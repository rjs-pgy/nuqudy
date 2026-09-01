import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Moon,
  Sun,
  Database,
  Download,
  Upload,
  RotateCcw,
  ShieldAlert,
  Check,
  Save,
  DollarSign,
  Globe,
  Sliders
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { storageService } from '../../services/storageService';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const {
    isDark,
    toggleDarkMode,
    gasUrl,
    setGasUrl,
    resetToDemoData,
    setConfirmModal,
    addToast,
    showToast,
    refreshAllData
  } = useFinance();

  // Profile states
  const [name, setName] = useState(user?.name ? (typeof user.name === 'string' ? user.name : 'Administrator') : 'Administrator');
  const [email, setEmail] = useState(user?.email || 'admin@nuqudy.app');
  const [currency, setCurrency] = useState(user?.currency || storageService.getSettings().currency || 'Rp');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Webhook URL
  const [inputGasUrl, setInputGasUrl] = useState(gasUrl || storageService.getSettings().gasWebAppUrl || '');

  // Keep in sync with user changes
  useEffect(() => {
    if (user) {
      if (typeof user.name === 'string') setName(user.name);
      if (typeof user.email === 'string') setEmail(user.email);
      if (user.currency) setCurrency(user.currency);
    }
  }, [user]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim() || 'Pengguna Nuqudy';
    const cleanEmail = email.trim() || 'admin@nuqudy.app';
    const cleanCurrency = currency.trim() || 'Rp';
    const cleanGasUrl = inputGasUrl.trim();

    updateProfile({
      name: cleanName,
      email: cleanEmail,
      currency: cleanCurrency
    });

    setGasUrl(cleanGasUrl);
    storageService.saveSettings({
      currency: cleanCurrency,
      gasWebAppUrl: cleanGasUrl
    });

    setSavedSuccess(true);
    showToast('success', 'Pengaturan Disimpan', 'Profil pengguna dan pengaturan aplikasi berhasil diperbarui.');
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupData = storageService.exportAllData();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(backupData);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nuqudy_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Cadangan data berhasil diunduh', 'success');
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const success = storageService.importData(content);
        if (success) {
          await refreshAllData();
          addToast('Data cadangan berhasil dipulihkan!', 'success');
        } else {
          addToast('Gagal memulihkan data. Format berkas tidak sesuai.', 'error');
        }
      } catch (err) {
        addToast('Format berkas backup JSON tidak valid.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset to Demo Data
  const handleResetData = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset ke Data Demo',
      message: 'Apakah Anda yakin ingin mengatur ulang seluruh data transaksi, kategori, dan akun ke data contoh awal? Data saat ini akan digantikan.',
      confirmLabel: 'Ya, Reset Data',
      variant: 'danger',
      onConfirm: async () => {
        await resetToDemoData();
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* 1. Profile Settings Form */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-emerald-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Profil Pengguna & Mata Uang
          </h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Alamat Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Simbol Mata Uang
              </label>
              <input
                type="text"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                placeholder="Rp"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                URL Google Apps Script Web App
              </label>
              <input
                type="url"
                value={inputGasUrl}
                onChange={e => setInputGasUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                Tersimpan!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </>
            )}
          </button>
        </form>
      </div>

      {/* 2. Theme & Display Preferences */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Tampilan & Mode Gelap
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pilih mode terang (Clean Utility) atau mode gelap untuk kenyamanan mata.
          </p>
        </div>

        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-colors cursor-pointer"
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Mode Terang</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-500" />
              <span>Mode Gelap</span>
            </>
          )}
        </button>
      </div>

      {/* 3. Database Backup & Restore */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Cadangkan & Pulihkan Data (JSON)
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Unduh seluruh data transaksi, akun, dan kategori Anda ke dalam format file JSON untuk disimpan secara lokal atau dipindahkan ke perangkat lain.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Unduh Cadangan (Backup JSON)
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Pulihkan Data (Import JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 4. Danger Zone: Reset to Demo */}
      <div className="p-6 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="text-base font-bold">Zona Bahaya</h3>
        </div>
        <p className="text-xs text-rose-700 dark:text-rose-300">
          Mengembalikan data aplikasi ke kondisi sampel awal. Tindakan ini akan menghapus data transaksi kustom yang belum tersinkronisasi.
        </p>

        <button
          onClick={handleResetData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset ke Data Demo Awal
        </button>
      </div>
    </div>
  );
};
