import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailVerification } from 'src/modules/email-verification/entities/email-verification.entity';

// 💡repository 내에서 에러를 던지는 것은 좋지 않다. repository는 데이터베이스와 통신하는 로직만 담당하고, 에러 처리는 service나 controller에서 하는 것이 좋다.
@Injectable()
export class EmailVerificationRepository {
  constructor(
    @InjectRepository(EmailVerification)
    private emailVerificationRepository: Repository<EmailVerification>,
  ) {}

  /**
   * email_verification 테이블에 이메일 인증을 위한 정보를 저장합니다.
   * @param email
   * @param verification_code
   * @returns EmailVerification
   */
  async saveEmailVerification(email: string, verification_code: string): Promise<EmailVerification> {
    const emailVerification = new EmailVerification();
    emailVerification.email = email;
    emailVerification.verification_code = verification_code;

    return await this.emailVerificationRepository.save(emailVerification);
  }

  /**
   * email_verification 테이블에 있는 컬럼 중 email과 verificationCode가 일치하는 컬럼을 찾습니다.
   * @param email
   * @param verificationCode
   * @returns mailVerification | null
   */
  async findEmailVerification(email: string, verificationCode: string): Promise<EmailVerification | null> {
    return await EmailVerification.findOne({
      where: { email, verification_code: verificationCode },
    });
  }
  /**
   * email_verification 테이블에 있는 컬럼의 is_verified 값을 true로 변경합니다.
   * @param emailVerification
   * @returns emailVerification
   */
  async updateIsVerified(emailVerification: EmailVerification): Promise<EmailVerification> {
    emailVerification.is_verified = true;
    return await emailVerification.save();
  }
}
