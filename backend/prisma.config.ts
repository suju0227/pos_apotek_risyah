import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config();

const databaseUrl =
  process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: databaseUrl ? { url: databaseUrl } : undefined,
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
});
