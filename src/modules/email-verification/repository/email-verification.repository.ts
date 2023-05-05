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

  async saveEmailVerification(email: string, verification_code: string): Promise<EmailVerification> {
    const emailVerification = new EmailVerification();
    emailVerification.email = email;
    emailVerification.verification_code = verification_code;

    return await this.emailVerificationRepository.save(emailVerification);
  }

  // 이메일로 인증 정보를 찾는 메서드
  //   async findEmailVerificationByEmail(email: string): Promise<EmailVerification | undefined> {
  //     return this.findOne({ email });
  //   }

  // 인증 여부를 업데이트하는 메서드
  //   async updateIsVerified(email: string): Promise<void> {
  //     await this.update({ email }, { is_verified: true });
  //   }
}
