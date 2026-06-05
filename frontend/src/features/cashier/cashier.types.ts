export type CashierProductUnit = {
  productUnitId: string;
  unitId: string;
  unitName: string;
  unitSymbol: string | null;
  conversionToBase: number;
  isDefaultSaleUnit: boolean;
  minSaleQty: number;
  saleUnitNote: string | null;
  sellingPrice: number;
  stockAvailable: number;
};

export type CashierProduct = {
  id: string;
  code: string;
  barcode: string | null;
  name: string;
  genericName: string | null;
  category: {
    id: string;
    name: string;
  } | null;
  baseUnit: {
    id: string;
    name: string;
    symbol: string | null;
  };
  stockAvailableBase: number;
  units: CashierProductUnit[];
};

export type CashierCartItem = {
  cartItemId: string;
  productId: string;
  productName: string;
  productCode: string;
  productUnitId: string;
  unitName: string;
  unitSymbol: string | null;
  qtySaleUnit: number;
  minSaleQty: number;
  sellingPrice: number;
  stockAvailable: number;
};

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'QRIS' | 'DEBIT';

export type DiscountType = 'NONE' | 'PERCENT' | 'NOMINAL';

export type CreateSalePayload = {
  paymentMethod: PaymentMethod;
  paidAmount: number;
  discountType: DiscountType;
  discountValue: number;
  items: Array<{
    productId: string;
    productUnitId: string;
    qtySaleUnit: number;
  }>;
};

export type CashierSaleResponse = {
  id: string;
  saleNumber: string;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  paidAmount: number;
  changeAmount: number;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    unitName: string;
    qtySale: number;
    sellingPrice: number;
    subtotal: number;
    discountAmount: number;
    totalAfterDiscount: number;
  }>;
};
