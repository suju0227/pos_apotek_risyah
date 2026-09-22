import { Prisma } from '@prisma/client';

export type DecimalValue = Prisma.Decimal | number | string;

export const decimal = (value: DecimalValue) => new Prisma.Decimal(value);

export const roundMoney = (value: DecimalValue) => decimal(value).toDecimalPlaces(0);

export const roundInternal = (value: DecimalValue) =>
  decimal(value).toDecimalPlaces(8);

export const roundQuantity = (value: DecimalValue) =>
  decimal(value).toDecimalPlaces(4);

export const sumDecimals = (values: DecimalValue[]): Prisma.Decimal =>
  values.reduce<Prisma.Decimal>(
    (sum, value) => sum.plus(decimal(value)),
    decimal(0),
  );
