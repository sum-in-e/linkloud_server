import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { DeleteResult, QueryRunner } from 'typeorm';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { EmailVerificationRepository } from 'src/modules/email-verification/repository/email-verification.repository';
import { KakaoSignUpDto, LoginDto, SignUpDto } from 'src/modules/user/dto/user.dto';
import { User } from 'src/modules/user/entities/user.entity';
import { UserRepository } from 'src/modules/user/repository/user.repository';
import { KakaoVericationInfoRepository } from 'src/modules/user/repository/kakao-virification-info.ropository';
import { KloudRepository } from 'src/modules/kloud/repository/kloud.repository';
import { LinkRepository } from 'src/modules/link/repositories/link.repository';
import { IncomingWebhook } from '@slack/client';
import dayjs from 'dayjs';

@Injectable()
export class UserService {
  private webhook: IncomingWebhook;
  private readonly webhookUrl: string;
  private readonly JWT_SECRET_KEY: string;
  private readonly MODE: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly kloudRepository: KloudRepository,
    private readonly linkRepository: LinkRepository,
    private readonly emailVerificationRepository: EmailVerificationRepository,
    private readonly kakaoVericationInfoRepository: KakaoVericationInfoRepository,
  ) {
    this.JWT_SECRET_KEY = this.configService.getOrThrow('JWT_SECRET_KEY');
    this.MODE = this.configService.getOrThrow('MODE');

    this.webhookUrl = this.configService.getOrThrow('SLACK_WEBHOOK_URL_FOR_SIGNOUT');
    this.webhook = new IncomingWebhook(this.webhookUrl);
  }

  /**
   * @description 이메일 회원가입
   */
  async createUser(body: SignUpDto, queryRunner: QueryRunner): Promise<User> {
    const user = await this.userRepository.findUserByEmailInTransaction(body.email, queryRunner);

    // 계정 검증
    if (user) {
      await this.checkUserStatusByEmail(user);

      let message = '이미 등록된 계정입니다.';
      if (user.method === 'kakao') message = `카카오 회원가입으로 등록된 계정입니다.`;

      throw new CustomHttpException(ResponseCode.EMAIL_ALREADY_EXIST, message, {
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
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '회원가입에 실패하였습니다.', { status: 500 });
    }
  }

  /**
   * @description 카카오 서버로부터 가져온 유저 정보를 createKakaoVerificationInfo 테이블에 저장하는 메서드
   */
  async createKakaoVerificationInfo(
    email: string,
    sub: string,
  ): Promise<{ email: string; sub: string } | { error: string }> {
    const user = await this.userRepository.findUserByEmail(email);

    // 계정 검증
    if (user) {
      // 탈퇴한 계정 예외처리
      if (user?.deletedAt) {
        return { error: '회원 탈퇴 처리된 이메일입니다.' };
      }

      // TODO: 휴면 계정 예외 처리

      const text = user.method === 'email' ? `이메일 회원가입으로 등록된 계정입니다.` : `이미 등록된 계정입니다.`;
      // 이미 가입된 이메일 예외 처리
      return { error: text };
    }

    try {
      const result = await this.kakaoVericationInfoRepository.createKakaoVerificationInfo(email, sub);
      return {
        email: result.email,
        sub: result.sub,
      };
    } catch (error) {
      return { error: '회원가입에 실패하였습니다.' };
    }
  }

  /**
   * @description 카카오 회원가입 시 kakao-verification-info DB에서 유저의 카카오 인증 정보 데이터 삭제
   */
  async deleteKakaoVerificationInfo(user: User, queryRunner: QueryRunner): Promise<DeleteResult> {
    try {
      return await this.kakaoVericationInfoRepository.deleteKakaoVerificationInfo(user.email, queryRunner);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '회원가입에 실패하였습니다.', { status: 500 });
    }
  }

  /**
   * @description 카카오 회원가입 완료
   */
  async createUserByKakao(body: KakaoSignUpDto, queryRunner: QueryRunner): Promise<User> {
    // sub로 kakaoVerificationInfoTable에 있는 유저 정보와 클라이언트에서 보낸 정보가 일치하는지 확인하여 유저 인증
    const kakaoVerificationInfo = await this.kakaoVericationInfoRepository.findEmailBySub(body.sign, queryRunner);

    if (!kakaoVerificationInfo) {
      throw new CustomHttpException(
        ResponseCode.KAKAO_VERIFICATION_INFO_NOT_EXIST,
        '카카오 인증 정보를 찾을 수 없습니다. 회원가입을 다시 진행해 주세요.',
        {
          status: 404,
        },
      );
    }

    const user = await this.userRepository.findUserByEmailInTransaction(kakaoVerificationInfo.email, queryRunner);

    if (user) {
      await this.checkUserStatusByEmail(user);

      throw new CustomHttpException(ResponseCode.EMAIL_ALREADY_EXIST, '이미 가입된 계정입니다.', {
        data: { email: user.email, method: user.method },
      });
    }

    if (body.name.length < 2 || body.name.length > 15) {
      throw new CustomHttpException(ResponseCode.INVALID_USER_NAME_FORMAT, '닉네임을 2~15자 이내로 설정해주세요.');
    }

    try {
      return await this.userRepository.createUserByKakao(kakaoVerificationInfo.email, body.name, queryRunner);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '회원가입에 실패하였습니다.', { status: 500 });
    }
  }

  /**
   * @description 카카오 로그인 계정 검증 및 유저 반환
   */
  async verifyKakaoUser(email: string): Promise<User | { error: string }> {
    const user = await this.userRepository.findUserByEmail(email);

    // 가입된 계정 존재하는지 확인
    if (!user) {
      return { error: '등록되지 않은 계정입니다.' };
    }

    if (user.method === 'email') {
      return { error: '이메일 회원가입으로 등록된 계정입니다.' };
    }

    // 탈퇴한 계정 예외처리
    if (user?.deletedAt) {
      return { error: '회원 탈퇴 처리된 계정입니다.' };
    }

    // TODO: 휴면 계정 예외 처리

    return user;
  }

  /**
   * @description 이메일 로그인 계정 검증 및 유저 반환
   */
  async verifyUser(body: LoginDto): Promise<User> {
    const user = await this.userRepository.findUserByEmail(body.email);

    // 가입된 계정 존재하는지 확인
    if (!user) {
      throw new CustomHttpException(ResponseCode.EMAIL_NOT_EXIST, '가입되지 않은 계정입니다.', { status: 404 });
    }

    // 카카오로 가입한 계정인 경우 예외 처리
    if (user.method === 'kakao') {
      throw new CustomHttpException(ResponseCode.SIGNED_BY_KAKAO, '카카오 회원가입으로 등록된 계정입니다.');
    }

    // 계정 상태 확인
    await this.checkUserStatusByEmail(user);

    if (!user.password) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '로그인에 실패하였습니다.', { status: 500 });
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
      throw new CustomHttpException(ResponseCode.DELETED_USER, '회원 탈퇴 처리된 계정입니다.', {
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

  /**
   * @description 링클라우드 슬랙 채널로 회원탈퇴 사유를 전송합니다.
   */
  async sendSignOutReason(reason: string): Promise<void> {
    try {
      if (this.webhook) {
        const message = {
          text: '🚨링클라우드 회원 탈퇴🚨',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*탈퇴 사유:* ${reason}`,
              },
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Occurred at ${dayjs().add(9, 'hour').format('YYYY-MM-DD HH:mm:ss')}`,
                },
              ],
            },
          ],
        };
        this.webhook.send(message);
      }
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '회원탈퇴 실패', { status: 500 });
    }
  }

  /**
   * @description 회원 탈퇴 메서드
   */
  async deleteUser(user: User, queryRunner: QueryRunner): Promise<void> {
    try {
      const klouds = await this.kloudRepository.findKloudByUser(user, queryRunner);
      const links = await this.linkRepository.findLinksByUser(user, queryRunner);

      // 유저와 연결된 링크와 클라우드를 제거한다
      if (klouds.length > 0) {
        await this.kloudRepository.deleteKlouds(klouds, queryRunner);
      }
      if (links.length > 0) {
        await this.linkRepository.deleteLinks(links, queryRunner);
      }

      // 유저는 softDelete 처리한다.
      return await this.userRepository.deleteUser(user, queryRunner);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '회원탈퇴 실패', { status: 500 });
    }
  }
}
