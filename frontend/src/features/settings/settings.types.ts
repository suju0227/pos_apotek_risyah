export type AppSettings = {
  id: number;
  siteName: string;
  applicationName: string;
  shortName: string;
  tagline: string | null;
  description: string | null;
  maintenanceMode: boolean;
  environment: 'development' | 'production' | 'maintenance';
  footerCopyright: string;
};

export type BrandingSettings = {
  id: number;
  logoPath: string | null;
  sidebarLogoPath: string | null;
  faviconPath: string | null;
  loginBackgroundPath: string | null;
  loginIllustrationPath: string | null;
  darkLogoPath: string | null;
  lightLogoPath: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  theme: 'LIGHT' | 'DARK' | 'AUTO';
  customCss: string | null;
};

export type PharmacyProfile = {
  id: number;
  pharmacyName: string;
  ownerName: string | null;
  pharmacistName: string | null;
  sia: string | null;
  sipa: string | null;
  operationalLicense: string | null;
  npwp: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  address: string | null;
  village: string | null;
  district: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  latitude: string | null;
  longitude: string | null;
  googleMapsUrl: string | null;
  openingHours: string | null;
  receiptFooter: string | null;
  invoiceFooter: string | null;
};

export type ReceiptSettings = {
  id: number;
  paperWidth: '58mm' | '80mm';
  fontSize: number;
  showLogo: boolean;
  showQRCode: boolean;
  showBarcode: boolean;
  showAddress: boolean;
  showNPWP: boolean;
  customHeader: string | null;
  customFooter: string | null;
  receiptFormat: 'STANDARD' | 'COMPACT' | 'THREE_COLUMNS';
  autoNumbering: boolean;
};

export type SecuritySettings = {
  id: number;
  sessionTimeout: number;
  minimumPasswordLength: number;
  passwordExpiration: number;
  maxLoginAttempt: number;
  enableTwoFactor: boolean;
  auditRetentionDays: number;
};

export type LocalizationSettings = {
  id: number;
  timezone: string;
  language: 'id' | 'en';
  currency: string;
  dateFormat: string;
  timeFormat: string;
  decimalSeparator: string;
  thousandSeparator: string;
  defaultTax: number;
};

export type PreferenceSettings = {
  id: number;
  defaultTheme: 'LIGHT' | 'DARK' | 'AUTO';
  enableAnimation: boolean;
  enableNotification: boolean;
  enableSound: boolean;
  dashboardRefreshInterval: number;
  defaultLandingPage: string;
  defaultRowsPerPage: number;
  backupDirectory: string;
  automaticBackup: boolean;
  backupIntervalHours: number;
  backupRetentionCount: number;
  backupCompressionEnabled: boolean;
  backupEncryptionEnabled: boolean;
};

export type GlobalSetting = {
  id: string;
  category: string;
  key: string;
  value: string;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  isPublic: boolean;
  isEditable: boolean;
  sortOrder: number;
  description: string | null;
};
