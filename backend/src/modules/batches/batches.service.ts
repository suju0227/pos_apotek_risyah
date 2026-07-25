import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  isPrismaNotFoundError,
  isPrismaUniqueError,
} from '../../common/utils/prisma-error';
import { PrismaService } from '../../database/prisma.service';
import { BatchPriceDto } from './dto/batch-price.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

const batchInclude = {
  product: {
    include: {
      category: true,
      baseUnit: true,
    },
  },
  supplier: true,
  prices: {
    where: { deletedAt: null },
    include: {
      productUnit: {
        include: { unit: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.ProductBatchInclude;

type BatchWithRelations = Prisma.ProductBatchGetPayload<{
  include: typeof batchInclude;
}>;

@Injectable()
export class BatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(role?: string) {
    const batches = await this.prisma.productBatch.findMany({
      where: { deletedAt: null },
      include: batchInclude,
      orderBy: [{ expiredDate: 'asc' }, { createdAt: 'desc' }],
    });

    return batches.map((batch) => this.toBatchResponse(batch, role));
  }

  async findOne(id: string, role?: string) {
    const batch = await this.prisma.productBatch.findFirst({
      where: { id, deletedAt: null },
      include: batchInclude,
    });

    if (!batch) {
      throw new NotFoundException('Batch tidak ditemukan');
    }

    return this.toBatchResponse(batch, role);
  }

  async create(dto: CreateBatchDto, role?: string) {
    await this.ensureProductActive(dto.productId);
    await this.ensureSupplierActive(dto.supplierId);
    await this.ensurePricesBelongToProduct(dto.productId, dto.prices);

    const costModal = dto.costModalBase ?? 0;
    const additionalCost = dto.additionalCostBase ?? 0;
    const hppBase = (dto.costModalBase !== undefined || dto.additionalCostBase !== undefined)
      ? costModal + additionalCost
      : dto.hppBase;

    try {
      const batch = await this.prisma.productBatch.create({
        data: {
          productId: dto.productId,
          supplierId: dto.supplierId,
          batchNumber: dto.batchNumber,
          expiredDate: this.toDate(dto.expiredDate),
          initialStockBase: dto.initialStockBase,
          currentStockBase: dto.currentStockBase,
          costModalBase: costModal,
          additionalCostBase: additionalCost,
          hppBase: hppBase,
          prices: {
            create: dto.prices.map((price) => ({
              productUnitId: price.productUnitId,
              sellingPrice: price.sellingPrice,
            })),
          },
        },
        include: batchInclude,
      });

      return this.toBatchResponse(batch, role);
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new BadRequestException('Nomor batch atau harga satuan sudah digunakan');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateBatchDto, role?: string) {
    const existingBatch = await this.prisma.productBatch.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingBatch) {
      throw new NotFoundException('Batch tidak ditemukan');
    }

    await this.ensureSupplierActive(dto.supplierId);
    if (dto.prices) {
      await this.ensurePricesBelongToProduct(existingBatch.productId, dto.prices);
    }

    const costModal = dto.costModalBase !== undefined ? dto.costModalBase : Number(existingBatch.costModalBase);
    const additionalCost = dto.additionalCostBase !== undefined ? dto.additionalCostBase : Number(existingBatch.additionalCostBase);
    const hppBase = (dto.costModalBase !== undefined || dto.additionalCostBase !== undefined)
      ? costModal + additionalCost
      : dto.hppBase;

    try {
      const batch = await this.prisma.$transaction(async (tx) => {
        if (dto.prices) {
          await tx.batchUnitPrice.updateMany({
            where: { batchId: id, deletedAt: null },
            data: {
              isActive: false,
              deletedAt: new Date(),
            },
          });
        }

        return tx.productBatch.update({
          where: { id },
          data: {
            supplierId: dto.supplierId,
            batchNumber: dto.batchNumber,
            expiredDate: dto.expiredDate ? this.toDate(dto.expiredDate) : undefined,
            initialStockBase: dto.initialStockBase,
            currentStockBase: dto.currentStockBase,
            costModalBase: dto.costModalBase,
            additionalCostBase: dto.additionalCostBase,
            hppBase: hppBase,
            isActive: dto.isActive,
            ...(dto.prices
              ? {
                  prices: {
                    create: dto.prices.map((price) => ({
                      productUnitId: price.productUnitId,
                      sellingPrice: price.sellingPrice,
                    })),
                  },
                }
              : {}),
          },
          include: batchInclude,
        });
      });

      return this.toBatchResponse(batch, role);
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        throw new NotFoundException('Batch tidak ditemukan');
      }
      if (isPrismaUniqueError(error)) {
        throw new BadRequestException('Nomor batch atau harga satuan sudah digunakan');
      }
      throw error;
    }
  }

  async deactivate(id: string, role?: string) {
    try {
      const batch = await this.prisma.productBatch.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date(),
          prices: {
            updateMany: {
              where: { deletedAt: null },
              data: {
                isActive: false,
                deletedAt: new Date(),
              },
            },
          },
        },
        include: batchInclude,
      });

      return this.toBatchResponse(batch, role);
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        throw new NotFoundException('Batch tidak ditemukan');
      }
      throw error;
    }
  }

  async expiredAlert(role?: string) {
    const today = this.startOfToday();
    const alertUntil = new Date(today);
    alertUntil.setDate(alertUntil.getDate() + 30);

    const batches = await this.prisma.productBatch.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        expiredDate: {
          gte: today,
          lte: alertUntil,
        },
      },
      include: batchInclude,
      orderBy: { expiredDate: 'asc' },
    });

    return batches.map((batch) => this.toBatchResponse(batch, role));
  }

  private async ensureProductActive(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, isActive: true, deletedAt: null },
    });

    if (!product) {
      throw new BadRequestException('Produk tidak valid');
    }
  }

  private async ensureSupplierActive(supplierId?: string | null) {
    if (!supplierId) return;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, isActive: true, deletedAt: null },
    });

    if (!supplier) {
      throw new BadRequestException('Supplier tidak valid');
    }
  }

  private async ensurePricesBelongToProduct(
    productId: string,
    prices: BatchPriceDto[],
  ) {
    const productUnitIds = prices.map((price) => price.productUnitId);
    const uniqueProductUnitIds = new Set(productUnitIds);

    if (uniqueProductUnitIds.size !== productUnitIds.length) {
      throw new BadRequestException('Harga satuan batch tidak boleh duplikat');
    }

    const activeProductUnits = await this.prisma.productUnit.findMany({
      where: {
        id: { in: productUnitIds },
        productId,
        isActive: true,
        isSaleUnit: true,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (activeProductUnits.length !== productUnitIds.length) {
      throw new BadRequestException('Satuan harga tidak valid untuk produk batch');
    }
  }

  private toBatchResponse(batch: BatchWithRelations, role?: string) {
    const isSanitized = role !== 'MANAGER' && role !== 'PEMILIK';

    const defaultPriceObj = batch.prices.find((p) => p.productUnit?.isDefaultSaleUnit);
    const sellingPriceDefault = defaultPriceObj ? Number(defaultPriceObj.sellingPrice) : 0;
    const conversionToBase = defaultPriceObj ? Number(defaultPriceObj.productUnit.conversionToBase) : 1;
    const sellingPriceBase = conversionToBase > 0 ? sellingPriceDefault / conversionToBase : 0;

    const costModalBase = isSanitized ? 0 : Number(batch.costModalBase || 0);
    const additionalCostBase = isSanitized ? 0 : Number(batch.additionalCostBase || 0);
    const hppBase = isSanitized ? 0 : Number(batch.hppBase || 0);

    const margin = isSanitized ? 0 : (sellingPriceBase - hppBase);
    const marginPercent = isSanitized ? 0 : (sellingPriceBase > 0 ? (margin / sellingPriceBase) * 100 : 0);
    const nilaiPersediaan = isSanitized ? 0 : (hppBase * Number(batch.currentStockBase));
    const potensiProfit = isSanitized ? 0 : (margin * Number(batch.currentStockBase));

    return {
      ...batch,
      initialStockBase: Number(batch.initialStockBase),
      currentStockBase: Number(batch.currentStockBase),
      costModalBase,
      additionalCostBase,
      hppBase,
      sellingPriceDefault,
      sellingPriceBase,
      margin,
      marginPercent,
      nilaiPersediaan,
      potensiProfit,
      status: this.resolveBatchStatus(batch),
      prices: batch.prices.map((price) => ({
        ...price,
        sellingPrice: Number(price.sellingPrice),
        productUnit: {
          ...price.productUnit,
          conversionToBase: Number(price.productUnit.conversionToBase),
        },
      })),
      product: {
        ...batch.product,
        minStockBase: Number(batch.product.minStockBase),
      },
    };
  }

  private resolveBatchStatus(batch: BatchWithRelations) {
    if (!batch.isActive || batch.deletedAt) return 'INACTIVE';
    if (Number(batch.currentStockBase) <= 0) return 'OUT_OF_STOCK';
    if (batch.expiredDate < this.startOfToday()) return 'EXPIRED';
    return 'ACTIVE';
  }

  private toDate(value: string) {
    return new Date(`${value}T00:00:00.000Z`);
  }

  private startOfToday() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
}
