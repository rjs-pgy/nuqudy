import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  Loader2,
  Sparkles,
  Database,
  Cloud,
  CheckCircle2,
  Link2,
  RefreshCw,
  HelpCircle,
  QrCode
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { ShareDeviceModal } from '../modals/ShareDeviceModal';

export const LoginPage: React.FC = () => {
  const { login, isLoading, users, refreshUsers } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Google Sheets Cloud Connection state on Login Screen
  const [gasUrl, setGasUrl] = useState(() => storageService.getSettings().gasWebAppUrl || '');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectMessage, setConnectMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // When mount, if GAS URL is available, auto sync users list from Sheets
  useEffect(() => {
    const currentGas = storageService.getSettings().gasWebAppUrl;
    if (currentGas) {
      setGasUrl(currentGas);
      storageService.fetchGasData()
        .then(res => {
          if (res.success) {
            refreshUsers();
          }
        })
        .catch(() => {});
    }
  }, [refreshUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Silakan isi username dan password Anda.');
      return;
    }

    const res = await login(username, password);
    if (!res.success) {
      setErrorMessage(res.message || 'Username atau password salah.');
    }
  };

  const handleUseDemo = () => {
    const adminUser = users.find(u => u.username.toLowerCase() === 'admin');
    if (adminUser) {
      setUsername(adminUser.username);
      if (adminUser.password) {
        setPassword(adminUser.password);
      } else {
        setPassword('admin123');
      }
    } else if (users.length > 0) {
      setUsername(users[0].username);
      if (users[0].password) {
        setPassword(users[0].password);
      }
    } else {
      setUsername('admin');
      setPassword('admin123');
    }
    setErrorMessage('');
  };

  // Connect / save Google Apps Script URL on this device
  const handleConnectGas = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = inputUrl.trim();
    if (!cleanUrl) {
      setConnectMessage({ success: false, text: 'Masukkan URL Google Apps Script Web App terlebih dahulu.' });
      return;
    }

    setIsConnecting(true);
    setConnectMessage(null);

    try {
      const res = await storageService.fetchGasData(cleanUrl);
      if (res.success) {
        setGasUrl(cleanUrl);
        refreshUsers();
        setConnectMessage({
          success: true,
          text: `Berhasil terhubung ke Google Spreadsheet! Database (${res.data?.transactions?.length || res.data?.length || 0} transaksi) telah dimuat ke perangkat ini.`
        });
        setSuccessNotice('Perangkat ini berhasil terhubung ke Google Spreadsheet Anda.');
        setTimeout(() => {
          setShowConnectModal(false);
          setConnectMessage(null);
        }, 1800);
      } else {
        setConnectMessage({
          success: false,
          text: res.message || 'Gagal tersambung ke Web App Google Apps Script. Pastikan URL benar dan izin diset ke "Anyone".'
        });
      }
    } catch (err: any) {
      setConnectMessage({
        success: false,
        text: 'Koneksi gagal: ' + err.message
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div
          id="login-card"
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-md relative"
        >
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center mb-6">
            <Logo size="xl" showText={true} showTagline={true} className="flex-col !gap-4" />
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              Masuk untuk mengelola keuangan pribadi Anda dengan sinkronisasi real-time multi-perangkat.
            </p>
          </div>

          {/* Database Cloud Connection Status Badge */}
          <div className="mb-6 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${gasUrl ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <div className="min-w-0">
                <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  {gasUrl ? 'Database Cloud Google Sheets' : 'Database Lokal / Baru'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {gasUrl ? 'Sinkron dengan Spreadsheet' : 'Belum terhubung ke Sheets'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setInputUrl(gasUrl);
                setShowConnectModal(true);
              }}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/80 border border-teal-200 dark:border-teal-800 transition-colors shrink-0 cursor-pointer"
            >
              {gasUrl ? 'Ubah URL' : 'Hubungkan'}
            </button>
          </div>

          {/* Success Notice Box */}
          {successNotice && (
            <div
              className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2 animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Error Message Box */}
          {errorMessage && (
            <div
              id="login-error-alert"
              className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-in fade-in"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="login-username-input"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
                  required
                />
                <button
                  type="button"
                  id="login-toggle-pwd-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="login-submit-btn"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 active:scale-98 text-white text-sm font-bold shadow-md shadow-teal-600/25 transition-all disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi &amp; Menyinkronkan...</span>
                  </>
                ) : (
                  <span>Masuk ke Nuqudy</span>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Helper & Multi-Device Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col items-center gap-3 text-center">
            <button
              type="button"
              id="login-demo-btn"
              onClick={handleUseDemo}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Isi Cepat Akun Demo (admin / admin123)</span>
            </button>

            {gasUrl && (
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Bagikan Link / QR untuk HP &amp; Perangkat Lain</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Credit */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-6">
          NUQUDY &bull; Google Apps Script &amp; Spreadsheet Database Multi-Device
        </p>
      </div>

      {/* Connect Google Sheets Modal for New Devices */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hubungkan ke Google Spreadsheet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sinkronkan perangkat ini dengan database Cloud Anda
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Masukkan URL Web App Google Apps Script Anda (akhiran <code className="text-teal-600 dark:text-teal-400 font-mono">/exec</code>) agar perangkat ini terhubung ke database Google Spreadsheet yang sama.
            </p>

            <form onSubmit={handleConnectGas} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  URL Web App Google Apps Script
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={e => setInputUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              {connectMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    connectMessage.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${connectMessage.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span>{connectMessage.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isConnecting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all disabled:opacity-70 cursor-pointer"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menghubungkan...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Hubungkan &amp; Muat Data</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Device Modal */}
      <ShareDeviceModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        gasUrlOverride={gasUrl}
      />
    </div>
  );
};
