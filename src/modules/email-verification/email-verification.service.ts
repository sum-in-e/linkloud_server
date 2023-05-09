import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { CustomHttpException } from 'src/core/http/http-exception';
import sgMail from '@sendgrid/mail';
import * as fs from 'fs';
import * as path from 'path';
import { EmailVerificationRepository } from 'src/modules/email-verification/repository/email-verification.repository';
import { UserRepository } from 'src/modules/user/repository/user.repository';

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

  async sendVerificationCode(email: string) {
    // 이미 가입된 이메일인지 확인
    const user = await this.userRepository.findUserByEmail(email);

    if (user) {
      throw new CustomHttpException(ResponseCode.EMAIL_ALREADY_EXIST, '이미 가입된 이메일입니다.');
    }

    // 이메일 인증 번호 생성
    const verification_code = this.generateVerificationCode();

    try {
      const savedEmailVerificationData = await this.emailVerificationRepository.createEmailVerification(
        email,
        verification_code,
      );
      await this.sendEmail(email, verification_code, this.SENDGRID_API_KEY);

      return { expiredAt: savedEmailVerificationData.expired_at };
    } catch (error) {
      throw new CustomHttpException(ResponseCode.FAILED_TO_SEND_EMAIL, '인증번호 발송에 실패하였습니다.');
    }
  }

  async confirmVerificationCode(email: string, verificationCode: string) {
    const emaiVerificationInfo = await this.emailVerificationRepository.findEmailVerification(email, verificationCode);

    if (!emaiVerificationInfo) {
      throw new CustomHttpException(ResponseCode.NOT_FOUND_VERIFICATION_INFO);
    }

    const isExpired = emaiVerificationInfo.expired_at < new Date();
    if (isExpired) {
      throw new CustomHttpException(ResponseCode.EXPIRED_VERIFICATION_CODE);
    }

    try {
      await this.emailVerificationRepository.updateIsVerified(emaiVerificationInfo);
      return {};
    } catch (error) {
      throw new CustomHttpException(ResponseCode.FAILED_TO_CONFIRM_VERIFICATION_CODE);
    }
  }

  // 이메일 인증 번호 생성 메서드
  private generateVerificationCode(): string {
    return Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
  }

  // 이메일 전송 메서드
  private async sendEmail(email: string, verification_code: string, apiKey: string): Promise<void> {
    sgMail.setApiKey(apiKey);
    const mailObj = {
      from: 'linkloud_official@linkloud.co.kr', // 발신자 이메일(sendgrid에 등록한 주소만 사용 가능)
      to: email, // 수신자 이메일 -> 유저가 입력한 이메일
      subject: '링클라우드 서비스 이용을 위한 이메일 인증 번호 안내', // 제목
      html: '',
    };
    const filePath = path.join(process.cwd(), 'src/modules/email-verification/html/email-verification.html');
    let html = fs.readFileSync(filePath, 'utf8');
    html = html.replace('${verification_code}', verification_code); // 인증 코드 삽입
    mailObj.html = html;

    await sgMail.send(mailObj);
  }
}
