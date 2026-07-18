import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateProductUnitDto } from './dto/create-product-unit.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductUnitDto } from './dto/update-product-unit.dto';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MANAGER')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('search')
  search(@CurrentUser() user: AuthUser, @Query('q') search?: string) {
    return this.productsService.search(user.role, search);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('search') search?: string) {
    return this.productsService.findAll(user.role, search);
  }

  @Post()
  create(@Body() dto: CreateProductDto, @CurrentUser() user: AuthUser) {
    return this.productsService.create(dto, user.role);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.update(id, dto, user.role);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.productsService.deactivate(id, user.role);
  }

  @Get(':productId/units')
  findUnits(@Param('productId') productId: string) {
    return this.productsService.findUnits(productId);
  }

  @Post(':productId/units')
  createUnit(
    @Param('productId') productId: string,
    @Body() dto: CreateProductUnitDto,
  ) {
    return this.productsService.createUnit(productId, dto);
  }

  @Patch(':productId/units/:productUnitId')
  updateUnit(
    @Param('productId') productId: string,
    @Param('productUnitId') productUnitId: string,
    @Body() dto: UpdateProductUnitDto,
  ) {
    return this.productsService.updateUnit(productId, productUnitId, dto);
  }

  @Patch(':productId/units/:productUnitId/deactivate')
  deactivateUnit(
    @Param('productId') productId: string,
    @Param('productUnitId') productUnitId: string,
  ) {
    return this.productsService.deactivateUnit(productId, productUnitId);
  }
}
