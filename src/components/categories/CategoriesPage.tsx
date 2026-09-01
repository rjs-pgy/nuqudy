import React, { useState } from 'react';
import {
  Plus,
  FolderTree,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  Tag,
  Check,
  X,
  Palette
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Category, TransactionType } from '../../types';
import { formatRupiah } from '../../utils/formatters';

const PRESET_COLORS = [
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444',
  '#f97316', '#f59e0b', '#84cc16', '#64748b'
];

export const CategoriesPage: React.FC = () => {
  const {
    categories,
    transactions,
    addCategory,
    updateCategory,
    deleteCategory,
    setConfirmModal
  } = useFinance();

  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [color, setColor] = useState('#10b981');
  const [icon, setIcon] = useState('Tag');
  const [description, setDescription] = useState('');

  const openAddModal = (catType: TransactionType) => {
    setEditingCategory(null);
    setName('');
    setType(catType);
    setColor(catType === 'income' ? '#10b981' : '#f43f5e');
    setIcon('Tag');
    setDescription('');
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color || '#10b981');
    setIcon(cat.icon || 'Tag');
    setDescription(cat.description || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCategory) {
      await updateCategory({
        ...editingCategory,
        name: name.trim(),
        type,
        color,
        icon,
        description: description.trim()
      });
    } else {
      await addCategory({
        categoryId: `cat_${Date.now()}`,
        name: name.trim(),
        type,
        color,
        icon,
        description: description.trim()
      });
    }
    setModalOpen(false);
  };

  const handleDelete = (cat: Category) => {
    const txCount = transactions.filter(t => t.category === cat.name).length;
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Kategori',
      message: `Apakah Anda yakin ingin menghapus kategori "${cat.name}"? ${
        txCount > 0 ? `Perhatian: Ada ${txCount} transaksi yang menggunakan kategori ini.` : ''
      }`,
      confirmLabel: 'Ya, Hapus',
      variant: 'danger',
      onConfirm: async () => {
        await deleteCategory(cat.categoryId);
      }
    });
  };

  const filteredCategories = categories.filter(c => c.type === activeTab);

  // Calculate usage and totals per category
  const categoryStats = React.useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {};
    transactions.forEach(t => {
      if (!stats[t.category]) {
        stats[t.category] = { count: 0, total: 0 };
      }
      stats[t.category].count += 1;
      stats[t.category].total += Number(t.amount);
    });
    return stats;
  }, [transactions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Pengelompokan Kategori
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kelola kategori untuk memudahkan analisis dan pelaporan anggaran.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('expense')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              Pengeluaran ({categories.filter(c => c.type === 'expense').length})
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'income'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Pemasukan ({categories.filter(c => c.type === 'income').length})
            </button>
          </div>

          {/* Add Category Button */}
          <button
            onClick={() => openAddModal(activeTab)}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Tambah Kategori
          </button>
        </div>
      </div>

      {/* 2. Category Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCategories.map(cat => {
          const stat = categoryStats[cat.name] || { count: 0, total: 0 };

          return (
            <div
              key={cat.categoryId}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs font-bold shrink-0"
                      style={{ backgroundColor: cat.color || (cat.type === 'income' ? '#10b981' : '#f43f5e') }}
                    >
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {cat.name}
                      </h4>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {cat.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {cat.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {stat.count} transaksi
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {formatRupiah(stat.total)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Category */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Jenis Kategori
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      type === 'expense'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      type === 'income'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Pemasukan
                  </button>
                </div>
              </div>

              {/* Category Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Contoh: Belanja Bulanan, Gaji, Makan & Minum"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Warna Label
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

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Keterangan (Opsional)
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Catatan tambahan untuk kategori ini..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
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
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
