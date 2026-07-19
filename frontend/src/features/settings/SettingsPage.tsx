import { useState } from 'react';
import { GeneralTab } from './components/GeneralTab';
import { BrandingTab } from './components/BrandingTab';
import { PharmacyTab } from './components/PharmacyTab';
import { LocalizationTab } from './components/LocalizationTab';
import { ReceiptTab } from './components/ReceiptTab';
import { PreferencesTab } from './components/PreferencesTab';
import { SecurityTab } from './components/SecurityTab';
import { BackupTab } from './components/BackupTab';
import { AboutTab } from './components/AboutTab';
import { 
  Store, 
  Settings, 
  Paintbrush, 
  Globe, 
  FileText, 
  SlidersHorizontal, 
  ShieldCheck, 
  Database, 
  Info 
} from 'lucide-react';

const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'branding', label: 'Branding', icon: Paintbrush },
  { id: 'pharmacy', label: 'Pharmacy Profile', icon: Store },
  { id: 'localization', label: 'Localization', icon: Globe },
  { id: 'receipt', label: 'Receipt & Invoice', icon: FileText },
  { id: 'preferences', label: 'System Preferences', icon: SlidersHorizontal },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'backup', label: 'Backup & Restore', icon: Database },
  { id: 'about', label: 'About System', icon: Info },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string>('general');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralTab />;
      case 'branding':
        return <BrandingTab />;
      case 'pharmacy':
        return <PharmacyTab />;
      case 'localization':
        return <LocalizationTab />;
      case 'receipt':
        return <ReceiptTab />;
      case 'preferences':
        return <PreferencesTab />;
      case 'security':
        return <SecurityTab />;
      case 'backup':
        return <BackupTab />;
      case 'about':
        return <AboutTab />;
      default:
        return <GeneralTab />;
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6">
      {/* Sidebar Nav */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-950">Settings</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage system configurations
          </p>
        </div>
        <nav className="flex md:flex-col gap-1 overflow-x-auto pb-4 md:pb-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 max-w-4xl pb-12">
        {renderTabContent()}
      </main>
    </div>
  );
}
