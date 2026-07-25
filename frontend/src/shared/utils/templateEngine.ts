export function renderTemplate(template: string, data: Record<string, string>): string {
  if (!template) return '';
  let rendered = template;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(placeholder, value);
  }
  return rendered;
}

export const defaultPoTemplate = `
<div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
    <h2 style="margin: 0;">{{pharmacyName}}</h2>
    <p style="margin: 5px 0 0 0; color: #666;">SURAT PESANAN (PURCHASE ORDER)</p>
  </div>
  
  <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
    <div>
      <p style="margin: 0;"><strong>Kepada Yth.</strong></p>
      <p style="margin: 5px 0 0 0;">{{supplierName}}</p>
    </div>
    <div style="text-align: right;">
      <p style="margin: 0;"><strong>No. PO:</strong> {{poNumber}}</p>
      <p style="margin: 5px 0 0 0;"><strong>Tanggal:</strong> {{orderDate}}</p>
    </div>
  </div>

  <p>Mohon dikirimkan barang-barang di bawah ini:</p>

  {{itemsTable}}

  <div style="display: flex; justify-content: space-between; margin-top: 50px;">
    <div style="text-align: center;">
      <p>Penerima,</p>
      <br><br><br>
      <p>(................................)</p>
    </div>
    <div style="text-align: center;">
      <p>Hormat Kami,</p>
      <br><br><br>
      <p>(................................)</p>
    </div>
  </div>
</div>
`;
