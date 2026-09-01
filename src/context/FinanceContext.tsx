/**
 * Finance Context and Provider for NUQUDY
 * Manages transactions, categories, accounts, period filters, and UI notifications.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Transaction,
  Category,
  AccountSummary,
  PeriodFilter,
  ActiveTab,
  ToastMessage,
  DashboardSummary,
  TransactionType,
  AccountType
} from '../types';
import { storage } from '../services/storageService';
import { isDateInPeriod } from '../utils/formatters';
import { useAuth } from './AuthContext';

interface ConfirmModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
}

interface FinanceContextType {
  // State
  transactions: Transaction[];
  categories: Category[];
  accounts: AccountSummary[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  period: PeriodFilter;
  setPeriod: (p: PeriodFilter) => void;
  customStartDate: string;
  setCustomStartDate: (d: string) => void;
  customEndDate: string;
  setCustomEndDate: (d: string) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  toggleTheme: () => void;
  isDark: boolean;
  toggleDarkMode: () => void;

  // Computed
  summary: DashboardSummary;
  filteredTransactions: Transaction[];

  // Modal handlers
  isTransactionModalOpen: boolean;
  editingTransaction: Transaction | null;
  transactionModalInitialType: TransactionType;
  openAddTransaction: (type?: TransactionType) => void;
  openEditTransaction: (tx: Transaction) => void;
  closeTransactionModal: () => void;

  // Confirmation Modal
  confirmModal: ConfirmModalConfig;
  setConfirmModal: React.Dispatch<React.SetStateAction<ConfirmModalConfig>>;

  // CRUD Operations
  createTransaction: (data: {
    date: string;
    type: TransactionType;
    category: string;
    amount: number;
    account: string;
    description: string;
  }) => boolean;
  editTransaction: (id: string, data: Partial<Transaction>) => boolean;
  removeTransaction: (id: string) => boolean;
  addTransaction: (data: {
    date: string;
    type: TransactionType;
    category: string;
    amount: number;
    account: string;
    description: string;
  }) => boolean;
  updateTransaction: (id: string, data: Partial<Transaction>) => boolean;
  deleteTransaction: (id: string) => boolean;

  createCategory: (data: { name: string; type: TransactionType; icon?: string; color?: string; description?: string }) => boolean;
  editCategory: (id: string, data: Partial<Category>) => boolean;
  removeCategory: (id: string) => boolean;
  addCategory: (data: { name: string; type: TransactionType; icon?: string; color?: string; description?: string }) => boolean;
  updateCategory: (id: string, data: Partial<Category>) => boolean;
  deleteCategory: (id: string) => boolean;

  createAccount: (data: { name: string; type: AccountType; initialBalance: number; color?: string; accountNumber?: string; description?: string }) => boolean;
  editAccount: (id: string, data: { name?: string; type?: AccountType; initialBalance?: number; color?: string; accountNumber?: string; description?: string }) => boolean;
  removeAccount: (id: string) => boolean;
  addAccount: (data: { name: string; type: AccountType; initialBalance: number; color?: string; accountNumber?: string; description?: string }) => boolean;
  updateAccount: (id: string, data: { name?: string; type?: AccountType; initialBalance?: number; color?: string; accountNumber?: string; description?: string }) => boolean;
  deleteAccount: (id: string) => boolean;

  // Notifications
  toasts: ToastMessage[];
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  addToast: (title: string, type?: 'success' | 'error' | 'info' | 'warning', message?: string) => void;
  dismissToast: (id: string) => void;
  removeToast: (id: string) => void;

  // Sync / Cloud
  gasUrl: string;
  setGasUrl: (url: string) => void;
  isSyncing: boolean;
  syncWithBackend: () => Promise<void>;

  // Data helpers
  reloadAllData: () => void;
  refreshAllData: () => void;
  resetToDemo: () => void;
  resetToDemoData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Navigation & Filters
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [period, setPeriod] = useState<PeriodFilter>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Ya, Hapus',
    cancelLabel: 'Batal',
    variant: 'danger',
    onConfirm: () => {}
  });

  // Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);

  // Theme
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  // Transaction Modal State
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionModalInitialType, setTransactionModalInitialType] = useState<TransactionType>('expense');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Theme Initializer
  useEffect(() => {
    const settings = storage.getSettings();
    const savedTheme = settings.theme || 'light';
    setThemeState(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    storage.saveSettings({ theme: newTheme });
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Load data function
  const reloadAllData = useCallback(() => {
    const userId = user?.userId;
    setTransactions(storage.getTransactions(userId));
    setCategories(storage.getCategories(userId));
    setAccounts(storage.getAccounts(userId));
  }, [user]);

  useEffect(() => {
    reloadAllData();
  }, [reloadAllData]);

  // Filtered transactions based on active period
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => isDateInPeriod(tx.date, period, customStartDate, customEndDate));
  }, [transactions, period, customStartDate, customEndDate]);

  // Dashboard summary computation
  const summary: DashboardSummary = useMemo(() => {
    const totalBalance = accounts.reduce((acc, curr) => acc + curr.currentBalance, 0);

    let periodIncome = 0;
    let periodExpense = 0;

    filteredTransactions.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') periodIncome += amt;
      if (tx.type === 'expense') periodExpense += amt;
    });

    return {
      totalBalance,
      periodIncome,
      periodExpense,
      periodNet: periodIncome - periodExpense,
      periodTransactionCount: filteredTransactions.length
    };
  }, [accounts, filteredTransactions]);

  // Transaction Modal Handlers
  const openAddTransaction = (type: TransactionType = 'expense') => {
    setEditingTransaction(null);
    setTransactionModalInitialType(type);
    setIsTransactionModalOpen(true);
  };

  const openEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTransactionModalInitialType(tx.type);
    setIsTransactionModalOpen(true);
  };

  const closeTransactionModal = () => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  };

  // Transaction CRUD
  const createTransaction = (data: {
    date: string;
    type: TransactionType;
    category: string;
    amount: number;
    account: string;
    description: string;
  }): boolean => {
    try {
      const newTx = storage.addTransaction({
        userId: user?.userId || 'USR-ADMIN01',
        ...data
      });
      reloadAllData();
      showToast('success', 'Transaksi Berhasil Disimpan', `${data.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} telah dicatat.`);

      // Jika URL Google Apps Script terkonfigurasi, sinkronkan ke Google Sheets (action: 'ADD')
      const gasUrl = storage.getSettings().gasWebAppUrl;
      if (gasUrl) {
        storage.addGasData({
          id: newTx.transactionId,
          transactionId: newTx.transactionId,
          userId: newTx.userId,
          date: newTx.date,
          type: newTx.type,
          category: newTx.category,
          amount: newTx.amount,
          account: newTx.account,
          description: newTx.description
        }).then(res => {
          if (res.success) {
            // Auto re-fetch data dari Sheets
            storage.fetchGasData().then(() => reloadAllData());
          }
        }).catch(err => {
          console.warn('Background GAS sync error:', err);
        });
      }

      return true;
    } catch (e) {
      showToast('error', 'Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan transaksi.');
      return false;
    }
  };

  const editTransaction = (id: string, data: Partial<Transaction>): boolean => {
    try {
      const success = storage.updateTransaction(id, data);
      if (success) {
        reloadAllData();
        showToast('success', 'Transaksi Diperbarui', 'Perubahan transaksi berhasil disimpan.');
        return true;
      }
      showToast('error', 'Gagal', 'Transaksi tidak ditemukan.');
      return false;
    } catch (e) {
      showToast('error', 'Gagal', 'Terjadi kesalahan sistem.');
      return false;
    }
  };

  const removeTransaction = (id: string): boolean => {
    try {
      const success = storage.deleteTransaction(id);
      if (success) {
        reloadAllData();
        showToast('success', 'Transaksi Dihapus', 'Data transaksi telah dihapus dari database.');

        // Jika URL Google Apps Script terkonfigurasi, hapus dari Google Sheets (action: 'DELETE')
        const gasUrl = storage.getSettings().gasWebAppUrl;
        if (gasUrl) {
          storage.deleteGasData(id).then(res => {
            if (res.success) {
              // Auto re-fetch data dari Sheets
              storage.fetchGasData().then(() => reloadAllData());
            }
          }).catch(err => {
            console.warn('Background GAS delete error:', err);
          });
        }

        return true;
      }
      return false;
    } catch (e) {
      showToast('error', 'Gagal', 'Tidak dapat menghapus transaksi.');
      return false;
    }
  };

  // Category CRUD
  const createCategory = (data: { name: string; type: TransactionType; icon?: string; color?: string }): boolean => {
    try {
      storage.addCategory({
        userId: user?.userId || 'USR-ADMIN01',
        ...data
      });
      reloadAllData();
      showToast('success', 'Kategori Ditambahkan', `Kategori "${data.name}" siap digunakan.`);
      return true;
    } catch (e) {
      showToast('error', 'Gagal', 'Tidak dapat menambahkan kategori.');
      return false;
    }
  };

  const editCategory = (id: string, data: Partial<Category>): boolean => {
    try {
      const ok = storage.updateCategory(id, data);
      if (ok) {
        reloadAllData();
        showToast('success', 'Kategori Diperbarui', 'Data kategori berhasil diubah.');
        return true;
      }
      return false;
    } catch (e) {
      showToast('error', 'Gagal', 'Tidak dapat memperbarui kategori.');
      return false;
    }
  };

  const removeCategory = (id: string): boolean => {
    try {
      const ok = storage.deleteCategory(id);
      if (ok) {
        reloadAllData();
        showToast('success', 'Kategori Dihapus', 'Kategori telah dihapus.');
        return true;
      }
      return false;
    } catch (e) {
      showToast('error', 'Gagal', 'Tidak dapat menghapus kategori.');
      return false;
    }
  };

  // Account CRUD
  const createAccount = (data: { name: string; type: AccountType; initialBalance: number; color?: string }): boolean => {
    try {
      storage.addAccount({
        userId: user?.userId || 'USR-ADMIN01',
        ...data
      });
      reloadAllData();
      showToast('success', 'Akun Ditambahkan', `Akun "${data.name}" berhasil dibuat.`);
      return true;
    } catch (e) {
      showToast('error', 'Gagal', 'Tidak dapat membuat akun.');
      return false;
    }
  };

  const editAccount = (id: string, data: { name?: string; type?: AccountType; initialBalance?: number; color?: string }): boolean => {
    try {
      const ok = storage.updateAccount(id, data);
      if (ok) {
        reloadAllData();
        showToast('success', 'Akun Diperbarui', 'Informasi akun berhasil disimpan.');
        return true;
      }
      return false;
    } catch (e) {
      showToast('error', 'Gagal', 'Tidak dapat memperbarui akun.');
      return false;
    }
  };

  const removeAccount = (id: string): boolean => {
    try {
      const ok = storage.deleteAccount(id);
      if (ok) {
        reloadAllData();
        showToast('success', 'Akun Dihapus', 'Akun keuangan telah dihapus.');
        return true;
      }
      return false;
    } catch (e) {
      showToast('error', 'Gagal', 'Tidak dapat menghapus akun.');
      return false;
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const gasUrl = storage.getSettings().gasWebAppUrl || '';

  const syncWithBackend = async () => {
    const currentGasUrl = storage.getSettings().gasWebAppUrl;
    if (!currentGasUrl) {
      setActiveTab('gas');
      showToast('info', 'Hubungkan Google Sheets', 'Silakan simpan URL Web App Google Apps Script untuk sinkronisasi database.');
      return;
    }

    setIsSyncing(true);
    try {
      const res = await storage.fetchGasData();
      if (res.success) {
        reloadAllData();
        showToast('success', 'Sinkronisasi Berhasil', `Data (${res.data?.length || 0} transaksi) berhasil dimuat dari Google Sheets.`);
      } else {
        showToast('error', 'Sinkronisasi Gagal', res.message || 'Gagal tersambung ke Google Sheets.');
      }
    } catch (e: any) {
      showToast('error', 'Error Sinkronisasi', e?.message || 'Tidak dapat terhubung ke Google Apps Script.');
    } finally {
      setIsSyncing(false);
    }
  };

  const resetToDemo = () => {
    storage.initDatabase(true);
    reloadAllData();
    showToast('info', 'Database Direset', 'Data demo awal Nuqudy telah dimuat kembali.');
  };

  const addToast = useCallback((title: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', message?: string) => {
    showToast(type, title, message);
  }, [showToast]);

  const setGasUrl = useCallback((url: string) => {
    storage.saveSettings({ gasWebAppUrl: url });
    reloadAllData();
  }, [reloadAllData]);

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        categories,
        accounts,
        activeTab,
        setActiveTab,
        period,
        setPeriod,
        customStartDate,
        setCustomStartDate,
        customEndDate,
        setCustomEndDate,
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === 'dark',
        toggleDarkMode: toggleTheme,
        summary,
        filteredTransactions,
        isTransactionModalOpen,
        editingTransaction,
        transactionModalInitialType,
        openAddTransaction,
        openEditTransaction,
        closeTransactionModal,
        confirmModal,
        setConfirmModal,
        createTransaction,
        editTransaction,
        removeTransaction,
        addTransaction: createTransaction,
        updateTransaction: editTransaction,
        deleteTransaction: removeTransaction,
        createCategory,
        editCategory,
        removeCategory,
        addCategory: createCategory,
        updateCategory: editCategory,
        deleteCategory: removeCategory,
        createAccount,
        editAccount,
        removeAccount,
        addAccount: createAccount,
        updateAccount: editAccount,
        deleteAccount: removeAccount,
        toasts,
        showToast,
        addToast,
        dismissToast,
        removeToast: dismissToast,
        gasUrl,
        setGasUrl,
        isSyncing,
        syncWithBackend,
        reloadAllData,
        refreshAllData: reloadAllData,
        resetToDemo,
        resetToDemoData: resetToDemo
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
