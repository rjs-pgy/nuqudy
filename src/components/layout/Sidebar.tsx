import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  FolderTree,
  WalletCards,
  FileSpreadsheet,
  Settings,
  LogOut,
  Code2,
  Moon,
  Sun,
  ShieldCheck,
  Plus,
  X,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { Logo } from '../common/Logo';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user, logout } = useAuth();
  const { activeTab, setActiveTab, isDark, toggleDarkMode, openAddTransaction } = useFinance();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi', icon: ArrowLeftRight },
    { id: 'categories', label: 'Kategori', icon: FolderTree },
    { id: 'accounts', label: 'Akun Keuangan', icon: WalletCards },
    { id: 'reports', label: 'Laporan', icon: FileSpreadsheet },
    { id: 'user_management', label: 'Kelola Akun & Sandi', icon: UserCheck },
    { id: 'gas', label: 'Backend Hub (GAS)', icon: Code2 },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id as any);
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-[#0F172A] text-slate-700 dark:text-slate-300 flex flex-col h-full border-r border-slate-200 dark:border-slate-800 shrink-0 select-none transition-colors duration-200">
      {/* Brand Header with optional Close button on mobile */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <Logo size="sm" showText={false} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-slate-900 dark:text-white font-black text-base tracking-tight leading-none truncate">
              NUQUDY
            </h1>
            <p className="text-emerald-600 dark:text-emerald-400 text-[10px] uppercase tracking-wider font-extrabold mt-0.5 truncate">
              Smart Financial
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <button
          onClick={() => {
            openAddTransaction('expense');
            if (onClose) onClose();
          }}
          className="w-full mb-3 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Transaksi Baru</span>
        </button>

        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Menu Utama
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Profile & Dark Mode Toggle */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0c1322]">
        {/* Quick Theme Toggle */}
        <div className="flex items-center justify-between px-2.5 py-1.5 mb-2 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 text-[11px] shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Tema Tampilan</span>
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Ganti Tema"
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Terang</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Gelap</span>
              </>
            )}
          </button>
        </div>

        {/* User Card - Clickable to Open Account Management */}
        <div
          onClick={() => handleNavClick('user_management')}
          className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs cursor-pointer hover:border-emerald-500/50 transition-colors group"
          title="Kelola Akun & Sandi"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            {typeof user?.name === 'string' ? user.name.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-xs text-slate-900 dark:text-white font-bold truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {typeof user?.name === 'string' ? user.name : 'Administrator'}
              </p>
              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-mono">
              {user?.email ? user.email : `@${user?.username || 'admin'}`}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              logout();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Keluar"
            id="sidebar-logout-btn"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
