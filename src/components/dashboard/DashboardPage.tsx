import React from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Plus,
  ArrowRight,
  CreditCard,
  Building2,
  Smartphone,
  PiggyBank,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, formatRupiahCompact, formatDateIndo } from '../../utils/formatters';
import { EmptyState } from '../common/EmptyState';
import { PeriodFilter, Transaction } from '../../types';

export const DashboardPage: React.FC = () => {
  const {
    summary,
    filteredTransactions,
    accounts,
    period,
    setPeriod,
    openAddTransaction,
    openEditTransaction,
    setActiveTab
  } = useFinance();

  const periodLabelMap: Record<PeriodFilter, string> = {
    today: 'Hari Ini',
    this_week: 'Minggu Ini',
    this_month: 'Bulan Ini',
    this_year: 'Tahun Ini',
    all: 'Semua Periode',
    custom: 'Kustom'
  };

  // Recent 6 transactions
  const recentTransactions = filteredTransactions.slice(0, 6);

  // Group transactions for bar chart
  const chartData = React.useMemo(() => {
    const dataMap: Record<string, { label: string; income: number; expense: number }> = {};

    filteredTransactions.forEach(tx => {
      const dateKey = tx.date;
      const displayLabel = formatDateIndo(tx.date);

      if (!dataMap[dateKey]) {
        dataMap[dateKey] = { label: displayLabel, income: 0, expense: 0 };
      }
      if (tx.type === 'income') dataMap[dateKey].income += Number(tx.amount);
      if (tx.type === 'expense') dataMap[dateKey].expense += Number(tx.amount);
    });

    return Object.keys(dataMap)
      .sort()
      .slice(-7)
      .map(k => dataMap[k]);
  }, [filteredTransactions]);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank': return <Building2 className="w-4 h-4" />;
      case 'ewallet': return <Smartphone className="w-4 h-4" />;
      case 'savings': return <PiggyBank className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  // Percentage calculations for progress bars
  const totalFlow = summary.periodIncome + summary.periodExpense;
  const incomePercent = totalFlow > 0 ? Math.round((summary.periodIncome / totalFlow) * 100) : 0;
  const expensePercent = totalFlow > 0 ? Math.round((summary.periodExpense / totalFlow) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* 1. Top Summary Metric Cards (Clean Minimal 4-Grid as in Design Spec) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Saldo */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between min-w-0">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1 truncate">
              Total Saldo
            </p>
            <h3
              className="text-lg sm:text-xl lg:text-[20px] xl:text-[22px] font-extrabold text-slate-900 dark:text-white tracking-tight truncate leading-tight whitespace-nowrap"
              title={formatRupiah(summary.totalBalance)}
            >
              {formatRupiah(summary.totalBalance)}
            </h3>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 truncate">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{accounts.length} akun terdaftar</span>
          </div>
        </div>

        {/* Card 2: Pemasukan */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between min-w-0">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1 truncate">
              Pemasukan ({periodLabelMap[period]})
            </p>
            <h3
              className="text-lg sm:text-xl lg:text-[20px] xl:text-[22px] font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight truncate leading-tight whitespace-nowrap"
              title={`+${formatRupiah(summary.periodIncome)}`}
            >
              +{formatRupiah(summary.periodIncome)}
            </h3>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, incomePercent || 100)}%` }}
            />
          </div>
        </div>

        {/* Card 3: Pengeluaran */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between min-w-0">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1 truncate">
              Pengeluaran ({periodLabelMap[period]})
            </p>
            <h3
              className="text-lg sm:text-xl lg:text-[20px] xl:text-[22px] font-extrabold text-rose-600 dark:text-rose-400 tracking-tight truncate leading-tight whitespace-nowrap"
              title={`-${formatRupiah(summary.periodExpense)}`}
            >
              -{formatRupiah(summary.periodExpense)}
            </h3>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, expensePercent || 0)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Selisih Bersih */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs bg-indigo-50/30 dark:bg-indigo-950/20 flex flex-col justify-between min-w-0">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1 truncate">
              Selisih Bersih (Net)
            </p>
            <h3
              className={`text-lg sm:text-xl lg:text-[20px] xl:text-[22px] font-extrabold tracking-tight truncate leading-tight whitespace-nowrap ${
                summary.periodNet >= 0
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
              title={`${summary.periodNet >= 0 ? '+' : ''}${formatRupiah(summary.periodNet)}`}
            >
              {summary.periodNet >= 0 ? '+' : ''}{formatRupiah(summary.periodNet)}
            </h3>
          </div>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-300 font-semibold mt-3 italic truncate">
            {summary.periodNet >= 0 ? 'Arus kas positif' : 'Defisit pengeluaran'}
          </p>
        </div>
      </div>

      {/* 2. Middle Section: Cash Analysis Chart (3 cols) & Recent Transactions (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Analisis Kas (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-base">
                  Analisis Arus Kas
                </h4>
                <p className="text-xs text-slate-400">
                  Perbandingan nominal masuk vs keluar ({periodLabelMap[period]})
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Masuk
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Keluar
                  </span>
                </div>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center">
                <p className="text-xs">Belum ada data grafik untuk periode ini.</p>
                <button
                  onClick={() => openAddTransaction('expense')}
                  className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
                >
                  + Tambah Transaksi
                </button>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis
                      tickFormatter={val => formatRupiahCompact(val)}
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value: any) => [formatRupiah(value), '']}
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Right: Transaksi Terbaru (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h4 className="font-bold text-slate-800 dark:text-white text-base">
              Transaksi Terbaru
            </h4>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase hover:underline cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/80">
            {recentTransactions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Belum ada transaksi pada periode ini
              </div>
            ) : (
              recentTransactions.map((tx: Transaction) => {
                const isIncome = tx.type === 'income';

                return (
                  <div
                    key={tx.transactionId}
                    onClick={() => openEditTransaction(tx)}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {tx.category}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase truncate mt-0.5">
                          {isIncome ? 'Pemasukan' : 'Pengeluaran'} &bull; {tx.account}
                        </p>
                      </div>
                    </div>

                    <p
                      className={`text-xs font-bold font-mono shrink-0 ml-3 ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Sources of Funds (Accounts Breakdown) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Pos Rekening & Dompet Keuangan
            </h4>
            <p className="text-xs text-slate-400">
              Ringkasan saldo likuid per akun keuangan
            </p>
          </div>
          <button
            onClick={() => setActiveTab('accounts')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            Kelola Akun
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map(acc => (
            <div
              key={acc.accountId}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${acc.color || '#10b981'}20`,
                    color: acc.color || '#10b981'
                  }}
                >
                  {getAccountIcon(acc.type)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {acc.name}
                  </p>
                  <p className="text-[10px] text-slate-400 capitalize">
                    {acc.type}
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                {formatRupiah(acc.currentBalance)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
