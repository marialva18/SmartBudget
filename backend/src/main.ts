import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { json } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());
  app.use(cookieParser());
  app.use(json({ limit: '1mb' }));

  if (configService.get<boolean>('TRUST_PROXY', false)) {
    app.set('trust proxy', 1);
  }

  app.enableCors({
    origin: configService
      .getOrThrow<string>('FRONTEND_ORIGIN')
      .split(',')
      .map((origin) => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-Id',
      'X-Client-Platform',
      'X-Device-Name',
      'Idempotency-Key',
    ],
  });

  app.setGlobalPrefix(configService.getOrThrow<string>('API_PREFIX'));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(configService.get<number>('PORT', 3000));
}
bootstrap().catch((error) => {
  console.error(
    'Failed to start SmartBudget API',
    error instanceof Error ? error.message : 'Unknown startup error',
  );
  process.exit(1);
});
