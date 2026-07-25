# Database Schema & Model Structure Analysis: Chained Units (Rantai Satuan)

## 1. Executive Summary
This report analyzes the database schema and model structure for introducing the **Chained Units** (Rantai Satuan) feature into the *POS Apotek V2* application. 
We investigated the Prisma schema, existing migrations, DTOs, and services. We present a detailed plan to introduce:
1. A self-relation `parentProductUnitId` to enable hierarchical chaining of product units.
2. A `multiplier` field of type `Decimal(18, 4)` to store relative multipliers between parent and child units.
3. Logical validations and architectural considerations to ensure mathematical consistency and avoid cross-product pollution.

---

## 2. Current Database Structure

### 2.1 The `ProductUnit` Model in `schema.prisma`
Currently, `ProductUnit` acts as a join table between `Product` and `Unit`, mapping how many base units make up a given unit:
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

### 2.2 Key Observations
1. **Base Unit Row Presence**: Base units (which have a conversion rate of `1.0`) are explicitly inserted into the `product_units` table for each product. This is confirmed by `import-bulk-data.ts` (lines 161, 171) and integration tests (e.g. `batches.integration.spec.ts` line 211).
2. **Precision Standards**: All financial and quantity-conversion decimals follow high-precision rules (typically `Decimal(18, 4)` or similar) to prevent floating-point errors.
3. **Database Constraints**: The database uses standard UUID primary keys and defines indexes/foreign keys with explicit `@map` and naming patterns.

---

## 3. Proposed Schema Modifications

To introduce Unit Chaining, we propose modifying the `ProductUnit` model to include:
1. `parentProductUnitId`: A nullable self-referential foreign key pointing to `ProductUnit.id`.
2. `multiplier`: A decimal field representing the conversion ratio of this unit relative to its parent unit.
3. An index on `parentProductUnitId` for query optimization.

### 3.1 Proposed Prisma Schema Changes
Within `model ProductUnit` in `backend/prisma/schema.prisma`:

```prisma
model ProductUnit {
  id                String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  productId         String    @map("product_id") @db.Uuid
  unitId            String    @map("unit_id") @db.Uuid
  conversionToBase  Decimal   @map("conversion_to_base") @db.Decimal(18, 4)
  
  // --- New Fields for Chained Units ---
  parentProductUnitId String?   @map("parent_product_unit_id") @db.Uuid
  multiplier          Decimal?  @map("multiplier") @db.Decimal(18, 4)
  // ------------------------------------

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
  
  // --- New Relations for Chained Units ---
  parentProductUnit   ProductUnit?  @relation("ProductUnitChains", fields: [parentProductUnitId], references: [id], onDelete: Restrict)
  childProductUnits   ProductUnit[] @relation("ProductUnitChains")
  // ---------------------------------------

  batchUnitPrices BatchUnitPrice[]
  purchaseItems PurchaseItem[]
  purchaseOrderItems PurchaseOrderItem[]
  saleItems SaleItem[]
  prescriptionItems PrescriptionItem[]

  @@index([productId], map: "idx_product_units_product_id")
  @@index([unitId], map: "idx_product_units_unit_id")
  
  // --- New Index for Chained Units ---
  @@index([parentProductUnitId], map: "idx_product_units_parent_product_unit_id")
  
  @@map("product_units")
}
```

### 3.2 SQL Migration Representation (PostgreSQL)
The corresponding SQL migration (`migration.sql`) to be generated:

```sql
-- AlterTable
ALTER TABLE "product_units" 
  ADD COLUMN "parent_product_unit_id" UUID,
  ADD COLUMN "multiplier" DECIMAL(18, 4);

-- CreateIndex
CREATE INDEX "idx_product_units_parent_product_unit_id" ON "product_units"("parent_product_unit_id");

-- AddForeignKey
ALTER TABLE "product_units" 
  ADD CONSTRAINT "product_units_parent_product_unit_id_fkey" 
  FOREIGN KEY ("parent_product_unit_id") REFERENCES "product_units"("id") 
  ON DELETE RESTRICT ON UPDATE CASCADE;
```

---

## 4. Key Design Decisions & Validation Rules

### 4.1 Nullable vs. Non-nullable `multiplier`
We recommend keeping both `parentProductUnitId` and `multiplier` **nullable**:
- **Why**: 
  - For the **root/base unit** of a product (e.g., Tablet), there is no parent unit. Thus, `parentProductUnitId` is `NULL`. In this state, its multiplier relative to a parent is logically undefined (or `NULL`), and its `conversionToBase` is simply `1.0`.
  - For **chained units** (e.g., Strip, Box), both `parentProductUnitId` and `multiplier` must be provided and must be positive numbers.
- **Enforcement**: We can add a Database Check Constraint to enforce this logic at the database level:
  ```sql
  ALTER TABLE "product_units"
    ADD CONSTRAINT "chk_product_units_chain_consistency"
    CHECK (
      (parent_product_unit_id IS NULL AND multiplier IS NULL) OR
      (parent_product_unit_id IS NOT NULL AND multiplier IS NOT NULL AND multiplier > 0)
    );
  ```

### 4.2 Restrict vs. Cascade on Delete
- We set `onDelete: Restrict` for the self-relation. 
- If a user attempts to delete a parent unit (e.g., Strip) that still has child units referencing it (e.g., Box), the database will prevent the deletion. This preserves relational integrity and forces the user to re-chain or delete children first.

### 4.3 Validation: Same-Product Enforcement
It is critical that a unit's parent belongs to the **same product** (e.g., a "Box of Paracetamol" must not be parented to a "Strip of Amoxicillin").
- Since Prisma does not support composite foreign key enforcement easily on product-specific groups in this schema, this constraint must be strictly enforced at the **NestJS Service Layer** before saving/updating a `ProductUnit`:
  ```typescript
  if (dto.parentProductUnitId) {
    const parentUnit = await tx.productUnit.findUnique({
      where: { id: dto.parentProductUnitId }
    });
    if (!parentUnit || parentUnit.productId !== productId) {
      throw new BadRequestException('Induk satuan harus milik produk yang sama');
    }
  }
  ```

### 4.4 The Mathematical Invariant: `conversionToBase`
Chained Units introduce a mathematical rule:
$$\text{conversionToBase} = \text{multiplier} \times \text{parentProductUnit.conversionToBase}$$
To maintain this:
1. **On Create**: Validate and calculate `conversionToBase` based on the parent's `conversionToBase` and the input `multiplier`.
2. **On Update**: 
   - If a parent unit's `conversionToBase` changes (e.g., Strip changes from 10 to 12 Tablets), all child units (e.g., Box = 10 Strips) must have their `conversionToBase` updated recursively.
   - To prevent inconsistencies, a recursive update function should run within a database transaction when a unit is updated.
3. **Cycle Detection**: Verify that chaining does not create circular references (e.g., Unit A -> Unit B -> Unit A). A cycle detection algorithm must check this path before writing to the database.

---

## 5. Recommended Implementation Steps

### Step 1: Database Migration
1. Update `backend/prisma/schema.prisma` with the proposed changes.
2. Run `npx prisma migrate dev --create-only` to generate a migration draft.
3. Add the check constraint `chk_product_units_chain_consistency` to the SQL file.
4. Execute `npx prisma migrate dev` to apply schema changes.

### Step 2: DTO Updates
Update `CreateProductUnitDto` and `UpdateProductUnitDto` in `backend/src/modules/products/dto/`:
- Add `parentProductUnitId?: string;` (UUID validation, optional).
- Add `multiplier?: number;` (Number validation, minimum 0.0001, optional).

### Step 3: Service Layer Logic (NestJS)
Implement in `products.service.ts`:
1. **Cycle Detection Helper**: A function to check if parenting a unit creates a cycle.
2. **Validation**: Check same-product parent match.
3. **Recursive Invariant Updater**: A helper function to propagate `conversionToBase` updates down the chain when a parent's multiplier or conversionToBase changes.
