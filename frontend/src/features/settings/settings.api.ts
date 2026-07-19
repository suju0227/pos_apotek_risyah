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

function sanitizePayload<T>(payload: any): T {
  if (!payload) return payload;
  const { id, createdAt, updatedAt, ...sanitized } = payload;
  return sanitized as T;
}

export const settingsApi = {
  getPublic: () => apiClient.get<any>('/settings/public'),
  getApp: () => apiClient.get<AppSettings>('/settings/app'),
  updateApp: (data: Partial<AppSettings>) => apiClient.put<AppSettings>('/settings/app', sanitizePayload(data)),
  getBranding: () => apiClient.get<BrandingSettings>('/settings/branding'),
  updateBranding: (data: Partial<BrandingSettings>) => apiClient.put<BrandingSettings>('/settings/branding', sanitizePayload(data)),
  getPharmacy: () => apiClient.get<PharmacyProfile>('/settings/pharmacy'),
  updatePharmacy: (data: Partial<PharmacyProfile>) => apiClient.put<PharmacyProfile>('/settings/pharmacy', sanitizePayload(data)),
  getLocalization: () => apiClient.get<LocalizationSettings>('/settings/localization'),
  updateLocalization: (data: Partial<LocalizationSettings>) => apiClient.put<LocalizationSettings>('/settings/localization', sanitizePayload(data)),
  getReceipt: () => apiClient.get<ReceiptSettings>('/settings/receipt'),
  updateReceipt: (data: Partial<ReceiptSettings>) => apiClient.put<ReceiptSettings>('/settings/receipt', sanitizePayload(data)),
  getSecurity: () => apiClient.get<SecuritySettings>('/settings/security'),
  updateSecurity: (data: Partial<SecuritySettings>) => apiClient.put<SecuritySettings>('/settings/security', sanitizePayload(data)),
  getPreferences: () => apiClient.get<PreferenceSettings>('/settings/preferences'),
  updatePreferences: (data: Partial<PreferenceSettings>) => apiClient.put<PreferenceSettings>('/settings/preferences', sanitizePayload(data)),
  getGlobal: () => apiClient.get<GlobalSetting[]>('/settings/global'),
  updateGlobal: (key: string, data: Partial<GlobalSetting>) => apiClient.put<GlobalSetting>(`/settings/global/${key}`, sanitizePayload(data)),
  refreshCache: () => apiClient.post('/settings/cache/refresh'),
};
