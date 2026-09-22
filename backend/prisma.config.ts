import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: '.env.development.local' });
config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
});
