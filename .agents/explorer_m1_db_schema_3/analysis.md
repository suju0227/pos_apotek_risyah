# Analysis Report: Chained Units (Rantai Satuan) Database Schema Investigation

## Summary of Findings
The database schema for `ProductUnit` requires modification to support a self-referencing hierarchical relationship (Chained Units/Rantai Satuan). This report details the necessary changes to the Prisma schema, PostgreSQL-specific migration strategies for existing data, database constraints, and implementation guidelines.

---

## 1. Current Schema Analysis

The current `ProductUnit` model in `backend/prisma/schema.prisma` is defined as follows:

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

### Key Observations from Current Setup:
1. `ProductUnit.id` is a UUID stored as a string using `@db.Uuid` and defaulted to PostgreSQL's `gen_random_uuid()`.
2. `conversionToBase` is defined as a `Decimal(18, 4)` to store the exact base conversion factor.
3. Database constraints are managed both via Prisma mappings and direct raw SQL CHECK constraints (e.g. `conversion_to_base > 0` added in migration `20260602100000_master_data_products`).

---

## 2. Proposed Prisma Schema Changes

To add chained units, we must define an optional self-referencing relationship for `ProductUnit` and add a relative `multiplier` field.

### Modified Model Code Block (Proposed):

```prisma
model ProductUnit {
  id                  String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  productId           String    @map("product_id") @db.Uuid
  unitId              String    @map("unit_id") @db.Uuid
  parentProductUnitId String?   @map("parent_product_unit_id") @db.Uuid
  conversionToBase    Decimal   @map("conversion_to_base") @db.Decimal(18, 4)
  multiplier          Decimal   @default(1.0000) @map("multiplier") @db.Decimal(18, 4)
  isDefaultSaleUnit   Boolean   @default(false) @map("is_default_sale_unit")
  isSaleUnit          Boolean   @default(true) @map("is_sale_unit")
  minSaleQty          Decimal   @default(1) @map("min_sale_qty") @db.Decimal(14, 3)
  saleUnitNote        String?   @map("sale_unit_note") @db.Text
  isActive            Boolean   @default(true) @map("is_active")
  createdAt           DateTime  @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt           DateTime  @updatedAt @map("updated_at") @db.Timestamp(6)
  deletedAt           DateTime? @map("deleted_at") @db.Timestamp(6)

  product             Product      @relation(fields: [productId], references: [id])
  unit                Unit         @relation(fields: [unitId], references: [id])
  parentProductUnit   ProductUnit? @relation("ProductUnitSelfRelation", fields: [parentProductUnitId], references: [id], onDelete: Restrict)
  childProductUnits   ProductUnit[] @relation("ProductUnitSelfRelation")

  batchUnitPrices     BatchUnitPrice[]
  purchaseItems       PurchaseItem[]
  purchaseOrderItems  PurchaseOrderItem[]
  saleItems           SaleItem[]
  prescriptionItems   PrescriptionItem[]

  @@index([productId], map: "idx_product_units_product_id")
  @@index([unitId], map: "idx_product_units_unit_id")
  @@index([parentProductUnitId], map: "idx_product_units_parent_product_unit_id")
  @@map("product_units")
}
```

### Explanation of Prisma Attributes:
- **`parentProductUnitId`**: UUID field, marked as optional (`String?`) to allow root product units (which have no parent and convert directly to base).
- **`parentProductUnit` & `childProductUnits`**: The self-referencing relation. We use a named relation `"ProductUnitSelfRelation"` to differentiate it.
- **`onDelete: Restrict`**: Restricts the deletion of a product unit if there are other units referencing it as a parent (avoids leaving orphan child units).
- **`multiplier`**: A `Decimal` mapped to `@db.Decimal(18, 4)` and defaulted to `1.0000`.
- **`@@index([parentProductUnitId], ...)`**: High-performance lookup of parent-child hierarchy tree.

---

## 3. PostgreSQL Specific Implications

### A. Decimal Precision (Decimal(18, 4))
- Mapping `@db.Decimal(18, 4)` maps to the PostgreSQL native type `DECIMAL(18, 4)` (equivalent to `NUMERIC(18, 4)`).
- This supports 18 total digits, of which 4 are after the decimal point. This is suitable for very precise multipliers (e.g. `0.3333` or `1.2500`).

### B. Migrating Existing Rows (Data Backfill)
When adding the `multiplier` column, existing rows in the database must be updated. 
- In the current schema, all product units are direct children of the product's base unit (meaning they have no parent product unit, i.e., `parent_product_unit_id IS NULL`).
- Consequently, their multiplier is relative to the base unit, which means `multiplier` **must be equal to `conversion_to_base`** for all existing records.
- Setting a static default of `1.0000` on the column via Prisma is safe to avoid migration crashes, but a post-creation data backfill SQL script is required to set:
  ```sql
  UPDATE "product_units" SET "multiplier" = "conversion_to_base" WHERE "parent_product_unit_id" IS NULL;
  ```

### C. Integrity Constraints
To maintain solid data integrity, several check constraints and triggers should be implemented at the database level:

1. **Multiplier Positive Check**:
   Like `conversion_to_base`, the `multiplier` must always be strictly positive:
   ```sql
   ALTER TABLE "product_units" ADD CONSTRAINT "product_units_multiplier_positive_check" CHECK ("multiplier" > 0);
   ```

2. **Self-Reference Prevention (Basic Cycle Prevention)**:
   A product unit cannot be its own parent:
   ```sql
   ALTER TABLE "product_units" ADD CONSTRAINT "product_units_no_self_parent_check" CHECK ("id" <> "parent_product_unit_id");
   ```

3. **Same-Product Unit Constraint**:
   If a parent unit is specified, both parent and child must belong to the same product (prevent linking Unit A of Product 1 to Unit B of Product 2):
   This is best handled by application logic (Zod validation, Service checking) or custom SQL trigger functions.

---

## 4. Step-by-Step Migration Guide

To generate, customize, and apply this migration safely, use the following procedure:

### Step 1: Run Prisma Migrate with `--create-only`
This generates the migration scripts in `backend/prisma/migrations` but holds off execution, allowing us to edit the SQL before applying.
In the `backend` directory, run:
```powershell
npx prisma migrate dev --create-only --name add_chained_units
```

### Step 2: Edit the Generated `migration.sql`
Open the newly created `migration.sql` file under the newly created migration directory. It will contain Prisma-generated SQL. Customize it to ensure data integrity and correct defaults:

```sql
-- 1. Add the column as nullable first to safely generate it
ALTER TABLE "product_units" ADD COLUMN "parent_product_unit_id" UUID;
ALTER TABLE "product_units" ADD COLUMN "multiplier" DECIMAL(18,4) NOT NULL DEFAULT 1.0000;

-- 2. Populate the multiplier with conversion_to_base for existing rows
UPDATE "product_units" SET "multiplier" = "conversion_to_base" WHERE "parent_product_unit_id" IS NULL;

-- 3. Add foreign key constraint (onDelete: RESTRICT)
ALTER TABLE "product_units" ADD CONSTRAINT "product_units_parent_product_unit_id_fkey" 
  FOREIGN KEY ("parent_product_unit_id") REFERENCES "product_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. Add Indexes
CREATE INDEX "idx_product_units_parent_product_unit_id" ON "product_units"("parent_product_unit_id");

-- 5. Add custom CHECK constraints (not natively managed by Prisma)
ALTER TABLE "product_units" ADD CONSTRAINT "product_units_multiplier_positive_check" CHECK ("multiplier" > 0);
ALTER TABLE "product_units" ADD CONSTRAINT "product_units_no_self_parent_check" CHECK ("id" <> "parent_product_unit_id");
```

### Step 3: Run the Migration
Apply the customized migration schema and run client generation:
```powershell
npx prisma migrate dev
```
*(Alternatively, inside `backend` folder you can use the shortcut script: `npm run db:migrate`)*

---

## 5. Architectural & Business Logic Recommendations

Because Prisma cannot check multi-row constraints (like verifying the entire hierarchy tree or calculating transitive conversions), we recommend enforcing these constraints in the application layer (NestJS services and Zod schemas) or PostgreSQL triggers:

### Recommendation A: Automatic `conversion_to_base` Calculation
When a unit is chained to a parent unit, its `conversionToBase` is no longer arbitrary. It must equal:
$$\text{conversionToBase}_{\text{child}} = \text{conversionToBase}_{\text{parent}} \times \text{multiplier}_{\text{child}}$$
- **Implementation**: The backend service handling `ProductUnit` creation or update should automatically calculate `conversionToBase` based on the parent's `conversionToBase` and the input `multiplier`.
- **Validation**: If updating a parent unit's conversion factor, the application should recursively update all children's `conversionToBase` factors using a transaction.

### Recommendation B: Cycle Prevention (Deep Tree validation)
Before inserting/updating a `parentProductUnitId`, perform a recursive search to verify that the parent is not a child/descendant of the current record.
A simple utility function like this should be run in NestJS service before mutation:
```typescript
async function validateNoCycle(productId: string, unitId: string, parentId: string): Promise<void> {
  let currentParentId: string | null = parentId;
  while (currentParentId) {
    if (currentParentId === unitId) {
      throw new BadRequestException("Cyclic dependency detected in unit hierarchy.");
    }
    const parentUnit = await prisma.productUnit.findUnique({
      where: { id: currentParentId },
      select: { parentProductUnitId: true }
    });
    currentParentId = parentUnit?.parentProductUnitId || null;
  }
}
```
