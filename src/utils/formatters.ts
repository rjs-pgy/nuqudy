/**
 * Utility functions for Rupiah currency, Indonesian date formatting, and ID generation.
 */

export function formatRupiah(amount: number | string | undefined | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num).replace('IDR', 'Rp');
}

export function formatRupiahCompact(amount: number | undefined | null): string {
  const num = amount || 0;
  if (Math.abs(num) >= 1_000_000_000) {
    return `Rp ${(num / 1_000_000_000).toFixed(1).replace('.0', '')} M`;
  }
  if (Math.abs(num) >= 1_000_000) {
    return `Rp ${(num / 1_000_000).toFixed(1).replace('.0', '')} Jt`;
  }
  if (Math.abs(num) >= 1_000) {
    return `Rp ${(num / 1_000).toFixed(0)} Rb`;
  }
  return formatRupiah(num);
}

export function parseRupiahInput(value: string): number {
  if (!value) return 0;
  const clean = value.replace(/[^0-9]/g, '');
  return parseInt(clean, 10) || 0;
}

export function formatDateIndo(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '-';
  const d = typeof dateStr === 'string' ? new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : '')) : dateStr;
  if (isNaN(d.getTime())) return String(dateStr);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatDateIndoFull(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '-';
  const d = typeof dateStr === 'string' ? new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : '')) : dateStr;
  if (isNaN(d.getTime())) return String(dateStr);

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateInput(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateId(prefix: string = 'ID'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function getTodayDateString(): string {
  return formatDateInput(new Date());
}

/**
 * Filter date helpers
 */
export function isDateInPeriod(dateStr: string, period: string, customStart?: string, customEnd?: string): boolean {
  if (!dateStr) return false;
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();

  // Reset time to start of day for comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === 'all') return true;

  if (period === 'today') {
    const t = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    return t.getTime() === today.getTime();
  }

  if (period === 'this_week') {
    // Start of week (Monday)
    const dayOfWeek = today.getDay(); // 0 is Sunday
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - distanceToMonday);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return target >= startOfWeek && target <= endOfWeek;
  }

  if (period === 'this_month') {
    return target.getFullYear() === now.getFullYear() && target.getMonth() === now.getMonth();
  }

  if (period === 'this_year') {
    return target.getFullYear() === now.getFullYear();
  }

  if (period === 'custom' && customStart && customEnd) {
    const start = new Date(customStart + 'T00:00:00');
    const end = new Date(customEnd + 'T23:59:59');
    return target >= start && target <= end;
  }

  return true;
}
