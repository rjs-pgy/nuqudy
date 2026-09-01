import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  Database,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  Trash2,
  DownloadCloud,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { GAS_FILES } from '../../utils/gasCode';
import { storage } from '../../services/storageService';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah } from '../../utils/formatters';

export const GasHubPage: React.FC = () => {
  const { showToast, reloadAllData, transactions } = useFinance();
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [gasUrlInput, setGasUrlInput] = useState(() => storage.getSettings().gasWebAppUrl || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  const activeFile = GAS_FILES[activeFileIndex] || GAS_FILES[0];

  const handleCopyCode = (filename: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    showToast('success', 'Kode Disalin!', `Kode file ${filename} telah disalin ke clipboard.`);
    setTimeout(() => setCopiedFile(null), 2500);
  };

  const handleSaveGasUrl = () => {
    const trimmed = gasUrlInput.trim();
    storage.saveSettings({ gasWebAppUrl: trimmed });
    showToast('success', 'Pengaturan Disimpan', 'URL Google Apps Script Web App berhasil disimpan.');
  };

  // Test 1: Fetch Data via doGet
  const handleTestFetch = async () => {
    if (!gasUrlInput.trim()) {
      showToast('warning', 'URL Kosong', 'Silakan masukkan URL Web App Google Apps Script Anda terlebih dahulu.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await storage.fetchGasData(gasUrlInput.trim());
      if (res.success) {
        reloadAllData();
        setTestResult({
          success: true,
          message: `Berhasil mengambil data dari Google Sheets! Ditemukan ${res.data?.length || 0} transaksi.`,
          details: res.data
        });
        showToast('success', 'Sinkronisasi Berhasil', `${res.data?.length || 0} transaksi dimuat.`);
      } else {
        setTestResult({
          success: false,
          message: res.message || 'Gagal membaca data dari Web App Google Apps Script.'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Koneksi gagal atau terblokir CORS. Pastikan Web App sudah di-deploy dengan akses "Anyone". Error: ' + err.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Test 2: Add Test Data via doPost (action: 'ADD')
  const handleTestAdd = async () => {
    if (!gasUrlInput.trim()) {
      showToast('warning', 'URL Kosong', 'Silakan masukkan URL Web App Google Apps Script Anda terlebih dahulu.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const testPayload = {
      action: 'ADD',
      userId: 'USR-ADMIN01',
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      category: 'Uji Coba Sheets',
      amount: 50000,
      account: 'Dompet Tunai',
      description: 'Transaksi uji coba sinkronisasi real-time ' + new Date().toLocaleTimeString()
    };

    try {
      const res = await storage.addGasData(testPayload, gasUrlInput.trim());
      if (res.success) {
        // Auto re-fetch
        await storage.fetchGasData(gasUrlInput.trim());
        reloadAllData();
        setTestResult({
          success: true,
          message: 'Berhasil menambahkan data uji ke Google Sheets via doPost (action: ADD)! Otomatis memuat ulang.',
          details: res.data
        });
        showToast('success', 'Data Uji Ditambahkan', 'Data baru tersimpan di Google Sheets.');
      } else {
        setTestResult({
          success: false,
          message: res.message || 'Gagal menambahkan data ke Google Sheets.'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Gagal mengirim request ADD: ' + err.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-400/20">
                Google Sheets Real-Time Database
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2">
              Integrasi Google Apps Script (GAS) Backend
            </h2>
            <p className="text-xs sm:text-sm text-teal-100/80 mt-1 max-w-2xl leading-relaxed">
              Gunakan Google Spreadsheet sebagai database cloud real-time tanpa server terpisah. Sinkronisasi otomatis saat membaca, menambah, dan menghapus transaksi.
            </p>
          </div>

          <a
            href="https://sheets.new"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-98 border border-white/20 text-white text-xs font-bold transition-all shadow-md backdrop-blur-xs"
          >
            <span>Buka Google Sheets Baru</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* 2. Step-by-Step Setup Guide */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Langkah Cepat Deployment Google Apps Script
            </h3>
            <p className="text-xs text-slate-500">
              Konfigurasi 4 langkah sederhana agar Google Sheets dapat diakses oleh Web App secara aman
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center">
                1
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Buat Spreadsheet
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Buka <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-teal-600 font-bold hover:underline">sheets.new</a>, beri nama spreadsheet, lalu klik menu <strong>Ekstensi &gt; Apps Script</strong>.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center">
                2
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Salin Code.gs
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Salin seluruh kode dari tab <strong>Code.gs</strong> di bawah ke editor Apps Script, lalu simpan (Ctrl+S).
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center">
                3
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Deploy Web App
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Klik <strong>Deploy &gt; New deployment</strong>. Pilih tipe <strong>Web app</strong>.
              Set <em>Execute as: <strong>Me</strong></em> dan <em>Who has access: <strong>Anyone</strong></em>.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center">
                4
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Hubungkan URL
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Salin <strong>Web app URL</strong> yang dihasilkan (akhiran <code>/exec</code>) dan tempel ke form di bawah ini!
            </p>
          </div>
        </div>

        {/* Live URL Configuration & Testing Controls */}
        <div className="pt-2 space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            URL Google Apps Script Web App (Real-Time Cloud Endpoint)
          </label>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="url"
              id="gas-url-input"
              value={gasUrlInput}
              onChange={e => setGasUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={handleSaveGasUrl}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              Simpan URL
            </button>
          </div>

          {/* Real-time Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={handleTestFetch}
              disabled={isTesting}
              className="px-3.5 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <DownloadCloud className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce' : ''}`} />
              <span>Tarik Data (doGet / fetchData)</span>
            </button>

            <button
              onClick={handleTestAdd}
              disabled={isTesting}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Kirim Data Uji (doPost: ADD)</span>
            </button>
          </div>

          {/* Test Status Feedback */}
          {testResult && (
            <div
              className={`mt-3 p-4 rounded-2xl text-xs font-medium flex items-start gap-3 ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-bold">{testResult.message}</p>
                {testResult.details && (
                  <p className="text-[11px] font-mono opacity-80">
                    Response Payload: {JSON.stringify(testResult.details).substring(0, 180)}...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Interactive Code Explorer & 1-Click Copy */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Source Code Google Apps Script &amp; Integrasi Frontend
            </h3>
            <p className="text-xs text-slate-500">
              Pilih berkas kode di bawah dan salin langsung dengan 1-klik
            </p>
          </div>

          <button
            onClick={() => handleCopyCode(activeFile.filename, activeFile.content)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all self-start sm:self-auto cursor-pointer"
          >
            {copiedFile === activeFile.filename ? (
              <>
                <Check className="w-4 h-4" />
                <span>Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Seluruh {activeFile.filename}</span>
              </>
            )}
          </button>
        </div>

        {/* File Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800">
          {GAS_FILES.map((file, idx) => (
            <button
              key={file.filename}
              onClick={() => setActiveFileIndex(idx)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeFileIndex === idx
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{file.filename}</span>
            </button>
          ))}
        </div>

        {/* File Description */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="font-medium text-slate-700 dark:text-slate-300">{activeFile.description}</span>
          <span className="font-mono text-[11px] text-slate-400">
            {activeFile.content.split('\n').length} baris
          </span>
        </div>

        {/* Code Block Container */}
        <div className="relative rounded-2xl bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-x-auto max-h-[500px] border border-slate-800 shadow-inner">
          <pre>
            <code>{activeFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

