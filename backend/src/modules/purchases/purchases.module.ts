import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { IdempotencyService } from '../sales/idempotency.service';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';

import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [PrismaModule, InventoryModule],
  controllers: [PurchasesController],
  providers: [IdempotencyService, PurchasesService],
})
export class PurchasesModule {}
