import { create } from 'zustand';
import { settingsApi } from './settings.api';

interface SettingsState {
  publicSettings: any | null;
  isLoading: boolean;
  load: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  publicSettings: null,
  isLoading: false,
  load: async () => {
    set({ isLoading: true });
    try {
      const res = await settingsApi.getPublic();
      set({ publicSettings: res });
      // Update DOM Browser Title & Favicon
      if (res.app?.siteName) {
        document.title = res.app.siteName;
      } else {
        document.title = 'POS Apotek';
      }
      if (res.branding?.faviconPath) {
        const faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (faviconLink) faviconLink.href = res.branding.faviconPath;
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      set({ isLoading: false });
    }
  }
}));
