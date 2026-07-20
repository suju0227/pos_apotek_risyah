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
import { CacheService } from '../../common/services/cache.service';
import { CreateDosageFormDto } from './dto/create-dosage-form.dto';
import { UpdateDosageFormDto } from './dto/update-dosage-form.dto';

@Injectable()
export class DosageFormsService {
  private readonly cacheKey = 'dosage-forms:all';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async findAll() {
    const cached = await this.cacheService.get<any[]>(this.cacheKey);
    if (cached) {
      return cached;
    }

    const dosageForms = await this.prisma.dosageForm.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { products: { where: { deletedAt: null } } },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    // Map response to include product count
    const mapped = dosageForms.map((df) => ({
      id: df.id,
      code: df.code,
      name: df.name,
      description: df.description,
      sortOrder: df.sortOrder,
      isActive: df.isActive,
      productCount: df._count.products,
      createdAt: df.createdAt,
      updatedAt: df.updatedAt,
    }));

    await this.cacheService.set(this.cacheKey, mapped);
    return mapped;
  }

  async findOne(id: string) {
    const dosageForm = await this.prisma.dosageForm.findFirst({
      where: { id, deletedAt: null },
    });

    if (!dosageForm) {
      throw new NotFoundException('Bentuk sediaan tidak ditemukan');
    }

    return dosageForm;
  }

  async create(dto: CreateDosageFormDto) {
    try {
      // Find max sort order to append new item to end
      const maxSortObj = await this.prisma.dosageForm.findFirst({
        where: { deletedAt: null },
        orderBy: { sortOrder: 'desc' },
      });
      const sortOrder = maxSortObj ? maxSortObj.sortOrder + 1 : 0;

      const dosageForm = await this.prisma.dosageForm.create({
        data: { ...dto, sortOrder },
      });

      await this.invalidateCache();
      return dosageForm;
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new BadRequestException('Kode atau nama bentuk sediaan sudah digunakan');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateDosageFormDto) {
    try {
      const dosageForm = await this.prisma.dosageForm.update({
        where: { id },
        data: dto,
      });

      await this.invalidateCache();
      return dosageForm;
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        throw new NotFoundException('Bentuk sediaan tidak ditemukan');
      }
      if (isPrismaUniqueError(error)) {
        throw new BadRequestException('Kode atau nama bentuk sediaan sudah digunakan');
      }
      throw error;
    }
  }

  async deactivate(id: string) {
    // Check if dosage form is still used by active products
    const productsCount = await this.prisma.product.count({
      where: { dosageFormId: id, isActive: true, deletedAt: null },
    });

    if (productsCount > 0) {
      throw new BadRequestException(
        'Bentuk sediaan tidak dapat dinonaktifkan karena masih digunakan oleh produk aktif',
      );
    }

    try {
      const dosageForm = await this.prisma.dosageForm.update({
        where: { id },
        data: { isActive: false },
      });

      await this.invalidateCache();
      return dosageForm;
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        throw new NotFoundException('Bentuk sediaan tidak ditemukan');
      }
      throw error;
    }
  }

  async remove(id: string) {
    // Check if dosage form is still used by products (any product, active or not)
    const productsCount = await this.prisma.product.count({
      where: { dosageFormId: id, deletedAt: null },
    });

    if (productsCount > 0) {
      throw new BadRequestException(
        'Bentuk sediaan tidak dapat dihapus karena masih digunakan oleh produk',
      );
    }

    try {
      const dosageForm = await this.prisma.dosageForm.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false },
      });

      await this.invalidateCache();
      return dosageForm;
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        throw new NotFoundException('Bentuk sediaan tidak ditemukan');
      }
      throw error;
    }
  }

  private async invalidateCache() {
    await this.cacheService.del(this.cacheKey);
    // Invalidate products list cache as well since it may display product's dosage form info
    await this.cacheService.del('products:all');
  }
}
