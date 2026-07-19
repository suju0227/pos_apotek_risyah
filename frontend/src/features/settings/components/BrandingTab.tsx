import { useEffect, useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Input } from '../../../shared/components/Input';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { ErrorState } from '../../../shared/components/ErrorState';
import { useToastStore } from '../../../shared/components/toast.store';
import { useBrandingSettings, useUpdateBrandingSettings } from '../settings.hooks';
import type { BrandingSettings } from '../settings.types';
import { useSettingsStore } from '../settings.store';

export function BrandingTab() {
  const { data, isLoading, error } = useBrandingSettings();
  const updateSettings = useUpdateBrandingSettings();
  const showToast = useToastStore((state) => state.show);
  const reloadPublic = useSettingsStore(state => state.load);

  const [form, setForm] = useState<Partial<BrandingSettings>>({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync(form as BrandingSettings);
      showToast('Pengaturan branding berhasil disimpan.');
      reloadPublic();
    } catch (err) {
      showToast((err as Error).message);
    }
  };

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (error) return <ErrorState message={(error as Error).message} />;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Logo & Gambar</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <Input label="Logo Path" name="logoPath" value={form.logoPath ?? ''} onChange={handleChange} />
            {form.logoPath && <img src={form.logoPath} alt="Logo" className="mt-2 h-12 object-contain border p-1 rounded" />}
          </div>
          <div>
            <Input label="Favicon Path" name="faviconPath" value={form.faviconPath ?? ''} onChange={handleChange} />
            {form.faviconPath && <img src={form.faviconPath} alt="Favicon" className="mt-2 h-8 w-8 object-contain border p-1 rounded" />}
          </div>
          <div>
            <Input label="Sidebar Logo Path" name="sidebarLogoPath" value={form.sidebarLogoPath ?? ''} onChange={handleChange} />
            {form.sidebarLogoPath && <img src={form.sidebarLogoPath} alt="Sidebar Logo" className="mt-2 h-10 object-contain bg-slate-800 p-1 rounded" />}
          </div>
          <div>
            <Input label="Login Background Path" name="loginBackgroundPath" value={form.loginBackgroundPath ?? ''} onChange={handleChange} />
          </div>
          <div>
            <Input label="Login Illustration Path" name="loginIllustrationPath" value={form.loginIllustrationPath ?? ''} onChange={handleChange} />
          </div>
          <div>
            <Input label="Dark Logo Path" name="darkLogoPath" value={form.darkLogoPath ?? ''} onChange={handleChange} />
          </div>
        </div>
      </Card>
      
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Warna Tema</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Primary Color</label>
            <div className="flex items-center space-x-2">
              <input type="color" name="primaryColor" value={form.primaryColor ?? '#000000'} onChange={handleChange} className="h-10 w-10 p-1 rounded cursor-pointer" />
              <Input className="flex-1" label="" name="primaryColor" value={form.primaryColor ?? ''} onChange={handleChange} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Color</label>
            <div className="flex items-center space-x-2">
              <input type="color" name="secondaryColor" value={form.secondaryColor ?? '#000000'} onChange={handleChange} className="h-10 w-10 p-1 rounded cursor-pointer" />
              <Input className="flex-1" label="" name="secondaryColor" value={form.secondaryColor ?? ''} onChange={handleChange} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Accent Color</label>
            <div className="flex items-center space-x-2">
              <input type="color" name="accentColor" value={form.accentColor ?? '#000000'} onChange={handleChange} className="h-10 w-10 p-1 rounded cursor-pointer" />
              <Input className="flex-1" label="" name="accentColor" value={form.accentColor ?? ''} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">Tampilan Default</label>
          <select name="theme" value={form.theme ?? 'AUTO'} onChange={handleChange} className="w-full md:w-1/3 rounded-md border border-slate-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="LIGHT">Light</option>
            <option value="DARK">Dark</option>
            <option value="AUTO">Auto (System)</option>
          </select>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">Custom CSS</label>
          <textarea name="customCss" value={form.customCss ?? ''} onChange={handleChange} className="w-full h-24 rounded-md border border-slate-300 p-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder=":root { ... }" />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={updateSettings.isPending}>
          {updateSettings.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
      </div>
    </form>
  );
}
