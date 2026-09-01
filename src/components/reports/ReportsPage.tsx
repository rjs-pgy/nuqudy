import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  CreditCard,
  Building2,
  Wallet
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, formatRupiahCompact, formatDateIndo } from '../../utils/formatters';
import { PeriodFilter } from '../../types';

const COLORS = ['#10b981', '#3b82f6', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

export const ReportsPage: React.FC = () => {
  const {
    filteredTransactions,
    transactions,
    accounts,
    categories,
    period,
    setPeriod,
    summary
  } = useFinance();

  const [reportType, setReportType] = useState<'overview' | 'expense' | 'income'>('overview');

  // Breakdown by Category for Active Period
  const categoryBreakdown = useMemo(() => {
    const dataMap: Record<string, { name: string; value: number; type: string; color?: string }> = {};

    filteredTransactions.forEach(t => {
      if (reportType === 'expense' && t.type !== 'expense') return;
      if (reportType === 'income' && t.type !== 'income') return;

      if (!dataMap[t.category]) {
        const catObj = categories.find(c => c.name === t.category);
        dataMap[t.category] = {
          name: t.category,
          value: 0,
          type: t.type,
          color: catObj?.color
        };
      }
      dataMap[t.category].value += Number(t.amount);
    });

    return Object.values(dataMap).sort((a, b) => b.value - a.value);
  }, [filteredTransactions, reportType, categories]);

  // Daily/Timeline Cashflow Trend
  const timelineData = useMemo(() => {
    const dataMap: Record<string, { date: string; label: string; income: number; expense: number; net: number }> = {};

    filteredTransactions.forEach(t => {
      if (!dataMap[t.date]) {
        dataMap[t.date] = {
          date: t.date,
          label: formatDateIndo(t.date),
          income: 0,
          expense: 0,
          net: 0
        };
      }
      if (t.type === 'income') dataMap[t.date].income += Number(t.amount);
      if (t.type === 'expense') dataMap[t.date].expense += Number(t.amount);
      dataMap[t.date].net = dataMap[t.date].income - dataMap[t.date].expense;
    });

    return Object.keys(dataMap)
      .sort()
      .map(k => dataMap[k]);
  }, [filteredTransactions]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Tanggal', 'Jenis', 'Kategori', 'Akun', 'Nominal', 'Catatan'];
    const rows = filteredTransactions.map(t => [
      t.transactionId,
      t.date,
      t.type,
      `"${t.category}"`,
      `"${t.account}"`,
      t.amount,
      `"${(t.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan_keuangan_nuqudy_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* 1. Header Toolbar & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs no-print">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Analisis & Laporan Keuangan
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Evaluasi efisiensi pengeluaran dan pertumbuhan pemasukan berkala.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Report Type Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setReportType('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                reportType === 'overview'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setReportType('expense')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                reportType === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-rose-600'
              }`}
            >
              Pengeluaran
            </button>
            <button
              onClick={() => setReportType('income')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                reportType === 'income'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-emerald-600'
              }`}
            >
              Pemasukan
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* Print Only Header */}
      <div className="hidden print-only p-4 border-b border-black mb-6">
        <h1 className="text-2xl font-black text-slate-900">NUQUDY &bull; Laporan Keuangan</h1>
        <p className="text-xs text-slate-600">
          Dicetak pada: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
        </p>
      </div>

      {/* 2. Top Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 truncate">
            Total Pemasukan
          </p>
          <h3
            className="text-lg sm:text-xl lg:text-[22px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 tracking-tight truncate leading-tight whitespace-nowrap"
            title={`+${formatRupiah(summary.periodIncome)}`}
          >
            +{formatRupiah(summary.periodIncome)}
          </h3>
          <p className="text-xs text-slate-400 mt-1 truncate">Periode aktif</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 truncate">
            Total Pengeluaran
          </p>
          <h3
            className="text-lg sm:text-xl lg:text-[22px] font-extrabold text-rose-600 dark:text-rose-400 mt-1 tracking-tight truncate leading-tight whitespace-nowrap"
            title={`-${formatRupiah(summary.periodExpense)}`}
          >
            -{formatRupiah(summary.periodExpense)}
          </h3>
          <p className="text-xs text-slate-400 mt-1 truncate">Periode aktif</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs bg-indigo-50/30 dark:bg-indigo-950/20 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 truncate">
            Selisih Kas Bersih (Net)
          </p>
          <h3
            className={`text-lg sm:text-xl lg:text-[22px] font-extrabold mt-1 tracking-tight truncate leading-tight whitespace-nowrap ${
              summary.periodNet >= 0
                ? 'text-indigo-700 dark:text-indigo-300'
                : 'text-rose-600 dark:text-rose-400'
            }`}
            title={`${summary.periodNet >= 0 ? '+' : ''}${formatRupiah(summary.periodNet)}`}
          >
            {summary.periodNet >= 0 ? '+' : ''}{formatRupiah(summary.periodNet)}
          </h3>
          <p className="text-xs text-slate-400 mt-1 truncate">
            {summary.periodNet >= 0 ? 'Surplus keuangan aman' : 'Perlu pengendalian biaya'}
          </p>
        </div>
      </div>

      {/* 3. Charts Row: Timeline Trend + Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Trend Arus Kas (3 cols) */}
        <div className="lg:col-span-3 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Tren Arus Kas Berkala
              </h4>
              <p className="text-xs text-slate-400">
                Pemasukan vs Pengeluaran sepanjang periode
              </p>
            </div>
          </div>

          {timelineData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              Belum ada data untuk periode ini.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis
                    tickFormatter={val => formatRupiahCompact(val)}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatRupiah(val), '']}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Pemasukan"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#incomeGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Pengeluaran"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#expenseGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right: Proporsi Kategori Donut Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Proporsi Kategori ({reportType === 'expense' ? 'Pengeluaran' : reportType === 'income' ? 'Pemasukan' : 'Semua'})
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Distribusi nominal berdasarkan pos anggaran
            </p>

            {categoryBreakdown.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                Tidak ada data pada periode ini
              </div>
            ) : (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatRupiah(val), '']}
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '11px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top Categories List */}
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-1">
            {categoryBreakdown.slice(0, 5).map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || COLORS[i % COLORS.length] }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                    {cat.name}
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {formatRupiah(cat.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Detailed Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <h4 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Tabel Rincian Kategori Periode Ini
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="pb-3 px-3">Kategori</th>
                <th className="pb-3 px-3">Tipe</th>
                <th className="pb-3 px-3 text-right">Persentase</th>
                <th className="pb-3 px-3 text-right">Total Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {categoryBreakdown.map(item => {
                const totalBase = item.type === 'income' ? summary.periodIncome : summary.periodExpense;
                const percent = totalBase > 0 ? ((item.value / totalBase) * 100).toFixed(1) : '0';

                return (
                  <tr key={item.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                      {item.name}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          item.type === 'income'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}
                      >
                        {item.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {percent}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatRupiah(item.value)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
