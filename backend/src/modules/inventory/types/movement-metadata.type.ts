export type PurchaseMetadata = {
  purchaseNumber: string;
  supplier: string;
  supplierCode?: string;
  invoice: string;
  unitCost: string; // Decimal as string for precision
  notes?: string;
};

export type SaleMetadata = {
  invoiceNumber: string;
  cashier: string;
  cashierCode?: string;
  unitPrice: string;
  discount: string;
  saleUnitName: string;
  conversionToBase: string;
};

export type PurchaseReturnMetadata = {
  purchaseReturnNumber: string;
  originalPurchaseNumber: string;
  supplier: string;
  reason: string;
  approvedBy: string;
};

export type SaleReturnMetadata = {
  saleReturnNumber: string;
  originalInvoice: string;
  customer: string;
  reason: string;
  returnedBy: string;
  approvedBy: string;
};

export type AdjustmentMetadata = {
  adjustmentType: string;
  reason: string;
  beforeQty: string;
  afterQty: string;
  approvedBy: string;
  notes?: string;
};

export type OpnameMetadata = {
  opnameNumber: string;
  systemQty: string;
  physicalQty: string;
  difference: string;
  verifiedBy: string;
  notes?: string;
};

export type TransferMetadata = {
  fromLocation: string;
  fromLocationCode?: string;
  toLocation: string;
  toLocationCode?: string;
  reason?: string;
};

export type MovementMetadata =
  | PurchaseMetadata
  | SaleMetadata
  | PurchaseReturnMetadata
  | SaleReturnMetadata
  | AdjustmentMetadata
  | OpnameMetadata
  | TransferMetadata
  | Record<string, unknown>;
