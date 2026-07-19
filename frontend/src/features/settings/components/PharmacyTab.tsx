import { useEffect, useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Input } from '../../../shared/components/Input';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { ErrorState } from '../../../shared/components/ErrorState';
import { useToastStore } from '../../../shared/components/toast.store';
import { usePharmacyProfile, useUpdatePharmacyProfile } from '../settings.hooks';
import type { PharmacyProfile } from '../settings.types';
import { useSettingsStore } from '../settings.store';

export function PharmacyTab() {
  const { data, isLoading, error } = usePharmacyProfile();
  const updateSettings = useUpdatePharmacyProfile();
  const showToast = useToastStore((state) => state.show);
  const reloadPublic = useSettingsStore(state => state.load);

  const [form, setForm] = useState<Partial<PharmacyProfile>>({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync(form as PharmacyProfile);
      showToast('Profil apotek berhasil disimpan.');
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
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Profil Apotek</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Input label="Nama Apotek" name="pharmacyName" value={form.pharmacyName ?? ''} onChange={handleChange} required />
          <Input label="Nama Pemilik" name="ownerName" value={form.ownerName ?? ''} onChange={handleChange} />
          <Input label="Nama Apoteker (APA)" name="pharmacistName" value={form.pharmacistName ?? ''} onChange={handleChange} />
          <Input label="Nomor SIA" name="sia" value={form.sia ?? ''} onChange={handleChange} />
          <Input label="Nomor SIPA" name="sipa" value={form.sipa ?? ''} onChange={handleChange} />
          <Input label="Izin Operasional" name="operationalLicense" value={form.operationalLicense ?? ''} onChange={handleChange} />
          <Input label="NPWP" name="npwp" value={form.npwp ?? ''} onChange={handleChange} />
        </div>
      </Card>
      
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Kontak & Alamat</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Input label="Email" name="email" value={form.email ?? ''} onChange={handleChange} />
          <Input label="Telepon" name="phone" value={form.phone ?? ''} onChange={handleChange} />
          <Input label="WhatsApp" name="whatsapp" value={form.whatsapp ?? ''} onChange={handleChange} />
          <Input label="Website" name="website" value={form.website ?? ''} onChange={handleChange} />
          <div className="lg:col-span-2">
            <Input label="Alamat Lengkap" name="address" value={form.address ?? ''} onChange={handleChange} />
          </div>
          <Input label="Kelurahan / Desa" name="village" value={form.village ?? ''} onChange={handleChange} />
          <Input label="Kecamatan" name="district" value={form.district ?? ''} onChange={handleChange} />
          <Input label="Kabupaten / Kota" name="city" value={form.city ?? ''} onChange={handleChange} />
          <Input label="Provinsi" name="province" value={form.province ?? ''} onChange={handleChange} />
          <Input label="Kode Pos" name="postalCode" value={form.postalCode ?? ''} onChange={handleChange} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2 mt-4">
          <Input label="Latitude" name="latitude" value={form.latitude ?? ''} onChange={handleChange} />
          <Input label="Longitude" name="longitude" value={form.longitude ?? ''} onChange={handleChange} />
          <div className="lg:col-span-2">
            <Input label="URL Google Maps" name="googleMapsUrl" value={form.googleMapsUrl ?? ''} onChange={handleChange} />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Lainnya</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Input label="Jam Operasional" name="openingHours" value={form.openingHours ?? ''} onChange={handleChange} />
          <Input label="Catatan Kaki Struk" name="receiptFooter" value={form.receiptFooter ?? ''} onChange={handleChange} />
          <Input label="Catatan Kaki Invoice" name="invoiceFooter" value={form.invoiceFooter ?? ''} onChange={handleChange} />
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
