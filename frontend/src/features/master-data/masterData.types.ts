export type Category = {
  id: string;
  name: string;
  parentId: string | null;
  description: string | null;
  isActive: boolean;
  children?: Category[];
};

export type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  contactPerson: string | null;
  isActive: boolean;
};

export type Unit = {
  id: string;
  name: string;
  symbol: string | null;
  isActive: boolean;
};

export type ProductUnit = {
  id: string;
  unitId: string;
  conversionToBase: number;
  isDefaultSaleUnit: boolean;
  isSaleUnit: boolean;
  minSaleQty: number;
  saleUnitNote: string | null;
  isActive: boolean;
  unit: Unit;
};

export type BatchFinancialSnapshot = {
  id: string;
  batchNumber: string;
  expiredDate: string;
  initialStockBase: number;
  currentStockBase: number;
  costModalBase: number;
  additionalCostBase: number;
  hppBase: number;
  sellingPriceDefault: number;
  sellingPriceBase: number;
  margin: number;
  marginPercent: number;
  nilaiPersediaan: number;
  potensiProfit: number;
  isActive: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'EXPIRED';
};

export type Product = {
  id: string;
  categoryId: string;
  baseUnitId: string;
  dosageFormId: string | null;
  storageLocationId: string | null;
  code: string;
  barcode: string | null;
  name: string;
  genericName: string | null;
  minStockBase: number;
  isActive: boolean;
  category: Category;
  baseUnit: Unit;
  dosageForm?: { id: string; name: string } | null;
  storageLocation?: { id: string; name: string } | null;
  productUnits: ProductUnit[];
  // Financial fields (0 for non-MANAGER roles, populated for MANAGER/PEMILIK)
  hppActive: number;
  sellingPriceActive: number;
  marginActive: number;
  marginPercentActive: number;
  batchCount: number;
  nilaiPersediaan: number;
  potensiProfit: number;
  hppMin: number;
  hppMax: number;
  batches: BatchFinancialSnapshot[];
};

export type CreateCategoryPayload = {
  name: string;
  parentId?: string | null;
  description?: string;
};

export type CreateSupplierPayload = {
  name: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
};

export type CreateUnitPayload = {
  name: string;
  symbol?: string;
};

export type CreateProductPayload = {
  categoryId: string;
  baseUnitId: string;
  dosageFormId?: string;
  storageLocationId?: string;
  code: string;
  barcode?: string;
  name: string;
  genericName?: string;
  minStockBase?: number;
};

export type CreateProductUnitPayload = {
  unitId: string;
  conversionToBase: number;
  isDefaultSaleUnit?: boolean;
  isSaleUnit?: boolean;
  minSaleQty?: number;
  saleUnitNote?: string;
};

export type UpdateProductUnitPayload = Partial<CreateProductUnitPayload> & {
  isActive?: boolean;
};

export type DosageForm = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
};

export type CreateDosageFormPayload = {
  code: string;
  name: string;
  description?: string;
};

export type UpdateDosageFormPayload = Partial<CreateDosageFormPayload> & {
  isActive?: boolean;
};
