import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { CustomHttpException } from 'src/core/http/http-exception';
import sgMail from '@sendgrid/mail';
import * as fs from 'fs';
import * as path from 'path';
import { EmailVerificationRepository } from 'src/modules/email-verification/repository/email-verification.repository';
import { UserRepository } from 'src/modules/user/repository/user.repository';
import { QueryRunner } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';

@Injectable()
export class EmailVerificationService {
  private readonly SENDGRID_API_KEY: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailVerificationRepository: EmailVerificationRepository,
    private readonly userRepository: UserRepository,
  ) {
    this.SENDGRID_API_KEY = this.configService.getOrThrow('SENDGRID_API_KEY');
  }

  async sendVerificationCode(email: string, queryRunner: QueryRunner) {
    // 이미 가입된 이메일인지 확인
    const user = await this.userRepository.findUserByEmailInTransaction(email, queryRunner);

    if (user?.deletedAt) {
      throw new CustomHttpException(ResponseCode.DELETED_USER, '회원 탈퇴 처리된 이메일입니다.', {
        data: { email: user.email, method: user.method },
      });
    }

    if (user) {
      let message = '이미 가입된 이메일입니다.';
      if (user.method === 'email') message = `이메일 회원가입으로 등록된 계정입니다.`;
      if (user.method === 'kakao') message = `카카오 회원가입으로 등록된 계정입니다.`;

      throw new CustomHttpException(ResponseCode.EMAIL_ALREADY_EXIST, message);
    }

    // 이메일 인증 번호 생성
    const verificationCode = this.generateVerificationCode();

    try {
      const savedEmailVerificationData = await this.emailVerificationRepository.createEmailVerification(
        email,
        verificationCode,
        queryRunner,
      );
      await this.sendEmail(email, verificationCode, this.SENDGRID_API_KEY);

      return { expiredAt: savedEmailVerificationData.expiredAt };
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '인증번호 발송에 실패하였습니다.', {
        status: 500,
      });
    }
  }

  async confirmVerificationCode(email: string, verificationCode: string) {
    const emaiVerificationInfo = await this.emailVerificationRepository.findEmailVerification(email);

    if (!emaiVerificationInfo || emaiVerificationInfo?.verificationCode !== verificationCode) {
      throw new CustomHttpException(ResponseCode.VERIFICATION_INFO_NOT_EXIST, '유효하지 않은 인증번호입니다.', {
        status: 404,
      });
    }

    const isExpired = emaiVerificationInfo.expiredAt < new Date();
    if (isExpired) {
      throw new CustomHttpException(ResponseCode.EXPIRED_VERIFICATION_CODE, '인증번호가 만료되었습니다.');
    }

    try {
      const emailVerificationInfo = await this.emailVerificationRepository.updateIsVerified(emaiVerificationInfo);
      return { email: emailVerificationInfo.email };
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '인증번호 확인에 실패하였습니다.', {
        status: 500,
      });
    }
  }

  async deleteVerificationCode(user: User, queryRunner: QueryRunner) {
    try {
      await this.emailVerificationRepository.deleteEmailVerification(user.email, queryRunner);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '회원가입에 실패하였습니다.', {
        status: 500,
      });
    }
  }

  // 이메일 인증 번호 생성 메서드
  private generateVerificationCode(): string {
    return Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
  }

  // 이메일 전송 메서드
  private async sendEmail(email: string, verificationCode: string, apiKey: string): Promise<void> {
    sgMail.setApiKey(apiKey);
    const mailObj = {
      from: 'linkloud@linkloud.xyz', // 발신자 이메일(sendgrid에 등록한 주소만 사용 가능)
      to: email, // 수신자 이메일 -> 유저가 입력한 이메일
      subject: '링클라우드 서비스 이용을 위한 이메일 인증 번호 안내', // 제목
      html: '',
    };
    const filePath = path.join(process.cwd(), 'src/modules/email-verification/html/email-verification.html');
    let html = fs.readFileSync(filePath, 'utf8');
    html = html.replace('${verificationCode}', verificationCode); // 인증 코드 삽입
    mailObj.html = html;

    await sgMail.send(mailObj);
  }
}
