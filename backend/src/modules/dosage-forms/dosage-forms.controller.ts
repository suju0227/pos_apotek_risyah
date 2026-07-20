import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DosageFormsService } from './dosage-forms.service';
import { CreateDosageFormDto } from './dto/create-dosage-form.dto';
import { UpdateDosageFormDto } from './dto/update-dosage-form.dto';

@Controller('dosage-forms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DosageFormsController {
  constructor(private readonly service: DosageFormsService) {}

  @Get()
  @Roles('MANAGER', 'APOTEKER', 'KASIR')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('MANAGER', 'APOTEKER', 'KASIR')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('MANAGER')
  create(@Body() dto: CreateDosageFormDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('MANAGER')
  update(@Param('id') id: string, @Body() dto: UpdateDosageFormDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles('MANAGER')
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }

  @Delete(':id')
  @Roles('MANAGER')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
