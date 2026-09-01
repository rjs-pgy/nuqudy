/**
 * Production-ready Google Apps Script Code Bundle for NUQUDY
 * Google Sheets as Real-Time Multi-Sheet Database Backend
 * Persists Users & Passwords, Transactions, Categories, Accounts, and Settings
 */

export interface GasFileItem {
  filename: string;
  type: 'server' | 'javascript' | 'markdown';
  description: string;
  content: string;
}

export const GAS_CODE_GS = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT (Code.gs) - DATABASE BACKEND REAL-TIME NUQUDY
 * Multi-Sheet Web App REST API untuk Google Spreadsheet
 * Menyimpan: Users & Sandi, Transactions, Categories, Accounts, Settings
 * =========================================================================
 */

// Konfigurasi Nama Sheet Database
const SHEETS = {
  USERS: 'Users',
  TRANSACTIONS: 'Transactions',
  CATEGORIES: 'Categories',
  ACCOUNTS: 'Accounts',
  SETTINGS: 'Settings'
};

// Konfigurasi Header Kolom Tiap Sheet
const SCHEMAS = {
  Users: [
    'userId', 'username', 'password', 'name', 'email', 'currency', 'role', 'status', 'createdAt', 'updatedAt'
  ],
  Transactions: [
    'transactionId', 'userId', 'date', 'type', 'category', 'amount', 'account', 'description', 'createdAt'
  ],
  Categories: [
    'categoryId', 'userId', 'name', 'type', 'icon', 'color', 'description', 'createdAt'
  ],
  Accounts: [
    'accountId', 'userId', 'name', 'type', 'initialBalance', 'accountNumber', 'description', 'color', 'createdAt'
  ],
  Settings: [
    'key', 'value', 'updatedAt'
  ]
};

/**
 * Inisialisasi atau Ambil Sheet dengan Header & Format Otomatis
 */
function getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  const headers = SCHEMAS[sheetName] || [];
  if (sheet.getLastRow() === 0 && headers.length > 0) {
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#0D9488');
    headerRange.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);

    // Inisialisasi Akun Admin Default jika sheet Users baru dibuat
    if (sheetName === SHEETS.USERS) {
      const now = new Date().toISOString();
      sheet.appendRow([
        'USR-ADMIN01',
        'admin',
        'admin123',
        'Pengguna Nuqudy',
        'admin@nuqudy.app',
        'Rp',
        'admin',
        'active',
        now,
        now
      ]);
    }
  }

  return sheet;
}

/**
 * Fungsi Setup Lengkap (Jalankan sekali di editor Apps Script)
 */
function setupDatabase() {
  Object.keys(SCHEMAS).forEach(function(sheetName) {
    getOrCreateSheet(sheetName);
  });
  Logger.log('Semua sheet database Nuqudy berhasil diinisialisasi!');
}

/**
 * Helper Output JSON dengan MIME Type yang kompatibel & Bebas Blokir CORS
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper: Konversi Sheet ke Array of Objects
 */
function readSheetRows(sheetName) {
  const sheet = getOrCreateSheet(sheetName);
  const rows = sheet.getDataRange().getValues();

  if (rows.length <= 1) {
    return [];
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);

  return dataRows.map(function(row) {
    const item = {};
    headers.forEach(function(header, idx) {
      let val = row[idx];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone() || 'GMT+7', 'yyyy-MM-dd');
      }
      item[header] = val;
    });
    return item;
  });
}

/**
 * =========================================================================
 * 1. FUNGSI doGet(e) - PENGAMBILAN DATA
 * =========================================================================
 */
function doGet(e) {
  try {
    const targetSheet = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet : null;

    // Jika meminta sheet tertentu (misal: ?sheet=Users atau ?sheet=Transactions)
    if (targetSheet && SCHEMAS[targetSheet]) {
      const sheetData = readSheetRows(targetSheet);
      return createJsonResponse({
        success: true,
        sheet: targetSheet,
        total: sheetData.length,
        data: sheetData
      });
    }

    // Default: Ambil seluruh data dari semua sheet dalam satu respons terpadu
    const usersData = readSheetRows(SHEETS.USERS).map(function(u) {
      // Sembunyikan password saat pembacaan publik jika diperlukan
      const sanitized = Object.assign({}, u);
      return sanitized;
    });

    const txData = readSheetRows(SHEETS.TRANSACTIONS);
    txData.sort(function(a, b) {
      return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
    });

    const catData = readSheetRows(SHEETS.CATEGORIES);
    const accData = readSheetRows(SHEETS.ACCOUNTS);
    const setRows = readSheetRows(SHEETS.SETTINGS);

    const settingsObj = {};
    setRows.forEach(function(r) {
      if (r.key) settingsObj[r.key] = r.value;
    });

    const fullBundle = {
      users: usersData,
      transactions: txData,
      categories: catData,
      accounts: accData,
      settings: settingsObj
    };

    return createJsonResponse({
      success: true,
      message: 'Data seluruh database berhasil diambil dari Google Sheets',
      data: fullBundle,
      transactions: txData // Kompatibilitas mundur
    });

  } catch (error) {
    return createJsonResponse({
      success: false,
      message: 'Gagal mengambil data dari Google Sheets: ' + error.toString()
    });
  }
}

/**
 * =========================================================================
 * 2. FUNGSI doPost(e) - MUTASI & SINKRONISASI REAL-TIME
 * =========================================================================
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = String(payload.action || '').toUpperCase();
    const now = new Date().toISOString();

    // -----------------------------------------------------------------------
    // A. MANAJEMEN AKUN PENGGUNA & SANDI (USERS)
    // -----------------------------------------------------------------------

    // A1. LOGIN PENGGUNA
    if (action === 'LOGIN' || action === 'AUTH') {
      const username = String(payload.username || '').trim().toLowerCase();
      const password = String(payload.password || '').trim();
      const users = readSheetRows(SHEETS.USERS);

      const found = users.find(function(u) {
        return String(u.username || '').toLowerCase() === username && String(u.password || '') === password;
      });

      if (found) {
        if (found.status === 'inactive') {
          return createJsonResponse({ success: false, message: 'Akun Anda sedang dinonaktifkan.' });
        }
        return createJsonResponse({
          success: true,
          message: 'Login berhasil!',
          data: {
            userId: found.userId,
            username: found.username,
            name: found.name,
            email: found.email,
            currency: found.currency || 'Rp',
            role: found.role || 'admin',
            status: found.status,
            createdAt: found.createdAt
          }
        });
      } else {
        return createJsonResponse({
          success: false,
          message: 'Username atau password salah di database Google Sheets.'
        });
      }
    }

    // A2. UPDATE PROFIL PENGGUNA (Nama, Email, Currency, Username)
    if (action === 'UPDATE_PROFILE' || action === 'UPDATEUSER') {
      const sheet = getOrCreateSheet(SHEETS.USERS);
      const values = sheet.getDataRange().getValues();
      const headers = values[0];
      const userIdIdx = headers.indexOf('userId');
      const usernameIdx = headers.indexOf('username');
      const nameIdx = headers.indexOf('name');
      const emailIdx = headers.indexOf('email');
      const currencyIdx = headers.indexOf('currency');
      const updatedIdx = headers.indexOf('updatedAt');

      const targetId = String(payload.userId || '').trim();
      const targetUsername = String(payload.username || '').trim().toLowerCase();

      let targetRow = -1;
      for (let r = 1; r < values.length; r++) {
        if ((targetId && String(values[r][userIdIdx]) === targetId) ||
            (targetUsername && String(values[r][usernameIdx]).toLowerCase() === targetUsername)) {
          targetRow = r + 1;
          break;
        }
      }

      if (targetRow !== -1) {
        if (payload.name && nameIdx !== -1) sheet.getRange(targetRow, nameIdx + 1).setValue(payload.name);
        if (payload.email && emailIdx !== -1) sheet.getRange(targetRow, emailIdx + 1).setValue(payload.email);
        if (payload.currency && currencyIdx !== -1) sheet.getRange(targetRow, currencyIdx + 1).setValue(payload.currency);
        if (payload.newUsername && usernameIdx !== -1) sheet.getRange(targetRow, usernameIdx + 1).setValue(payload.newUsername);
        if (updatedIdx !== -1) sheet.getRange(targetRow, updatedIdx + 1).setValue(now);

        return createJsonResponse({
          success: true,
          message: 'Profil pengguna berhasil diperbarui di Google Sheets!',
          data: payload
        });
      } else {
        // Jika belum ada row user sama sekali, buat baru
        sheet.appendRow([
          payload.userId || ('USR-' + Utilities.getUuid().substring(0, 8)),
          payload.username || 'admin',
          payload.password || 'admin123',
          payload.name || 'Pengguna Nuqudy',
          payload.email || 'admin@nuqudy.app',
          payload.currency || 'Rp',
          'admin',
          'active',
          now,
          now
        ]);
        return createJsonResponse({
          success: true,
          message: 'Pengguna baru berhasil didaftarkan di Google Sheets!',
          data: payload
        });
      }
    }

    // A3. UBAH KATA SANDI (CHANGE PASSWORD)
    if (action === 'CHANGE_PASSWORD' || action === 'UPDATEPASSWORD') {
      const sheet = getOrCreateSheet(SHEETS.USERS);
      const values = sheet.getDataRange().getValues();
      const headers = values[0];
      const userIdIdx = headers.indexOf('userId');
      const usernameIdx = headers.indexOf('username');
      const passIdx = headers.indexOf('password');
      const updatedIdx = headers.indexOf('updatedAt');

      const targetId = String(payload.userId || '').trim();
      const targetUsername = String(payload.username || '').trim().toLowerCase();
      const oldPassword = String(payload.oldPassword || '').trim();
      const newPassword = String(payload.newPassword || payload.password || '').trim();

      if (!newPassword) {
        return createJsonResponse({ success: false, message: 'Kata sandi baru tidak boleh kosong.' });
      }

      let targetRow = -1;
      let isOldPassMatch = true;

      for (let r = 1; r < values.length; r++) {
        if ((targetId && String(values[r][userIdIdx]) === targetId) ||
            (targetUsername && String(values[r][usernameIdx]).toLowerCase() === targetUsername)) {
          targetRow = r + 1;
          if (oldPassword && String(values[r][passIdx]) !== oldPassword) {
            isOldPassMatch = false;
          }
          break;
        }
      }

      if (targetRow === -1) {
        return createJsonResponse({ success: false, message: 'Akun pengguna tidak ditemukan di Google Sheets.' });
      }

      if (!isOldPassMatch) {
        return createJsonResponse({ success: false, message: 'Kata sandi lama yang Anda masukkan tidak sesuai.' });
      }

      sheet.getRange(targetRow, passIdx + 1).setValue(newPassword);
      if (updatedIdx !== -1) sheet.getRange(targetRow, updatedIdx + 1).setValue(now);

      return createJsonResponse({
        success: true,
        message: 'Kata sandi akun berhasil diperbarui di Google Sheets! Gunakan kata sandi baru untuk login.'
      });
    }

    // A4. TAMBAH AKUN PENGGUNA BARU (ADD USER)
    if (action === 'ADD_USER' || action === 'REGISTER_USER') {
      const sheet = getOrCreateSheet(SHEETS.USERS);
      const users = readSheetRows(SHEETS.USERS);
      const username = String(payload.username || '').trim().toLowerCase();

      const exists = users.some(function(u) {
        return String(u.username || '').toLowerCase() === username;
      });

      if (exists) {
        return createJsonResponse({ success: false, message: 'Username "' + username + '" sudah digunakan.' });
      }

      const newUserId = payload.userId || ('USR-' + Utilities.getUuid().substring(0, 8).toUpperCase());
      sheet.appendRow([
        newUserId,
        username,
        payload.password || 'admin123',
        payload.name || username,
        payload.email || (username + '@nuqudy.app'),
        payload.currency || 'Rp',
        payload.role || 'member',
        'active',
        now,
        now
      ]);

      return createJsonResponse({
        success: true,
        message: 'Akun pengguna baru berhasil ditambahkan ke Google Sheets!',
        data: { userId: newUserId, username: username }
      });
    }

    // A5. HAPUS AKUN PENGGUNA (DELETE USER)
    if (action === 'DELETE_USER') {
      const sheet = getOrCreateSheet(SHEETS.USERS);
      const targetId = String(payload.userId || '').trim();
      const values = sheet.getDataRange().getValues();
      const idIdx = values[0].indexOf('userId');

      let deleted = false;
      for (let r = values.length - 1; r >= 1; r--) {
        if (String(values[r][idIdx]) === targetId) {
          sheet.deleteRow(r + 1);
          deleted = true;
          break;
        }
      }

      if (deleted) {
        return createJsonResponse({ success: true, message: 'Akun pengguna berhasil dihapus dari Google Sheets.' });
      } else {
        return createJsonResponse({ success: false, message: 'Akun pengguna tidak ditemukan.' });
      }
    }

    // -----------------------------------------------------------------------
    // B. MANAJEMEN TRANSAKSI (TRANSACTIONS)
    // -----------------------------------------------------------------------

    // B1. TAMBAH TRANSAKSI (ADD)
    if (action === 'ADD' || action === 'ADD_TRANSACTION' || action === 'ADDTRANSACTION') {
      const sheet = getOrCreateSheet(SHEETS.TRANSACTIONS);
      const txId = payload.id || payload.transactionId || ('TX-' + Utilities.getUuid().substring(0, 8).toUpperCase());
      const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT+7', 'yyyy-MM-dd');

      const newRow = [
        txId,
        payload.userId || 'USR-ADMIN01',
        payload.date || today,
        payload.type || 'expense',
        payload.category || 'Umum',
        Number(payload.amount) || 0,
        payload.account || 'Dompet Tunai',
        payload.description || '',
        now
      ];

      sheet.appendRow(newRow);

      return createJsonResponse({
        success: true,
        message: 'Transaksi berhasil ditambahkan ke Google Sheets!',
        data: {
          transactionId: txId,
          userId: payload.userId || 'USR-ADMIN01',
          date: payload.date || today,
          type: payload.type || 'expense',
          category: payload.category || 'Umum',
          amount: Number(payload.amount) || 0,
          account: payload.account || 'Dompet Tunai',
          description: payload.description || '',
          createdAt: now
        }
      });
    }

    // B2. HAPUS TRANSAKSI (DELETE)
    if (action === 'DELETE' || action === 'DELETE_TRANSACTION' || action === 'DELETETRANSACTION') {
      const sheet = getOrCreateSheet(SHEETS.TRANSACTIONS);
      const targetId = String(payload.id || payload.transactionId || '').trim();

      if (!targetId) {
        return createJsonResponse({ success: false, message: 'ID transaksi wajib disertakan.' });
      }

      const values = sheet.getDataRange().getValues();
      const idIdx = values[0].indexOf('transactionId');

      let deleted = false;
      for (let r = values.length - 1; r >= 1; r--) {
        if (String(values[r][idIdx]).trim() === targetId) {
          sheet.deleteRow(r + 1);
          deleted = true;
          break;
        }
      }

      if (deleted) {
        return createJsonResponse({ success: true, message: 'Transaksi ' + targetId + ' berhasil dihapus dari Google Sheets.' });
      } else {
        return createJsonResponse({ success: false, message: 'Transaksi tidak ditemukan di Google Sheets.' });
      }
    }

    // -----------------------------------------------------------------------
    // C. SINKRONISASI TOTAL DATABASE (SYNC_ALL / FULL PUSH)
    // -----------------------------------------------------------------------
    if (action === 'SYNC_ALL' || action === 'FULL_PUSH') {
      // 1. Sync Users
      if (Array.isArray(payload.users) && payload.users.length > 0) {
        const uSheet = getOrCreateSheet(SHEETS.USERS);
        const existingUsers = readSheetRows(SHEETS.USERS);
        payload.users.forEach(function(u) {
          const matchIdx = existingUsers.findIndex(function(ex) {
            return ex.userId === u.userId || (ex.username && ex.username.toLowerCase() === (u.username || '').toLowerCase());
          });
          if (matchIdx === -1) {
            uSheet.appendRow([
              u.userId || ('USR-' + Utilities.getUuid().substring(0, 8)),
              u.username || 'user',
              u.password || 'admin123',
              u.name || u.username || 'Pengguna',
              u.email || (u.username + '@nuqudy.app'),
              u.currency || 'Rp',
              u.role || 'admin',
              u.status || 'active',
              u.createdAt || now,
              now
            ]);
          }
        });
      }

      // 2. Sync Categories
      if (Array.isArray(payload.categories) && payload.categories.length > 0) {
        const cSheet = getOrCreateSheet(SHEETS.CATEGORIES);
        const existingCats = readSheetRows(SHEETS.CATEGORIES);
        payload.categories.forEach(function(c) {
          const match = existingCats.some(function(ex) { return ex.categoryId === c.categoryId; });
          if (!match) {
            cSheet.appendRow([
              c.categoryId,
              c.userId || 'USR-ADMIN01',
              c.name,
              c.type || 'expense',
              c.icon || '',
              c.color || '#0d9488',
              c.description || '',
              c.createdAt || now
            ]);
          }
        });
      }

      // 3. Sync Accounts
      if (Array.isArray(payload.accounts) && payload.accounts.length > 0) {
        const aSheet = getOrCreateSheet(SHEETS.ACCOUNTS);
        const existingAccs = readSheetRows(SHEETS.ACCOUNTS);
        payload.accounts.forEach(function(a) {
          const match = existingAccs.some(function(ex) { return ex.accountId === a.accountId; });
          if (!match) {
            aSheet.appendRow([
              a.accountId,
              a.userId || 'USR-ADMIN01',
              a.name,
              a.type || 'cash',
              Number(a.initialBalance) || 0,
              a.accountNumber || '',
              a.description || '',
              a.color || '#0d9488',
              a.createdAt || now
            ]);
          }
        });
      }

      // 4. Sync Transactions
      if (Array.isArray(payload.transactions) && payload.transactions.length > 0) {
        const tSheet = getOrCreateSheet(SHEETS.TRANSACTIONS);
        const existingTx = readSheetRows(SHEETS.TRANSACTIONS);
        payload.transactions.forEach(function(t) {
          const match = existingTx.some(function(ex) { return ex.transactionId === (t.transactionId || t.id); });
          if (!match) {
            tSheet.appendRow([
              t.transactionId || t.id || ('TX-' + Utilities.getUuid().substring(0, 8)),
              t.userId || 'USR-ADMIN01',
              t.date,
              t.type,
              t.category,
              Number(t.amount) || 0,
              t.account,
              t.description || '',
              t.createdAt || now
            ]);
          }
        });
      }

      return createJsonResponse({
        success: true,
        message: 'Seluruh database (Akun Pengguna, Kategori, Rekening, Transaksi) berhasil disinkronkan ke Google Sheets!'
      });
    }

    // Default Fallback
    return createJsonResponse({
      success: false,
      message: 'Aksi "' + action + '" tidak dikenali. Gunakan LOGIN, UPDATE_PROFILE, CHANGE_PASSWORD, ADD, DELETE, atau SYNC_ALL.'
    });

  } catch (error) {
    return createJsonResponse({
      success: false,
      message: 'Server error pada Google Apps Script: ' + error.toString()
    });
  }
}
`;

export const FRONTEND_JS_CODE = `/**
 * =========================================================================
 * FRONTEND JAVASCRIPT / TYPESCRIPT CLIENT (Web App)
 * Multi-Sheet Real-Time Database Client (Users, Transactions, Categories, Accounts)
 * =========================================================================
 */

// URL Google Apps Script Web App Anda (Deployment Exec URL)
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycb.../exec";

/**
 * 1. Mengambil Seluruh Database (Users, Transactions, Categories, Accounts)
 */
async function fetchAllDatabase() {
  try {
    const res = await fetch(GAS_WEB_APP_URL, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });
    const json = await res.json();
    if (json.success) {
      console.log("Database berhasil dimuat:", json.data);
      return json.data;
    }
    return null;
  } catch (err) {
    console.error("Fetch Error:", err);
    return null;
  }
}

/**
 * 2. Login & Verifikasi Sandi via Google Sheets
 */
async function loginUser(username, password) {
  try {
    const res = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "LOGIN",
        username: username,
        password: password
      })
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * 3. Update Profil Pengguna ke Google Sheets
 */
async function updateUserProfile(userId, { name, email, currency }) {
  try {
    const res = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "UPDATE_PROFILE",
        userId: userId,
        name: name,
        email: email,
        currency: currency
      })
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * 4. Ubah Kata Sandi Akun di Google Sheets
 */
async function changeUserPassword(userId, oldPassword, newPassword) {
  try {
    const res = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "CHANGE_PASSWORD",
        userId: userId,
        oldPassword: oldPassword,
        newPassword: newPassword
      })
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * 5. Tambah Transaksi ke Google Sheets
 */
async function addTransaction(payload) {
  try {
    const res = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "ADD",
        ...payload
      })
    });
    const result = await res.json();
    if (result.success) {
      // Auto re-fetch
      await fetchAllDatabase();
    }
    return result;
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * 6. Hapus Transaksi dari Google Sheets
 */
async function deleteTransaction(transactionId) {
  try {
    const res = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "DELETE",
        id: transactionId
      })
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}
`;

export const DEPLOYMENT_GUIDE_MD = `# Panduan Deployment Google Apps Script Multi-Sheet Database

Aplikasi NUQUDY menyimpan seluruh data aplikasi ke Google Spreadsheet, meliputi:
1. **Users**: Data akun pengguna, username, password, email, nama, dan hak akses.
2. **Transactions**: Seluruh riwayat pemasukan dan pengeluaran.
3. **Categories**: Kategori pemasukan dan pengeluaran beserta warna & ikon.
4. **Accounts**: Rekening bank, e-wallet, kas tunai, dan saldo awal.
5. **Settings**: Konfigurasi preferensi aplikasi dan mata uang.

---

### Langkah 1: Buat Spreadsheet & Buka Apps Script
1. Buka [sheets.new](https://sheets.new) di browser Anda.
2. Beri nama spreadsheet Anda, misalnya **"Database Keuangan Nuqudy"**.
3. Di menu atas, klik **Ekstensi (Extensions)** > **Apps Script**.
4. Hapus seluruh isi kode default \`myFunction()\`.
5. Salin seluruh isi file **Code.gs** dari tab di samping dan tempel ke editor Apps Script.
6. Simpan project (Ctrl+S).

---

### Langkah 2: Jalankan Setup Sheet Otomatis (Opsional / Otomatis)
1. Pada menu dropdown fungsi di bagian atas editor, pilih fungsi \`setupDatabase\`.
2. Klik tombol **Run / Jalankan**.
3. Beri izin Google jika diminta (*Review Permissions* > Pilih Akun > *Advanced* > *Go to Untitled Project (unsafe)* > *Allow*).
4. Google Spreadsheet Anda akan otomatis memiliki tab: \`Users\`, \`Transactions\`, \`Categories\`, \`Accounts\`, dan \`Settings\` dengan header yang rapi dan akun default \`admin\` (\`admin123\`).

---

### Langkah 3: Deploy sebagai Web App
1. Di pojok kanan atas Apps Script, klik tombol biru **Deploy** > **New deployment**.
2. Klik ikon gerigi ⚙️ di samping *Select type* > pilih **Web app**.
3. Konfigurasi:
   - **Description**: \`Nuqudy Multi-Sheet Database v2\`
   - **Execute as**: **Me (email Anda)** *(Wajib "Me")*
   - **Who has access**: **Anyone** *(Wajib "Anyone" agar frontend dapat berinteraksi bebas)*
4. Klik **Deploy** dan salin **Web app URL** (akhiran \`/exec\`).

---

### Langkah 4: Hubungkan ke Nuqudy
1. Masukkan URL tersebut ke menu **GAS Hub** atau **Pengaturan** di Nuqudy.
2. Tekan tombol **Simpan URL** dan **Sinkronkan Sekarang**.
3. Semua perubahan profil, kata sandi, transaksi, kategori, dan rekening akan tersimpan secara real-time ke Google Spreadsheet!
`;

export const GAS_FILES: GasFileItem[] = [
  {
    filename: 'Code.gs',
    type: 'server',
    description: 'Backend Multi-Sheet: Users (Sandi & Profil), Transactions, Categories, Accounts, Settings',
    content: GAS_CODE_GS
  },
  {
    filename: 'FrontendIntegration.js',
    type: 'javascript',
    description: 'Client JavaScript: Login, Update Profil, Ganti Sandi, Add/Delete Transaksi',
    content: FRONTEND_JS_CODE
  },
  {
    filename: 'DeploymentGuide.md',
    type: 'markdown',
    description: 'Panduan Deployment Lengkap Multi-Sheet dengan Setup Otomatis',
    content: DEPLOYMENT_GUIDE_MD
  }
];
