# Handoff Report: Chained Units (Rantai Satuan) Database Schema Investigation

## 1. Observation

1. **Prisma Schema File**: The file `backend/prisma/schema.prisma` contains the definition for the `ProductUnit` model (lines 185-210):
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

2. **Existing Migrations**: The directory `backend/prisma/migrations/` shows multiple existing schema migrations, including:
   - `20260602100000_master_data_products/migration.sql`: Contains the original table definition for `product_units` with a check constraint `CONSTRAINT "product_units_conversion_to_base_check" CHECK ("conversion_to_base" > 0)`.
   - `20260603140000_price_precision_sale_units/migration.sql`: Modified columns on the table such as adding `is_sale_unit` and `min_sale_qty`.

3. **Backend Configuration**: In `backend/package.json`, there are scripts for running prisma commands (lines 11-17):
   - `"db:migrate": "prisma migrate dev"`
   - `"db:generate": "prisma generate"`

---

## 2. Logic Chain

1. **Self-Relation Definition**:
   - *Observation*: The `ProductUnit.id` primary key is of type `String` with annotation `@db.Uuid`.
   - *Reasoning*: Any foreign key pointing to `ProductUnit.id` must also have the exact matching database type (`UUID`). Thus, `parentProductUnitId` must be defined in Prisma as `String? @map("parent_product_unit_id") @db.Uuid`.
   - *Reasoning*: Prisma requires defining relations explicitly. A self-referential one-to-many relationship maps a parent relation (`parentProductUnit ProductUnit?`) and a back-relation (`childProductUnits ProductUnit[]`) using a unique name, e.g., `"ProductUnitSelfRelation"`.

2. **Multiplier Definition**:
   - *Observation*: The multiplier must be stored with decimal precision `Decimal(18, 4)`.
   - *Reasoning*: In Prisma, this is represented as `multiplier Decimal @default(1.0000) @map("multiplier") @db.Decimal(18, 4)`.

3. **Handling Existing Rows (Data Integrity)**:
   - *Observation*: Existing rows in the `product_units` table currently represent direct conversions to the base unit (with no parent unit).
   - *Reasoning*: Because these existing units have no parent, their multiplier relative to the "virtual" parent base unit is equal to their current conversion factor. If a new non-null `multiplier` column is added, inserting the static default `1.0000` for all existing records would corrupt this data. Therefore, the migration SQL must backfill existing records to set `multiplier = conversion_to_base`.

4. **Referential Action on Deletion**:
   - *Reasoning*: Deleting a parent `ProductUnit` while child units still reference it would result in orphans or invalid hierarchies. Using `onDelete: Restrict` on the self-relation prevents the database from allowing deletions of parents that have children.

---

## 3. Caveats

- **Cyclic Dependency Checking**: Database-level check constraints can prevent direct self-referencing (e.g., `id <> parent_product_unit_id`), but cannot prevent deep cyclic references (e.g., A -> B -> C -> A). Deep cycle detection must be enforced in the application service layers.
- **Transitive Calculation Invariance**: The invariant $\text{conversionToBase}_{\text{child}} = \text{conversionToBase}_{\text{parent}} \times \text{multiplier}_{\text{child}}$ must be validated and automatically synchronized on insertion/update. While this could be implemented using database trigger functions, doing so in backend services (NestJS) is recommended for maintainability.

---

## 4. Conclusion

The schema changes should be implemented by adding the following block to the `ProductUnit` model in `backend/prisma/schema.prisma`:
```prisma
parentProductUnitId String?      @map("parent_product_unit_id") @db.Uuid
multiplier          Decimal      @default(1.0000) @map("multiplier") @db.Decimal(18, 4)

parentProductUnit   ProductUnit? @relation("ProductUnitSelfRelation", fields: [parentProductUnitId], references: [id], onDelete: Restrict)
childProductUnits   ProductUnit[] @relation("ProductUnitSelfRelation")

@@index([parentProductUnitId], map: "idx_product_units_parent_product_unit_id")
```

A customized SQL migration is required to populate existing row data and apply constraints:
```sql
ALTER TABLE "product_units" ADD COLUMN "parent_product_unit_id" UUID;
ALTER TABLE "product_units" ADD COLUMN "multiplier" DECIMAL(18,4) NOT NULL DEFAULT 1.0000;

UPDATE "product_units" SET "multiplier" = "conversion_to_base" WHERE "parent_product_unit_id" IS NULL;

ALTER TABLE "product_units" ADD CONSTRAINT "product_units_parent_product_unit_id_fkey" 
  FOREIGN KEY ("parent_product_unit_id") REFERENCES "product_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "idx_product_units_parent_product_unit_id" ON "product_units"("parent_product_unit_id");

ALTER TABLE "product_units" ADD CONSTRAINT "product_units_multiplier_positive_check" CHECK ("multiplier" > 0);
ALTER TABLE "product_units" ADD CONSTRAINT "product_units_no_self_parent_check" CHECK ("id" <> "parent_product_unit_id");
```

---

## 5. Verification Method

1. **Create and Inspect Migration Draft**:
   Run the following command in the `backend` folder to draft the migration files:
   ```powershell
   npx prisma migrate dev --create-only --name add_chained_units
   ```
2. **Review Generated SQL**:
   Verify that the generated `migration.sql` matches the structure above.
3. **Execute and Validate Database**:
   Apply migration:
   ```powershell
   npx prisma migrate dev
   ```
   Verify Prisma models compile successfully:
   ```powershell
   npx prisma validate
   ```
4. **Test Execution**:
   Run the backend tests to ensure the schema modification didn't break existing tests:
   ```powershell
   npm run test
   ```
