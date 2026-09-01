import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Edit2,
  Calendar,
  CreditCard,
  Folder,
  Download,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import { EmptyState } from '../common/EmptyState';
import { Transaction, TransactionType } from '../../types';

export const TransactionsPage: React.FC = () => {
  const {
    filteredTransactions,
    categories,
    accounts,
    openAddTransaction,
    openEditTransaction,
    deleteTransaction,
    setConfirmModal
  } = useFinance();

  // Search & Filter local states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtered & Sorted Transactions
  const processedTransactions = useMemo(() => {
    let result = [...filteredTransactions];

    // Search query filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        tx =>
          tx.category.toLowerCase().includes(q) ||
          tx.account.toLowerCase().includes(q) ||
          (tx.description && tx.description.toLowerCase().includes(q)) ||
          tx.amount.toString().includes(q)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(tx => tx.type === typeFilter);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(tx => tx.category === selectedCategory);
    }

    // Account filter
    if (selectedAccount !== 'all') {
      result = result.filter(tx => tx.account === selectedAccount);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortOrder === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortOrder === 'highest') return b.amount - a.amount;
      if (sortOrder === 'lowest') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [filteredTransactions, searchTerm, typeFilter, selectedCategory, selectedAccount, sortOrder]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(processedTransactions.length / itemsPerPage));
  const paginatedList = processedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Totals for the current filtered list
  const totalIncome = processedTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = processedTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Export filtered to CSV
  const handleExportCSV = () => {
    if (processedTransactions.length === 0) return;

    const headers = ['ID', 'Tanggal', 'Jenis', 'Kategori', 'Akun', 'Jumlah', 'Catatan'];
    const rows = processedTransactions.map(t => [
      t.transactionId,
      t.date,
      t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      `"${t.category}"`,
      `"${t.account}"`,
      t.amount,
      `"${(t.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transaksi_nuqudy_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (tx: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Transaksi',
      message: `Apakah Anda yakin ingin menghapus transaksi "${tx.category}" senilai ${formatRupiah(tx.amount)}?`,
      confirmLabel: 'Ya, Hapus',
      variant: 'danger',
      onConfirm: async () => {
        await deleteTransaction(tx.transactionId);
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* 1. Top Summary Banner for Active Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Transaksi</p>
          <h3 className="text-xl font-black text-slate-800 dark:text-white mt-1">
            {processedTransactions.length} <span className="text-xs font-normal text-slate-400">item</span>
          </h3>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Total Pemasukan</p>
          <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            +{formatRupiah(totalIncome)}
          </h3>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Total Pengeluaran</p>
          <h3 className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
            -{formatRupiah(totalExpense)}
          </h3>
        </div>
      </div>

      {/* 2. Search, Filter & Action Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari transaksi, kategori, akun, atau catatan..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Reset
              </button>
            )}
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            <button
              onClick={() => { setTypeFilter('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => { setTypeFilter('income'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'income'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              Pemasukan
            </button>
            <button
              onClick={() => { setTypeFilter('expense'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-rose-600'
              }`}
            >
              Pengeluaran
            </button>
          </div>

          {/* Actions: Export CSV & Tambah Transaksi */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              disabled={processedTransactions.length === 0}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={() => openAddTransaction('expense')}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white shadow-xs shadow-emerald-500/25 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ Transaksi</span>
            </button>
          </div>
        </div>

        {/* Second Row: Specific Category, Account & Sort dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="font-semibold">Filter:</span>
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Semua Kategori</option>
            {categories.map(cat => (
              <option key={cat.categoryId} value={cat.name}>
                {cat.name} ({cat.type === 'income' ? 'Masuk' : 'Keluar'})
              </option>
            ))}
          </select>

          {/* Account Dropdown */}
          <select
            value={selectedAccount}
            onChange={e => { setSelectedAccount(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Semua Akun</option>
            {accounts.map(acc => (
              <option key={acc.accountId} value={acc.name}>
                {acc.name}
              </option>
            ))}
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as any)}
            className="ml-auto px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="highest">Nominal Terbesar</option>
            <option value="lowest">Nominal Terkecil</option>
          </select>
        </div>
      </div>

      {/* 3. Transactions Table (Desktop) & Card List (Mobile) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {paginatedList.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Tidak ada transaksi yang cocok"
              description="Coba ubah kata kunci pencarian atau sesuaikan filter periode waktu Anda."
              actionLabel="Tambah Transaksi Baru"
              onAction={() => openAddTransaction('expense')}
            />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-6">Tanggal</th>
                    <th className="py-3.5 px-6">Kategori</th>
                    <th className="py-3.5 px-6">Akun</th>
                    <th className="py-3.5 px-6">Catatan</th>
                    <th className="py-3.5 px-6 text-right">Jumlah</th>
                    <th className="py-3.5 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                  {paginatedList.map(tx => {
                    const isIncome = tx.type === 'income';

                    return (
                      <tr
                        key={tx.transactionId}
                        onClick={() => openEditTransaction(tx)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                          {formatDateIndo(tx.date)}
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isIncome
                                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-100">
                              {tx.category}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold">
                            {tx.account}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                          {tx.description || '-'}
                        </td>

                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <span
                            className={`font-mono font-bold text-sm ${
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditTransaction(tx);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(tx, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedList.map(tx => {
                const isIncome = tx.type === 'income';

                return (
                  <div
                    key={tx.transactionId}
                    onClick={() => openEditTransaction(tx)}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400'
                        }`}
                      >
                        {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {tx.category}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatDateIndo(tx.date)}
                          </span>
                          <span className="text-[10px] text-slate-400">&bull;</span>
                          <span className="text-[10px] text-slate-500 font-semibold truncate">
                            {tx.account}
                          </span>
                        </div>
                        {tx.description && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {tx.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <p
                        className={`font-mono font-bold text-xs ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
                      </p>

                      <div className="flex items-center justify-end gap-1 mt-1">
                        <button
                          onClick={(e) => handleDelete(tx, e)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div>
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, processedTransactions.length)} dari {processedTransactions.length} transaksi
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
