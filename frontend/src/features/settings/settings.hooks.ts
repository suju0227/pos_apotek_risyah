import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from './settings.api';
import type { GlobalSetting } from './settings.types';

export function useAppSettings() {
  return useQuery({ queryKey: ['settings', 'app'], queryFn: settingsApi.getApp });
}
export function useUpdateAppSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.updateApp,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'app'] }),
  });
}

export function useBrandingSettings() {
  return useQuery({ queryKey: ['settings', 'branding'], queryFn: settingsApi.getBranding });
}
export function useUpdateBrandingSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.updateBranding,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'branding'] }),
  });
}

export function usePharmacyProfile() {
  return useQuery({ queryKey: ['settings', 'pharmacy'], queryFn: settingsApi.getPharmacy });
}
export function useUpdatePharmacyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.updatePharmacy,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'pharmacy'] }),
  });
}

export function useLocalizationSettings() {
  return useQuery({ queryKey: ['settings', 'localization'], queryFn: settingsApi.getLocalization });
}
export function useUpdateLocalizationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.updateLocalization,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'localization'] }),
  });
}

export function useReceiptSettings() {
  return useQuery({ queryKey: ['settings', 'receipt'], queryFn: settingsApi.getReceipt });
}
export function useUpdateReceiptSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.updateReceipt,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'receipt'] }),
  });
}

export function useSecuritySettings() {
  return useQuery({ queryKey: ['settings', 'security'], queryFn: settingsApi.getSecurity });
}
export function useUpdateSecuritySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.updateSecurity,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'security'] }),
  });
}

export function usePreferenceSettings() {
  return useQuery({ queryKey: ['settings', 'preferences'], queryFn: settingsApi.getPreferences });
}
export function useUpdatePreferenceSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.updatePreferences,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'preferences'] }),
  });
}

export function useGlobalSettings() {
  return useQuery({ queryKey: ['settings', 'global'], queryFn: settingsApi.getGlobal });
}
export function useUpdateGlobalSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: Partial<GlobalSetting> }) =>
      settingsApi.updateGlobal(key, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'global'] }),
  });
}

export function useUploadSettingImage() {
  return useMutation({
    mutationFn: settingsApi.uploadImage,
  });
}
