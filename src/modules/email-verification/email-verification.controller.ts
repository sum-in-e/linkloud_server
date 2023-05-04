import { Controller, Post, Query, UsePipes } from '@nestjs/common';

import { EmailVerificationDto } from 'src/modules/email-verification/dto/email-verification.dto';
import { EmailVerificationService } from 'src/modules/email-verification/email-verification.service';
import { EmailVerificationPipe } from 'src/modules/email-verification/pipes/email-verification.pipe';

@Controller('email-verification')
export class EmailVerificationController {
  constructor(private readonly emailService: EmailVerificationService) {}

  @Post('verify')
  @UsePipes(EmailVerificationPipe)
  async sendVerificationCode(@Query() emailVerificationDto: EmailVerificationDto) {
    await this.emailService.sendVerificationCode(emailVerificationDto.email);
  }
}
