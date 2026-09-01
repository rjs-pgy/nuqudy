import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  KeyRound,
  ShieldCheck,
  Users,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  FileSpreadsheet,
  Link as LinkIcon,
  Sparkles,
  Lock,
  Mail,
  Wallet,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { storageService } from '../../services/storageService';
import { User } from '../../types';

export const AccountManagementPage: React.FC = () => {
  const { user, users, updateProfile, changePassword, addUser, deleteUser, refreshUsers } = useAuth();
  const { gasUrl, setGasUrl, isSyncing, syncWithBackend, showToast, setActiveTab, setConfirmModal } = useFinance();

  // Active Tab within Account Page: 'profile' | 'password' | 'users' | 'database'
  const [activeSection, setActiveSection] = useState<'profile' | 'password' | 'users' | 'database'>('profile');

  // --- Profile Form State ---
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileUsername, setProfileUsername] = useState(user?.username || '');
  const [profileCurrency, setProfileCurrency] = useState(user?.currency || 'Rp');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Keep state in sync with user
  useEffect(() => {
    if (user) {
      setProfileName(typeof user.name === 'string' ? user.name : 'Pengguna Nuqudy');
      setProfileEmail(typeof user.email === 'string' ? user.email : 'admin@nuqudy.app');
      setProfileUsername(typeof user.username === 'string' ? user.username : 'admin');
      setProfileCurrency(user.currency || 'Rp');
    }
  }, [user]);

  // --- Password Form State ---
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- Add User Modal State ---
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'member'>('member');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // --- Push Full Database to GAS State ---
  const [isPushingFullDb, setIsPushingFullDb] = useState(false);

  // Profile Save Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profileUsername.trim()) {
      showToast('error', 'Validasi Gagal', 'Nama dan Username wajib diisi.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const ok = await updateProfile({
        name: profileName.trim(),
        email: profileEmail.trim(),
        username: profileUsername.trim().toLowerCase(),
        currency: profileCurrency.trim()
      });

      if (ok) {
        showToast(
          'success',
          'Profil Diperbarui',
          gasUrl
            ? 'Profil berhasil disimpan dan disinkronkan ke Google Spreadsheet (Sheet Users)!'
            : 'Profil berhasil disimpan di penyimpanan lokal.'
        );
      }
    } catch (err: any) {
      showToast('error', 'Gagal', err?.message || 'Gagal menyimpan profil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Password Change Handler
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!newPassword.trim()) {
      setPasswordMessage({ type: 'error', text: 'Kata sandi baru tidak boleh kosong.' });
      return;
    }

    if (newPassword.length < 4) {
      setPasswordMessage({ type: 'error', text: 'Kata sandi baru minimal 4 karakter.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Konfirmasi kata sandi baru tidak cocok.' });
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        setPasswordMessage({ type: 'success', text: res.message });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showToast('success', 'Kata Sandi Diubah', res.message);
      } else {
        setPasswordMessage({ type: 'error', text: res.message });
        showToast('error', 'Gagal Mengubah Sandi', res.message);
      }
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err?.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Add User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserUsername.trim()) {
      showToast('error', 'Validasi Gagal', 'Username wajib diisi.');
      return;
    }

    setIsCreatingUser(true);
    try {
      const res = await addUser({
        username: newUserUsername.trim().toLowerCase(),
        name: newUserName.trim() || newUserUsername.trim(),
        email: newUserEmail.trim() || `${newUserUsername.trim().toLowerCase()}@nuqudy.app`,
        password: newUserPassword.trim() || 'admin123',
        role: newUserRole
      });

      if (res.success) {
        showToast('success', 'Akun Ditambahkan', res.message);
        setIsAddUserModalOpen(false);
        setNewUserName('');
        setNewUserUsername('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserRole('member');
      } else {
        showToast('error', 'Gagal', res.message);
      }
    } catch (err: any) {
      showToast('error', 'Gagal', err?.message || 'Gagal menambahkan akun.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Delete User Confirmation
  const confirmDeleteUser = (targetUser: User) => {
    if (targetUser.userId === user?.userId) {
      showToast('error', 'Tidak Diizinkan', 'Anda tidak dapat menghapus akun yang sedang Anda gunakan.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Hapus Akun Pengguna?',
      message: `Apakah Anda yakin ingin menghapus akun "${targetUser.name}" (${targetUser.username}) dari database?`,
      confirmLabel: 'Hapus Akun',
      variant: 'danger',
      onConfirm: async () => {
        const res = await deleteUser(targetUser.userId);
        if (res.success) {
          showToast('success', 'Akun Dihapus', res.message);
        } else {
          showToast('error', 'Gagal', res.message);
        }
      }
    });
  };

  // Push Full Database to GAS
  const handlePushFullDatabase = async () => {
    if (!gasUrl) {
      showToast('warning', 'GAS Belum Terhubung', 'Silakan hubungkan URL Google Apps Script terlebih dahulu.');
      return;
    }

    setIsPushingFullDb(true);
    try {
      const res = await storageService.syncAllToGas();
      if (res.success) {
        showToast('success', 'Database Tersinkronkan', 'Seluruh data (Akun, Sandi, Transaksi, Kategori, Rekening) berhasil dikirim ke Google Spreadsheet!');
      } else {
        showToast('error', 'Gagal', res.message || 'Gagal mengirim database.');
      }
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Koneksi error.');
    } finally {
      setIsPushingFullDb(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Cloud Status Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-500/20 shrink-0">
            {typeof user?.name === 'string' ? user.name.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {typeof user?.name === 'string' ? user.name : 'Pengguna Nuqudy'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>{user?.role === 'admin' ? 'Administrator' : 'Member'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Username: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">@{user?.username}</span> &bull; {user?.email}
            </p>
          </div>
        </div>

        {/* Database Status Pill & Sync Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {gasUrl ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Google Spreadsheet Aktif (Sheet: Users &amp; Data)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Penyimpanan Lokal (Belum terhubung ke Sheets)</span>
            </div>
          )}

          <button
            onClick={syncWithBackend}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Tarik data terbaru dari Google Spreadsheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Data'}</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveSection('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'profile'
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Profil Pengguna</span>
        </button>

        <button
          onClick={() => setActiveSection('password')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'password'
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Ubah Kata Sandi</span>
        </button>

        <button
          onClick={() => setActiveSection('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'users'
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Akun ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('database')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'database'
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Database Spreadsheet</span>
        </button>
      </div>

      {/* SECTION 1: PROFIL PENGGUNA */}
      {activeSection === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Informasi Akun Pengguna</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Perubahan pada data ini akan langsung disimpan ke database Google Spreadsheet (Sheet <code className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">Users</code>).
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Username (ID Login)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      id="profile-username-input"
                      value={profileUsername}
                      onChange={e => setProfileUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Digunakan saat masuk ke aplikasi.
                  </p>
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    id="profile-name-input"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      id="profile-email-input"
                      value={profileEmail}
                      onChange={e => setProfileEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                {/* Mata Uang Utama */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Simbol Mata Uang
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      id="profile-currency-input"
                      value={profileCurrency}
                      onChange={e => setProfileCurrency(e.target.value)}
                      placeholder="Rp, $, EUR, dll"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  id="btn-save-profile"
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSavingProfile ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Sheets...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Perubahan Profil</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Info Card */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-3">
                <Sparkles className="w-4 h-4" />
                <span>Integrasi Database Cloud</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Penyimpanan Terpusat</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Data profil dan pengaturan akun ini disinkronkan secara langsung ke Google Spreadsheet. Ketika Anda membuka aplikasi dari perangkat atau browser lain, data akun Anda tetap tersimpan dan terjaga.
              </p>

              <div className="mt-4 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>User ID:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{user?.userId}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Status Akun:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">{user?.status || 'Aktif'}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Tipe Akun:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold uppercase">{user?.role || 'Admin'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('gas')}
              className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Kelola Koneksi Google Spreadsheet</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: UBAH KATA SANDI */}
      {activeSection === 'password' && (
        <div className="max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Ubah Kata Sandi Akun</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Kata sandi baru akan otomatis diperbarui pada tabel <code className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">Users</code> di Google Spreadsheet. Gunakan kata sandi baru untuk login berikutnya.
            </p>
          </div>

          {passwordMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in ${
                passwordMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {passwordMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSavePassword} className="space-y-4">
            {/* Kata Sandi Lama */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Kata Sandi Saat Ini (Lama)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  id="old-password-input"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  placeholder="Masukkan kata sandi saat ini"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Kata Sandi Baru */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="new-password-input"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Konfirmasi Kata Sandi Baru */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Ulangi Kata Sandi Baru
              </label>
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="confirm-password-input"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi baru"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                required
              />
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                id="btn-save-password"
                disabled={isSavingPassword}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-60"
              >
                {isSavingPassword ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Google Sheets...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Perbarui Kata Sandi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 3: DAFTAR AKUN PENGGUNA (MULTI-USER) */}
      {activeSection === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Daftar Akun Pengguna Terdaftar</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Kelola seluruh akun yang memiliki akses ke aplikasi. Semua akun tersimpan pada sheet <code className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">Users</code>.
              </p>
            </div>

            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer shrink-0"
              id="btn-add-new-user"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tambah Akun Baru</span>
            </button>
          </div>

          {/* User List Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Username (Login ID)</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {users.map(u => {
                  const isCurrent = u.userId === user?.userId || u.username === user?.username;
                  return (
                    <tr key={u.userId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
                            {typeof u.name === 'string' ? u.name.slice(0, 2).toUpperCase() : 'US'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                  Anda
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">ID: {u.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        @{u.username}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {u.email}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {u.role || 'Admin'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{u.status || 'Active'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isCurrent ? (
                          <button
                            onClick={() => confirmDeleteUser(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Hapus Akun"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Sesi Aktif</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: STRUKTUR & SINKRONISASI DATABASE SPREADSHEET */}
      {activeSection === 'database' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Arsitektur Multi-Sheet Database</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Google Spreadsheet Anda berfungsi sebagai database relational real-time dengan 5 lembar kerja otomatis:
                </p>
              </div>

              <button
                onClick={handlePushFullDatabase}
                disabled={isPushingFullDb || !gasUrl}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isPushingFullDb ? 'animate-spin' : ''}`} />
                <span>{isPushingFullDb ? 'Mengirim Database...' : 'Push Seluruh Data ke Sheets'}</span>
              </button>
            </div>

            {/* Schema Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-600 dark:text-emerald-400 mb-2">
                  <Users className="w-4 h-4" />
                  <span>Sheet: Users</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  Menyimpan akun login, sandi terenkripsi, nama, email, mata uang, dan hak akses.
                </p>
                <div className="flex flex-wrap gap-1 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                  <span className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">userId</span>
                  <span className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">username</span>
                  <span className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">password</span>
                  <span className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">name</span>
                  <span className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">email</span>
                  <span className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">currency</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 font-bold text-xs text-teal-600 dark:text-teal-400 mb-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Sheet: Transactions</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  Menyimpan setiap transaksi pemasukan &amp; pengeluaran real-time.
                </p>
                <div className="flex flex-wrap gap-1 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                  <span className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">transactionId</span>
                  <span className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">date</span>
                  <span className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">type</span>
                  <span className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">amount</span>
                  <span className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">category</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 font-bold text-xs text-blue-600 dark:text-blue-400 mb-2">
                  <Wallet className="w-4 h-4" />
                  <span>Sheet: Accounts &amp; Categories</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  Menyimpan rekening bank, kas tunai, e-wallet, serta kategori transaksi.
                </p>
                <div className="flex flex-wrap gap-1 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                  <span className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">accountId</span>
                  <span className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">initialBalance</span>
                  <span className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">categoryId</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tambah Akun Pengguna Baru */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAddUserModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Tambah Akun Pengguna Baru
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Akun baru akan langsung didaftarkan ke Google Spreadsheet database.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Username (Wajib)
                </label>
                <input
                  type="text"
                  value={newUserUsername}
                  onChange={e => setNewUserUsername(e.target.value)}
                  placeholder="misal: budi, finance_staff"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="misal: Budi Santoso"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Alamat Email
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="budi@nuqudy.app"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Kata Sandi Awal
                </label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  placeholder="Default: admin123"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Peran / Hak Akses
                </label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs"
                >
                  <option value="member">Member / Pengguna Standar</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isCreatingUser ? 'Menyimpan...' : 'Daftarkan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
