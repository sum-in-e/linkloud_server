import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailVerification } from 'src/modules/email-verification/entities/email-verification.entity';
import { EmailVerificationController } from 'src/modules/email-verification/email-verification.controller';
import { EmailVerificationService } from './email-verification.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailVerificationRepository } from 'src/modules/email-verification/repository/email-verification.repository';
import { UserModule } from 'src/modules/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([EmailVerification]), ConfigModule, forwardRef(() => UserModule)],
  controllers: [EmailVerificationController],
  providers: [EmailVerificationService, ConfigService, EmailVerificationRepository],
  exports: [EmailVerificationRepository],
})
export class EmailVerificationModule {}
