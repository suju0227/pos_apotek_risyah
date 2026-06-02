import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  isPrismaNotFoundError,
  isPrismaUniqueError,
} from '../../common/utils/prisma-error';
import { PrismaService } from '../../database/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.unit.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateUnitDto) {
    try {
      return await this.prisma.unit.create({ data: dto });
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new BadRequestException('Nama satuan sudah digunakan');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateUnitDto) {
    try {
      return await this.prisma.unit.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        throw new NotFoundException('Satuan tidak ditemukan');
      }
      if (isPrismaUniqueError(error)) {
        throw new BadRequestException('Nama satuan sudah digunakan');
      }
      throw error;
    }
  }

  deactivate(id: string) {
    return this.update(id, { isActive: false });
  }
}
