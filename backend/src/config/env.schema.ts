import * as Joi from 'joi';

export const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'staging', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  APP_URL: Joi.string().uri().default('http://localhost:5173'),
  FRONTEND_URL: Joi.string().uri().optional(),
  DATABASE_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_SECRET: Joi.string().min(16).optional(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  APP_TIMEZONE: Joi.string().valid('Asia/Makassar').default('Asia/Makassar'),
  EXPORT_DIR: Joi.string().default('storage/exports'),
});
