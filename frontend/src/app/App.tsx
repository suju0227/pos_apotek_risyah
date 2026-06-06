import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PlaceholderPage } from '../shared/components/PlaceholderPage';
import { ToastRegion } from '../shared/components/ToastRegion';
import { LoginPage } from '../features/auth/LoginPage';
import { BatchPage } from '../features/batches/BatchPage';
import { CashierPage } from '../features/cashier/CashierPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import {
  CategoriesPage,
  ProductsPage,
  SuppliersPage,
  UnitsPage,
} from '../features/master-data/MasterDataPages';
import { PurchaseOrderPage } from '../features/purchase-orders/PurchaseOrderPage';
import { PurchasePage } from '../features/purchases/PurchasePage';
import { ProfitReportPage } from '../features/reports/ProfitReportPage';
import { SalesReportPage } from '../features/reports/SalesReportPage';
import type { RoleName } from '../features/auth/auth.types';

const managerOnly: RoleName[] = ['MANAGER'];
const cashierAndManager: RoleName[] = ['KASIR', 'MANAGER'];
const pharmacistAndManager: RoleName[] = ['APOTEKER', 'MANAGER'];

export function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={managerOnly}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kasir"
            element={
              <ProtectedRoute allowedRoles={cashierAndManager}>
                <CashierPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/riwayat-transaksi"
            element={
              <ProtectedRoute allowedRoles={cashierAndManager}>
                <PlaceholderPage title="Riwayat Transaksi" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/retur-penjualan"
            element={
              <ProtectedRoute allowedRoles={cashierAndManager}>
                <PlaceholderPage title="Retur Penjualan" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/produk"
            element={
              <ProtectedRoute allowedRoles={managerOnly}>
                <ProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kategori"
            element={
              <ProtectedRoute allowedRoles={managerOnly}>
                <CategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier"
            element={
              <ProtectedRoute allowedRoles={managerOnly}>
                <SuppliersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/satuan"
            element={
              <ProtectedRoute allowedRoles={managerOnly}>
                <UnitsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/batch"
            element={
              <ProtectedRoute allowedRoles={managerOnly}>
                <BatchPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pemesanan"
            element={
              <ProtectedRoute allowedRoles={pharmacistAndManager}>
                <PurchaseOrderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pelayanan/resep"
            element={
              <ProtectedRoute allowedRoles={pharmacistAndManager}>
                <PlaceholderPage title="Pelayanan Resep" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pelayanan/konseling"
            element={
              <ProtectedRoute allowedRoles={pharmacistAndManager}>
                <PlaceholderPage title="Konseling" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pembelian"
            element={
              <ProtectedRoute allowedRoles={managerOnly}>
                <PurchasePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pembelian/dari-po/:poId"
            element={
              <ProtectedRoute allowedRoles={managerOnly}>
                <PurchasePage />
              </ProtectedRoute>
            }
          />
          {[
            ['/stok', 'Stok'],
            ['/mutasi-stok', 'Mutasi Stok'],
            ['/retur-pembelian', 'Retur Pembelian'],
            ['/export', 'Export'],
            ['/users', 'Users'],
            ['/settings', 'Settings'],
          ].map(([path, title]) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute allowedRoles={managerOnly}>
                  <PlaceholderPage title={title} />
                </ProtectedRoute>
              }
            />
          ))}
          <Route
            path="/laporan/penjualan"
            element={
              <ProtectedRoute allowedRoles={managerOnly}>
                <SalesReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/laporan/laba"
            element={
              <ProtectedRoute allowedRoles={managerOnly}>
                <ProfitReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={<PlaceholderPage title="Halaman tidak ditemukan" />}
          />
        </Route>
      </Routes>
      <ToastRegion />
    </>
  );
}
