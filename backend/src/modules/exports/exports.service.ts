import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import PDFDocument = require('pdfkit');
import { ProfitReportQueryDto } from '../reports/dto/profit-report-query.dto';
import { SalesReportQueryDto } from '../reports/dto/sales-report-query.dto';
import { ReportsService } from '../reports/reports.service';

type ExportFile = {
  filename: string;
  contentType: string;
  buffer: Buffer;
};

type SalesReport = Awaited<ReturnType<ReportsService['sales']>>;
type ProfitReport = Awaited<ReturnType<ReportsService['profit']>>;

const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PDF_CONTENT_TYPE = 'application/pdf';

@Injectable()
export class ExportsService {
  constructor(private readonly reportsService: ReportsService) {}

  async salesXlsx(query: SalesReportQueryDto): Promise<ExportFile> {
    const report = await this.fullSalesReport(query);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Laporan Penjualan');
    this.addMetadataRows(sheet, 'Laporan Penjualan', report.filters);

    sheet.addRow([]);
    const summaryHeader = sheet.addRow(['Ringkasan']);
    summaryHeader.font = { bold: true, size: 12 };
    this.addKeyValueRows(sheet, report.summary);
    sheet.addRow([]);

    const headers = [
      'Nomor Transaksi',
      'Tanggal',
      'Kasir',
      'Metode',
      'Subtotal',
      'Diskon',
      'Total',
      'Retur',
      'Net Revenue',
      'Status Retur',
    ];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    for (const row of report.data) {
      const dataRow = sheet.addRow([
        row.saleNumber,
        row.saleDate,
        row.cashier.name,
        row.paymentMethod,
        row.subtotal,
        row.discountTotal,
        row.grandTotal,
        row.returnTotal,
        row.netTotal,
        row.returnStatus,
      ]);
      
      // Format currency columns
      [5, 6, 7, 8, 9].forEach((colIdx) => {
        dataRow.getCell(colIdx).numFmt = '#,##0';
      });
    }
    
    this.autosize(sheet);

    return {
      filename: this.filename('laporan-penjualan', 'xlsx'),
      contentType: XLSX_CONTENT_TYPE,
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
    };
  }

  async profitXlsx(query: ProfitReportQueryDto): Promise<ExportFile> {
    const report = await this.fullProfitReport(query);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Laporan Laba');
    this.addMetadataRows(sheet, 'Laporan Laba', report.filters);

    sheet.addRow([]);
    const summaryHeader = sheet.addRow(['Ringkasan']);
    summaryHeader.font = { bold: true, size: 12 };
    this.addKeyValueRows(sheet, report.summary);
    sheet.addRow([]);
    
    const headers = [
      'Transaksi',
      'Tanggal',
      'Produk',
      'Batch',
      'Qty Base',
      'Revenue',
      'Diskon',
      'HPP',
      'Gross Profit',
      'Return Revenue',
      'Return HPP',
      'Return Profit',
      'Net Profit',
      'Profit Display',
    ];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    for (const row of report.data) {
      const dataRow = sheet.addRow([
        row.saleNumber,
        row.saleDate,
        row.productName,
        row.batchNumber,
        row.qtyBase,
        row.grossRevenue,
        row.discountAmount,
        row.hppAmount,
        row.grossProfit,
        row.returnRevenue,
        row.returnHpp,
        row.returnProfit,
        row.netProfit,
        row.profitDisplay,
      ]);
      
      // Format currency columns
      [6, 7, 8, 9, 10, 11, 12, 13, 14].forEach((colIdx) => {
        dataRow.getCell(colIdx).numFmt = '#,##0';
      });
    }
    this.autosize(sheet);

    return {
      filename: this.filename('laporan-laba', 'xlsx'),
      contentType: XLSX_CONTENT_TYPE,
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
    };
  }

  async salesPdf(query: SalesReportQueryDto): Promise<ExportFile> {
    const report = await this.fullSalesReport(query);
    
    const headers = ['Transaksi', 'Tanggal', 'Kasir', 'Total', 'Retur', 'Net'];
    const rows = report.data.map((row) => [
      row.saleNumber,
      row.saleDate.slice(0, 10),
      row.cashier.name,
      this.formatCurrency(row.grandTotal),
      this.formatCurrency(row.returnTotal),
      this.formatCurrency(row.netTotal),
    ]);
    
    const buffer = await this.buildPdf('Laporan Penjualan', report, headers, rows);

    return {
      filename: this.filename('laporan-penjualan', 'pdf'),
      contentType: PDF_CONTENT_TYPE,
      buffer,
    };
  }

  async profitPdf(query: ProfitReportQueryDto): Promise<ExportFile> {
    const report = await this.fullProfitReport(query);
    
    const headers = ['Transaksi', 'Produk', 'Batch', 'Revenue', 'HPP', 'Net Profit'];
    const rows = report.data.map((row) => [
      row.saleNumber,
      row.productName,
      row.batchNumber || '-',
      this.formatCurrency(row.grossRevenue),
      this.formatCurrency(row.hppAmount),
      this.formatCurrency(row.netProfit),
    ]);
    
    const buffer = await this.buildPdf('Laporan Laba', report, headers, rows);

    return {
      filename: this.filename('laporan-laba', 'pdf'),
      contentType: PDF_CONTENT_TYPE,
      buffer,
    };
  }

  private async fullSalesReport(query: SalesReportQueryDto) {
    const firstPage = await this.reportsService.sales({ ...query, page: 1, limit: 1 });
    return this.reportsService.sales({
      ...query,
      page: 1,
      limit: Math.max(firstPage.pagination.total, 1),
    });
  }

  private async fullProfitReport(query: ProfitReportQueryDto) {
    const firstPage = await this.reportsService.profit({ ...query, page: 1, limit: 1 });
    return this.reportsService.profit({
      ...query,
      page: 1,
      limit: Math.max(firstPage.pagination.total, 1),
    });
  }

  private addMetadataRows(
    sheet: ExcelJS.Worksheet,
    title: string,
    filters: Record<string, unknown>,
  ) {
    const titleRow = sheet.addRow([title]);
    titleRow.font = { bold: true, size: 14 };
    sheet.addRow(['Diekspor Pada', new Date().toISOString()]);
    sheet.addRow(['Periode Mulai', filters.startAt]);
    sheet.addRow(['Periode Selesai', filters.endAt]);
    sheet.addRow(['Filter', this.filterSummary(filters)]);
  }

  private addKeyValueRows(sheet: ExcelJS.Worksheet, values: Record<string, unknown>) {
    for (const [key, value] of Object.entries(values)) {
      const isNumber = typeof value === 'number';
      const row = sheet.addRow([key, value]);
      if (isNumber) {
        row.getCell(2).numFmt = '#,##0';
      }
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
  }

  private async buildPdf(
    title: string,
    report: SalesReport | ProfitReport,
    headers: string[],
    rows: string[][],
  ) {
    return new Promise<Buffer>((resolve, reject) => {
      const document = new PDFDocument({ margin: 36, size: 'A4' });
      const chunks: Buffer[] = [];

      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);

      document.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' });
      document.moveDown(1);
      
      document.fontSize(9).font('Helvetica');
      document.text(`Diekspor Pada: ${new Date().toISOString()}`);
      document.text(`Periode Mulai: ${report.filters.startAt}`);
      document.text(`Periode Selesai: ${report.filters.endAt}`);
      document.text(`Filter: ${this.filterSummary(report.filters)}`);
      document.moveDown();

      document.fontSize(11).font('Helvetica-Bold').text('Ringkasan');
      document.fontSize(9).font('Helvetica');
      for (const [key, value] of Object.entries(report.summary)) {
        const displayValue = typeof value === 'number' ? this.formatCurrency(value) : value;
        document.text(`${key}: ${displayValue}`);
      }
      document.moveDown(1.5);

      document.fontSize(11).font('Helvetica-Bold').text('Detail');
      document.moveDown(0.5);
      
      this.drawPdfTable(document, headers, rows, document.y);

      document.end();
    });
  }

  private drawPdfTable(
    document: typeof PDFDocument,
    headers: string[],
    rows: string[][],
    startY: number,
  ) {
    const startX = 36;
    let y = startY;
    const rowHeight = 20;
    const colWidth = (595 - 2 * startX) / headers.length; // A4 width is 595

    document.fontSize(9).font('Helvetica-Bold');
    
    // Draw Headers
    headers.forEach((header, i) => {
      document.text(header, startX + i * colWidth, y, { width: colWidth, align: 'left' });
    });
    
    y += 12;
    document.moveTo(startX, y).lineTo(595 - startX, y).lineWidth(1).strokeColor('#000000').stroke();
    y += 8;
    
    // Draw Rows
    document.font('Helvetica').fontSize(8);
    for (const row of rows) {
      if (y > 780) {
        document.addPage();
        y = 36; // New page margin
      }
      row.forEach((cell, i) => {
        document.text(cell, startX + i * colWidth, y, { width: colWidth, align: 'left' });
      });
      y += 12;
      document.moveTo(startX, y).lineTo(595 - startX, y).lineWidth(0.5).strokeColor('#cccccc').stroke();
      y += 8;
    }
  }

  private filterSummary(filters: Record<string, unknown>) {
    return Object.entries(filters)
      .filter(([key]) => !['startAt', 'endAt', 'page', 'limit'].includes(key))
      .map(([key, value]) => `${key}=${value}`)
      .join(', ') || '-';
  }

  private filename(prefix: string, extension: 'xlsx' | 'pdf') {
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${prefix}-${timestamp}.${extension}`;
  }

  private autosize(sheet: ExcelJS.Worksheet) {
    sheet.columns.forEach((column) => {
      let maxLength = 12;
      column.eachCell?.((cell) => {
        maxLength = Math.max(maxLength, String(cell.value ?? '').length + 2);
      });
      column.width = Math.min(maxLength, 40);
    });
  }
}
