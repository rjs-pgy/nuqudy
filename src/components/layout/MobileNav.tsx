import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  FolderTree,
  WalletCards,
  FileSpreadsheet,
  Settings,
  Code2
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab } = useFinance();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi', icon: ArrowLeftRight },
    { id: 'categories', label: 'Kategori', icon: FolderTree },
    { id: 'accounts', label: 'Akun', icon: WalletCards },
    { id: 'reports', label: 'Laporan', icon: FileSpreadsheet },
    { id: 'gas', label: 'GAS Hub', icon: Code2 },
    { id: 'settings', label: 'Setelan', icon: Settings },
  ];

  return (
    <div className="lg:hidden sticky bottom-0 left-0 right-0 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 px-1 py-1.5 flex items-center justify-around shadow-lg transition-colors">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            id={`mobile-nav-${item.id}`}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-xl transition-all cursor-pointer min-w-0 ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[9px] sm:text-[10px] mt-0.5 tracking-tight truncate max-w-[50px]">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
