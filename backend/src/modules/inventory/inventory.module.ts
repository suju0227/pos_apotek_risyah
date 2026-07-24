import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../../database/prisma.module';
import { InventoryService } from './inventory.service';
import { ReceiveStockHandler } from './handlers/receive-stock.handler';
import { CommitOutboundStockHandler } from './handlers/commit-outbound-stock.handler';
import { AdjustStockHandler } from './handlers/adjust-stock.handler';
import { TransferStockHandler } from './handlers/transfer-stock.handler';
import { CompleteStockOpnameHandler } from './handlers/complete-stock-opname.handler';

const CommandHandlers = [
  ReceiveStockHandler,
  CommitOutboundStockHandler,
  AdjustStockHandler,
  TransferStockHandler,
  CompleteStockOpnameHandler,
];

@Module({
  imports: [CqrsModule, PrismaModule],
  providers: [InventoryService, ...CommandHandlers],
  exports: [InventoryService],
})
export class InventoryModule {}
