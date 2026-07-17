# Analysis: Chained Units (Rantai Satuan) Database Schema and Model Structure

This report analyzes the database schema and model structure of the "Chained Units" (Rantai Satuan) feature for POS Apotek V2. It details the proposed changes to the `ProductUnit` model in `backend/prisma/schema.prisma` and identifies how these changes impact Prisma Client generation, TypeScript types, DTOs, and NestJS service logic.

---

## 1. Current Database Schema and Querying Context

### 1.1 Existing `ProductUnit` Model Structure
The current `ProductUnit` model is defined as follows in `backend/prisma/schema.prisma` (lines 185–210):

```prisma
model ProductUnit {
  id                String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  productId         String    @map("product_id") @db.Uuid
  unitId            String    @map("unit_id") @db.Uuid
  conversionToBase  Decimal   @map("conversion_to_base") @db.Decimal(18, 4)
  isDefaultSaleUnit Boolean   @default(false) @map("is_default_sale_unit")
  isSaleUnit        Boolean   @default(true) @map("is_sale_unit")
  minSaleQty        Decimal   @default(1) @map("min_sale_qty") @db.Decimal(14, 3)
  saleUnitNote      String?   @map("sale_unit_note") @db.Text
  isActive          Boolean   @default(true) @map("is_active")
  createdAt         DateTime  @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt         DateTime  @updatedAt @map("updated_at") @db.Timestamp(6)
  deletedAt         DateTime? @map("deleted_at") @db.Timestamp(6)

  product Product @relation(fields: [productId], references: [id])
  unit    Unit    @relation(fields: [unitId], references: [id])
  batchUnitPrices BatchUnitPrice[]
  purchaseItems PurchaseItem[]
  purchaseOrderItems PurchaseOrderItem[]
  saleItems SaleItem[]
  prescriptionItems PrescriptionItem[]

  @@index([productId], map: "idx_product_units_product_id")
  @@index([unitId], map: "idx_product_units_unit_id")
  @@map("product_units")
}
```

### 1.2 Current Querying and Type Casts
- **Products Module (`products.service.ts`)**: Product units are fetched inside the product queries, mapped to responses using `toProductUnitResponse(productUnit)`, and conversion factors are converted from `Prisma.Decimal` to JS `number` using `Number(productUnit.conversionToBase)`.
- **Sales and Purchases Modules (`sales.service.ts`, `purchases.service.ts`)**: Lookups verify product unit status, e.g., mapping quantities back to base units using `conversionToBase` (stored as snapshot values inside transactions).
- **TypeScript Types**:
  - `ProductUnitWithUnit` is defined as `ProductUnit & { unit: Unit }`.
  - `ProductUnit` types are imported directly from `@prisma/client`.

---

## 2. Proposed Database Schema Changes

To support "Chained Units" (Rantai Satuan), we will introduce a hierarchical self-relation on `ProductUnit` and store the multiplier relative to its parent unit.

### 2.1 Prisma Schema Modifications
We add two fields to the `ProductUnit` model:
1. `parentProductUnitId`: String/Uuid, optional, references the parent unit's `id`.
2. `multiplier`: Decimal (18,4), optional (since the base unit does not have a parent unit and therefore has no relative multiplier, or it can default to `null`/1.0).

#### Recommended Schema Diff
```prisma
model ProductUnit {
  id                String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  productId         String    @map("product_id") @db.Uuid
  unitId            String    @map("unit_id") @db.Uuid
  conversionToBase  Decimal   @map("conversion_to_base") @db.Decimal(18, 4)
  isDefaultSaleUnit Boolean   @default(false) @map("is_default_sale_unit")
  isSaleUnit        Boolean   @default(true) @map("is_sale_unit")
  minSaleQty        Decimal   @default(1) @map("min_sale_qty") @db.Decimal(14, 3)
  saleUnitNote      String?   @map("sale_unit_note") @db.Text
  isActive          Boolean   @default(true) @map("is_active")
  createdAt         DateTime  @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt         DateTime  @updatedAt @map("updated_at") @db.Timestamp(6)
  deletedAt         DateTime? @map("deleted_at") @db.Timestamp(6)

  // --- NEW FIELDS ---
  parentProductUnitId String?      @map("parent_product_unit_id") @db.Uuid
  multiplier          Decimal?     @map("multiplier") @db.Decimal(18, 4)

  product Product @relation(fields: [productId], references: [id])
  unit    Unit    @relation(fields: [unitId], references: [id])
  
  // --- NEW RELATIONS ---
  parentProductUnit   ProductUnit?  @relation("ProductUnitParent", fields: [parentProductUnitId], references: [id])
  childProductUnits   ProductUnit[] @relation("ProductUnitParent")
  
  batchUnitPrices BatchUnitPrice[]
  purchaseItems PurchaseItem[]
  purchaseOrderItems PurchaseOrderItem[]
  saleItems SaleItem[]
  prescriptionItems PrescriptionItem[]

  @@index([productId], map: "idx_product_units_product_id")
  @@index([unitId], map: "idx_product_units_unit_id")
  // --- NEW INDEX ---
  @@index([parentProductUnitId], map: "idx_product_units_parent_product_unit_id")
  @@map("product_units")
}
```

---

## 3. Impact on Prisma Client Generation & TypeScript Types

### 3.1 Generated TypeScript Types
Running `prisma generate` will update the `@prisma/client` library. The model types will shift as follows:

1. **`ProductUnit` Model Interface**:
   ```typescript
   export type ProductUnit = {
     id: string;
     productId: string;
     unitId: string;
     conversionToBase: Prisma.Decimal;
     isDefaultSaleUnit: boolean;
     isSaleUnit: boolean;
     minSaleQty: Prisma.Decimal;
     saleUnitNote: string | null;
     isActive: boolean;
     createdAt: Date;
     updatedAt: Date;
     deletedAt: Date | null;
     // --- New Fields ---
     parentProductUnitId: string | null;
     multiplier: Prisma.Decimal | null;
   }
   ```

2. **Self-relation Navigation Fields**:
   Prisma also generates new relation types within `Prisma.ProductUnitInclude` and `Prisma.ProductUnitGetPayload`:
   - `parentProductUnit?: ProductUnit | null`
   - `childProductUnits?: ProductUnit[]`

### 3.2 Numeric/Decimal Type Transformations
In the NestJS backend, all database `Decimal` values returned to the client are mapped to standard JavaScript `number` types. The existing helpers in `products.service.ts` will need updates to parse the new Decimal `multiplier` value:

```typescript
// products.service.ts
private toProductUnitResponse(productUnit: ProductUnitWithUnit) {
  return {
    ...productUnit,
    conversionToBase: Number(productUnit.conversionToBase),
    minSaleQty: Number(productUnit.minSaleQty),
    // --- New conversion mapping ---
    multiplier: productUnit.multiplier ? Number(productUnit.multiplier) : null,
  };
}
```

---

## 4. Impact on Backend DTOs & Validation Rules

To expose these new fields in the API, the Create and Update DTOs in `backend/src/modules/products/dto` must be modified.

### 4.1 DTO Updates
- **`CreateProductUnitDto`**:
  ```typescript
  @IsUUID()
  @IsOptional()
  parentProductUnitId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  @IsOptional()
  multiplier?: number;
  ```
- **`UpdateProductUnitDto`**:
  ```typescript
  @IsUUID()
  @IsOptional()
  parentProductUnitId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  @IsOptional()
  multiplier?: number;
  ```

### 4.2 Business Rules and Backend Validations (Critical Path)
When handling `parentProductUnitId` and `multiplier` updates in `products.service.ts`, several validations must be implemented to prevent logical errors and data corruption:

1. **Same-Product Validation**:
   The parent product unit (`parentProductUnitId`) must belong to the same product as the unit being created/updated. You cannot cross-link units between different products.
   *Proposed validation query:*
   ```typescript
   const parentUnit = await this.prisma.productUnit.findUnique({
     where: { id: dto.parentProductUnitId }
   });
   if (parentUnit.productId !== productId) {
     throw new BadRequestException('Satuan induk harus milik produk yang sama');
   }
   ```

2. **Circular Reference Prevention**:
   You cannot set a parent that creates a loop (e.g. Unit A -> parent Unit B -> parent Unit A). A cycle detection helper must be added to check the hierarchy tree before writing changes:
   ```typescript
   private async detectCycle(unitId: string, parentId: string): Promise<boolean> {
     let currentParentId = parentId;
     while (currentParentId) {
       if (currentParentId === unitId) return true;
       const parent = await this.prisma.productUnit.findUnique({
         where: { id: currentParentId },
         select: { parentProductUnitId: true },
       });
       currentParentId = parent?.parentProductUnitId || null;
     }
     return false;
   }
   ```

3. **Active Parent Validation**:
   The parent unit referenced must be active (`isActive: true` and `deletedAt: null`).

4. **Consistency between `conversionToBase` and `multiplier`**:
   The multiplier must be mathematically aligned with the base conversion factor.
   - For a unit with a parent:
     $$\text{conversionToBase} = \text{multiplier} \times \text{parent.conversionToBase}$$
   - When a parent unit's `conversionToBase` is updated, the changes must **propagate down the chain** to update the descendants' `conversionToBase` fields accordingly. This propagation should be executed within a database transaction.

### 4.3 Propagation Logic for Recursive Updates
If the multiplier of a unit or the conversion factor of its parent changes, we must recursively recalculate `conversionToBase` for all descendant units:
```typescript
private async propagateConversionToBase(unitId: string, parentConversionToBase: number, tx: Prisma.TransactionClient) {
  const children = await tx.productUnit.findMany({
    where: { parentProductUnitId: unitId, deletedAt: null }
  });

  for (const child of children) {
    const childMultiplier = Number(child.multiplier);
    const newConversionToBase = childMultiplier * parentConversionToBase;

    await tx.productUnit.update({
      where: { id: child.id },
      data: { conversionToBase: newConversionToBase }
    });

    // Recurse into children
    await this.propagateConversionToBase(child.id, newConversionToBase, tx);
  }
}
```

---

## 5. Summary of Recommendations

1. **Prisma Schema Update**:
   Apply the schema changes precisely as shown in section 2.1, keeping relation name strings explicit (`"ProductUnitParent"`) and registering the index on `parentProductUnitId`.
2. **DTO & Validation Implementation**:
   Implement standard validations in `CreateProductUnitDto` and `UpdateProductUnitDto`. Add backend-level validation checks in `products.service.ts` for product ID matching, parent activity, cycle detection, and consistency.
3. **Transaction-Guaranteed Propagation**:
   Ensure that any operation altering a unit's `conversionToBase` or hierarchy propagates updates to descendants inside a single database transaction (`this.prisma.$transaction`) to keep the conversion values consistent across all inventory operations.
