import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Helper to parse simple CSV lines
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function main() {
  // Check argument for CSV path
  const csvArg = process.argv[2];
  const csvPath = csvArg ? path.resolve(csvArg) : path.resolve(__dirname, '../../../scripts/sample-onboarding.csv');
  
  console.log(`Membaca file CSV dari: ${csvPath}`);
  if (!fs.existsSync(csvPath)) {
    console.error(`File tidak ditemukan: ${csvPath}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  
  if (lines.length <= 1) {
    console.log('CSV kosong atau hanya berisi header.');
    return;
  }
  
  const header = parseCsvLine(lines[0]);
  console.log(`Header kolom: ${header.join(', ')}`);
  
  // Find a manager user to act as creator for audit/mutations
  const managerUser = await prisma.user.findFirst({
    where: { isActive: true },
    include: { role: true }
  });
  
  if (!managerUser) {
    console.error('Tidak ada user aktif ditemukan di database. Pastikan db:seed sudah dijalankan.');
    process.exit(1);
  }
  
  console.log(`Menggunakan user "${managerUser.username}" (ID: ${managerUser.id}) untuk pencatatan transaksi.`);
  
  let successCount = 0;
  let errorCount = 0;
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < header.length) {
      console.warn(`Baris ${i + 1} dilewati karena format tidak lengkap.`);
      continue;
    }
    
    // Map columns
    const code = row[0];
    const name = row[1];
    const categoryName = row[2];
    const supplierName = row[3];
    const baseUnitName = row[4];
    const saleUnitName = row[5];
    const conversionToBase = parseFloat(row[6]);
    const minSaleQty = parseFloat(row[7]);
    const purchasePrice = parseFloat(row[8]);
    const sellingPrice = parseFloat(row[9]);
    const initialStock = parseFloat(row[10]);
    const batchNumber = row[11];
    const expiredDateStr = row[12];
    
    try {
      console.log(`\nMemproses baris ${i + 1}: ${code} - ${name}`);
      
      // Execute import in a transaction to satisfy relational constraints
      await prisma.$transaction(async (tx) => {
        // 1. Get or create Category
        let category = await tx.category.findFirst({ where: { name: categoryName, deletedAt: null } });
        if (!category) {
          category = await tx.category.create({ data: { name: categoryName, isActive: true } });
        }
        
        // 2. Get or create Supplier
        let supplier = await tx.supplier.findFirst({ where: { name: supplierName, deletedAt: null } });
        if (!supplier) {
          supplier = await tx.supplier.create({ data: { name: supplierName, isActive: true } });
        }
        
        // 3. Get or create Units
        const baseUnit = await tx.unit.upsert({
          where: { name: baseUnitName },
          update: { isActive: true },
          create: { name: baseUnitName, symbol: baseUnitName, isActive: true }
        });
        
        const saleUnit = await tx.unit.upsert({
          where: { name: saleUnitName },
          update: { isActive: true },
          create: { name: saleUnitName, symbol: saleUnitName, isActive: true }
        });
        
        // 4. Create or update Product (lookup by code OR name to prevent unique violations)
        let product = await tx.product.findFirst({
          where: {
            OR: [
              { code: code },
              { name: name }
            ],
            deletedAt: null
          }
        });
        
        if (product) {
          product = await tx.product.update({
            where: { id: product.id },
            data: {
              code: code,
              name: name,
              categoryId: category.id,
              baseUnitId: baseUnit.id,
              isActive: true
            }
          });
        } else {
          product = await tx.product.create({
            data: {
              code: code,
              name: name,
              categoryId: category.id,
              baseUnitId: baseUnit.id,
              isActive: true
            }
          });
        }
        
        // 5. Create or update ProductUnit for base unit
        let pUnitBase = await tx.productUnit.findFirst({
          where: { productId: product.id, unitId: baseUnit.id, deletedAt: null }
        });
        if (pUnitBase) {
          pUnitBase = await tx.productUnit.update({
            where: { id: pUnitBase.id },
            data: {
              conversionToBase: 1.0,
              isSaleUnit: true,
              isActive: true
            }
          });
        } else {
          pUnitBase = await tx.productUnit.create({
            data: {
              productId: product.id,
              unitId: baseUnit.id,
              conversionToBase: 1.0,
              isSaleUnit: true,
              isDefaultSaleUnit: baseUnitName === saleUnitName,
              isActive: true
            }
          });
        }
        
        // 6. Create or update ProductUnit for sale unit if different
        let pUnitSale: any = pUnitBase;
        if (baseUnitName !== saleUnitName) {
          pUnitSale = await tx.productUnit.findFirst({
            where: { productId: product.id, unitId: saleUnit.id, deletedAt: null }
          });
          if (pUnitSale) {
            pUnitSale = await tx.productUnit.update({
              where: { id: pUnitSale.id },
              data: {
                conversionToBase: conversionToBase,
                isSaleUnit: true,
                minSaleQty: minSaleQty,
                isActive: true
              }
            });
          } else {
            pUnitSale = await tx.productUnit.create({
              data: {
                productId: product.id,
                unitId: saleUnit.id,
                conversionToBase: conversionToBase,
                isSaleUnit: true,
                isDefaultSaleUnit: true,
                minSaleQty: minSaleQty,
                isActive: true
              }
            });
          }
          
          // Ensure base unit is not marked as default sale unit if they differ
          await tx.productUnit.update({
            where: { id: pUnitBase.id },
            data: { isDefaultSaleUnit: false }
          });
        }
        
        // 7. Create ProductBatch
        const expiredDate = new Date(expiredDateStr);
        // Check if batch number already exists for this product
        let batch = await tx.productBatch.findFirst({
          where: {
            productId: product.id,
            batchNumber: batchNumber,
            deletedAt: null
          }
        });
        
        if (batch) {
          console.log(`   Batch ${batchNumber} sudah ada untuk produk ini. Mengupdate stok...`);
          const updatedStock = parseFloat(batch.currentStockBase.toString()) + initialStock;
          batch = await tx.productBatch.update({
            where: { id: batch.id },
            data: {
              currentStockBase: updatedStock,
              initialStockBase: parseFloat(batch.initialStockBase.toString()) + initialStock,
              hppBase: purchasePrice,
              supplierId: supplier.id
            }
          });
        } else {
          batch = await tx.productBatch.create({
            data: {
              productId: product.id,
              supplierId: supplier.id,
              batchNumber: batchNumber,
              expiredDate: expiredDate,
              initialStockBase: initialStock,
              currentStockBase: initialStock,
              hppBase: purchasePrice,
              isActive: true
            }
          });
        }
        
        // 8. Create BatchUnitPrice for sale unit
        let bPriceSale = await tx.batchUnitPrice.findFirst({
          where: { batchId: batch.id, productUnitId: pUnitSale.id, deletedAt: null }
        });
        if (bPriceSale) {
          await tx.batchUnitPrice.update({
            where: { id: bPriceSale.id },
            data: { sellingPrice: sellingPrice, isActive: true }
          });
        } else {
          await tx.batchUnitPrice.create({
            data: {
              batchId: batch.id,
              productUnitId: pUnitSale.id,
              sellingPrice: sellingPrice,
              isActive: true
            }
          });
        }
        
        // If they differ, also create price for base unit (based on proportional selling price)
        if (baseUnitName !== saleUnitName) {
          const baseSellingPrice = Math.round(sellingPrice / conversionToBase);
          let bPriceBase = await tx.batchUnitPrice.findFirst({
            where: { batchId: batch.id, productUnitId: pUnitBase.id, deletedAt: null }
          });
          if (bPriceBase) {
            await tx.batchUnitPrice.update({
              where: { id: bPriceBase.id },
              data: { sellingPrice: baseSellingPrice, isActive: true }
            });
          } else {
            await tx.batchUnitPrice.create({
              data: {
                batchId: batch.id,
                productUnitId: pUnitBase.id,
                sellingPrice: baseSellingPrice,
                isActive: true
              }
            });
          }
        }
        
        // 9. Record StockAdjustment & StockMutation to preserve audit trail
        const adjustment = await tx.stockAdjustment.create({
          data: {
            batchId: batch.id,
            productId: product.id,
            createdById: managerUser.id,
            adjustmentType: 'INCREASE',
            oldQty: 0,
            newQty: initialStock,
            difference: initialStock,
            reason: 'Import massal onboarding produk'
          }
        });
        
        await tx.stockMutation.create({
          data: {
            productId: product.id,
            batchId: batch.id,
            createdById: managerUser.id,
            movementType: 'IN',
            referenceType: 'ADJUSTMENT',
            referenceId: adjustment.id,
            qtyBefore: 0,
            qtyChange: initialStock,
            qtyAfter: initialStock,
            metadata: { reason: 'Import massal onboarding produk' }
          }
        });
      });
      
      console.log(`   Berhasil mengimpor produk ${code} - ${name} dengan stok ${initialStock}`);
      successCount++;
    } catch (err: any) {
      console.error(`   Gagal mengimpor baris ${i + 1} (${code}):`, err.message || err);
      errorCount++;
    }
  }
  
  console.log(`\n=== RINGKASAN IMPOR ===`);
  console.log(`Total Berhasil : ${successCount}`);
  console.log(`Total Gagal    : ${errorCount}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
