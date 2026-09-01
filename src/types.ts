/**
 * NUQUDY - Smart Financial Management
 * Global TypeScript definitions for models, state, and Apps Script integration
 */

export type TransactionType = 'income' | 'expense';

export type AccountType = 'cash' | 'bank' | 'ewallet' | 'savings' | 'other';

export type PeriodFilter = 'today' | 'this_week' | 'this_month' | 'this_year' | 'all' | 'custom';

export type ActiveTab = 'dashboard' | 'transactions' | 'categories' | 'accounts' | 'reports' | 'settings' | 'gas' | 'gas_hub';

export interface User {
  userId: string;
  username: string;
  name: string;
  email: string;
  currency?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Transaction {
  transactionId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
  amount: number;
  account: string;
  description: string;
  createdAt: string;
}

export interface Category {
  categoryId: string;
  userId: string;
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
  description?: string;
  createdAt: string;
}

export interface Account {
  accountId: string;
  userId: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  accountNumber?: string;
  description?: string;
  color?: string;
  createdAt: string;
}


export interface SettingItem {
  key: string;
  value: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  currency: string;
  gasWebAppUrl?: string;
  syncMode: 'local' | 'gas_cloud';
  lastSyncedAt?: string;
}

export interface AccountSummary extends Account {
  currentBalance: number;
  totalIncome: number;
  totalExpense: number;
  transactionCount: number;
}

export interface DashboardSummary {
  totalBalance: number;
  periodIncome: number;
  periodExpense: number;
  periodNet: number; // Income - Expense
  periodTransactionCount: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface TransactionFilterState {
  searchQuery: string;
  type: 'all' | TransactionType;
  category: string;
  account: string;
  startDate: string;
  endDate: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}
