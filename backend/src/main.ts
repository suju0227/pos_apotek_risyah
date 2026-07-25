import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const corsOrigins = [
    ...(configService.get<string>('CORS_ORIGIN') ?? '').split(','),
    configService.get<string>('FRONTEND_URL'),
    configService.get<string>('APP_URL'),
  ]
    .filter((origin): origin is string => Boolean(origin))
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin tidak diizinkan oleh CORS'));
    },
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  const apiPrefix = configService.get<string>('API_PREFIX') ?? '/api';
  app.setGlobalPrefix(apiPrefix.replace(/^\/+/, ''));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const port =
    configService.get<number>('APP_PORT') ?? configService.get<number>('PORT') ?? 3000;
  const host = configService.get<string>('APP_HOST') ?? '0.0.0.0';
  app.useStaticAssets(join(process.cwd(), 'storage'), { prefix: '/api/storage/' });
  await app.listen(port, host);
}

void bootstrap();
