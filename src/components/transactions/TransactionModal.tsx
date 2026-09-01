import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Plus, Calendar, Tag, Wallet, FileText, Check } from 'lucide-react';
import { TransactionType, Transaction } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, parseRupiahInput, getTodayDateString } from '../../utils/formatters';

interface TransactionModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  editingTransaction?: Transaction | null;
  initialType?: TransactionType;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  editingTransaction: propEditingTx,
  initialType: propInitialType
}) => {
  const {
    isTransactionModalOpen,
    closeTransactionModal,
    editingTransaction: contextEditingTx,
    transactionModalInitialType,
    categories,
    accounts,
    createTransaction,
    editTransaction,
    createCategory,
    showToast
  } = useFinance();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isTransactionModalOpen;
  const onClose = propOnClose || closeTransactionModal;
  const editingTransaction = propEditingTx !== undefined ? propEditingTx : contextEditingTx;
  const initialType = propInitialType || transactionModalInitialType || 'expense';

  const [type, setType] = useState<TransactionType>(initialType);
  const [date, setDate] = useState<string>(getTodayDateString());
  const [category, setCategory] = useState<string>('');
  const [account, setAccount] = useState<string>('');
  const [amountRaw, setAmountRaw] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline Quick Category Modal State
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Populate fields when editing or opening
  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      setCategory(editingTransaction.category);
      setAccount(editingTransaction.account);
      setAmountRaw(String(editingTransaction.amount));
      setDescription(editingTransaction.description || '');
    } else {
      setType(initialType);
      setDate(getTodayDateString());
      setAmountRaw('');
      setDescription('');
      
      // Default account
      if (accounts.length > 0) {
        setAccount(accounts[0].name);
      }
    }
  }, [editingTransaction, initialType, accounts, isOpen]);

  // Set default category according to type
  useEffect(() => {
    if (!isOpen) return;

    if (!editingTransaction) {
      const typeCategories = categories.filter(c => c.type === type);
      if (typeCategories.length > 0) {
        // If current category does not exist in type categories, default to first
        if (!typeCategories.some(c => c.name === category)) {
          setCategory(typeCategories[0].name);
        }
      } else {
        setCategory('');
      }
    }
  }, [type, categories, editingTransaction, isOpen]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseRupiahInput(e.target.value);
    setAmountRaw(parsed > 0 ? String(parsed) : '');
  };

  const handleQuickAddAmount = (addAmount: number) => {
    const current = parseRupiahInput(amountRaw);
    setAmountRaw(String(current + addAmount));
  };

  const handleCreateQuickCategory = () => {
    if (!newCatName.trim()) return;
    const ok = createCategory({
      name: newCatName.trim(),
      type
    });
    if (ok) {
      setCategory(newCatName.trim());
      setNewCatName('');
      setShowNewCatInput(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNumber = parseRupiahInput(amountRaw);

    if (amountNumber <= 0) {
      showToast('warning', 'Nominal Tidak Valid', 'Nominal transaksi harus lebih besar dari 0');
      return;
    }

    if (!category) {
      showToast('warning', 'Pilih Kategori', 'Silakan pilih kategori transaksi');
      return;
    }

    if (!account) {
      showToast('warning', 'Pilih Akun', 'Silakan pilih akun / sumber uang');
      return;
    }

    setIsSubmitting(true);

    if (editingTransaction) {
      editTransaction(editingTransaction.transactionId, {
        date,
        type,
        category,
        amount: amountNumber,
        account,
        description: description.trim()
      });
    } else {
      createTransaction({
        date,
        type,
        category,
        amount: amountNumber,
        account,
        description: description.trim()
      });
    }

    setIsSubmitting(false);
    onClose();
  };

  const availableCategories = categories.filter(c => c.type === type);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        id="transaction-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 animate-in zoom-in-95 duration-150 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {editingTransaction ? 'Perbarui rincian transaksi' : 'Catat pemasukan atau pengeluaran baru'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Type Toggle: Pemasukan vs Pengeluaran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Jenis Transaksi
            </label>
            <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
              <button
                type="button"
                id="tx-type-expense-btn"
                onClick={() => setType('expense')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                Pengeluaran
              </button>

              <button
                type="button"
                id="tx-type-income-btn"
                onClick={() => setType('income')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Pemasukan
              </button>
            </div>
          </div>

          {/* Amount / Nominal */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Nominal ({type === 'income' ? 'Pemasukan' : 'Pengeluaran'})
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-base">
                Rp
              </div>
              <input
                type="text"
                id="tx-amount-input"
                value={amountRaw ? formatRupiah(parseRupiahInput(amountRaw)).replace('Rp', '').trim() : ''}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full pl-12 pr-4 py-3 text-lg font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                required
                autoFocus
              />
            </div>

            {/* Quick Nominal Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-[11px] text-slate-400 mr-1">Cepat:</span>
              {[20_000, 50_000, 100_000, 250_000, 500_000, 1_000_000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  +{val >= 1_000_000 ? `${val / 1_000_000}Jt` : `${val / 1_000}Rb`}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Account in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Tanggal
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  id="tx-date-input"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                  required
                />
              </div>
            </div>

            {/* Akun / Sumber Dana */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Akun / Sumber Dana
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Wallet className="w-4 h-4" />
                </div>
                <select
                  id="tx-account-select"
                  value={account}
                  onChange={e => setAccount(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                  required
                >
                  {accounts.map(acc => (
                    <option key={acc.accountId} value={acc.name}>
                      {acc.name} ({formatRupiah(acc.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Kategori */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Kategori
              </label>
              <button
                type="button"
                onClick={() => setShowNewCatInput(!showNewCatInput)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                {showNewCatInput ? 'Batal' : 'Buat Kategori Baru'}
              </button>
            </div>

            {showNewCatInput ? (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder={`Nama kategori ${type === 'income' ? 'pemasukan' : 'pengeluaran'}...`}
                  className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleCreateQuickCategory}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Tag className="w-4 h-4" />
                </div>
                <select
                  id="tx-category-select"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                  required
                >
                  {availableCategories.map(cat => (
                    <option key={cat.categoryId} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Keterangan / Deskripsi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Keterangan / Catatan
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3.5 flex items-start pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <textarea
                id="tx-desc-input"
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Catatan tambahan (opsional, contoh: Beli kopi susu & camilan)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              id="tx-submit-btn"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white text-sm font-bold shadow-md shadow-emerald-500/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              {editingTransaction ? 'Simpan Perubahan' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
