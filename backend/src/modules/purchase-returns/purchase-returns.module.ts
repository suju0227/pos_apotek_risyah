import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { IdempotencyService } from '../sales/idempotency.service';
import { PurchaseReturnsController } from './purchase-returns.controller';
import { PurchaseReturnsService } from './purchase-returns.service';

import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [PrismaModule, InventoryModule],
  controllers: [PurchaseReturnsController],
  providers: [IdempotencyService, PurchaseReturnsService],
})
export class PurchaseReturnsModule {}
