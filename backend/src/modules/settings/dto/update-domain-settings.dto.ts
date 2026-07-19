import { IsString, IsOptional, IsBoolean, IsInt, IsEnum, IsNumber } from 'class-validator';

export class UpdateAppSettingDto {
  @IsOptional() @IsString() siteName?: string;
  @IsOptional() @IsString() applicationName?: string;
  @IsOptional() @IsString() shortName?: string;
  @IsOptional() @IsString() tagline?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() maintenanceMode?: boolean;
  @IsOptional() @IsEnum(['development', 'production', 'maintenance']) environment?: string;
  @IsOptional() @IsString() footerCopyright?: string;
}

export class UpdateBrandingSettingDto {
  @IsOptional() @IsString() logoPath?: string;
  @IsOptional() @IsString() sidebarLogoPath?: string;
  @IsOptional() @IsString() faviconPath?: string;
  @IsOptional() @IsString() loginBackgroundPath?: string;
  @IsOptional() @IsString() loginIllustrationPath?: string;
  @IsOptional() @IsString() darkLogoPath?: string;
  @IsOptional() @IsString() lightLogoPath?: string;
  @IsOptional() @IsString() primaryColor?: string;
  @IsOptional() @IsString() secondaryColor?: string;
  @IsOptional() @IsString() accentColor?: string;
  @IsOptional() @IsEnum(['LIGHT', 'DARK', 'AUTO']) theme?: string;
  @IsOptional() @IsString() customCss?: string;
}

export class UpdatePharmacyProfileDto {
  @IsOptional() @IsString() pharmacyName?: string;
  @IsOptional() @IsString() ownerName?: string;
  @IsOptional() @IsString() pharmacistName?: string;
  @IsOptional() @IsString() sia?: string;
  @IsOptional() @IsString() sipa?: string;
  @IsOptional() @IsString() operationalLicense?: string;
  @IsOptional() @IsString() npwp?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() village?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() province?: string;
  @IsOptional() @IsString() postalCode?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsString() googleMapsUrl?: string;
  @IsOptional() @IsString() openingHours?: string;
  @IsOptional() @IsString() receiptFooter?: string;
  @IsOptional() @IsString() invoiceFooter?: string;
}

export class UpdateReceiptSettingDto {
  @IsOptional() @IsEnum(['58mm', '80mm']) paperWidth?: string;
  @IsOptional() @IsInt() fontSize?: number;
  @IsOptional() @IsBoolean() showLogo?: boolean;
  @IsOptional() @IsBoolean() showQRCode?: boolean;
  @IsOptional() @IsBoolean() showBarcode?: boolean;
  @IsOptional() @IsBoolean() showAddress?: boolean;
  @IsOptional() @IsBoolean() showNPWP?: boolean;
  @IsOptional() @IsString() customHeader?: string;
  @IsOptional() @IsString() customFooter?: string;
  @IsOptional() @IsEnum(['STANDARD', 'COMPACT', 'THREE_COLUMNS']) receiptFormat?: string;
  @IsOptional() @IsBoolean() autoNumbering?: boolean;
}

export class UpdateSecuritySettingDto {
  @IsOptional() @IsInt() sessionTimeout?: number;
  @IsOptional() @IsInt() minimumPasswordLength?: number;
  @IsOptional() @IsInt() passwordExpiration?: number;
  @IsOptional() @IsInt() maxLoginAttempt?: number;
  @IsOptional() @IsBoolean() enableTwoFactor?: boolean;
  @IsOptional() @IsInt() auditRetentionDays?: number;
}

export class UpdateLocalizationSettingDto {
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsEnum(['id', 'en']) language?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() dateFormat?: string;
  @IsOptional() @IsString() timeFormat?: string;
  @IsOptional() @IsString() decimalSeparator?: string;
  @IsOptional() @IsString() thousandSeparator?: string;
  @IsOptional() @IsNumber() defaultTax?: number;
}

export class UpdatePreferenceSettingDto {
  @IsOptional() @IsEnum(['LIGHT', 'DARK', 'AUTO']) defaultTheme?: string;
  @IsOptional() @IsBoolean() enableAnimation?: boolean;
  @IsOptional() @IsBoolean() enableNotification?: boolean;
  @IsOptional() @IsBoolean() enableSound?: boolean;
  @IsOptional() @IsInt() dashboardRefreshInterval?: number;
  @IsOptional() @IsString() defaultLandingPage?: string;
  @IsOptional() @IsInt() defaultRowsPerPage?: number;
  @IsOptional() @IsString() backupDirectory?: string;
  @IsOptional() @IsBoolean() automaticBackup?: boolean;
  @IsOptional() @IsInt() backupIntervalHours?: number;
  @IsOptional() @IsInt() backupRetentionCount?: number;
  @IsOptional() @IsBoolean() backupCompressionEnabled?: boolean;
  @IsOptional() @IsBoolean() backupEncryptionEnabled?: boolean;
}

export class UpdateGlobalSettingDto {
  @IsString() key: string;
  @IsString() value: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() valueType?: string;
  @IsOptional() @IsBoolean() isPublic?: boolean;
  @IsOptional() @IsBoolean() isEditable?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsString() description?: string;
}
