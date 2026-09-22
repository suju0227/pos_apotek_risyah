import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { Request, Response } from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AppModule } from '../src/app.module';

let handler: ((req: Request, res: Response) => void) | undefined;

async function createHandler() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const corsOrigins = [
    ...(process.env.CORS_ORIGIN ?? '').split(','),
    process.env.FRONTEND_URL,
    process.env.APP_URL,
  ]
    .filter((origin): origin is string => Boolean(origin))
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const vercelFrontendOrigin =
    /^https:\/\/pos-apotek-risyah-frontend(?:-[a-z0-9-]+)?\.vercel\.app$/;

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (
        !origin ||
        corsOrigins.includes(origin.replace(/\/$/, '')) ||
        vercelFrontendOrigin.test(origin)
      ) {
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
  await app.init();
  return app.getHttpAdapter().getInstance() as (
    req: Request,
    res: Response,
  ) => void;
}

export default async function vercelHandler(
  req: VercelRequest,
  res: VercelResponse,
) {
  process.env.DATABASE_URL ??=
    process.env.NEON_POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.NEON_POSTGRES_URL;
  handler ??= await createHandler();
  return handler(
    req as unknown as Request,
    res as unknown as Response,
  );
}
