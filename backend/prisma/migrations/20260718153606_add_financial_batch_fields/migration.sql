-- AlterTable
ALTER TABLE "product_batches" ADD COLUMN     "additional_cost_base" DECIMAL(18,8) NOT NULL DEFAULT 0,
ADD COLUMN     "cost_modal_base" DECIMAL(18,8) NOT NULL DEFAULT 0;
