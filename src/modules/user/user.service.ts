import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { QueryRunner } from 'typeorm';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { EmailVerificationRepository } from 'src/modules/email-verification/repository/email-verification.repository';
import { KakaoSignUpDto, LoginDto, SignUpDto } from 'src/modules/user/dto/user.dto';
import { User } from 'src/modules/user/entities/user.entity';
import { UserRepository } from 'src/modules/user/repository/user.repository';
import { KakaoVericationInfoRepository } from 'src/modules/user/repository/kakao-virification-info.ropository';
import { CloudRepository } from 'src/modules/cloud/repository/cloud.repository';
import { LinkRepository } from 'src/modules/link/repositories/link.repository';

@Injectable()
export class UserService {
  private readonly JWT_SECRET_KEY: string;
  private readonly MODE: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly cloudRepository: CloudRepository,
    private readonly linkRepository: LinkRepository,
    private readonly emailVerificationRepository: EmailVerificationRepository,
    private readonly kakaoVericationInfoRepository: KakaoVericationInfoRepository,
  ) {
    this.JWT_SECRET_KEY = this.configService.getOrThrow('JWT_SECRET_KEY');
    this.MODE = this.configService.getOrThrow('MODE');
  }

  /**
   * @description 이메일 회원가입
   */
  async createUser(body: SignUpDto, queryRunner: QueryRunner): Promise<User> {
    const user = await this.userRepository.findUserByEmailInTransaction(body.email, queryRunner);

    // 계정 검증
    if (user) {
      await this.checkUserStatusByEmail(user);

      throw new CustomHttpException(ResponseCode.EMAIL_ALREADY_EXIST, '이미 가입된 이메일입니다.', {
        data: { email: user.email, method: user.method },
      });
    }

    // 이메일 인증 여부 검증
    const chekcVerifiedEmail = await this.emailVerificationRepository.checkVerifiedEmail(body.email, queryRunner);

    if (!chekcVerifiedEmail) {
      throw new CustomHttpException(ResponseCode.NOT_VERIFIED_EMAIL, '인증되지 않은 이메일입니다.');
    }

    const saltOrRounds = 10; // 암호화 강도
    const hashedPassword = await bcrypt.hash(body.password, saltOrRounds);

    try {
      return await this.userRepository.createUserByEmail(body, hashedPassword, queryRunner);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.SIGN_UP_FAILED, '회원가입에 실패하였습니다.', { status: 500 });
    }
  }

  /**
   * @description 카카오 서버로부터 가져온 유저 정보를 createKakaoVerificationInfo 테이블에 저장하는 메서드
   */
  async createKakaoVerificationInfo(email: string, sub: string): Promise<{ email: string; sub: string }> {
    const user = await this.userRepository.findUserByEmail(email);

    // 계정 검증
    if (user) {
      await this.checkUserStatusByEmail(user);

      throw new CustomHttpException(ResponseCode.EMAIL_ALREADY_EXIST, '이미 가입된 이메일입니다.', {
        data: { email: user.email, method: user.method },
      });
    }

    // KakaoVerificationInfo 테이블에 저장(카카오 회원가입 완료 시 유저 인증을 위해 사용)
    try {
      const result = await this.kakaoVericationInfoRepository.createKakaoVerificationInfo(email, sub);
      return {
        email: result.email,
        sub: result.sub,
      };
    } catch (error) {
      throw new CustomHttpException(ResponseCode.SIGN_UP_FAILED, '회원가입에 실패하였습니다.', { status: 500 });
    }
  }

  /**
   * @description 카카오 회원가입 완료
   */
  async createUserByKakao(body: KakaoSignUpDto, queryRunner: QueryRunner): Promise<User> {
    // sub로 kakaoVerificationInfoTable에 있는 유저 정보와 클라이언트에서 보낸 정보가 일치하는지 확인하여 유저 인증
    const kakaoVerificationInfo = await this.kakaoVericationInfoRepository.findEmailBySub(body.sign, queryRunner);

    if (!kakaoVerificationInfo) {
      throw new CustomHttpException(ResponseCode.SIGN_UP_FAILED, '회원가입에 실패하였습니다.');
    }

    const user = await this.userRepository.findUserByEmailInTransaction(kakaoVerificationInfo.email, queryRunner);

    if (user) {
      await this.checkUserStatusByEmail(user);

      throw new CustomHttpException(ResponseCode.EMAIL_ALREADY_EXIST, '이미 가입된 이메일입니다.', {
        data: { email: user.email, method: user.method },
      });
    }

    if (!body.isAgreeProvidePersonalInfo || !body.isAgreeTermsOfUse) {
      throw new CustomHttpException(ResponseCode.TERMS_NOT_AGREED, '필수 약관 동의가 필요합니다.');
    }

    if (body.name.length < 2 || body.name.length > 15) {
      throw new CustomHttpException(ResponseCode.INVALID_USER_NAME_FORMAT, '닉네임을 2~15자 이내로 설정해주세요.');
    }

    try {
      return await this.userRepository.createUserByKakao(kakaoVerificationInfo.email, body.name, queryRunner);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.SIGN_UP_FAILED, '회원가입에 실패하였습니다.', { status: 500 });
    }
  }

  /**
   * @description 카카오 로그인 계정 검증 및 유저 반환
   */
  async verifyKakaoUser(email: string): Promise<User> {
    const user = await this.userRepository.findUserByEmail(email);

    // 가입된 계정 존재하는지 확인
    if (!user) {
      throw new CustomHttpException(ResponseCode.EMAIL_NOT_EXIST, '존재하지 않는 이메일입니다.');
    }

    if (user.method === 'email') {
      throw new CustomHttpException(ResponseCode.SIGNED_BY_EMAIL, '이메일 회원가입으로 등록된 계정입니다.');
    }

    // 계정 상태 확인
    await this.checkUserStatusByEmail(user);

    return user;
  }

  /**
   * @description 이메일 로그인 계정 검증 및 유저 반환
   */
  async verifyUser(body: LoginDto): Promise<User> {
    const user = await this.userRepository.findUserByEmail(body.email);

    // 가입된 계정 존재하는지 확인
    if (!user) {
      throw new CustomHttpException(ResponseCode.EMAIL_NOT_EXIST, '존재하지 않는 이메일입니다.');
    }

    // 카카오로 가입한 계정인 경우 예외 처리
    if (user.method === 'kakao') {
      throw new CustomHttpException(ResponseCode.SIGNED_BY_KAKAO, '카카오 회원가입으로 등록된 계정입니다.');
    }

    // 계정 상태 확인
    await this.checkUserStatusByEmail(user);

    if (!user.password) {
      throw new CustomHttpException(ResponseCode.LOGIN_FAILED, '로그인에 실패하였습니다.');
    }

    // 비밀번호 검증
    const isMatch = await bcrypt.compare(body.password, user.password);

    if (!isMatch) {
      throw new CustomHttpException(ResponseCode.WRONG_PASSWORD, '비밀번호가 일치하지 않습니다.');
    }

    return user;
  }

  /**
   * @description 해당 계정이 탈퇴 처리된 계정인지, 휴면 계정인지 판별하는 메서드
   */
  private async checkUserStatusByEmail(user: User): Promise<User> {
    // 탈퇴한 계정 예외처리
    if (user?.deletedAt) {
      throw new CustomHttpException(ResponseCode.DELETED_USER, '회원 탈퇴 처리된 이메일입니다.', {
        data: { email: user.email, method: user.method },
      });
    }

    // TODO: 휴면 계정 예외 처리

    return user;
  }

  /**
   * @description 유저 로그인 시점에 lastLoginAt 필드에 로그인 일자 업데이트하는 메서드
   */
  async updateLastLoginAt(user: User, queryRunner?: QueryRunner): Promise<void> {
    if (queryRunner) {
      await this.userRepository.updateLastLoginAt(user, queryRunner);
    } else {
      await this.userRepository.updateLastLoginAt(user);
    }
  }

  async deleteUser(user: User, queryRunner: QueryRunner): Promise<void> {
    try {
      const clouds = await this.cloudRepository.findCloudByUser(user, queryRunner);
      const links = await this.linkRepository.findLinksByUser(user, queryRunner);

      // 유저와 연결된 링크와 클라우드를 제거한다
      if (clouds.length > 0) {
        await this.cloudRepository.deleteClouds(clouds, queryRunner);
      }
      if (links.length > 0) {
        await this.linkRepository.deleteLinks(links, queryRunner);
      }

      // 유저는 softDelete 처리한다.
      return await this.userRepository.deleteUser(user, queryRunner);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.UNKNOWN_ERROR, '회원탈퇴 실패', { status: 500 });
    }
  }
}
