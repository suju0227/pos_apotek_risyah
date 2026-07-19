import { apiClient } from '../../shared/api/apiClient';
import type {
  AppSettings,
  BrandingSettings,
  PharmacyProfile,
  ReceiptSettings,
  SecuritySettings,
  LocalizationSettings,
  PreferenceSettings,
  GlobalSetting
} from './settings.types';

export const settingsApi = {
  getPublic: () => apiClient.get<any>('/settings/public'),
  getApp: () => apiClient.get<AppSettings>('/settings/app'),
  updateApp: (data: Partial<AppSettings>) => apiClient.put<AppSettings>('/settings/app', data),
  getBranding: () => apiClient.get<BrandingSettings>('/settings/branding'),
  updateBranding: (data: Partial<BrandingSettings>) => apiClient.put<BrandingSettings>('/settings/branding', data),
  getPharmacy: () => apiClient.get<PharmacyProfile>('/settings/pharmacy'),
  updatePharmacy: (data: Partial<PharmacyProfile>) => apiClient.put<PharmacyProfile>('/settings/pharmacy', data),
  getLocalization: () => apiClient.get<LocalizationSettings>('/settings/localization'),
  updateLocalization: (data: Partial<LocalizationSettings>) => apiClient.put<LocalizationSettings>('/settings/localization', data),
  getReceipt: () => apiClient.get<ReceiptSettings>('/settings/receipt'),
  updateReceipt: (data: Partial<ReceiptSettings>) => apiClient.put<ReceiptSettings>('/settings/receipt', data),
  getSecurity: () => apiClient.get<SecuritySettings>('/settings/security'),
  updateSecurity: (data: Partial<SecuritySettings>) => apiClient.put<SecuritySettings>('/settings/security', data),
  getPreferences: () => apiClient.get<PreferenceSettings>('/settings/preferences'),
  updatePreferences: (data: Partial<PreferenceSettings>) => apiClient.put<PreferenceSettings>('/settings/preferences', data),
  getGlobal: () => apiClient.get<GlobalSetting[]>('/settings/global'),
  updateGlobal: (data: Partial<GlobalSetting>) => apiClient.put<GlobalSetting>('/settings/global', data),
  refreshCache: () => apiClient.post('/settings/cache/refresh'),
};
