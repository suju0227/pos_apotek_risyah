import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: '.env.development.local' });
config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url:
      process.env.DATABASE_URL ??
      process.env.NEON_POSTGRES_PRISMA_URL ??
      process.env.NEON_POSTGRES_URL ??
      process.env.NEON_DATABASE_URL ?? '',
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
});
