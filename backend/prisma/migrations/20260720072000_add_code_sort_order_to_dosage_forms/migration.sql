-- AlterTable
ALTER TABLE "dosage_forms" ADD COLUMN "code" VARCHAR(50) NOT NULL;
ALTER TABLE "dosage_forms" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "dosage_forms_code_key" ON "dosage_forms"("code");
