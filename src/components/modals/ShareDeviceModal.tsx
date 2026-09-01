import React, { useState } from 'react';
import {
  Smartphone,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  ShieldCheck,
  X,
  Share2,
  Sparkles
} from 'lucide-react';
import { storageService } from '../../services/storageService';

interface ShareDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  gasUrlOverride?: string;
}

export const ShareDeviceModal: React.FC<ShareDeviceModalProps> = ({
  isOpen,
  onClose,
  gasUrlOverride
}) => {
  const [copied, setCopied] = useState(false);
  const gasUrl = gasUrlOverride || storageService.getSettings().gasWebAppUrl || '';

  if (!isOpen) return null;

  // Generate shareable link with query & hash fallback
  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    if (!gasUrl) {
      return `${origin}${pathname}`;
    }
    return `${origin}${pathname}?gas=${encodeURIComponent(gasUrl)}`;
  };

  const shareUrl = getShareUrl();
  const qrCodeUrl = gasUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(shareUrl)}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Buka di HP / Perangkat Lain
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sinkronisasi data otomatis dengan Google Spreadsheet
            </p>
          </div>
        </div>

        {!gasUrl ? (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200 mb-6">
            <p className="font-semibold mb-1">⚠️ URL Google Apps Script Belum Dikonfigurasi</p>
            <p className="text-[11px] leading-relaxed">
              Agar perangkat lain langsung terhubung ke database Google Spreadsheet yang sama, pastikan Anda telah memasukkan URL Web App di menu <strong>Backend Hub (GAS)</strong> atau <strong>Pengaturan</strong>.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* QR Code Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 shrink-0">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code Nuqudy Multi-Device"
                    className="w-36 h-36 rounded-lg object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-slate-400">
                    <QrCode className="w-12 h-12" />
                  </div>
                )}
              </div>

              <div className="text-center sm:text-left space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Scan Langsung dengan HP</span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Arahkan Kamera HP ke QR Code
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Link ini membawa konfigurasi database Google Spreadsheet Anda sehingga HP Anda langsung tersambung dan data langsung muncul sama persis.
                </p>
              </div>
            </div>

            {/* Link Box */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Tautan Khusus Multi-Perangkat
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shrink-0 shadow-sm transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* How it works summary */}
            <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-800 dark:text-teal-300">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Cara Kerja Sinkronisasi Multi-Device</span>
              </div>
              <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Buka link di browser HP (Chrome, Safari, dsb).</li>
                <li>Aplikasi otomatis mendeteksi Google Apps Script dan menarik seluruh data akun &amp; transaksi terbaru.</li>
                <li>Setiap transaksi yang ditambah atau diubah di HP atau Laptop akan langsung saling terbarui.</li>
              </ul>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
