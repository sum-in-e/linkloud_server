import { Controller, Post, Query, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsPublic } from 'src/core/auth/decorator/is-public.decorator';
import { TransactionManager } from 'src/core/tansaction/decorators/transaction.decorator';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { TransactionInterceptor } from 'src/core/tansaction/interceptors/transaction.interceptor';

import {
  EmailVerificationConfirmDto,
  EmailVerificationDto,
} from 'src/modules/email-verification/dto/email-verification.dto';
import { EmailVerificationService } from 'src/modules/email-verification/email-verification.service';
import { EmailVerificationPipe } from 'src/modules/email-verification/pipes/email-verification.pipe';
import { QueryRunner } from 'typeorm';

@Controller('email-verification')
@ApiTags('이메일 인증 APIs')
export class EmailVerificationController {
  constructor(private readonly emailService: EmailVerificationService) {}

  @ApiOperation({ summary: '인증 코드 발송' })
  @ApiResponse({ status: 400, description: `${ResponseCode.DELETED_USER}, ${ResponseCode.EMAIL_ALREADY_EXIST}` })
  @Post('send')
  @UsePipes(EmailVerificationPipe)
  @UseInterceptors(TransactionInterceptor)
  @IsPublic()
  async sendVerificationCode(@Query() query: EmailVerificationDto, @TransactionManager() queryRunner: QueryRunner) {
    return await this.emailService.sendVerificationCode(query.email, queryRunner);
  }

  @ApiOperation({ summary: '인증 코드 검증' })
  @ApiResponse({ status: 400, description: ResponseCode.EXPIRED_VERIFICATION_CODE })
  @ApiResponse({ status: 404, description: ResponseCode.VERIFICATION_INFO_NOT_EXIST })
  @Post('confirm')
  @IsPublic()
  async confirmVerificationCode(@Query() query: EmailVerificationConfirmDto) {
    return await this.emailService.confirmVerificationCode(query.email, query.verificationCode);
  }
}
