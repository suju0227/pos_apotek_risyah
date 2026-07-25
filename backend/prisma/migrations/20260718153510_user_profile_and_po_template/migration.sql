-- DropIndex
DROP INDEX "idx_idempotency_keys_lookup";

-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "po_print_template" TEXT;

-- AlterTable
ALTER TABLE "purchase_items" ALTER COLUMN "qty_received" DROP DEFAULT;

-- AlterTable
ALTER TABLE "purchase_order_items" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "purchase_orders" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "phone" VARCHAR(20);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

