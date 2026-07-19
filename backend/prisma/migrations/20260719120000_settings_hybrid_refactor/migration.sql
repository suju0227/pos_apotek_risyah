-- Rename old table
ALTER TABLE "app_settings" RENAME TO "app_settings_legacy";
ALTER TABLE "app_settings_legacy" RENAME CONSTRAINT "app_settings_pkey" TO "app_settings_legacy_pkey";

-- CreateTable
CREATE TABLE "app_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "site_name" VARCHAR(200) NOT NULL DEFAULT 'Apotek Risyah',
    "application_name" VARCHAR(200) NOT NULL DEFAULT 'POS Apotek Risyah',
    "short_name" VARCHAR(50) NOT NULL DEFAULT 'ARIS',
    "tagline" VARCHAR(200),
    "description" TEXT,
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "environment" VARCHAR(50) NOT NULL DEFAULT 'production',
    "footer_copyright" VARCHAR(200) NOT NULL DEFAULT '© 2026 Apotek Risyah. All rights reserved.',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ck_app_settings_single_row" CHECK (id = 1),
    CONSTRAINT "ck_app_settings_env" CHECK ("environment" IN ('development', 'staging', 'production'))
);

-- CreateTable
CREATE TABLE "branding_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "logo_path" VARCHAR(255),
    "sidebar_logo_path" VARCHAR(255),
    "favicon_path" VARCHAR(255),
    "login_background_path" VARCHAR(255),
    "login_illustration_path" VARCHAR(255),
    "dark_logo_path" VARCHAR(255),
    "light_logo_path" VARCHAR(255),
    "primary_color" VARCHAR(50) NOT NULL DEFAULT '#2563eb',
    "secondary_color" VARCHAR(50) NOT NULL DEFAULT '#475569',
    "accent_color" VARCHAR(50) NOT NULL DEFAULT '#3b82f6',
    "theme" VARCHAR(20) NOT NULL DEFAULT 'LIGHT',
    "custom_css" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branding_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ck_branding_settings_single_row" CHECK (id = 1),
    CONSTRAINT "ck_branding_theme" CHECK ("theme" IN ('LIGHT', 'DARK', 'SYSTEM'))
);

-- CreateTable
CREATE TABLE "pharmacy_profile" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "pharmacy_name" VARCHAR(200) NOT NULL DEFAULT 'Apotek Risyah',
    "owner_name" VARCHAR(200),
    "pharmacist_name" VARCHAR(200),
    "sia" VARCHAR(100),
    "sipa" VARCHAR(100),
    "operational_license" VARCHAR(100),
    "npwp" VARCHAR(100),
    "email" VARCHAR(100),
    "phone" VARCHAR(50),
    "whatsapp" VARCHAR(50),
    "website" VARCHAR(200),
    "address" TEXT,
    "village" VARCHAR(100),
    "district" VARCHAR(100),
    "city" VARCHAR(100),
    "province" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(10,8),
    "google_maps_url" TEXT,
    "opening_hours" VARCHAR(255),
    "receipt_footer" TEXT,
    "invoice_footer" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pharmacy_profile_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ck_pharmacy_profile_single_row" CHECK (id = 1)
);

-- CreateTable
CREATE TABLE "receipt_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "paper_width" TEXT NOT NULL DEFAULT '80mm',
    "font_size" INTEGER NOT NULL DEFAULT 12,
    "show_logo" BOOLEAN NOT NULL DEFAULT true,
    "show_qr_code" BOOLEAN NOT NULL DEFAULT false,
    "show_barcode" BOOLEAN NOT NULL DEFAULT false,
    "show_address" BOOLEAN NOT NULL DEFAULT true,
    "show_npwp" BOOLEAN NOT NULL DEFAULT false,
    "custom_header" TEXT,
    "custom_footer" TEXT,
    "receipt_format" VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
    "auto_numbering" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipt_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ck_receipt_settings_single_row" CHECK (id = 1),
    CONSTRAINT "ck_receipt_paper_width" CHECK ("paper_width" IN ('58mm', '80mm', 'A4', 'A5')),
    CONSTRAINT "ck_receipt_format" CHECK ("receipt_format" IN ('STANDARD', 'SIMPLE', 'DETAILED'))
);

-- CreateTable
CREATE TABLE "security_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "session_timeout" INTEGER NOT NULL DEFAULT 30,
    "minimum_password_length" INTEGER NOT NULL DEFAULT 8,
    "password_expiration" INTEGER NOT NULL DEFAULT 90,
    "max_login_attempt" INTEGER NOT NULL DEFAULT 5,
    "enable_two_factor" BOOLEAN NOT NULL DEFAULT false,
    "audit_retention_days" INTEGER NOT NULL DEFAULT 365,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ck_security_settings_single_row" CHECK (id = 1)
);

-- CreateTable
CREATE TABLE "localization_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'Asia/Makassar',
    "language" VARCHAR(10) NOT NULL DEFAULT 'id',
    "currency" VARCHAR(20) NOT NULL DEFAULT 'IDR',
    "date_format" VARCHAR(50) NOT NULL DEFAULT 'DD-MM-YYYY',
    "time_format" VARCHAR(50) NOT NULL DEFAULT 'HH:mm:ss',
    "decimal_separator" VARCHAR(5) NOT NULL DEFAULT ',',
    "thousand_separator" VARCHAR(5) NOT NULL DEFAULT '.',
    "default_tax" DECIMAL(5,2) NOT NULL DEFAULT 11.00,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "localization_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ck_localization_settings_single_row" CHECK (id = 1),
    CONSTRAINT "ck_localization_language" CHECK ("language" IN ('id', 'en'))
);

-- CreateTable
CREATE TABLE "preference_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "default_theme" VARCHAR(20) NOT NULL DEFAULT 'LIGHT',
    "enable_animation" BOOLEAN NOT NULL DEFAULT true,
    "enable_notification" BOOLEAN NOT NULL DEFAULT true,
    "enable_sound" BOOLEAN NOT NULL DEFAULT true,
    "dashboard_refresh_interval" INTEGER NOT NULL DEFAULT 60,
    "default_landing_page" VARCHAR(100) NOT NULL DEFAULT '/dashboard',
    "default_rows_per_page" INTEGER NOT NULL DEFAULT 10,
    "backup_directory" VARCHAR(255) NOT NULL DEFAULT './backups',
    "automatic_backup" BOOLEAN NOT NULL DEFAULT false,
    "backup_interval_hours" INTEGER NOT NULL DEFAULT 24,
    "backup_retention_count" INTEGER NOT NULL DEFAULT 7,
    "backup_compression_enabled" BOOLEAN NOT NULL DEFAULT true,
    "backup_encryption_enabled" BOOLEAN NOT NULL DEFAULT false,
    "last_backup_at" TIMESTAMP(6),
    "last_restore_at" TIMESTAMP(6),
    "backup_checksum" VARCHAR(256),
    "backup_size" BIGINT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preference_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ck_preference_settings_single_row" CHECK (id = 1)
);

-- CreateTable
CREATE TABLE "global_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category" VARCHAR(50) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "value_type" VARCHAR(20) NOT NULL DEFAULT 'STRING',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_editable" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "global_settings_key_key" ON "global_settings"("key");

-- CreateIndex
CREATE INDEX "global_settings_category_idx" ON "global_settings"("category");

-- Default inserts (idempotent)
INSERT INTO "app_settings" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "branding_settings" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "pharmacy_profile" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "receipt_settings" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "security_settings" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "localization_settings" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "preference_settings" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;

-- Data Migration Block
DO $$
DECLARE
    legacy_record RECORD;
BEGIN
    SELECT * INTO legacy_record FROM "app_settings_legacy" LIMIT 1;
    IF FOUND THEN
        UPDATE "pharmacy_profile" SET 
            "pharmacy_name" = legacy_record."pharmacy_name",
            "address" = legacy_record."address",
            "phone" = legacy_record."phone"
        WHERE id = 1;

        UPDATE "localization_settings" SET 
            "timezone" = legacy_record."timezone",
            "currency" = legacy_record."currency"
        WHERE id = 1;

        UPDATE "app_settings" SET 
            "site_name" = legacy_record."pharmacy_name"
        WHERE id = 1;
    END IF;
END $$;
