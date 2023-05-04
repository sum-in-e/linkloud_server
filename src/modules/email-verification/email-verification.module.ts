import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailVerification } from 'src/modules/email-verification/entities/email-verification.entity';
import { EmailVerificationController } from 'src/modules/email-verification/email-verification.controller';
import { EmailVerificationService } from './email-verification.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailVerificationRepository } from 'src/modules/email-verification/repository/email-verification.repository';

@Module({
  imports: [TypeOrmModule.forFeature([EmailVerification]), ConfigModule],
  controllers: [EmailVerificationController],
  providers: [EmailVerificationService, ConfigService, EmailVerificationRepository],
})
export class EmailVerificationModule {}
