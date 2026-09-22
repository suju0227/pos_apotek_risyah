import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { decimal, roundMoney, sumDecimals } from '../../common/utils/money.util';
import { DiscountType } from './dto/create-sale.dto';

@Injectable()
export class DiscountService {
  calculateDiscount(
    discountType: DiscountType,
    discountValue: number,
    subtotal: Prisma.Decimal | number,
  ) {
    const value = decimal(discountValue);
    if (value.isNegative()) {
      throw new BadRequestException('Diskon tidak boleh negatif');
    }

    if (discountType === 'NONE') return 0;

    if (discountType === 'PERCENT') {
      if (value.greaterThan(100)) {
        throw new BadRequestException('Diskon persen tidak boleh lebih dari 100');
      }
      return roundMoney(decimal(subtotal).mul(value).div(100)).toNumber();
    }

    if (value.greaterThan(subtotal)) {
      throw new BadRequestException('Diskon tidak boleh melebihi subtotal');
    }

    return roundMoney(value).toNumber();
  }

  allocateDiscount(subtotals: Array<Prisma.Decimal | number>, discountTotal: Prisma.Decimal | number) {
    const total = decimal(discountTotal);
    if (total.isNegative()) {
      throw new BadRequestException('Diskon tidak boleh negatif');
    }
    if (!subtotals.length) return [];
    if (total.isZero()) return subtotals.map(() => 0);

    const subtotalTotal = sumDecimals(subtotals);
    if (!subtotalTotal.greaterThan(0)) {
      throw new BadRequestException('Subtotal alokasi diskon tidak valid');
    }

    let allocated = decimal(0);
    return subtotals.map((subtotal, index) => {
      if (index === subtotals.length - 1) {
        return roundMoney(total.sub(allocated)).toNumber();
      }
      const value = roundMoney(decimal(subtotal).div(subtotalTotal).mul(total));
      allocated = roundMoney(allocated.plus(value));
      return value.toNumber();
    });
  }
}
