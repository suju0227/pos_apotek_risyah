## 2026-07-10T02:58:47Z

You are a teamwork_preview_worker.
Your working directory is: d:\pos_apotek_risyah\.agents\worker_m1_db_schema
Your task is to implement Milestone 1: Database Schema update (M1_DB_SCHEMA) for the "Chained Units" (Rantai Satuan) project.

Specifically, you must:
1. Update `backend/prisma/schema.prisma` to add:
   - `parentProductUnitId String?      @map("parent_product_unit_id") @db.Uuid`
   - `multiplier          Decimal?     @map("multiplier") @db.Decimal(18, 4)`
   - `parentProductUnit   ProductUnit? @relation("ProductUnitChains", fields: [parentProductUnitId], references: [id], onDelete: Restrict)`
   - `childProductUnits   ProductUnit[] @relation("ProductUnitChains")`
   - Index on `parentProductUnitId`: `@@index([parentProductUnitId], map: "idx_product_units_parent_product_unit_id")`

2. Generate the PostgreSQL migration file using:
   `npx prisma migrate dev --create-only --name add_chained_units`

3. Modify the generated `migration.sql` file to add the following constraints:
   - Check constraint to prevent direct self-parenting:
     `ALTER TABLE "product_units" ADD CONSTRAINT "product_units_no_self_parent_check" CHECK ("id" <> "parent_product_unit_id");`
   - Check constraint to enforce consistency of parent and multiplier:
     `ALTER TABLE "product_units" ADD CONSTRAINT "chk_product_units_chain_consistency" CHECK ((parent_product_unit_id IS NULL AND multiplier IS NULL) OR (parent_product_unit_id IS NOT NULL AND multiplier IS NOT NULL AND multiplier > 0));`

4. Apply the migration and regenerate Prisma Client using:
   `npx prisma migrate dev`

5. Verify that the backend compiles and run tests to ensure no regressions:
   - Run compilation check: `npm run build` inside `backend/`
   - Run tests: `npm run test` or `npx jest`

6. Write a completion report to `d:\pos_apotek_risyah\.agents\worker_m1_db_schema\handoff.md` summarizing the exact changes made, command outputs, and verification results.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
