import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  DashboardDaysQueryDto,
  DashboardTopProductsQueryDto,
} from './dto/dashboard-query.dto';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MANAGER')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary() {
    return this.dashboardService.summary();
  }

  @Get('low-stock')
  lowStock() {
    return this.dashboardService.lowStock();
  }

  @Get('expired-batches')
  expiredBatches() {
    return this.dashboardService.expiredBatches();
  }

  @Get('recent-transactions')
  recentTransactions() {
    return this.dashboardService.recentTransactions();
  }

  @Get('trends')
  trends(@Query() query: DashboardDaysQueryDto) {
    return this.dashboardService.trends(query.days);
  }

  @Get('top-products')
  topProducts(@Query() query: DashboardTopProductsQueryDto) {
    return this.dashboardService.topProducts(query.days, query.limit);
  }

  @Get('payment-methods')
  paymentMethods(@Query() query: DashboardDaysQueryDto) {
    return this.dashboardService.paymentMethods(query.days);
  }
}
