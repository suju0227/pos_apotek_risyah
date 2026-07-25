# Handoff Report: Chained Units Database Schema Investigation

## 1. Observation
We observed the following details in the codebase:
- **`backend/prisma/schema.prisma` lines 185-210**:
  ```prisma
  model ProductUnit {
    id                String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
    productId         String    @map("product_id") @db.Uuid
    unitId            String    @map("unit_id") @db.Uuid
    conversionToBase  Decimal   @map("conversion_to_base") @db.Decimal(18, 4)
    ...
  ```
- **`backend/prisma/migrations/20260602100000_master_data_products/migration.sql` lines 17-30**:
  ```sql
  CREATE TABLE "product_units" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "conversion_to_base" DECIMAL(18, 4) NOT NULL,
    ...
  ```
- **`backend/src/scripts/import-bulk-data.ts` lines 161 & 171**:
  We observed that the base unit itself is registered as a row in `ProductUnit` with `conversionToBase: 1.0`.

---

## 2. Logic Chain
- **Step 1**: The base unit is stored as a row in `ProductUnit` with `conversionToBase: 1.0` (Observation 3). Therefore, `parentProductUnitId` must be nullable (`String?` in Prisma, `UUID` nullable in SQL) because the root/base unit does not have a parent unit.
- **Step 2**: For any chained unit (e.g. Box -> Strip), a parent and a positive relative multiplier are required. Therefore, the schema-level `multiplier` should be nullable (`Decimal?`) to accommodate the root unit, but database/application-level validation must enforce that `multiplier` is defined if and only if `parentProductUnitId` is present.
- **Step 3**: Declaring a self-relation in Prisma requires naming the relation (e.g., `"ProductUnitChains"`) to disambiguate the parent relation from the children collection relation (Observation 1).
- **Step 4**: To guarantee referential integrity and avoid orphans, the relation constraint `onDelete: Restrict` should be applied, preventing the deletion of any unit that is currently a parent to another.
- **Step 5**: To ensure optimal index coverage for tree traversal queries, a database index must be placed on the foreign key column `parent_product_unit_id` (Observation 2).

---

## 3. Caveats
- **Scope limitation**: We did not explore how the frontend client configuration UI handles chained units or displays them to the user.
- **Database assumption**: The analysis assumes the target database remains PostgreSQL, as declared in `schema.prisma` line 6.

---

## 4. Conclusion
To implement unit chaining, the following configuration should be introduced:

### Prisma Schema Updates (`backend/prisma/schema.prisma`):
```prisma
// Within model ProductUnit:
parentProductUnitId String?       @map("parent_product_unit_id") @db.Uuid
multiplier          Decimal?      @map("multiplier") @db.Decimal(18, 4)

parentProductUnit   ProductUnit?  @relation("ProductUnitChains", fields: [parentProductUnitId], references: [id], onDelete: Restrict)
childProductUnits   ProductUnit[] @relation("ProductUnitChains")

@@index([parentProductUnitId], map: "idx_product_units_parent_product_unit_id")
```

### PostgreSQL Migration Updates (`migration.sql`):
```sql
ALTER TABLE "product_units" 
  ADD COLUMN "parent_product_unit_id" UUID,
  ADD COLUMN "multiplier" DECIMAL(18, 4);

CREATE INDEX "idx_product_units_parent_product_unit_id" ON "product_units"("parent_product_unit_id");

ALTER TABLE "product_units" 
  ADD CONSTRAINT "product_units_parent_product_unit_id_fkey" 
  FOREIGN KEY ("parent_product_unit_id") REFERENCES "product_units"("id") 
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Rule constraint to prevent half-chains
ALTER TABLE "product_units"
  ADD CONSTRAINT "chk_product_units_chain_consistency"
  CHECK (
    (parent_product_unit_id IS NULL AND multiplier IS NULL) OR
    (parent_product_unit_id IS NOT NULL AND multiplier IS NOT NULL AND multiplier > 0)
  );
```

### Key Business/Application Rules to Implement in NestJS Services:
1. **Product Group Matching**: Validate that `parentProductUnit.productId === childProductUnit.productId`.
2. **Cycle Detection**: Walk the relation path upwards to ensure no circular dependency is formed.
3. **Recursive Invariant Propagation**: If a parent's `conversionToBase` changes, update all child units recursively: `child.conversionToBase = parent.conversionToBase * child.multiplier`.

---

## 5. Verification Method
To verify these schema modifications:
1. Run `npx prisma validate` inside the `backend` folder to ensure the self-relation structure is syntactically valid in Prisma.
2. Run `npx prisma migrate dev --create-only` and verify that the generated SQL file includes the column creations, the correct foreign key reference pointing to `product_units(id)`, and the index.
3. Add check constraints manually to the SQL script and run migrations.
4. Run standard integration tests (`npm run test:cov` or similar test scripts in `backend`) to ensure existing `ProductUnit` inserts and updates function properly.
