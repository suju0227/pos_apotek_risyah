import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { StockMutationsController } from './stock-mutations.controller';
import { StockMutationsService } from './stock-mutations.service';

@Module({
  imports: [PrismaModule],
  controllers: [StockMutationsController],
  providers: [StockMutationsService],
})
export class StockModule {}
