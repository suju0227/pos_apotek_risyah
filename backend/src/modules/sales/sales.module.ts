import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { CashierProductsController } from './cashier-products.controller';
import { FefoService } from './fefo.service';
import { IdempotencyService } from './idempotency.service';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [PrismaModule],
  controllers: [CashierProductsController, SalesController],
  providers: [FefoService, IdempotencyService, SalesService],
  exports: [FefoService, IdempotencyService, SalesService],
})
export class SalesModule {}
