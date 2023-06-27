import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, QueryRunner, Repository } from 'typeorm';
import { EmailVerification } from 'src/modules/email-verification/entities/email-verification.entity';

// 💡repository 내에서 에러를 던지는 것은 좋지 않다. repository는 데이터베이스와 통신하는 로직만 담당하고, 에러 처리는 service나 controller에서 하는 것이 좋다.
@Injectable()
export class EmailVerificationRepository {
  constructor(
    @InjectRepository(EmailVerification)
    private emailVerificationRepository: Repository<EmailVerification>,
  ) {}

  /**
   * @description email_verification 테이블에 이메일 인증을 위한 정보를 저장합니다.
   */
  async createEmailVerification(
    email: string,
    verificationCode: string,
    queryRunner: QueryRunner,
  ): Promise<EmailVerification> {
    const emailVerification = new EmailVerification();
    emailVerification.email = email;
    emailVerification.verificationCode = verificationCode;

    return await queryRunner.manager.save(emailVerification);
  }

  /**
   * @description email_verification 테이블에 있는 컬럼 중 email과 verificationCode가 일치하는 컬럼을 찾습니다. (여러개의 로우 중 expiredAt이 가장 늦은 코드로 선택)
   */
  async findEmailVerification(email: string): Promise<EmailVerification | null> {
    const emailVerifications = await EmailVerification.find({
      where: { email },
      order: { expiredAt: 'DESC' },
    });

    // 만약 결과가 없다면 null을 반환합니다.
    if (emailVerifications.length === 0) return null;

    // 그렇지 않다면 첫 번째 결과를 반환합니다. 이것이 expiredAt이 제일 나중인 로우입니다.
    return emailVerifications[0];
  }

  /**
   * @description email_verification 테이블에 있는 컬럼의 is_verified 값을 true로 변경합니다.
   */
  async updateIsVerified(emailVerification: EmailVerification): Promise<EmailVerification> {
    emailVerification.isVerified = true;
    return await emailVerification.save();
  }

  /**
   * @description 이메일이 인증 되었는지 확인합니다.
   */
  async checkVerifiedEmail(email: string, queryRunner: QueryRunner): Promise<EmailVerification | null> {
    return await queryRunner.manager
      .getRepository(EmailVerification)
      .findOne({ where: { email: email, isVerified: true } });
  }

  /**
   * @description email_verification 테이블에서 이메일에 해당하는 컬럼을 제거합니다.
   */
  async deleteEmailVerification(email: string, queryRunner: QueryRunner): Promise<DeleteResult> {
    return queryRunner.manager.getRepository(EmailVerification).delete({ email });
  }
}
