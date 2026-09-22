import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { decimal, roundMoney } from '../../common/utils/money.util';
import { PaymentMethod } from './dto/create-sale.dto';

type PaymentResult = {
  paidAmount: number;
  changeAmount: number;
};

@Injectable()
export class PaymentService {
  validatePayment(
    paymentMethod: PaymentMethod,
    paidAmount: number,
    grandTotal: Prisma.Decimal | number,
  ): PaymentResult {
    const paid = decimal(paidAmount);
    if (paid.isNegative()) {
      throw new BadRequestException('Nominal pembayaran tidak boleh negatif');
    }

    if (paymentMethod === 'CASH') {
      if (paid.lessThan(grandTotal)) {
        throw new BadRequestException('Nominal pembayaran belum mencukupi');
      }

      return {
        paidAmount: paid.toNumber(),
        changeAmount: roundMoney(paid.sub(decimal(grandTotal))).toNumber(),
      };
    }

    return {
      paidAmount: paid.toNumber(),
      changeAmount: 0,
    };
  }
}
