import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { CustomHttpException } from 'src/core/http/http-exception';
import { User } from 'src/modules/user/entities/user.entity';
import sgMail from '@sendgrid/mail';
import * as fs from 'fs';
import * as path from 'path';
import { EmailVerificationRepository } from 'src/modules/email-verification/repository/email-verification.repository';

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly configService: ConfigService,
    private readonly emailVerificationRepository: EmailVerificationRepository,
  ) {}

  async sendVerificationCode(email: string) {
    // 이미 가입된 이메일인지 확인
    const user = await User.findOne({ where: { email } });

    if (user) {
      throw new CustomHttpException(ResponseCode.EMAIL_ALREADY_EXIST);
    }

    // 이메일 인증 번호 생성
    const verification_code = this.generateVerificationCode();

    const apiKey = this.configService.get('SENDGRID_API_KEY');

    if (!apiKey) {
      throw new CustomHttpException(
        ResponseCode.SENDGRID_API_KEY_NOT_FOUND,
        'SendGrid API key is not found in environment variables',
      );
    }

    try {
      await this.emailVerificationRepository.saveEmailVerification(email, verification_code);
      await this.sendEmail(email, verification_code, apiKey);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.FAILED_TO_SEND_EMAIL, 'Failed to send email verification code');
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
