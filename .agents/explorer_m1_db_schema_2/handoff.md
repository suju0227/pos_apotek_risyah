# Handoff Report: Chained Units Database Schema Analysis

## 1. Observation

- **ProductUnit Model Definition**:
  Directly observed in `backend/prisma/schema.prisma` (lines 185–210):
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

- **TypeScript Imports**:
  `ProductUnit` is imported from `@prisma/client` in `products.service.ts` (line 6) and `purchases.service.ts` (line 7).
  
- **Decimal Conversions**:
  `conversionToBase` is mapped to JavaScript `number` using `Number(productUnit.conversionToBase)` in `products.service.ts` (line 364), `purchases.service.ts` (lines 115, 355, 698), `sales.service.ts` (lines 158, 566), etc.

- **DTO Declarations**:
  DTOs are defined in `backend/src/modules/products/dto/create-product-unit.dto.ts` and `update-product-unit.dto.ts` using `class-validator` decorators.

---

## 2. Logic Chain

1. **Self-Relation Definition**:
   To represent "Chained Units" hierarchical structures in SQL via Prisma:
   - A nullable foreign key field referencing the same model (`parentProductUnitId`) must be added.
   - An optional `multiplier` field of type `Decimal(18, 4)` is required to capture the relative multiplication factor.
   - Prisma requires named relation attributes (e.g., `@relation("ProductUnitParent")`) on both ends of the self-relation to distinguish parent and child navigation fields.

2. **Types Generation**:
   - Running `prisma generate` will modify the generated `ProductUnit` type, introducing optional `parentProductUnitId: string | null` and `multiplier: Decimal | null`.
   - New database queries will allow loading relations recursively or in-depth (e.g., `include: { parentProductUnit: true }`).

3. **Data Serialization Impact**:
   - Because `multiplier` is defined as `Decimal` in Prisma, it maps to `Prisma.Decimal` in TypeScript.
   - Any API response mapping must convert this Decimal value to a JS `number` using `Number(productUnit.multiplier)`.

4. **Validation Logic**:
   - To maintain consistency:
     - `parentProductUnitId` must reference a unit belonging to the same `productId`.
     - Cycle detection must prevent infinite hierarchy loops (e.g., A -> B -> A).
     - Changing the multiplier or parent of a unit must trigger recalculation of `conversionToBase` recursively down the child hierarchy tree inside a database transaction.

---

## 3. Caveats

- **Recursive Depth Loading**: We did not specify a maximum nesting limit for unit chains. If the hierarchy exceeds 3–4 layers, custom recursive checks might be slightly slow, though in apotek contexts, units rarely exceed 4 layers (e.g., Tablet -> Strip -> Pack -> Box).
- **Prisma Recursive Includes**: Prisma does not natively support arbitrary-depth recursive includes. Rebuilding the hierarchy in memory (since we fetch all active units for a single product anyway) is the recommended approach.

---

## 4. Conclusion

The proposed schema changes are clean, idiomatic to Prisma, and align directly with the Postgres capabilities of the project stack. Implementing the `parentProductUnitId` self-relation and `multiplier` requires:
- Updating `schema.prisma` with the relative fields, relation definitions, and a new database index on `parentProductUnitId`.
- Updating validation layers (DTOs and services) to enforce cycle detection, single-product boundaries, parent liveness, and transactional cascading updates for `conversionToBase`.

---

## 5. Verification Method

Once the implementer writes these schema modifications:
1. Run `npm run db:validate` inside `backend/` to ensure schema syntactical correctness.
2. Run `npm run prisma:generate` (or `npx prisma generate`) to regenerate the client and verify TypeScript compiles successfully.
3. Inspect `node_modules/.prisma/client/index.d.ts` to confirm the fields `parentProductUnitId` (nullable string) and `multiplier` (nullable Decimal) are present.
4. Execute `npm run test` to verify no existing tests are broken by the type addition.
