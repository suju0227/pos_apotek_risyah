import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductUnit, Unit } from '@prisma/client';
import {
  isPrismaNotFoundError,
  isPrismaUniqueError,
} from '../../common/utils/prisma-error';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../common/services/cache.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateProductUnitDto } from './dto/create-product-unit.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductUnitDto } from './dto/update-product-unit.dto';

const productInclude = {
  category: true,
  baseUnit: true,
  dosageForm: true,
  storageLocation: true,
  productUnits: {
    where: { deletedAt: null },
    include: { unit: true },
    orderBy: [{ isDefaultSaleUnit: 'desc' }, { createdAt: 'asc' }],
  },
  batches: {
    where: { deletedAt: null, isActive: true },
    include: {
      prices: {
        where: { deletedAt: null, isActive: true },
        include: {
          productUnit: {
            include: { unit: true },
          },
        },
      },
    },
    orderBy: [{ expiredDate: 'asc' }, { createdAt: 'asc' }],
  },
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;
type ProductUnitWithUnit = ProductUnit & { unit: Unit };

@Injectable()
export class ProductsService {
  private readonly cacheKey = 'products:all';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(role?: string, search?: string, categoryId?: string) {
    let products: any[];
    // Don't cache search or filtered results
    if (search || categoryId) {
      products = await this.queryProducts(search, categoryId);
    } else {
      // Try to get from cache
      const cached = await this.cacheService.get<any[]>(this.cacheKey);
      if (cached) {
        products = cached;
      } else {
        // Query database
        products = await this.queryProducts();
        // Store in cache
        await this.cacheService.set(this.cacheKey, products);
      }
    }

    return products.map((product) => this.sanitizeProductResponse(product, role));
  }

  private async getDescendantCategoryIds(categoryId: string): Promise<string[]> {
    const categories = await this.prisma.category.findMany({
      where: { parentId: categoryId, deletedAt: null },
      select: { id: true },
    });
    const ids = categories.map((c) => c.id);
    const childIdsPromises = ids.map((id) => this.getDescendantCategoryIds(id));
    const childIds = await Promise.all(childIdsPromises);
    return [categoryId, ...ids, ...childIds.flat()];
  }

  private async queryProducts(search?: string, categoryId?: string) {
    let categoryIds: string[] | undefined;
    if (categoryId) {
      categoryIds = await this.getDescendantCategoryIds(categoryId);
    }

    const products = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: productInclude,
      orderBy: { name: 'asc' },
    });

    return products.map((product) => this.toProductResponse(product));
  }

  search(role?: string, search?: string, categoryId?: string) {
    return this.findAll(role, search, categoryId);
  }

  async create(dto: CreateProductDto, role?: string) {
    await this.ensureCategoryActive(dto.categoryId);
    await this.ensureUnitActive(dto.baseUnitId);
    if (dto.dosageFormId) await this.ensureDosageFormActive(dto.dosageFormId);
    if (dto.storageLocationId) await this.ensureStorageLocationActive(dto.storageLocationId);

    try {
      const product = await this.prisma.product.create({
        data: dto,
        include: productInclude,
      });

      // Invalidate cache
      await this.cacheService.del(this.cacheKey);

      return this.sanitizeProductResponse(this.toProductResponse(product), role);
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new BadRequestException('Kode, barcode, atau nama produk sudah digunakan');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateProductDto, role?: string) {
    if (dto.categoryId) await this.ensureCategoryActive(dto.categoryId);
    if (dto.baseUnitId) await this.ensureUnitActive(dto.baseUnitId);
    if (dto.dosageFormId) await this.ensureDosageFormActive(dto.dosageFormId);
    if (dto.storageLocationId) await this.ensureStorageLocationActive(dto.storageLocationId);

    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: dto,
        include: productInclude,
      });

      // Invalidate cache
      await this.cacheService.del(this.cacheKey);

      return this.sanitizeProductResponse(this.toProductResponse(product), role);
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        throw new NotFoundException('Produk tidak ditemukan');
      }
      if (isPrismaUniqueError(error)) {
        throw new BadRequestException('Kode, barcode, atau nama produk sudah digunakan');
      }
      throw error;
    }
  }

  async deactivate(id: string, role?: string) {
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date(),
          productUnits: {
            updateMany: {
              where: { deletedAt: null },
              data: {
                isActive: false,
                isDefaultSaleUnit: false,
                deletedAt: new Date(),
              },
            },
          },
        },
        include: productInclude,
      });

      // Invalidate cache
      await this.cacheService.del(this.cacheKey);

      return this.sanitizeProductResponse(this.toProductResponse(product), role);
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        throw new NotFoundException('Produk tidak ditemukan');
      }
      throw error;
    }
  }

  async findUnits(productId: string) {
    await this.ensureProductExists(productId);

    const units = await this.prisma.productUnit.findMany({
      where: { productId, deletedAt: null },
      include: { unit: true },
      orderBy: [{ isDefaultSaleUnit: 'desc' }, { createdAt: 'asc' }],
    });

    return units.map((unit) => this.toProductUnitResponse(unit));
  }

  async createUnit(productId: string, dto: CreateProductUnitDto) {
    await this.ensureProductExists(productId);
    await this.ensureUnitActive(dto.unitId);
    this.ensureDefaultSaleUnitIsSellable(dto);

    try {
      const productUnit = await this.prisma.$transaction(async (tx) => {
        if (dto.isDefaultSaleUnit) {
          await tx.productUnit.updateMany({
            where: { productId, deletedAt: null },
            data: { isDefaultSaleUnit: false },
          });
        }

        return tx.productUnit.create({
          data: {
            productId,
            unitId: dto.unitId,
            conversionToBase: dto.conversionToBase,
            isDefaultSaleUnit: dto.isDefaultSaleUnit ?? false,
            isSaleUnit: dto.isSaleUnit ?? true,
            minSaleQty: dto.minSaleQty ?? 1,
            saleUnitNote: dto.saleUnitNote,
          },
          include: { unit: true },
        });
      });

      await this.cacheService.del(this.cacheKey);

      return this.toProductUnitResponse(productUnit);
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new BadRequestException('Satuan produk sudah digunakan');
      }
      throw error;
    }
  }

  async updateUnit(
    productId: string,
    productUnitId: string,
    dto: UpdateProductUnitDto,
  ) {
    await this.ensureProductExists(productId);
    await this.ensureProductUnitExists(productId, productUnitId);
    if (dto.unitId) await this.ensureUnitActive(dto.unitId);
    this.ensureDefaultSaleUnitIsSellable(dto);
    if (dto.isDefaultSaleUnit && dto.isActive === false) {
      throw new BadRequestException('Satuan default harus aktif');
    }

    try {
      const productUnit = await this.prisma.$transaction(async (tx) => {
        if (dto.isDefaultSaleUnit) {
          await tx.productUnit.updateMany({
            where: {
              productId,
              id: { not: productUnitId },
              deletedAt: null,
            },
            data: { isDefaultSaleUnit: false },
          });
        }

        return tx.productUnit.update({
          where: { id: productUnitId },
          data: {
            ...dto,
            ...(dto.isActive === false || dto.isSaleUnit === false
              ? { isDefaultSaleUnit: false }
              : {}),
          },
          include: { unit: true },
        });
      });

      await this.cacheService.del(this.cacheKey);

      return this.toProductUnitResponse(productUnit);
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        throw new NotFoundException('Satuan produk tidak ditemukan');
      }
      if (isPrismaUniqueError(error)) {
        throw new BadRequestException('Satuan produk sudah digunakan');
      }
      throw error;
    }
  }

  async deactivateUnit(productId: string, productUnitId: string) {
    await this.ensureProductExists(productId);
    await this.ensureProductUnitExists(productId, productUnitId);

    try {
      const productUnit = await this.prisma.productUnit.update({
        where: { id: productUnitId },
        data: {
          isActive: false,
          isSaleUnit: false,
          isDefaultSaleUnit: false,
          deletedAt: new Date(),
        },
        include: { unit: true },
      });

      await this.cacheService.del(this.cacheKey);

      return this.toProductUnitResponse(productUnit);
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        throw new NotFoundException('Satuan produk tidak ditemukan');
      }
      throw error;
    }
  }

  private async ensureCategoryActive(categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, isActive: true, deletedAt: null },
    });

    if (!category) {
      throw new BadRequestException('Kategori tidak valid');
    }
  }

  private async ensureDosageFormActive(dosageFormId: string) {
    const dosageForm = await this.prisma.dosageForm.findFirst({
      where: { id: dosageFormId, isActive: true, deletedAt: null },
    });

    if (!dosageForm) {
      throw new BadRequestException('Bentuk Sediaan tidak valid');
    }
  }

  private async ensureStorageLocationActive(storageLocationId: string) {
    const storageLocation = await this.prisma.storageLocation.findFirst({
      where: { id: storageLocationId, isActive: true, deletedAt: null },
    });

    if (!storageLocation) {
      throw new BadRequestException('Lokasi Penyimpanan tidak valid');
    }
  }

  private async ensureUnitActive(unitId: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id: unitId, isActive: true },
    });

    if (!unit) {
      throw new BadRequestException('Satuan tidak valid');
    }
  }

  private async ensureProductExists(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('Produk tidak ditemukan');
    }
  }

  private async ensureProductUnitExists(productId: string, productUnitId: string) {
    const productUnit = await this.prisma.productUnit.findFirst({
      where: {
        id: productUnitId,
        productId,
        deletedAt: null,
      },
    });

    if (!productUnit) {
      throw new NotFoundException('Satuan produk tidak ditemukan');
    }
  }

  private ensureDefaultSaleUnitIsSellable(
    dto: CreateProductUnitDto | UpdateProductUnitDto,
  ) {
    if (dto.isDefaultSaleUnit && dto.isSaleUnit === false) {
      throw new BadRequestException('Satuan default harus boleh dijual');
    }
  }

  private toProductResponse(product: ProductWithRelations) {
    // Calculate financial summary
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    // Active batches for financials (isActive = true, expiredDate >= today, currentStockBase > 0)
    const activeBatches = product.batches?.filter((b: any) =>
      b.isActive &&
      !b.deletedAt &&
      new Date(b.expiredDate) >= todayUTC &&
      Number(b.currentStockBase) > 0
    ) || [];

    const batchCount = activeBatches.length;

    // Sum of inventory value and potential profit
    let nilaiPersediaan = 0;
    let potensiProfit = 0;
    const hpps = activeBatches.map((b: any) => Number(b.hppBase));
    const hppMin = hpps.length > 0 ? Math.min(...hpps) : 0;
    const hppMax = hpps.length > 0 ? Math.max(...hpps) : 0;

    activeBatches.forEach((batch: any) => {
      const hpp = Number(batch.hppBase);
      const stock = Number(batch.currentStockBase);
      
      const defaultPriceObj = batch.prices?.find((p: any) => p.productUnit?.isDefaultSaleUnit);
      const sellingPriceDefault = defaultPriceObj ? Number(defaultPriceObj.sellingPrice) : 0;
      const conversionToBase = defaultPriceObj ? Number(defaultPriceObj.productUnit.conversionToBase) : 1;
      const sellingPriceBase = conversionToBase > 0 ? sellingPriceDefault / conversionToBase : 0;

      const margin = sellingPriceBase - hpp;
      nilaiPersediaan += hpp * stock;
      potensiProfit += margin * stock;
    });

    const activeBatch = activeBatches[0];
    let hppActive = 0;
    let sellingPriceActive = 0;
    let marginActive = 0;
    let marginPercentActive = 0;

    if (activeBatch) {
      hppActive = Number(activeBatch.hppBase);
      const defaultPriceObj = activeBatch.prices?.find((p: any) => p.productUnit?.isDefaultSaleUnit);
      const sellingPriceDefault = defaultPriceObj ? Number(defaultPriceObj.sellingPrice) : 0;
      const conversionToBase = defaultPriceObj ? Number(defaultPriceObj.productUnit.conversionToBase) : 1;
      sellingPriceActive = conversionToBase > 0 ? sellingPriceDefault / conversionToBase : 0;

      marginActive = sellingPriceActive - hppActive;
      marginPercentActive = sellingPriceActive > 0 ? (marginActive / sellingPriceActive) * 100 : 0;
    }

    return {
      ...product,
      minStockBase: Number(product.minStockBase),
      productUnits: product.productUnits.map((unit) =>
        this.toProductUnitResponse(unit),
      ),
      batches: product.batches?.map((batch: any) => {
        // Map batch pricing/status/financials
        const defaultPriceObj = batch.prices?.find((p: any) => p.productUnit?.isDefaultSaleUnit);
        const sellingPriceDefault = defaultPriceObj ? Number(defaultPriceObj.sellingPrice) : 0;
        const conversionToBase = defaultPriceObj ? Number(defaultPriceObj.productUnit.conversionToBase) : 1;
        const sellingPriceBase = conversionToBase > 0 ? sellingPriceDefault / conversionToBase : 0;

        const hpp = Number(batch.hppBase);
        const margin = sellingPriceBase - hpp;
        const marginPercent = sellingPriceBase > 0 ? (margin / sellingPriceBase) * 100 : 0;
        const stock = Number(batch.currentStockBase);

        return {
          ...batch,
          initialStockBase: Number(batch.initialStockBase),
          currentStockBase: stock,
          costModalBase: Number(batch.costModalBase || 0),
          additionalCostBase: Number(batch.additionalCostBase || 0),
          hppBase: hpp,
          sellingPriceDefault,
          sellingPriceBase,
          margin,
          marginPercent,
          nilaiPersediaan: hpp * stock,
          potensiProfit: margin * stock,
          prices: batch.prices?.map((price: any) => ({
            ...price,
            sellingPrice: Number(price.sellingPrice),
            productUnit: {
              ...price.productUnit,
              conversionToBase: Number(price.productUnit.conversionToBase),
            },
          })) || [],
        };
      }) || [],
      hppActive,
      sellingPriceActive,
      marginActive,
      marginPercentActive,
      batchCount,
      nilaiPersediaan,
      potensiProfit,
      hppMin,
      hppMax,
    };
  }

  private sanitizeProductResponse(product: any, role?: string) {
    const isSanitized = role !== 'MANAGER' && role !== 'PEMILIK';
    if (!isSanitized) {
      return product;
    }

    return {
      ...product,
      hppActive: 0,
      sellingPriceActive: product.sellingPriceActive,
      marginActive: 0,
      marginPercentActive: 0,
      nilaiPersediaan: 0,
      potensiProfit: 0,
      hppMin: 0,
      hppMax: 0,
      batches: product.batches?.map((batch: any) => ({
        ...batch,
        costModalBase: 0,
        additionalCostBase: 0,
        hppBase: 0,
        margin: 0,
        marginPercent: 0,
        nilaiPersediaan: 0,
        potensiProfit: 0,
      })) || [],
    };
  }

  private toProductUnitResponse(productUnit: ProductUnitWithUnit) {
    return {
      ...productUnit,
      conversionToBase: Number(productUnit.conversionToBase),
      minSaleQty: Number(productUnit.minSaleQty),
    };
  }
}
