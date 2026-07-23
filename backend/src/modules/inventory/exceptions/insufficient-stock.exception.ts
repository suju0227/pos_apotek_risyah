import { BadRequestException } from '@nestjs/common';

export class InsufficientStockException extends BadRequestException {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Stok tidak cukup untuk produk ${productId}. ` +
        `Diminta: ${requested}, Tersedia: ${available}`,
    );
  }
}
