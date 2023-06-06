import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import { AuthGuard } from 'src/core/auth/guard/auth.guard';
import { AuthService } from 'src/core/auth/auth.service';
import { CustomLogger } from 'src/core/logger/logger.provider';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Logging 설정 (http 요청 로깅)
  const logger = app.get(CustomLogger);
  app.use(logger.createMorganMiddleware());

  // AuthGuard 설정
  const authService = app.get(AuthService);
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new AuthGuard(authService, reflector));

  // Swagger 설정
  const swaggerID = configService.get('SWAGGER_USER');
  const swaggerPW = configService.get('SWAGGER_PASSWORD');

  const config = new DocumentBuilder()
    .setTitle('Linkloud')
    .setDescription('Linkloud API description')
    .setVersion('1.0')
    .addTag('Linkloud')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  app.use(
    ['/docs', '/docs-json'],
    basicAuth({
      challenge: true,
      users: {
        [swaggerID]: swaggerPW,
      },
    }),
  );

  SwaggerModule.setup('docs', app, document);

  // CORS 옵션 정의
  const corsOptions = {
    origin: ['https://linkloud.co.kr', 'http://localhost:3000'], // whitelist에 추가할 도메인
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    credentials: true, // *🚨프론트에도 withCredential:true 설정 필요
  };

  // CORS 옵션 적용
  app.enableCors(corsOptions);

  const port = configService.get('PORT');
  await app.listen(port);
}
bootstrap();
