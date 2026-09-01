import React from 'react';
import { Transaction, AccountSummary } from '../../types';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';

interface PrintableReportProps {
  transactions: Transaction[];
  accounts: AccountSummary[];
  periodTitle: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
  userName: string;
}

export const PrintableReport: React.FC<PrintableReportProps> = ({
  transactions,
  accounts,
  periodTitle,
  totalIncome,
  totalExpense,
  net,
  userName
}) => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="hidden print:block p-8 bg-white text-black font-sans">
      {/* Header */}
      <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-teal-800">
            NUQUDY &bull; LAPORAN KEUANGAN
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Smart Financial Management
          </p>
        </div>
        <div className="text-right text-xs text-slate-600">
          <p>Dicetak pada: <strong>{currentDate}</strong></p>
          <p>Pengguna: <strong>{userName}</strong></p>
          <p>Periode: <strong>{periodTitle}</strong></p>
        </div>
      </div>

      {/* Ringkasan Eksekutif */}
      <div className="my-6 grid grid-cols-4 gap-4 p-4 rounded-xl border border-slate-300 bg-slate-50">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Pemasukan</span>
          <span className="text-sm font-bold font-mono text-emerald-700">+{formatRupiah(totalIncome)}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Pengeluaran</span>
          <span className="text-sm font-bold font-mono text-rose-700">-{formatRupiah(totalExpense)}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Selisih Bersih (Net)</span>
          <span className="text-sm font-bold font-mono text-slate-900">{formatRupiah(net)}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Saldo Terkini</span>
          <span className="text-sm font-bold font-mono text-teal-800">
            {formatRupiah(accounts.reduce((a, c) => a + c.currentBalance, 0))}
          </span>
        </div>
      </div>

      {/* Rincian Transaksi */}
      <div className="mt-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-2">
          Rincian Transaksi ({transactions.length} Data)
        </h3>
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-400 font-bold">
              <th className="py-2 px-2">No</th>
              <th className="py-2 px-2">Tanggal</th>
              <th className="py-2 px-2">Jenis</th>
              <th className="py-2 px-2">Kategori</th>
              <th className="py-2 px-2">Akun</th>
              <th className="py-2 px-2">Keterangan</th>
              <th className="py-2 px-2 text-right">Nominal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {transactions.map((tx, idx) => (
              <tr key={tx.transactionId}>
                <td className="py-1.5 px-2">{idx + 1}</td>
                <td className="py-1.5 px-2 whitespace-nowrap">{formatDateIndo(tx.date)}</td>
                <td className="py-1.5 px-2 font-semibold">
                  {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                </td>
                <td className="py-1.5 px-2">{tx.category}</td>
                <td className="py-1.5 px-2">{tx.account}</td>
                <td className="py-1.5 px-2">{tx.description || '-'}</td>
                <td className={`py-1.5 px-2 text-right font-mono font-bold ${tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-4 border-t border-slate-300 flex justify-between items-center text-[10px] text-slate-500">
        <span>Laporan dihasilkan secara otomatis oleh Nuqudy Smart Financial Management.</span>
        <span>Halaman 1 dari 1</span>
      </div>
    </div>
  );
};
