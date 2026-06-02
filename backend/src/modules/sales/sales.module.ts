import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { FefoService } from './fefo.service';
import { IdempotencyService } from './idempotency.service';

@Module({
  imports: [PrismaModule],
  providers: [FefoService, IdempotencyService],
  exports: [FefoService, IdempotencyService],
})
export class SalesModule {}
