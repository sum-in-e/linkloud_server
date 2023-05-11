import { Controller, Post, Query, UsePipes } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsPublic } from 'src/core/auth/decorator/is-public.decorator';

import {
  EmailVerificationConfirmDto,
  EmailVerificationDto,
} from 'src/modules/email-verification/dto/email-verification.dto';
import { EmailVerificationService } from 'src/modules/email-verification/email-verification.service';
import { EmailVerificationPipe } from 'src/modules/email-verification/pipes/email-verification.pipe';

@Controller('email-verification')
@ApiTags('이메일 인증 APIs')
export class EmailVerificationController {
  constructor(private readonly emailService: EmailVerificationService) {}

  @ApiOperation({ summary: '인증 코드 발송' })
  @Post('send')
  @UsePipes(EmailVerificationPipe)
  @IsPublic()
  async sendVerificationCode(@Query() emailVerificationDto: EmailVerificationDto) {
    return await this.emailService.sendVerificationCode(emailVerificationDto.email);
  }

  @ApiOperation({ summary: '인증 코드 검증' })
  @Post('confirm')
  @IsPublic()
  async confirmVerificationCode(@Query() emailVerificationConfirmDto: EmailVerificationConfirmDto) {
    return await this.emailService.confirmVerificationCode(
      emailVerificationConfirmDto.email,
      emailVerificationConfirmDto.verificationCode,
    );
  }
}
