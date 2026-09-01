/**
 * Storage and Data Synchronization Service for NUQUDY
 * Seamlessly manages local persistence, demo data, and Google Apps Script Web App sync.
 * Persists Users & Passwords, Transactions, Categories, Accounts, and Settings.
 */

import {
  User,
  Transaction,
  Category,
  Account,
  AccountSummary,
  AppSettings,
  ApiResponse,
  PeriodFilter
} from '../types';
import { generateId, formatDateInput, isDateInPeriod } from '../utils/formatters';

export const STORAGE_KEYS = {
  USERS: 'nuqudy_users_v1',
  CURRENT_USER: 'nuqudy_active_session_v1',
  TRANSACTIONS: 'nuqudy_transactions_v1',
  CATEGORIES: 'nuqudy_categories_v1',
  ACCOUNTS: 'nuqudy_accounts_v1',
  SETTINGS: 'nuqudy_settings_v1',
  DATABASE_INITIALIZED: 'nuqudy_db_init_v1'
};

// Default Demo User with credentials
export const DEFAULT_DEMO_USER: User = {
  userId: 'USR-ADMIN01',
  username: 'admin',
  password: 'admin123',
  name: 'Pengguna Nuqudy',
  email: 'admin@nuqudy.app',
  currency: 'Rp',
  role: 'admin',
  status: 'active',
  createdAt: new Date().toISOString()
};

// Default Demo Accounts
const DEFAULT_ACCOUNTS: Account[] = [
  {
    accountId: 'ACC-CASH',
    userId: 'USR-ADMIN01',
    name: 'Dompet Tunai',
    type: 'cash',
    initialBalance: 750000,
    color: '#0d9488',
    createdAt: new Date().toISOString()
  },
  {
    accountId: 'ACC-BCA',
    userId: 'USR-ADMIN01',
    name: 'Bank BCA',
    type: 'bank',
    initialBalance: 6500000,
    color: '#0284c7',
    createdAt: new Date().toISOString()
  },
  {
    accountId: 'ACC-EWALLET',
    userId: 'USR-ADMIN01',
    name: 'GoPay / OVO',
    type: 'ewallet',
    initialBalance: 450000,
    color: '#8b5cf6',
    createdAt: new Date().toISOString()
  },
  {
    accountId: 'ACC-SAVINGS',
    userId: 'USR-ADMIN01',
    name: 'Tabungan Darurat',
    type: 'savings',
    initialBalance: 15000000,
    color: '#10b981',
    createdAt: new Date().toISOString()
  }
];

// Default Categories
const DEFAULT_CATEGORIES: Category[] = [
  // Income
  { categoryId: 'CAT-IN-1', userId: 'USR-ADMIN01', name: 'Gaji Pokok', type: 'income', icon: 'Wallet', color: '#10b981', createdAt: new Date().toISOString() },
  { categoryId: 'CAT-IN-2', userId: 'USR-ADMIN01', name: 'Bonus & THR', type: 'income', icon: 'Gift', color: '#06b6d4', createdAt: new Date().toISOString() },
  { categoryId: 'CAT-IN-3', userId: 'USR-ADMIN01', name: 'Penjualan Bisnis', type: 'income', icon: 'Store', color: '#3b82f6', createdAt: new Date().toISOString() },
  { categoryId: 'CAT-IN-4', userId: 'USR-ADMIN01', name: 'Investasi & Dividen', type: 'income', icon: 'TrendingUp', color: '#8b5cf6', createdAt: new Date().toISOString() },
  { categoryId: 'CAT-IN-5', userId: 'USR-ADMIN01', name: 'Pendapatan Lain', type: 'income', icon: 'Coins', color: '#6366f1', createdAt: new Date().toISOString() },

  // Expense
  { categoryId: 'CAT-EX-1', userId: 'USR-ADMIN01', name: 'Makanan & Minuman', type: 'expense', icon: 'Utensils', color: '#f59e0b', createdAt: new Date().toISOString() },
  { categoryId: 'CAT-EX-2', userId: 'USR-ADMIN01', name: 'Transportasi & Bensin', type: 'expense', icon: 'Car', color: '#3b82f6', createdAt: new Date().toISOString() },
  { categoryId: 'CAT-EX-3', userId: 'USR-ADMIN01', name: 'Belanja Kebutuhan', type: 'expense', icon: 'ShoppingCart', color: '#ec4899', createdAt: new Date().toISOString() },
  { categoryId: 'CAT-EX-4', userId: 'USR-ADMIN01', name: 'Tagihan & Listrik', type: 'expense', icon: 'Receipt', color: '#ef4444', createdAt: new Date().toISOString() },
  { categoryId: 'CAT-EX-5', userId: 'USR-ADMIN01', name: 'Pendidikan & Kursus', type: 'expense', icon: 'GraduationCap', color: '#6366f1', createdAt: new Date().toISOString() },
  { categoryId: 'CAT-EX-6', userId: 'USR-ADMIN01', name: 'Kesehatan & Obat', type: 'expense', icon: 'HeartPulse', color: '#14b8a6', createdAt: new Date().toISOString() },
  { categoryId: 'CAT-EX-7', userId: 'USR-ADMIN01', name: 'Hiburan & Liburan', type: 'expense', icon: 'Film', color: '#a855f7', createdAt: new Date().toISOString() },
  { categoryId: 'CAT-EX-8', userId: 'USR-ADMIN01', name: 'Sedekah & Donasi', type: 'expense', icon: 'Heart', color: '#10b981', createdAt: new Date().toISOString() }
];

function generateInitialTransactions(): Transaction[] {
  const today = new Date();
  const d = (offsetDays: number) => {
    const target = new Date(today);
    target.setDate(today.getDate() - offsetDays);
    return formatDateInput(target);
  };

  return [
    {
      transactionId: 'TX-DEMO-001',
      userId: 'USR-ADMIN01',
      date: d(0),
      type: 'expense',
      category: 'Makanan & Minuman',
      amount: 45000,
      account: 'Dompet Tunai',
      description: 'Makan siang nasi padang & es teh',
      createdAt: new Date().toISOString()
    },
    {
      transactionId: 'TX-DEMO-002',
      userId: 'USR-ADMIN01',
      date: d(0),
      type: 'expense',
      category: 'Transportasi & Bensin',
      amount: 28000,
      account: 'GoPay / OVO',
      description: 'Ojek online ke kantor',
      createdAt: new Date().toISOString()
    },
    {
      transactionId: 'TX-DEMO-003',
      userId: 'USR-ADMIN01',
      date: d(1),
      type: 'expense',
      category: 'Belanja Kebutuhan',
      amount: 245000,
      account: 'Bank BCA',
      description: 'Belanja mingguan supermarket',
      createdAt: new Date().toISOString()
    },
    {
      transactionId: 'TX-DEMO-004',
      userId: 'USR-ADMIN01',
      date: d(3),
      type: 'income',
      category: 'Gaji Pokok',
      amount: 8500000,
      account: 'Bank BCA',
      description: 'Gaji bulanan',
      createdAt: new Date().toISOString()
    },
    {
      transactionId: 'TX-DEMO-005',
      userId: 'USR-ADMIN01',
      date: d(4),
      type: 'expense',
      category: 'Tagihan & Listrik',
      amount: 350000,
      account: 'Bank BCA',
      description: 'Token listrik PLN & Wi-Fi internet',
      createdAt: new Date().toISOString()
    },
    {
      transactionId: 'TX-DEMO-006',
      userId: 'USR-ADMIN01',
      date: d(6),
      type: 'income',
      category: 'Bonus & THR',
      amount: 1500000,
      account: 'Bank BCA',
      description: 'Insentif project freelance',
      createdAt: new Date().toISOString()
    },
    {
      transactionId: 'TX-DEMO-007',
      userId: 'USR-ADMIN01',
      date: d(8),
      type: 'expense',
      category: 'Kesehatan & Obat',
      amount: 120000,
      account: 'GoPay / OVO',
      description: 'Vitamin dan suplemen harian',
      createdAt: new Date().toISOString()
    }
  ];
}

class StorageService {
  private isInitialized = false;

  constructor() {
    this.initDatabase();
  }

  /**
   * Initialize local database with demo data if empty
   */
  public initDatabase(forceReset = false): void {
    if (this.isInitialized && !forceReset) return;

    try {
      const hasInit = localStorage.getItem(STORAGE_KEYS.DATABASE_INITIALIZED);
      if (!hasInit || forceReset) {
        // Save initial user list
        const existingUsersRaw = localStorage.getItem(STORAGE_KEYS.USERS);
        if (!existingUsersRaw || forceReset) {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([DEFAULT_DEMO_USER]));
        }

        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(generateInitialTransactions()));
        
        const defaultSettings: AppSettings = {
          theme: 'light',
          currency: 'Rp',
          syncMode: 'local',
          lastSyncedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
        localStorage.setItem(STORAGE_KEYS.DATABASE_INITIALIZED, 'true');
      }
      this.isInitialized = true;
    } catch (e) {
      console.error('Failed to initialize local database', e);
    }
  }

  // --- USERS MANAGEMENT ---
  public getUsers(): User[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USERS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [DEFAULT_DEMO_USER];
  }

  public saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  public addUser(user: Partial<User> & { username: string }): User {
    const users = this.getUsers();
    const cleanUsername = user.username.trim().toLowerCase();
    const newUser: User = {
      userId: user.userId || generateId('USR'),
      username: cleanUsername,
      password: user.password || 'admin123',
      name: user.name?.trim() || cleanUsername,
      email: user.email ? user.email.trim() : '',
      currency: user.currency || 'Rp',
      role: user.role || 'member',
      status: user.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  public updateUser(userId: string, data: Partial<User>): boolean {
    const users = this.getUsers();
    const index = users.findIndex(u => u.userId === userId || u.username === data.username);
    if (index === -1) return false;
    users[index] = {
      ...users[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.saveUsers(users);
    return true;
  }

  public deleteUser(userId: string): boolean {
    const users = this.getUsers();
    const filtered = users.filter(u => u.userId !== userId);
    if (filtered.length === users.length) return false;
    this.saveUsers(filtered);
    return true;
  }

  // --- SETTINGS ---
  public getSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { theme: 'light', currency: 'Rp', syncMode: 'local' };
  }

  public saveSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }

  // --- TRANSACTIONS ---
  public getTransactions(userId?: string): Transaction[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const list: Transaction[] = raw ? JSON.parse(raw) : [];
      const filtered = userId ? list.filter(t => t.userId === userId) : list;
      return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (e) {
      return [];
    }
  }

  public addTransaction(data: Omit<Transaction, 'transactionId' | 'createdAt'>): Transaction {
    const list = this.getTransactions();
    const newTx: Transaction = {
      ...data,
      transactionId: generateId('TX'),
      createdAt: new Date().toISOString()
    };
    list.unshift(newTx);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));
    return newTx;
  }

  public updateTransaction(transactionId: string, data: Partial<Transaction>): boolean {
    const list = this.getTransactions();
    const index = list.findIndex(t => t.transactionId === transactionId);
    if (index === -1) return false;
    list[index] = { ...list[index], ...data };
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));
    return true;
  }

  public deleteTransaction(transactionId: string): boolean {
    const list = this.getTransactions();
    const filtered = list.filter(t => t.transactionId !== transactionId);
    if (filtered.length === list.length) return false;
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
    return true;
  }

  // --- CATEGORIES ---
  public getCategories(userId?: string): Category[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      const list: Category[] = raw ? JSON.parse(raw) : DEFAULT_CATEGORIES;
      return userId ? list.filter(c => c.userId === userId) : list;
    } catch (e) {
      return DEFAULT_CATEGORIES;
    }
  }

  public addCategory(data: Omit<Category, 'categoryId' | 'createdAt'>): Category {
    const list = this.getCategories();
    const newCat: Category = {
      ...data,
      categoryId: generateId('CAT'),
      createdAt: new Date().toISOString()
    };
    list.push(newCat);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(list));
    return newCat;
  }

  public updateCategory(categoryId: string, data: Partial<Category>): boolean {
    const list = this.getCategories();
    const index = list.findIndex(c => c.categoryId === categoryId);
    if (index === -1) return false;
    list[index] = { ...list[index], ...data };
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(list));
    return true;
  }

  public deleteCategory(categoryId: string): boolean {
    const list = this.getCategories();
    const filtered = list.filter(c => c.categoryId !== categoryId);
    if (filtered.length === list.length) return false;
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filtered));
    return true;
  }

  // --- ACCOUNTS ---
  public getAccounts(userId?: string): AccountSummary[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      const accounts: Account[] = raw ? JSON.parse(raw) : DEFAULT_ACCOUNTS;
      const transactions = this.getTransactions(userId);

      return accounts.map(acc => {
        let totalIncome = 0;
        let totalExpense = 0;
        let count = 0;

        transactions.forEach(tx => {
          if (tx.account === acc.name || tx.account === acc.accountId) {
            count++;
            if (tx.type === 'income') totalIncome += Number(tx.amount) || 0;
            if (tx.type === 'expense') totalExpense += Number(tx.amount) || 0;
          }
        });

        const initial = Number(acc.initialBalance) || 0;
        const currentBalance = initial + totalIncome - totalExpense;

        return {
          ...acc,
          initialBalance: initial,
          currentBalance,
          totalIncome,
          totalExpense,
          transactionCount: count
        };
      });
    } catch (e) {
      return [];
    }
  }

  public addAccount(data: Omit<Account, 'accountId' | 'createdAt'>): Account {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    const accounts: Account[] = raw ? JSON.parse(raw) : [];
    const newAcc: Account = {
      ...data,
      accountId: generateId('ACC'),
      createdAt: new Date().toISOString()
    };
    accounts.push(newAcc);
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    return newAcc;
  }

  public updateAccount(accountId: string, data: Partial<Account>): boolean {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    const accounts: Account[] = raw ? JSON.parse(raw) : [];
    const index = accounts.findIndex(a => a.accountId === accountId);
    if (index === -1) return false;
    accounts[index] = { ...accounts[index], ...data };
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    return true;
  }

  public deleteAccount(accountId: string): boolean {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    const accounts: Account[] = raw ? JSON.parse(raw) : [];
    const filtered = accounts.filter(a => a.accountId !== accountId);
    if (filtered.length === accounts.length) return false;
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(filtered));
    return true;
  }

  // --- GAS CLOUD REAL-TIME API (Google Sheets Backend Multi-Sheet) ---

  /**
   * Fetch data from Google Apps Script Web App (via GET / doGet)
   * Supports both full database bundle and transaction list.
   */
  public async fetchGasData(customUrl?: string): Promise<ApiResponse<any>> {
    const url = customUrl || this.getSettings().gasWebAppUrl;
    if (!url) {
      return { success: false, message: 'URL Google Apps Script belum dikonfigurasi.' };
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });
      const json = await response.json();
      
      if (json && json.success) {
        // Multi-Sheet Bundle response { users, transactions, categories, accounts, settings }
        if (json.data && typeof json.data === 'object' && !Array.isArray(json.data)) {
          if (Array.isArray(json.data.transactions)) {
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(json.data.transactions));
          }
          if (Array.isArray(json.data.users) && json.data.users.length > 0) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(json.data.users));
          }
          if (Array.isArray(json.data.categories) && json.data.categories.length > 0) {
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(json.data.categories));
          }
          if (Array.isArray(json.data.accounts) && json.data.accounts.length > 0) {
            localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(json.data.accounts));
          }
          this.saveSettings({ lastSyncedAt: new Date().toISOString() });
          return { success: true, message: 'Seluruh database berhasil disinkronkan dari Google Sheets', data: json.data };
        }

        // Backward compatibility: array of transactions
        if (Array.isArray(json.data)) {
          if (json.data.length > 0) {
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(json.data));
          }
          this.saveSettings({ lastSyncedAt: new Date().toISOString() });
          return { success: true, message: 'Transaksi berhasil disinkronkan dari Google Sheets', data: json.data };
        }
      }
      return { success: false, message: json.message || 'Format data dari Google Sheets tidak valid' };
    } catch (err: any) {
      return { success: false, message: 'Gagal menghubungi Google Apps Script: ' + err.message };
    }
  }

  /**
   * Sync/Push Entire Local Database to Google Sheets in 1 Call (Users, Transactions, Categories, Accounts)
   */
  public async syncAllToGas(customUrl?: string): Promise<ApiResponse> {
    const url = customUrl || this.getSettings().gasWebAppUrl;
    if (!url) {
      return { success: false, message: 'URL Google Apps Script belum dikonfigurasi.' };
    }

    try {
      const payload = {
        action: 'SYNC_ALL',
        users: this.getUsers(),
        transactions: this.getTransactions(),
        categories: this.getCategories(),
        accounts: this.getAccounts(),
        settings: this.getSettings()
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const json = await response.json();
      if (json.success) {
        this.saveSettings({ lastSyncedAt: new Date().toISOString() });
      }
      return json;
    } catch (err: any) {
      return { success: false, message: 'Gagal sinkronisasi ke Google Sheets: ' + err.message };
    }
  }

  /**
   * Update user profile to Google Sheets
   */
  public async updateUserGas(payload: { userId?: string; username?: string; name?: string; email?: string; currency?: string }, customUrl?: string): Promise<ApiResponse> {
    const url = customUrl || this.getSettings().gasWebAppUrl;
    if (!url) return { success: false, message: 'URL GAS belum dikonfigurasi' };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'UPDATE_PROFILE', ...payload })
      });
      return await response.json();
    } catch (err: any) {
      return { success: false, message: 'Koneksi error: ' + err.message };
    }
  }

  /**
   * Change user password to Google Sheets
   */
  public async changePasswordGas(payload: { userId?: string; username?: string; oldPassword?: string; newPassword: string }, customUrl?: string): Promise<ApiResponse> {
    const url = customUrl || this.getSettings().gasWebAppUrl;
    if (!url) return { success: false, message: 'URL GAS belum dikonfigurasi' };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'CHANGE_PASSWORD', ...payload })
      });
      return await response.json();
    } catch (err: any) {
      return { success: false, message: 'Koneksi error: ' + err.message };
    }
  }

  /**
   * Add new user to Google Sheets
   */
  public async addUserGas(user: Partial<User>, customUrl?: string): Promise<ApiResponse> {
    const url = customUrl || this.getSettings().gasWebAppUrl;
    if (!url) return { success: false, message: 'URL GAS belum dikonfigurasi' };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ADD_USER', ...user })
      });
      return await response.json();
    } catch (err: any) {
      return { success: false, message: 'Koneksi error: ' + err.message };
    }
  }

  /**
   * Delete user from Google Sheets
   */
  public async deleteUserGas(userId: string, customUrl?: string): Promise<ApiResponse> {
    const url = customUrl || this.getSettings().gasWebAppUrl;
    if (!url) return { success: false, message: 'URL GAS belum dikonfigurasi' };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'DELETE_USER', userId })
      });
      return await response.json();
    } catch (err: any) {
      return { success: false, message: 'Koneksi error: ' + err.message };
    }
  }

  /**
   * Add transaction to Google Sheets (action: 'ADD')
   */
  public async addGasData(payload: Record<string, any>, customUrl?: string): Promise<ApiResponse> {
    const url = customUrl || this.getSettings().gasWebAppUrl;
    if (!url) {
      return { success: false, message: 'URL Google Apps Script belum dikonfigurasi.' };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ADD', ...payload })
      });
      const json = await response.json();
      return json;
    } catch (err: any) {
      return { success: false, message: 'Gagal mengirim data ke Google Sheets: ' + err.message };
    }
  }

  /**
   * Delete transaction from Google Sheets (action: 'DELETE')
   */
  public async deleteGasData(id: string, customUrl?: string): Promise<ApiResponse> {
    const url = customUrl || this.getSettings().gasWebAppUrl;
    if (!url) {
      return { success: false, message: 'URL Google Apps Script belum dikonfigurasi.' };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'DELETE', id })
      });
      const json = await response.json();
      return json;
    } catch (err: any) {
      return { success: false, message: 'Gagal menghapus data di Google Sheets: ' + err.message };
    }
  }

  /**
   * General sync dispatcher for custom action
   */
  public async syncWithGas(action: string, payload: Record<string, any> = {}): Promise<ApiResponse> {
    const settings = this.getSettings();
    if (!settings.gasWebAppUrl) {
      return { success: false, message: 'URL Google Apps Script belum dikonfigurasi di Pengaturan.' };
    }

    try {
      const response = await fetch(settings.gasWebAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...payload })
      });
      const json = await response.json();
      return json;
    } catch (err: any) {
      return { success: false, message: 'Gagal menghubungi Google Apps Script: ' + err.message };
    }
  }

  // --- EXPORT & BACKUP ---
  public exportDatabaseJson(): string {
    return JSON.stringify({
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      users: this.getUsers(),
      accounts: this.getAccounts(),
      categories: this.getCategories(),
      transactions: this.getTransactions(),
      settings: this.getSettings()
    }, null, 2);
  }

  public exportAllData(): string {
    return this.exportDatabaseJson();
  }

  public importDatabaseJson(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      if (data.accounts) localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(data.accounts));
      if (data.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories));
      if (data.transactions) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
      return true;
    } catch (e) {
      return false;
    }
  }

  public importData(jsonStr: string): boolean {
    return this.importDatabaseJson(jsonStr);
  }
}

export const storage = new StorageService();
export const storageService = storage;
