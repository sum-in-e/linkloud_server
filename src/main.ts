import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const configService = app.get(ConfigService);

  const config = new DocumentBuilder()
    .setTitle('Linkloud')
    .setDescription('Linkloud API description')
    .setVersion('1.0')
    .addTag('Linkloud')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  const swaggerID = configService.get('SWAGGER_USER');
  const swaggerPW = configService.get('SWAGGER_PASSWORD');

  // Swagger 설정
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
    origin: ['http://linkloud.co.kr'], // whitelist에 추가할 도메인
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
