import { useState } from 'react';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { useAuthStore } from '../auth/auth.store';
import { ProductSaleUnitsTab } from './ProductSaleUnitsTab';
import { ProductFinancialTab } from './ProductFinancialTab';
import type { Product } from '../master-data/masterData.types';
import type { ProductTabId } from './product.types';

const ALL_TABS: { id: ProductTabId; label: string }[] = [
  { id: 'satuan-jual', label: 'Satuan Jual' },
  { id: 'financial', label: 'Financial' },
];

interface ProductDetailPanelProps {
  product: Product;
  onClose: () => void;
}

export function ProductDetailPanel({ product, onClose }: ProductDetailPanelProps) {
  const user = useAuthStore((state) => state.user);
  const canViewFinancials = user?.role === 'MANAGER' || user?.role === 'PEMILIK';
  const [activeTab, setActiveTab] = useState<ProductTabId>('satuan-jual');

  const visibleTabs = canViewFinancials ? ALL_TABS : ALL_TABS.filter((t) => t.id !== 'financial');

  return (
    <Card className="space-y-0 overflow-hidden p-0">
      {/* Panel Header */}
      <div className="flex flex-col gap-2 border-b border-slate-100 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="pb-0">
          <h2 className="text-base font-semibold text-slate-900">
            Detail: {product.name}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Kode: {product.code}
            {product.genericName ? ` · Generik: ${product.genericName}` : ''}
          </p>
        </div>
        <Button type="button" variant="ghost" onClick={onClose} className="self-start shrink-0">
          Tutup
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/50 px-5">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative shrink-0 px-4 py-3 text-sm font-medium transition-colors duration-150 focus:outline-none ${
              activeTab === tab.id
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-5">
        <div key={activeTab} className="transition-opacity duration-150 opacity-100">
          {activeTab === 'satuan-jual' && (
            <ProductSaleUnitsTab productId={product.id} selectedProduct={product} />
          )}
          {activeTab === 'financial' && (
            <ProductFinancialTab product={product} />
          )}
        </div>
      </div>
    </Card>
  );
}
