import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
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
}
