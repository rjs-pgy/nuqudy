import React, { useState } from 'react';
import {
  Plus,
  RefreshCw,
  Menu,
  Sun,
  Moon,
  Smartphone,
  QrCode
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { PeriodFilter } from '../../types';
import { ShareDeviceModal } from '../modals/ShareDeviceModal';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const {
    activeTab,
    period,
    setPeriod,
    openAddTransaction,
    syncWithBackend,
    isSyncing,
    gasUrl,
    isDark,
    toggleDarkMode
  } = useFinance();

  const [showShareModal, setShowShareModal] = useState(false);

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Ringkasan Keuangan', subtitle: 'Pantau arus kas dan saldo terkini' },
    transactions: { title: 'Daftar Transaksi', subtitle: 'Catatan seluruh pemasukan dan pengeluaran' },
    categories: { title: 'Manajemen Kategori', subtitle: 'Kelola kelompok transaksi Anda' },
    accounts: { title: 'Akun & Dompet', subtitle: 'Kelola rekening bank, e-wallet, dan tunai' },
    reports: { title: 'Laporan Keuangan', subtitle: 'Analisis dan cetak ringkasan performa' },
    user_management: { title: 'Kelola Akun & Sandi', subtitle: 'Manajemen pengguna, password, dan sinkronisasi data akun' },
    gas: { title: 'Backend Hub (GAS)', subtitle: 'Koneksi Google Spreadsheet & Apps Script' },
    settings: { title: 'Pengaturan', subtitle: 'Konfigurasi akun dan sistem aplikasi' }
  };

  const currentMeta = tabTitles[activeTab] || { title: 'Keuangan', subtitle: 'Nuqudy Smart Financial' };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 z-20 transition-colors duration-200">
      {/* Left: Mobile Toggle & Page Title / Period Selector */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none cursor-pointer"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
              {currentMeta.title}
            </h2>

            {/* Quick Period Switcher (Cleanly spaced for wide screens) */}
            {['dashboard', 'transactions', 'reports'].includes(activeTab) && (
              <div className="hidden xl:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 ml-2 shrink-0">
                {(['this_month', 'this_week', 'today', 'all'] as PeriodFilter[]).map(p => {
                  const labels: Record<string, string> = {
                    this_month: 'Bulan ini',
                    this_week: 'Minggu ini',
                    today: 'Hari ini',
                    all: 'Semua'
                  };
                  return (
                    <button
                      key={p}
                      id={`hdr-period-${p}`}
                      onClick={() => setPeriod(p)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        period === p
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {labels[p]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <p className="hidden sm:block text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Theme Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          aria-label="Toggle Theme"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500" />
          )}
        </button>

        {/* Open on Phone / Multi-Device Share */}
        {gasUrl && (
          <button
            onClick={() => setShowShareModal(true)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-xs font-semibold transition-colors cursor-pointer"
            title="Bagikan Link / QR Code untuk HP"
          >
            <Smartphone className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="hidden lg:inline">Buka di HP</span>
          </button>
        )}

        {/* Backend / Google Sheets Sync Button */}
        <button
          onClick={syncWithBackend}
          disabled={isSyncing}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            gasUrl
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
          title={gasUrl ? 'Tersambung ke Google Spreadsheet' : 'Klik untuk hubungkan ke Google Sheets'}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
          <span className="hidden sm:inline">
            {isSyncing ? 'Sinkron...' : gasUrl ? 'Sync Sheets' : 'Local'}
          </span>
        </button>

        {/* Primary Action Button: Tambah Transaksi */}
        <button
          id="header-btn-add-tx"
          onClick={() => openAddTransaction('expense')}
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/25 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="tracking-wide uppercase">Transaksi</span>
        </button>
      </div>

      {/* Share Device Modal for Phone / Multi-Device */}
      <ShareDeviceModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        gasUrlOverride={gasUrl}
      />
    </header>
  );
};
