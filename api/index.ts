import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { Request, Response } from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AppModule } from '../backend/src/app.module';

let handler: ((req: Request, res: Response) => void) | undefined;

async function createHandler() {
  process.env.DATABASE_URL ??=
    process.env.NEON_POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.NEON_POSTGRES_URL;
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const origins = [
    ...(configService.get<string>('CORS_ORIGIN') ?? '').split(','),
    configService.get<string>('FRONTEND_URL'),
    configService.get<string>('APP_URL'),
  ].filter((value): value is string => Boolean(value)).map((value) => value.trim());

  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      if (!origin || origins.includes(origin)) callback(null, true);
      else callback(new Error('Origin tidak diizinkan oleh CORS'));
    },
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.setGlobalPrefix((configService.get<string>('API_PREFIX') ?? '/api').replace(/^\/+/, ''));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.init();
  return app.getHttpAdapter().getInstance() as (req: Request, res: Response) => void;
}

export default async function handlerEntry(req: VercelRequest, res: VercelResponse) {
  handler ??= await createHandler();
  return handler(req as unknown as Request, res as unknown as Response);
}
