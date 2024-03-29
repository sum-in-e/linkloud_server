import { HttpModule } from '@nestjs/axios';
import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailVerificationModule } from 'src/modules/email-verification/email-verification.module';
import { KakaoVericationInfo } from 'src/modules/user/entities/kakao-verification-info.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { UserRepository } from 'src/modules/user/repository/user.repository';
import { KakaoOauthService } from 'src/modules/user/oauth/kakao-oauth.service';
import { UserController } from 'src/modules/user/user.controller';
import { UserService } from 'src/modules/user/user.service';
import { JwtUtil } from 'src/modules/user/utils/jwt.util';
import { KakaoVericationInfoRepository } from 'src/modules/user/repository/kakao-virification-info.ropository';
import { JwtService } from '@nestjs/jwt';
import { LinkModule } from 'src/modules/link/link.module';
import { KloudModule } from 'src/modules/kloud/kloud.module';
import { AuthService } from 'src/core/auth/auth.service';
import { SentryProvider } from 'src/common/sentry/sentry.provider';
import { EmailVerificationService } from 'src/modules/email-verification/email-verification.service';
import { AuthModule } from 'src/core/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, KakaoVericationInfo]),
    forwardRef(() => EmailVerificationModule),
    forwardRef(() => KloudModule),
    forwardRef(() => LinkModule),
    forwardRef(() => AuthModule),
    HttpModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    AuthService,
    KakaoOauthService,
    EmailVerificationService,
    ConfigService,
    JwtService,
    UserRepository,
    KakaoVericationInfoRepository,
    JwtUtil,
    SentryProvider,
  ],
  exports: [UserRepository],
})
export class UserModule {}
