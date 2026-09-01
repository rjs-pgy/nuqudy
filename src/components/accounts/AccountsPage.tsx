import React, { useState } from 'react';
import {
  Plus,
  CreditCard,
  Building2,
  Smartphone,
  PiggyBank,
  Wallet,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  X
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Account, AccountType } from '../../types';
import { formatRupiah } from '../../utils/formatters';

const PRESET_COLORS = [
  '#0d9488', '#0284c7', '#4f46e5', '#7c3aed',
  '#db2777', '#e11d48', '#d97706', '#16a34a', '#475569'
];

export const AccountsPage: React.FC = () => {
  const {
    accounts,
    transactions,
    addAccount,
    updateAccount,
    deleteAccount,
    setConfirmModal
  } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [initialBalance, setInitialBalance] = useState<string>('0');
  const [accountNumber, setAccountNumber] = useState('');
  const [color, setColor] = useState('#0d9488');
  const [description, setDescription] = useState('');

  const openAddModal = () => {
    setEditingAccount(null);
    setName('');
    setType('bank');
    setInitialBalance('0');
    setAccountNumber('');
    setColor('#0d9488');
    setDescription('');
    setModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setInitialBalance(acc.initialBalance.toString());
    setAccountNumber(acc.accountNumber || '');
    setColor(acc.color || '#0d9488');
    setDescription(acc.description || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedInitial = Number(initialBalance) || 0;

    if (editingAccount) {
      await updateAccount({
        ...editingAccount,
        name: name.trim(),
        type,
        initialBalance: parsedInitial,
        accountNumber: accountNumber.trim(),
        color,
        description: description.trim()
      });
    } else {
      await addAccount({
        accountId: `acc_${Date.now()}`,
        name: name.trim(),
        type,
        initialBalance: parsedInitial,
        currentBalance: parsedInitial,
        accountNumber: accountNumber.trim(),
        color,
        description: description.trim()
      });
    }
    setModalOpen(false);
  };

  const handleDelete = (acc: Account) => {
    if (accounts.length <= 1) {
      alert('Anda harus memiliki setidaknya satu akun keuangan.');
      return;
    }

    const txCount = transactions.filter(t => t.account === acc.name).length;
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Akun Keuangan',
      message: `Apakah Anda yakin ingin menghapus akun "${acc.name}"? ${
        txCount > 0 ? `Perhatian: Ada ${txCount} transaksi yang tercatat pada akun ini.` : ''
      }`,
      confirmLabel: 'Ya, Hapus',
      variant: 'danger',
      onConfirm: async () => {
        await deleteAccount(acc.accountId);
      }
    });
  };

  const getAccountIcon = (accType: AccountType) => {
    switch (accType) {
      case 'bank': return <Building2 className="w-5 h-5" />;
      case 'ewallet': return <Smartphone className="w-5 h-5" />;
      case 'savings': return <PiggyBank className="w-5 h-5" />;
      default: return <Wallet className="w-5 h-5" />;
    }
  };

  const totalAssets = accounts.reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* 1. Overview Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Total Likuiditas & Aset
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5 tracking-tight truncate">
            {formatRupiah(totalAssets)}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tersebar di {accounts.length} rekening bank, e-wallet, dan pos kas.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Tambah Akun Baru
        </button>
      </div>

      {/* 2. Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map(acc => {
          // Calculate inflows and outflows for this account
          const accTransactions = transactions.filter(t => t.account === acc.name);
          const totalIn = accTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);
          const totalOut = accTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

          return (
            <div
              key={acc.accountId}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                      style={{ backgroundColor: acc.color || '#0d9488' }}
                    >
                      {getAccountIcon(acc.type)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                        {acc.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium capitalize">
                        {acc.type} {acc.accountNumber ? `• ${acc.accountNumber}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(acc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Akun"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(acc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Hapus Akun"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Balance Display */}
                <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Saldo Berjalan
                  </p>
                  <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 tracking-tight truncate">
                    {formatRupiah(acc.currentBalance)}
                  </p>
                </div>
              </div>

              {/* Inflow vs Outflow Mini Stats */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400">Total Masuk</p>
                    <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                      +{formatRupiah(totalIn)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400">Total Keluar</p>
                    <p className="font-mono font-bold text-rose-600 dark:text-rose-400 truncate">
                      -{formatRupiah(totalOut)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Account */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingAccount ? 'Edit Akun Keuangan' : 'Tambah Akun Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Account Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Nama Akun <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Contoh: BCA Payroll, Mandiri Tabungan, GoPay, Dompet Tunai"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Type & Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Tipe Akun
                  </label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as AccountType)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="bank">Bank (Rekening)</option>
                    <option value="cash">Tunai (Cash)</option>
                    <option value="ewallet">E-Wallet</option>
                    <option value="savings">Tabungan / Investasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    No. Rekening / ID
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    placeholder="Contoh: 123-456-789"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Initial Balance */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Saldo Awal (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={initialBalance}
                  onChange={e => setInitialBalance(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Color Tag */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Warna Tema Akun
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-7 h-7 rounded-lg transition-transform hover:scale-110 flex items-center justify-center cursor-pointer"
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
