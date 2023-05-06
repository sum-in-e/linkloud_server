import { Injectable } from '@nestjs/common';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { EmailVerificationRepository } from 'src/modules/email-verification/repository/email-verification.repository';
import { SignUpDto } from 'src/modules/user/dto/user.dto';
import { User } from 'src/modules/user/entities/user.entity';
import { UserRepository } from 'src/modules/user/repository/user.repository';
import bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailVerificationRepository: EmailVerificationRepository,
  ) {}

  async createUser(body: SignUpDto): Promise<Pick<User, 'email' | 'method'>> {
    // 이미 가입된 이메일인지 확인
    const user = await this.userRepository.findUserByEmail(body.email);

    if (user) {
      throw new CustomHttpException(ResponseCode.EMAIL_ALREADY_EXIST, '이미 가입된 이메일입니다.');
    }

    // 이메일 인증 여부 검증
    const chekcVerifiedEmail = await this.emailVerificationRepository.checkVerifiedEmail(body.email);

    if (!chekcVerifiedEmail) {
      throw new CustomHttpException(ResponseCode.NOT_VERIFIED_EMAIL, '인증되지 않은 이메일입니다.');
    }

    // 비밀번호 암호화 처리
    const saltOrRounds = 10; // 암호화 강도
    const hashedPassword = await bcrypt.hash(body.password, saltOrRounds);

    // DB에 저장
    try {
      const result = await this.userRepository.createUserByEmail(body, hashedPassword);
      return {
        email: result.email,
        method: result.method,
      };
    } catch (error) {
      throw new CustomHttpException(ResponseCode.SIGN_UP_FAILED, '회원가입에 실패하였습니다.');
    }
  }

  // async createUserByKakao(user: User) {
  //   return await this.userRepository.save(user);
  // }
}

// // * 비밀번호 검증
// const isMatch = await bcrypt.compare(body.password, user.password); // 입력받은 비밀번호와 저장된 비밀번호를 비교

// if (!isMatch) {
//   throw new CustomHttpException(ResponseCode.WRONG_PASSWORD);
// }
