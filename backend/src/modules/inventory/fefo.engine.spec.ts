import { Prisma } from '@prisma/client';
import { allocateFEFO } from './fefo.engine';
import { InsufficientStockException } from './exceptions/insufficient-stock.exception';

type MockBatch = {
  id: string;
  batchNumber: string;
  expiredDate: Date;
  createdAt: Date;
  currentStockBase: Prisma.Decimal;
  hppBase: Prisma.Decimal;
};

const makeBatch = (o: Partial<MockBatch> & { id: string }): MockBatch => ({
  id: o.id,
  batchNumber: `BATCH-${o.id}`,
  expiredDate: o.expiredDate ?? new Date('2027-01-01'),
  createdAt: o.createdAt ?? new Date('2026-01-01'),
  currentStockBase: o.currentStockBase ?? new Prisma.Decimal(100),
  hppBase: o.hppBase ?? new Prisma.Decimal('4200.0000'),
});

describe('allocateFEFO', () => {
  it('ambil batch dengan expiry paling dekat terlebih dahulu', () => {
    const sorted = [
      makeBatch({ id: 'b2', expiredDate: new Date('2027-01-01'), currentStockBase: new Prisma.Decimal(50) }),
      makeBatch({ id: 'b1', expiredDate: new Date('2027-03-01'), currentStockBase: new Prisma.Decimal(50) }),
    ];
    const result = allocateFEFO(sorted, 30, 'prod-1');
    expect(result).toHaveLength(1);
    expect(result[0].batchId).toBe('b2');
    expect(result[0].allocatedQty).toBe(30);
  });

  it('split batch ketika qty melebihi satu batch', () => {
    const batches = [
      makeBatch({ id: 'b1', expiredDate: new Date('2027-01-01'), currentStockBase: new Prisma.Decimal(10) }),
      makeBatch({ id: 'b2', expiredDate: new Date('2027-03-01'), currentStockBase: new Prisma.Decimal(20) }),
    ];
    const result = allocateFEFO(batches, 15, 'prod-1');
    expect(result).toHaveLength(2);
    expect(result[0].batchId).toBe('b1');
    expect(result[0].allocatedQty).toBe(10);
    expect(result[1].batchId).toBe('b2');
    expect(result[1].allocatedQty).toBe(5);
  });

  it('throw InsufficientStockException jika stok kurang', () => {
    const batches = [makeBatch({ id: 'b1', currentStockBase: new Prisma.Decimal(5) })];
    expect(() => allocateFEFO(batches, 10, 'prod-1')).toThrow(InsufficientStockException);
  });

  it('throw InsufficientStockException jika tidak ada batch', () => {
    expect(() => allocateFEFO([], 10, 'prod-1')).toThrow(InsufficientStockException);
  });

  it('total alokasi selalu sama dengan requestedQty', () => {
    const batches = [
      makeBatch({ id: 'b1', currentStockBase: new Prisma.Decimal(10) }),
      makeBatch({ id: 'b2', currentStockBase: new Prisma.Decimal(20) }),
    ];
    const result = allocateFEFO(batches, 25, 'prod-1');
    const total = result.reduce((sum: number, allocation: any) => sum + allocation.allocatedQty, 0);
    expect(total).toBe(25);
  });

  it('skip batch dengan currentStockBase = 0', () => {
    const batches = [
      makeBatch({ id: 'b1', currentStockBase: new Prisma.Decimal(0) }),
      makeBatch({ id: 'b2', currentStockBase: new Prisma.Decimal(20) }),
    ];
    const result = allocateFEFO(batches, 10, 'prod-1');
    expect(result).toHaveLength(1);
    expect(result[0].batchId).toBe('b2');
  });
});
