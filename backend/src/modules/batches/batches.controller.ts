import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { BatchesService } from './batches.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@Controller('batches')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MANAGER')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Get('expired-alert')
  expiredAlert(@CurrentUser() user: AuthUser) {
    return this.batchesService.expiredAlert(user.role);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.batchesService.findAll(user.role);
  }

  @Post()
  create(@Body() dto: CreateBatchDto, @CurrentUser() user: AuthUser) {
    return this.batchesService.create(dto, user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.batchesService.findOne(id, user.role);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBatchDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.batchesService.update(id, dto, user.role);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.batchesService.deactivate(id, user.role);
  }
}
