import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { LoginPage } from './components/auth/LoginPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { TransactionsPage } from './components/transactions/TransactionsPage';
import { CategoriesPage } from './components/categories/CategoriesPage';
import { AccountsPage } from './components/accounts/AccountsPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { GasBackendHubPage } from './components/gas/GasBackendHubPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { AccountManagementPage } from './components/profile/AccountManagementPage';
import { TransactionModal } from './components/transactions/TransactionModal';
import { ConfirmModal } from './components/common/ConfirmModal';
import { ToastContainer } from './components/common/Toast';

const MainAppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { activeTab, toasts, removeToast, confirmModal, setConfirmModal, isSyncing, syncStatusText } = useFinance();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'accounts':
        return <AccountsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'user_management':
        return <AccountManagementPage />;
      case 'gas':
        return <GasBackendHubPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-[#1E293B] dark:text-slate-100 font-sans overflow-hidden">
      {/* Real-time Sync & Loading Indicator */}
      {isSyncing && (
        <div
          id="sync-loading-indicator"
          className="fixed top-3.5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 border border-emerald-500/30 shadow-lg text-xs font-semibold backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
          <span>{syncStatusText || 'Memuat data dari Google Sheets...'}</span>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-[270px] w-full bg-white dark:bg-[#0F172A] z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <Sidebar onClose={() => setMobileDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Header onToggleMobileMenu={() => setMobileDrawerOpen(true)} />

        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-7">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>

      {/* Global Modals & Notifications */}
      <TransactionModal />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel={confirmModal.cancelLabel}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <MainAppContent />
      </FinanceProvider>
    </AuthProvider>
  );
}
