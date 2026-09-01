/**
 * Production-ready Google Apps Script Code Bundle for NUQUDY
 * Google Sheets as Real-Time Database Backend
 */

export interface GasFileItem {
  filename: string;
  type: 'server' | 'javascript' | 'markdown';
  description: string;
  content: string;
}

export const GAS_CODE_GS = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT (Code.gs) - DATABASE BACKEND REAL-TIME
 * Web App REST API untuk Google Spreadsheet
 * =========================================================================
 */

// Nama Sheet Database
const SHEET_NAME = "Transactions";

/**
 * Helper: Ambil atau buat Sheet dengan Header otomatis
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  // Jika baris masih 0, tambahkan header
  if (sheet.getLastRow() === 0) {
    const headers = [
      "transactionId",
      "userId",
      "date",
      "type",
      "category",
      "amount",
      "account",
      "description",
      "createdAt"
    ];
    sheet.appendRow(headers);
    
    // Format Header (Background hijau teal, font putih tebal, freeze baris 1)
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#0d9488");
    headerRange.setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

/**
 * Helper: Format Output JSON dengan Header CORS
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 1. FUNGSI doGet(e)
 * Mengambil seluruh data transaksi dari Google Sheets dalam format JSON
 */
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const rows = sheet.getDataRange().getValues();
    
    // Jika hanya ada header atau kosong
    if (rows.length <= 1) {
      return createJsonResponse({
        success: true,
        message: "Data masih kosong",
        data: []
      });
    }
    
    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    // Format setiap baris menjadi objek JSON
    const result = dataRows.map(row => {
      const item = {};
      headers.forEach((header, index) => {
        let val = row[index];
        // Format tanggal jika objek Date
        if (val instanceof Date) {
          val = Utilities.formatDate(val, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd");
        }
        item[header] = val;
      });
      return item;
    });
    
    // Urutkan transaksi terbaru di atas
    result.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

    return createJsonResponse({
      success: true,
      total: result.length,
      data: result
    });
  } catch (error) {
    return createJsonResponse({
      success: false,
      message: "Gagal mengambil data: " + error.toString()
    });
  }
}

/**
 * 2. FUNGSI doPost(e)
 * Menangani aksi penambahan ('ADD') dan penghapusan ('DELETE') data
 */
function doPost(e) {
  try {
    // Parsing request payload (Mendukung JSON string maupun URL Encoded)
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = String(payload.action || "").toUpperCase();
    const sheet = getOrCreateSheet();
    const now = new Date().toISOString();

    // ==========================================
    // ACTION: ADD (Menambah Baris Transaksi Baru)
    // ==========================================
    if (action === "ADD" || action === "ADDTRANSACTION") {
      const txId = payload.id || payload.transactionId || ("TX-" + Utilities.getUuid().substring(0, 8).toUpperCase());
      const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd");

      const newRow = [
        txId,
        payload.userId || "USR-DEFAULT",
        payload.date || today,
        payload.type || "expense",
        payload.category || "Umum",
        Number(payload.amount) || 0,
        payload.account || "Dompet Tunai",
        payload.description || "",
        now
      ];

      sheet.appendRow(newRow);

      return createJsonResponse({
        success: true,
        message: "Data berhasil ditambahkan ke Google Sheets!",
        data: {
          transactionId: txId,
          userId: payload.userId || "USR-DEFAULT",
          date: payload.date || today,
          type: payload.type || "expense",
          category: payload.category || "Umum",
          amount: Number(payload.amount) || 0,
          account: payload.account || "Dompet Tunai",
          description: payload.description || "",
          createdAt: now
        }
      });
    }

    // ==========================================
    // ACTION: DELETE (Menghapus Baris Berdasarkan ID)
    // ==========================================
    if (action === "DELETE" || action === "DELETETRANSACTION") {
      const targetId = String(payload.id || payload.transactionId || "").trim();
      
      if (!targetId) {
        return createJsonResponse({
          success: false,
          message: "ID transaksi wajib disertakan untuk penghapusan."
        });
      }

      const values = sheet.getDataRange().getValues();
      if (values.length <= 1) {
        return createJsonResponse({
          success: false,
          message: "Data sheet kosong, tidak ada yang dapat dihapus."
        });
      }

      const headers = values[0];
      const idColumnIndex = headers.indexOf("transactionId");

      if (idColumnIndex === -1) {
        return createJsonResponse({
          success: false,
          message: "Kolom transactionId tidak ditemukan pada sheet."
        });
      }

      let deleted = false;
      // Loop dari bawah ke atas agar index baris tidak bergeser jika ada duplikasi
      for (let r = values.length - 1; r >= 1; r--) {
        if (String(values[r][idColumnIndex]).trim() === targetId) {
          sheet.deleteRow(r + 1); // Row index di Apps Script berbasis 1
          deleted = true;
          break;
        }
      }

      if (deleted) {
        return createJsonResponse({
          success: true,
          message: "Data dengan ID " + targetId + " berhasil dihapus dari Google Sheets!"
        });
      } else {
        return createJsonResponse({
          success: false,
          message: "Data dengan ID " + targetId + " tidak ditemukan di Google Sheets."
        });
      }
    }

    // ==========================================
    // ACTION: READ / GET_ALL (Mengambil Data via POST)
    // ==========================================
    if (action === "READ" || action === "GET" || action === "GETTRANSACTIONS") {
      return doGet(e);
    }

    // Default jika action tidak dikenali
    return createJsonResponse({
      success: false,
      message: "Action tidak dikenali. Gunakan 'ADD', 'DELETE', atau 'READ'."
    });

  } catch (error) {
    return createJsonResponse({
      success: false,
      message: "Terjadi kesalahan server: " + error.toString()
    });
  }
}
`;

export const FRONTEND_JS_CODE = `/**
 * =========================================================================
 * FRONTEND JAVASCRIPT / TYPESCRIPT CLIENT (Web App)
 * Real-time Fetch, Add, Delete with Automatic Re-fetch
 * =========================================================================
 */

// Ganti dengan URL Google Apps Script Web App Anda hasil Deployment
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycb.../exec";

// 1. FUNGSI fetchData() - Mengambil Data Terbaru & Memperbarui UI
async function fetchData() {
  try {
    console.log("Sedang mengambil data dari Google Sheets...");
    
    const response = await fetch(GAS_WEB_APP_URL, {
      method: "GET",
      // Mode cors default untuk Google Apps Script Web App
      headers: {
        "Accept": "application/json"
      }
    });

    const result = await response.json();

    if (result.success) {
      console.log("Data berhasil diambil:", result.data);
      // Panggil fungsi render UI aplikasi Anda di sini
      renderUI(result.data);
      return result.data;
    } else {
      console.error("Gagal mengambil data:", result.message);
      alert("Gagal memuat data: " + result.message);
      return [];
    }
  } catch (error) {
    console.error("Error pada fetchData():", error);
    return [];
  }
}

// 2. FUNGSI addData(payload) - Mengirim Data Baru ke Google Sheets
async function addData(payload) {
  try {
    console.log("Sedang mengirim data baru ke Google Sheets...", payload);

    // Kirim POST request dengan action: 'ADD'
    const response = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      // Gunakan text/plain untuk menghindari CORS Preflight (OPTIONS) di browser
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "ADD",
        ...payload
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log("Data berhasil ditambahkan!", result);
      
      // AUTO RE-FETCH: Muat ulang data terbaru secara otomatis setelah tambah
      await fetchData();
      return result;
    } else {
      console.error("Gagal menambah data:", result.message);
      alert("Gagal menambahkan: " + result.message);
      return null;
    }
  } catch (error) {
    console.error("Error pada addData():", error);
    return null;
  }
}

// 3. FUNGSI deleteData(id) - Menghapus Baris Berdasarkan ID
async function deleteData(id) {
  try {
    console.log("Sedang menghapus data ID:", id);

    // Kirim POST request dengan action: 'DELETE'
    const response = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "DELETE",
        id: id
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log("Data berhasil dihapus!", result);

      // AUTO RE-FETCH: Muat ulang data terbaru secara otomatis setelah hapus
      await fetchData();
      return result;
    } else {
      console.error("Gagal menghapus data:", result.message);
      alert("Gagal menghapus: " + result.message);
      return null;
    }
  } catch (error) {
    console.error("Error pada deleteData():", error);
    return null;
  }
}

// Contoh Fungsi Render UI Sederhana
function renderUI(dataList) {
  const container = document.getElementById("transaction-list");
  if (!container) return;

  container.innerHTML = "";
  dataList.forEach(item => {
    const div = document.createElement("div");
    div.className = "p-3 border-b flex justify-between items-center";
    div.innerHTML = \`
      <div>
        <p class="font-bold">\${item.category} - Rp \${Number(item.amount).toLocaleString('id-ID')}</p>
        <p class="text-xs text-gray-500">\${item.date} | \${item.account} | \${item.description || '-'}</p>
      </div>
      <button onclick="deleteData('\${item.transactionId}')" class="px-2 py-1 bg-red-500 text-white rounded text-xs">
        Hapus
      </button>
    \`;
    container.appendChild(div);
  });
}
`;

export const DEPLOYMENT_GUIDE_MD = `# Panduan Deployment Google Apps Script sebagai Database Web App

Ikuti langkah-langkah berikut untuk menghubungkan Google Sheets dengan Web App secara real-time:

### Langkah 1: Buat Google Spreadsheet Baru
1. Buka [sheets.new](https://sheets.new) di browser Anda.
2. Beri nama spreadsheet Anda, misalnya **"Database Keuangan Nuqudy"**.

### Langkah 2: Buka Editor Apps Script
1. Pada menu navigasi Google Sheets di bagian atas, klik **Ekstensi (Extensions)** > **Apps Script**.
2. Hapus seluruh isi file default \`myFunction()\`.
3. Salin seluruh isi kode dari tab **Code.gs** dan tempel (*paste*) ke editor Apps Script.
4. Klik ikon **Simpan (Save / Ctrl+S)**.

### Langkah 3: Deploy sebagai Web App (PENTING!)
1. Di pojok kanan atas Apps Script, klik tombol biru **Deploy** > pilih **New deployment (Penerapan baru)**.
2. Klik ikon gerigi ⚙️ di samping *Select type* dan pilih **Web app**.
3. Isi konfigurasi deployment dengan tepat:
   - **Description**: \`Database API Nuqudy v1\`
   - **Execute as (Jalankan sebagai)**: Pilih **Me (emailanda@gmail.com)**
     *(Wajib dipilih "Me" agar script berjalan dengan izin akun Google Anda)*
   - **Who has access (Siapa yang memiliki akses)**: Pilih **Anyone (Siapa saja)**
     *(Wajib "Anyone" agar aplikasi web dapat membaca & menulis data tanpa login Google tambahan)*
4. Klik **Deploy**.
5. Jika muncul permintaan otorisasi (*Authorization required*):
   - Klik **Authorize access**.
   - Pilih akun Google Anda.
   - Klik **Advanced** > klik **Go to Untitled project (unsafe)**.
   - Klik **Allow**.

### Langkah 4: Hubungkan ke Aplikasi
1. Salin **Web app URL** yang berformat \`https://script.google.com/macros/s/AKfycb.../exec\`.
2. Kembali ke aplikasi Nuqudy ini, tempelkan URL tersebut ke kolom **URL Web App Google Apps Script** di tab Backend Hub / Pengaturan, lalu klik **Simpan URL**.
3. Klik tombol **Tes Koneksi / Tarik Data** untuk menguji sinkronisasi secara langsung!
`;

export const GAS_FILES: GasFileItem[] = [
  {
    filename: 'Code.gs',
    type: 'server',
    description: 'Backend Google Apps Script: doGet(e), doPost(e) dengan action ADD & DELETE',
    content: GAS_CODE_GS
  },
  {
    filename: 'FrontendIntegration.js',
    type: 'javascript',
    description: 'Client JavaScript: fetchData(), addData(), deleteData() dengan Auto Re-fetch',
    content: FRONTEND_JS_CODE
  },
  {
    filename: 'DeploymentGuide.md',
    type: 'markdown',
    description: 'Petunjuk Deployment Lengkap (Execute as: Me, Who has access: Anyone)',
    content: DEPLOYMENT_GUIDE_MD
  }
];

