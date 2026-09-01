import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User as UserIcon, Loader2, Sparkles } from 'lucide-react';
import { Logo } from '../common/Logo';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, isLoading, users } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

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
    // If there is an active user with default username 'admin', fill it
    const adminUser = users.find(u => u.username.toLowerCase() === 'admin');
    if (adminUser) {
      setUsername(adminUser.username);
      if (adminUser.password) {
        setPassword(adminUser.password);
      } else {
        setPassword('admin123');
      }
    } else if (users.length > 0) {
      // Use the first existing user
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div
          id="login-card"
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-md"
        >
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center mb-8">
            <Logo size="xl" showText={true} showTagline={true} className="flex-col !gap-4" />
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              Masuk untuk memantau saldo, mengelola pengeluaran, dan merencanakan keuangan pribadi Anda.
            </p>
          </div>

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
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <span>Masuk ke Nuqudy</span>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <button
              type="button"
              id="login-demo-btn"
              onClick={handleUseDemo}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Isi Akun Demo (admin / admin123)</span>
            </button>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              *Catatan: Password demo dapat diubah melalui menu Pengaturan.
            </p>
          </div>
        </div>

        {/* Footer Credit */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-6">
          NUQUDY &bull; Google Apps Script &amp; Spreadsheet Database
        </p>
      </div>
    </div>
  );
};
