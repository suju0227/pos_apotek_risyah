/*
  Warnings:

  - You are about to drop the column `address` on the `app_settings_legacy` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `app_settings_legacy` table. All the data in the column will be lost.
  - You are about to drop the column `po_print_template` on the `app_settings_legacy` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "app_settings" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "app_settings_legacy" DROP COLUMN "address",
DROP COLUMN "phone",
DROP COLUMN "po_print_template",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "pharmacy_name" DROP DEFAULT,
ALTER COLUMN "expired_alert_days" DROP DEFAULT,
ALTER COLUMN "timezone" DROP DEFAULT,
ALTER COLUMN "currency" DROP DEFAULT,
ALTER COLUMN "created_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "branding_settings" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "parent_id" UUID,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "global_settings" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "localization_settings" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "pharmacy_profile" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "preference_settings" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "dosage_form_id" UUID,
ADD COLUMN     "storage_location_id" UUID;

-- AlterTable
ALTER TABLE "receipt_settings" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "security_settings" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "dosage_forms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "dosage_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_locations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "storage_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dosage_forms_name_key" ON "dosage_forms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "storage_locations_name_key" ON "storage_locations"("name");

-- CreateIndex
CREATE INDEX "idx_products_dosage_form_id" ON "products"("dosage_form_id");

-- CreateIndex
CREATE INDEX "idx_products_storage_location_id" ON "products"("storage_location_id");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_dosage_form_id_fkey" FOREIGN KEY ("dosage_form_id") REFERENCES "dosage_forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_storage_location_id_fkey" FOREIGN KEY ("storage_location_id") REFERENCES "storage_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop old constraint
DROP INDEX IF EXISTS "uq_categories_name_active";

-- Create new contextual indexes
CREATE UNIQUE INDEX "uq_categories_name_parent_active" ON "categories"("name", "parent_id") 
WHERE "deleted_at" IS NULL AND "parent_id" IS NOT NULL;

CREATE UNIQUE INDEX "uq_categories_name_root_active" ON "categories"("name") 
WHERE "deleted_at" IS NULL AND "parent_id" IS NULL;
