import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { typeORMConfig } from 'src/configs/ormconfig';
import { UserModule } from 'src/modules/user/user.module';
import { EmailVerificationModule } from 'src/modules/email-verification/email-verification.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from 'src/core/http/filters/http-exception.filter';
import { HttpResponseBuilder } from 'src/core/http/util/http-response-builder';
import { SuccessInterceptor } from 'src/core/http/interceptors/http-success.interceptor';
import { LinkModule } from 'src/modules/link/link.module';
import { KloudModule } from 'src/modules/kloud/kloud.module';
import { AuthModule } from 'src/core/auth/auth.module';
import { GroupsModule } from './modules/group/group.module';
import { LoggerModule } from 'src/core/logger/logger.module';
import { SentryModule } from 'src/common/sentry/sentry.module';
import { NotificationnModule } from './modules/notification/notification.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationScheduler } from 'src/modules/notification/scheduler/notificationScheduler';
import { NotificationService } from 'src/modules/notification/services/notification.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        MODE: Joi.string().required(),
      }),
      envFilePath: '.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: typeORMConfig,
    }), // typeORM 연결
    UserModule,
    EmailVerificationModule,
    LinkModule,
    KloudModule,
    AuthModule,
    GroupsModule,
    LoggerModule,
    SentryModule,
    NotificationnModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ConfigService,
    HttpResponseBuilder,
    NotificationScheduler,
    NotificationService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SuccessInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
