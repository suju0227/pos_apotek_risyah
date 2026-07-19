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
      set({ publicSettings: res.data });
      // Update DOM Browser Title & Favicon
      document.title = res.data.siteName || 'POS Apotek';
      if (res.data.faviconPath) {
        const faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (faviconLink) faviconLink.href = res.data.faviconPath;
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      set({ isLoading: false });
    }
  }
}));
