import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductBatch, ProductUnit } from '@prisma/client';
import { isPrismaUniqueError } from '../../common/utils/prisma-error';
import { PrismaService } from '../../database/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PurchaseItemDto } from './dto/purchase-item.dto';

const purchaseInclude = {
  supplier: true,
  createdBy: {
    include: { role: true },
  },
  items: {
    include: {
      product: true,
      productUnit: {
        include: { unit: true },
      },
      batch: true,
    },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.PurchaseInclude;

type PurchaseWithRelations = Prisma.PurchaseGetPayload<{
  include: typeof purchaseInclude;
}>;

type ProductUnitForPurchase = ProductUnit & {
  product: {
    id: string;
    isActive: boolean;
    deletedAt: Date | null;
  };
};

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const purchases = await this.prisma.purchase.findMany({
      where: { deletedAt: null },
      include: purchaseInclude,
      orderBy: [{ purchaseDate: 'desc' }, { createdAt: 'desc' }],
    });

    return purchases.map((purchase) => this.toPurchaseResponse(purchase));
  }

  async findOne(id: string) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id, deletedAt: null },
      include: purchaseInclude,
    });

    if (!purchase) {
      throw new NotFoundException('Pembelian tidak ditemukan');
    }

    return this.toPurchaseResponse(purchase);
  }

  async create(dto: CreatePurchaseDto, createdById: string) {
    await this.ensureSupplierActive(dto.supplierId);
    this.ensureUniqueSellingPrices(dto.items);

    const items = await this.resolveItems(dto.items);
    const purchaseNumber = this.generatePurchaseNumber();
    const subtotal = this.roundPrecision(
      items.reduce((sum, item) => sum + item.totalPrice, 0),
      6,
    );

    try {
      const purchase = await this.prisma.$transaction(async (tx) => {
        const createdPurchase = await tx.purchase.create({
          data: {
            supplierId: dto.supplierId,
            createdById,
            purchaseNumber,
            invoiceNumber: dto.invoiceNumber,
            purchaseDate: this.toDate(dto.purchaseDate),
            subtotal,
          },
        });

        for (const item of items) {
          const batch = await this.createOrUpdateBatch(tx, {
            productId: item.productId,
            supplierId: dto.supplierId,
            batchNumber: item.batchNumber,
            expiredDate: item.expiredDate,
            qtyBase: item.qtyBase,
            hppBase: item.hppBase,
          });

          await tx.purchaseItem.create({
            data: {
              purchaseId: createdPurchase.id,
              productId: item.productId,
              productUnitId: item.productUnitId,
              batchId: batch.id,
              batchNumber: item.batchNumber,
              expiredDate: item.expiredDate,
              qtyPurchase: item.qtyPurchase,
              conversionSnapshot: item.conversionSnapshot,
              qtyBase: item.qtyBase,
              purchasePrice: item.purchasePrice,
              hppBase: item.hppBase,
              totalPrice: item.totalPrice,
            },
          });

          await this.replaceBatchPrices(tx, batch.id, item.sellingPrices);

          await tx.stockMutation.create({
            data: {
              productId: item.productId,
              batchId: batch.id,
              createdById,
              mutationType: 'PURCHASE_IN',
              referenceType: 'PURCHASE',
              referenceId: createdPurchase.id,
              qtyBefore: batch.qtyBefore,
              qtyChange: item.qtyBase,
              qtyAfter: batch.qtyAfter,
              reason: `Pembelian ${createdPurchase.purchaseNumber}`,
            },
          });
        }

        return tx.purchase.findUniqueOrThrow({
          where: { id: createdPurchase.id },
          include: purchaseInclude,
        });
      });

      return this.toPurchaseResponse(purchase);
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new BadRequestException('Nomor pembelian sudah digunakan');
      }
      throw error;
    }
  }

  private async ensureSupplierActive(supplierId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, isActive: true, deletedAt: null },
    });

    if (!supplier) {
      throw new BadRequestException('Supplier tidak valid');
    }
  }

  private ensureUniqueSellingPrices(items: PurchaseItemDto[]) {
    for (const item of items) {
      const ids = item.sellingPrices.map((price) => price.productUnitId);
      if (new Set(ids).size !== ids.length) {
        throw new BadRequestException('Harga jual tidak boleh duplikat');
      }
    }
  }

  private async resolveItems(items: PurchaseItemDto[]) {
    const resolvedItems = [];

    for (const item of items) {
      const purchaseUnit = await this.findProductUnit(item.productId, item.productUnitId);
      const conversionSnapshot = Number(purchaseUnit.conversionToBase);
      const qtyBase = this.roundPrecision(
        item.qtyPurchase * conversionSnapshot,
        4,
      );
      const totalPrice = this.roundPrecision(
        item.qtyPurchase * item.purchasePrice,
        6,
      );
      const hppBase = qtyBase === 0
        ? 0
        : this.roundPrecision(item.purchasePrice / qtyBase, 8);

      await this.ensureSellingPricesBelongToProduct(
        item.productId,
        item.sellingPrices.map((price) => price.productUnitId),
      );

      resolvedItems.push({
        productId: item.productId,
        productUnitId: item.productUnitId,
        batchNumber: item.batchNumber,
        expiredDate: this.toDate(item.expiredDate),
        qtyPurchase: item.qtyPurchase,
        conversionSnapshot,
        qtyBase,
        purchasePrice: item.purchasePrice,
        hppBase,
        totalPrice,
        sellingPrices: item.sellingPrices,
      });
    }

    return resolvedItems;
  }

  private async findProductUnit(productId: string, productUnitId: string) {
    const productUnit = await this.prisma.productUnit.findFirst({
      where: {
        id: productUnitId,
        productId,
        isActive: true,
        deletedAt: null,
        product: {
          isActive: true,
          deletedAt: null,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            isActive: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!productUnit) {
      throw new BadRequestException('Produk atau satuan pembelian tidak valid');
    }

    return productUnit as ProductUnitForPurchase;
  }

  private async ensureSellingPricesBelongToProduct(
    productId: string,
    productUnitIds: string[],
  ) {
    const productUnits = await this.prisma.productUnit.findMany({
      where: {
        id: { in: productUnitIds },
        productId,
        isActive: true,
        isSaleUnit: true,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (productUnits.length !== productUnitIds.length) {
      throw new BadRequestException('Harga jual berisi satuan produk yang tidak valid');
    }
  }

  private async createOrUpdateBatch(
    tx: Prisma.TransactionClient,
    input: {
      productId: string;
      supplierId: string;
      batchNumber: string;
      expiredDate: Date;
      qtyBase: number;
      hppBase: number;
    },
  ): Promise<ProductBatch & { qtyBefore: number; qtyAfter: number }> {
    const existingBatch = await tx.productBatch.findFirst({
      where: {
        productId: input.productId,
        batchNumber: input.batchNumber,
        deletedAt: null,
      },
    });

    if (existingBatch) {
      const qtyBefore = Number(existingBatch.currentStockBase);
      const qtyAfter = qtyBefore + input.qtyBase;
      const updatedBatch = await tx.productBatch.update({
        where: { id: existingBatch.id },
        data: {
          supplierId: input.supplierId,
          expiredDate: input.expiredDate,
          currentStockBase: qtyAfter,
          hppBase: input.hppBase,
          isActive: true,
        },
      });

      return {
        ...updatedBatch,
        qtyBefore,
        qtyAfter,
      };
    }

    const createdBatch = await tx.productBatch.create({
      data: {
        productId: input.productId,
        supplierId: input.supplierId,
        batchNumber: input.batchNumber,
        expiredDate: input.expiredDate,
        initialStockBase: input.qtyBase,
        currentStockBase: input.qtyBase,
        hppBase: input.hppBase,
      },
    });

    return {
      ...createdBatch,
      qtyBefore: 0,
      qtyAfter: input.qtyBase,
    };
  }

  private async replaceBatchPrices(
    tx: Prisma.TransactionClient,
    batchId: string,
    sellingPrices: { productUnitId: string; sellingPrice: number }[],
  ) {
    for (const price of sellingPrices) {
      await tx.batchUnitPrice.updateMany({
        where: {
          batchId,
          productUnitId: price.productUnitId,
          deletedAt: null,
        },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      });

      await tx.batchUnitPrice.create({
        data: {
          batchId,
          productUnitId: price.productUnitId,
          sellingPrice: price.sellingPrice,
        },
      });
    }
  }

  private toPurchaseResponse(purchase: PurchaseWithRelations) {
    return {
      ...purchase,
      subtotal: Number(purchase.subtotal),
      createdBy: {
        id: purchase.createdBy.id,
        name: purchase.createdBy.name,
        username: purchase.createdBy.username,
        role: purchase.createdBy.role.name,
      },
      items: purchase.items.map((item) => ({
        ...item,
        qtyPurchase: Number(item.qtyPurchase),
        conversionSnapshot: Number(item.conversionSnapshot),
        qtyBase: Number(item.qtyBase),
        purchasePrice: Number(item.purchasePrice),
        hppBase: Number(item.hppBase),
        totalPrice: Number(item.totalPrice),
        product: {
          ...item.product,
          minStockBase: Number(item.product.minStockBase),
        },
        productUnit: {
          ...item.productUnit,
          conversionToBase: Number(item.productUnit.conversionToBase),
        },
        batch: {
          ...item.batch,
          initialStockBase: Number(item.batch.initialStockBase),
          currentStockBase: Number(item.batch.currentStockBase),
          hppBase: Number(item.batch.hppBase),
        },
      })),
    };
  }

  private generatePurchaseNumber() {
    return `PUR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  private toDate(value: string) {
    return new Date(`${value}T00:00:00.000Z`);
  }

  private roundPrecision(value: number, decimals: number) {
    const factor = 10 ** decimals;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
}
