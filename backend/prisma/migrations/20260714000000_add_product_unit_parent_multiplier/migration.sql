-- Add parent_product_unit_id and multiplier columns to product_units
-- These columns were added to the Prisma schema but a migration was never generated for them.

ALTER TABLE "product_units"
  ADD COLUMN IF NOT EXISTS "parent_product_unit_id" UUID,
  ADD COLUMN IF NOT EXISTS "multiplier" DECIMAL(18, 4);

-- FK: parent_product_unit_id references product_units(id) (self-referential chain)
ALTER TABLE "product_units"
  ADD CONSTRAINT "product_units_parent_product_unit_id_fkey"
  FOREIGN KEY ("parent_product_unit_id") REFERENCES "product_units"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Index for the new FK column
CREATE INDEX IF NOT EXISTS "idx_product_units_parent_product_unit_id"
  ON "product_units"("parent_product_unit_id");
