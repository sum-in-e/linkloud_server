import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from 'src/core/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Linkloud')
    .setDescription('Linkloud API description')
    .setVersion('1.0')
    .addTag('Linkloud')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  const swaggerID = configService.get('SWAGGER_USER');
  const swaggerPW = configService.get('SWAGGER_PASSWORD');

  // Add basic auth middleware
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

  const port = configService.get('PORT');
  await app.listen(port);
}
bootstrap();
