/**
 * Google Apps Script: Monitoring Penyisiran SE2026 (High Performance Edition)
 * 
 * FUNGSI:
 * 1. Menu Google Sheet: "📊 Monitoring SE2026" → "📤 Upload Data Hari Ini (Multi Excel)"
 * 2. Web App API (doGet): Mengembalikan 2D Array langsung (cepat & hemat bandwidth)
 * 3. Midnight Transfer: Otomasi copy data antar sheet saat tengah malam
 * 
 * CARA PAKAI MENU UPLOAD:
 * 1. Buka Google Sheet → Refresh halaman spreadsheet
 * 2. Menu "📊 Monitoring SE2026" akan muncul di sebelah kanan menu "Bantuan (Help)"
 * 3. Klik "📤 Upload Data Hari Ini (Multi Excel)"
 * 4. Pilih 1 atau beberapa file Excel (.xlsx) sekaligus
 * 5. Klik "Mulai Proses & Simpan"
 */

// ============================================
// MENU GOOGLE SHEET
// ============================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📊 Monitoring SE2026')
    .addItem('📤 Upload Data Hari Ini (Multi Excel)', 'showUploadDialog')
    .addSeparator()
    .addItem('🔄 Run Midnight Transfer (Manual)', 'testTransfer')
    .addToUi();
}

/**
 * Menampilkan Dialog Modal Upload Multi Excel
 */
function showUploadDialog() {
  var html = HtmlService.createHtmlOutput(getUploadDialogHtml())
    .setWidth(620)
    .setHeight(560)
    .setTitle('Upload Data Hari Ini — SE2026');
  SpreadsheetApp.getUi().showModalDialog(html, '📤 Upload Data Hari Ini (Multi Excel)');
}

/**
 * Menerima data gabungan dari dialog modal dan menulis ke sheet "data hari ini" (Overwrite)
 */
function saveUploadedData(allRows) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('data hari ini');
    
    if (!sheet) {
      sheet = ss.insertSheet('data hari ini');
    }

    if (!allRows || allRows.length === 0) {
      return { success: false, error: 'Tidak ada baris data yang dikirim.' };
    }

    // Bersihkan isi sheet lama (Overwrite)
    sheet.clearContents();
    SpreadsheetApp.flush();

    var totalRows = allRows.length;
    var colCount = allRows[0].length;
    var chunkSize = 5000;

    // Tulis bertahap per 5000 baris agar aman dari limit memori
    for (var i = 0; i < totalRows; i += chunkSize) {
      var chunk = allRows.slice(i, Math.min(i + chunkSize, totalRows));
      sheet.getRange(i + 1, 1, chunk.length, colCount).setValues(chunk);
    }

    SpreadsheetApp.flush();
    return {
      success: true,
      totalRows: totalRows - 1, // minus header
      colCount: colCount
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ============================================
// WEB APP API (doGet)
// ============================================

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetParam = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet : 'both';
    var result = {
      format: 'compact_2d'
    };

    var headers = null;

    if (sheetParam === 'hari_ini' || sheetParam === 'both') {
      var sheetHariIni = ss.getSheetByName('data hari ini');
      if (sheetHariIni) {
        var rawHariIni = sheetHariIni.getDataRange().getValues();
        if (rawHariIni.length > 0) {
          headers = rawHariIni[0];
          result.hariIni = rawHariIni.slice(1);
        } else {
          result.hariIni = [];
        }
      } else {
        result.hariIni = [];
      }
    }

    if (sheetParam === 'kemarin' || sheetParam === 'both') {
      var sheetKemarin = ss.getSheetByName('data kemarin');
      if (sheetKemarin) {
        var rawKemarin = sheetKemarin.getDataRange().getValues();
        if (rawKemarin.length > 0) {
          if (!headers) headers = rawKemarin[0];
          result.kemarin = rawKemarin.slice(1);
        } else {
          result.kemarin = [];
        }
      } else {
        result.kemarin = [];
      }
    }

    // Baca Tabel Target Wilayah (KODE_SUB_SLS, Keluarga, UB, UM, UMK, Target_Prelist)
    var sheetTarget = ss.getSheetByName('target wilayah') ||
                      ss.getSheetByName('Target Wilayah') ||
                      ss.getSheetByName('TARGET WILAYAH') ||
                      ss.getSheetByName('target_wilayah');
    if (!sheetTarget) {
      var allSheets = ss.getSheets();
      for (var i = 0; i < allSheets.length; i++) {
        var sName = allSheets[i].getName().toLowerCase().trim();
        if (sName.indexOf('target') !== -1) {
          sheetTarget = allSheets[i];
          break;
        }
      }
    }

    if (sheetTarget) {
      var rawTarget = sheetTarget.getDataRange().getValues();
      if (rawTarget.length > 0) {
        result.targetHeaders = rawTarget[0];
        result.targetWilayah = rawTarget.slice(1);
      } else {
        result.targetHeaders = [];
        result.targetWilayah = [];
      }
    } else {
      result.targetHeaders = [];
      result.targetWilayah = [];
    }

    result.headers = headers || [];
    result.timestamp = new Date().toISOString();
    result.success = true;

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    var errorResult = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    return ContentService
      .createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// MIDNIGHT TRANSFER (OTOMASI)
// ============================================

function midnightTransfer() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var sheetHariIni = ss.getSheetByName('data hari ini');
  var sheetKemarin = ss.getSheetByName('data kemarin');
  var sheetHistory = ss.getSheetByName('history data');
  
  if (!sheetHistory) {
    sheetHistory = ss.insertSheet('history data');
  }
  
  // STEP 1: Copy "data kemarin" → append ke "history data"
  var kemarinData = sheetKemarin.getDataRange().getValues();
  
  if (kemarinData.length > 1) {
    var kemarinHeaders = kemarinData[0];
    var kemarinRows = kemarinData.slice(1);
    
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var tanggal = yesterday.getDate();
    var bulan = yesterday.getMonth() + 1;
    var tahun = yesterday.getFullYear();
    
    var historyLastRow = sheetHistory.getLastRow();
    
    if (historyLastRow === 0) {
      var historyHeaders = kemarinHeaders.concat(['TANGGAL', 'BULAN', 'TAHUN']);
      sheetHistory.getRange(1, 1, 1, historyHeaders.length).setValues([historyHeaders]);
    }
    
    var historyRows = kemarinRows.map(function(row) {
      return row.concat([tanggal, bulan, tahun]);
    });
    
    if (historyRows.length > 0) {
      var startRow = sheetHistory.getLastRow() + 1;
      sheetHistory.getRange(startRow, 1, historyRows.length, historyRows[0].length)
        .setValues(historyRows);
    }
    
    Logger.log('Step 1: Appended ' + kemarinRows.length + ' rows to "history data"');
  }
  
  // STEP 2: Copy "data hari ini" → overwrite "data kemarin"
  var hariIniData = sheetHariIni.getDataRange().getValues();
  
  if (hariIniData.length > 0) {
    sheetKemarin.clearContents();
    sheetKemarin.getRange(1, 1, hariIniData.length, hariIniData[0].length)
      .setValues(hariIniData);
    
    Logger.log('Step 2: Copied ' + hariIniData.length + ' rows to "data kemarin"');
  }
  
  Logger.log('Midnight transfer completed!');
}

function testTransfer() {
  midnightTransfer();
  SpreadsheetApp.getUi().alert('Transfer selesai! "data hari ini" telah disalin ke "data kemarin", dan riwayat telah diarsipkan ke "history data".');
}

// ============================================
// HTML MODAL DIALOG UPLOAD
// ============================================

function getUploadDialogHtml() {
  return '<!DOCTYPE html>' +
  '<html>' +
  '<head>' +
  '  <meta charset="utf-8">' +
  '  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"><\/script>' +
  '  <style>' +
  '    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }' +
  '    body { margin: 0; padding: 20px; background-color: #fafafa; color: #333; }' +
  '    h3 { margin-top: 0; margin-bottom: 6px; color: #E65100; font-size: 1.25rem; font-weight: 700; }' +
  '    p { margin-top: 0; margin-bottom: 16px; font-size: 0.85rem; color: #666; line-height: 1.4; }' +
  '    .dropzone {' +
  '      border: 2px dashed #FFB74D;' +
  '      border-radius: 12px;' +
  '      background-color: #FFF8E1;' +
  '      padding: 24px 16px;' +
  '      text-align: center;' +
  '      cursor: pointer;' +
  '      transition: all 0.2s;' +
  '      margin-bottom: 16px;' +
  '    }' +
  '    .dropzone:hover, .dropzone.dragover {' +
  '      border-color: #F57C00;' +
  '      background-color: #FFE0B2;' +
  '    }' +
  '    .dropzone svg { width: 44px; height: 44px; fill: #F57C00; margin-bottom: 8px; }' +
  '    .dropzone-title { font-weight: 600; font-size: 0.95rem; color: #E65100; margin-bottom: 4px; }' +
  '    .dropzone-desc { font-size: 0.78rem; color: #888; }' +
  '    #fileInput { display: none; }' +
  '    .file-list {' +
  '      max-height: 140px;' +
  '      overflow-y: auto;' +
  '      background: #fff;' +
  '      border: 1px solid #e0e0e0;' +
  '      border-radius: 8px;' +
  '      padding: 8px;' +
  '      margin-bottom: 16px;' +
  '    }' +
  '    .file-item {' +
  '      display: flex;' +
  '      justify-content: space-between;' +
  '      align-items: center;' +
  '      padding: 6px 10px;' +
  '      border-bottom: 1px solid #f0f0f0;' +
  '      font-size: 0.8rem;' +
  '    }' +
  '    .file-item:last-child { border-bottom: none; }' +
  '    .file-name { font-weight: 500; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 320px; }' +
  '    .file-meta { color: #888; font-size: 0.75rem; }' +
  '    .stats-box {' +
  '      background: #fff;' +
  '      border-left: 4px solid #F57C00;' +
  '      padding: 10px 14px;' +
  '      border-radius: 4px;' +
  '      font-size: 0.82rem;' +
  '      margin-bottom: 18px;' +
  '      box-shadow: 0 1px 3px rgba(0,0,0,0.05);' +
  '    }' +
  '    .btn-submit {' +
  '      width: 100%;' +
  '      padding: 12px;' +
  '      background: linear-gradient(135deg, #FF9800, #F57C00);' +
  '      color: #fff;' +
  '      border: none;' +
  '      border-radius: 8px;' +
  '      font-size: 0.95rem;' +
  '      font-weight: 600;' +
  '      cursor: pointer;' +
  '      transition: background 0.2s;' +
  '      box-shadow: 0 2px 8px rgba(245, 124, 0, 0.3);' +
  '    }' +
  '    .btn-submit:hover:not(:disabled) {' +
  '      background: linear-gradient(135deg, #F57C00, #E65100);' +
  '    }' +
  '    .btn-submit:disabled {' +
  '      background: #ccc;' +
  '      cursor: not-allowed;' +
  '      box-shadow: none;' +
  '    }' +
  '    .status-msg {' +
  '      margin-top: 14px;' +
  '      font-size: 0.85rem;' +
  '      text-align: center;' +
  '      font-weight: 500;' +
  '    }' +
  '    .spinner {' +
  '      display: inline-block;' +
  '      width: 16px;' +
  '      height: 16px;' +
  '      border: 2px solid rgba(255, 152, 0, 0.3);' +
  '      border-radius: 50%;' +
  '      border-top-color: #F57C00;' +
  '      animation: spin 0.8s linear infinite;' +
  '      vertical-align: middle;' +
  '      margin-right: 6px;' +
  '    }' +
  '    @keyframes spin { to { transform: rotate(360deg); } }' +
  '  </style>' +
  '</head>' +
  '<body>' +
  '  <h3>📤 Upload File Data Hari Ini</h3>' +
  '  <p>Pilih satu atau lebih file Excel (.xlsx). Jika file lebih dari 1, baris data akan otomatis digabungkan dan <b>menimpa (overwrite)</b> sheet <i>data hari ini</i>.</p>' +
  '  ' +
  '  <div class="dropzone" id="dropzone">' +
  '    <svg viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>' +
  '    <div class="dropzone-title">Klik atau seret file Excel ke sini</div>' +
  '    <div class="dropzone-desc">Dapat memilih lebih dari 1 file sekaligus (.xlsx, .xls)</div>' +
  '  </div>' +
  '  <input type="file" id="fileInput" multiple accept=".xlsx, .xls" />' +
  '  ' +
  '  <div id="fileList" class="file-list" style="display:none;"></div>' +
  '  ' +
  '  <div id="statsBox" class="stats-box" style="display:none;">' +
  '    <div id="statsText"></div>' +
  '  </div>' +
  '  ' +
  '  <button id="btnSubmit" class="btn-submit" disabled>Pilih File Terlebih Dahulu</button>' +
  '  <div id="statusMsg" class="status-msg"></div>' +
  '  ' +
  '  <script>' +
  '    var selectedFiles = [];' +
  '    var dropzone = document.getElementById("dropzone");' +
  '    var fileInput = document.getElementById("fileInput");' +
  '    var fileList = document.getElementById("fileList");' +
  '    var statsBox = document.getElementById("statsBox");' +
  '    var statsText = document.getElementById("statsText");' +
  '    var btnSubmit = document.getElementById("btnSubmit");' +
  '    var statusMsg = document.getElementById("statusMsg");' +
  '    ' +
  '    dropzone.addEventListener("click", function() { fileInput.click(); });' +
  '    dropzone.addEventListener("dragover", function(e) { e.preventDefault(); dropzone.classList.add("dragover"); });' +
  '    dropzone.addEventListener("dragleave", function() { dropzone.classList.remove("dragover"); });' +
  '    dropzone.addEventListener("drop", function(e) { e.preventDefault(); dropzone.classList.remove("dragover"); handleFiles(e.dataTransfer.files); });' +
  '    fileInput.addEventListener("change", function(e) { handleFiles(e.target.files); });' +
  '    ' +
  '    function formatBytes(bytes) {' +
  '      if (bytes < 1024) return bytes + " B";' +
  '      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";' +
  '      return (bytes / 1048576).toFixed(2) + " MB";' +
  '    }' +
  '    ' +
  '    function handleFiles(files) {' +
  '      if (!files || files.length === 0) return;' +
  '      selectedFiles = Array.prototype.slice.call(files);' +
  '      renderFileList();' +
  '    }' +
  '    ' +
  '    function renderFileList() {' +
  '      fileList.innerHTML = "";' +
  '      fileList.style.display = "block";' +
  '      var totalSize = 0;' +
  '      selectedFiles.forEach(function(f, idx) {' +
  '        totalSize += f.size;' +
  '        var item = document.createElement("div");' +
  '        item.className = "file-item";' +
  '        item.innerHTML = "<span class=\\"file-name\\">📄 " + f.name + "</span><span class=\\"file-meta\\">" + formatBytes(f.size) + "</span>";' +
  '        fileList.appendChild(item);' +
  '      });' +
  '      ' +
  '      statsBox.style.display = "block";' +
  '      statsText.innerHTML = "<b>" + selectedFiles.length + " file dipilih</b> (Total: " + formatBytes(totalSize) + "). Data akan digabungkan otomatis.";' +
  '      btnSubmit.disabled = false;' +
  '      btnSubmit.innerText = "🚀 Mulai Proses & Simpan (" + selectedFiles.length + " File)";' +
  '      statusMsg.innerHTML = "";' +
  '    }' +
  '    ' +
  '    btnSubmit.addEventListener("click", async function() {' +
  '      if (selectedFiles.length === 0) return;' +
  '      btnSubmit.disabled = true;' +
  '      statusMsg.innerHTML = "<span class=\\"spinner\\"></span> Sedang membaca dan menggabungkan file Excel...";' +
  '      ' +
  '      try {' +
  '        var combinedRows = [];' +
  '        var detectedHeader = null;' +
  '        ' +
  '        for (var i = 0; i < selectedFiles.length; i++) {' +
  '          var file = selectedFiles[i];' +
  '          statusMsg.innerHTML = "<span class=\\"spinner\\"></span> Membaca file " + (i + 1) + " dari " + selectedFiles.length + ": " + file.name + "...";' +
  '          var arrayBuffer = await file.arrayBuffer();' +
  '          var workbook = XLSX.read(arrayBuffer, { type: "array" });' +
  '          var firstSheetName = workbook.SheetNames[0];' +
  '          var sheet = workbook.Sheets[firstSheetName];' +
  '          var json2D = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });' +
  '          ' +
  '          if (json2D && json2D.length > 0) {' +
  '            if (!detectedHeader) {' +
  '              detectedHeader = json2D[0];' +
  '              combinedRows.push(detectedHeader);' +
  '            }' +
  '            // Ambil baris data saja (abaikan header untuk file ke-2 dst)' +
  '            var dataRows = json2D.slice(1).filter(function(r) { return r && r.length > 0 && r.some(function(cell) { return cell !== ""; }); });' +
  '            combinedRows = combinedRows.concat(dataRows);' +
  '          }' +
  '        }' +
  '        ' +
  '        if (combinedRows.length <= 1) {' +
  '          throw new Error("Tidak ada data yang berhasil dibaca dari file Excel.");' +
  '        }' +
  '        ' +
  '        statusMsg.innerHTML = "<span class=\\"spinner\\"></span> Menyimpan " + (combinedRows.length - 1).toLocaleString("id-ID") + " baris data ke Google Sheet...";' +
  '        ' +
  '        google.script.run' +
  '          .withSuccessHandler(function(res) {' +
  '            if (res && res.success) {' +
  '              statusMsg.innerHTML = "✅ <b>Berhasil!</b> Tersimpan " + res.totalRows.toLocaleString("id-ID") + " baris data ke sheet <i>data hari ini</i>.";' +
  '              btnSubmit.innerText = "Selesai";' +
  '              setTimeout(function() {' +
  '                google.script.host.close();' +
  '              }, 2500);' +
  '            } else {' +
  '              statusMsg.innerHTML = "❌ Gagal: " + (res.error || "Terjadi kesalahan");' +
  '              btnSubmit.disabled = false;' +
  '            }' +
  '          })' +
  '          .withFailureHandler(function(err) {' +
  '            statusMsg.innerHTML = "❌ Gagal menyimpan: " + err.message;' +
  '            btnSubmit.disabled = false;' +
  '          })' +
  '          .saveUploadedData(combinedRows);' +
  '        ' +
  '      } catch (err) {' +
  '        statusMsg.innerHTML = "❌ Error: " + err.message;' +
  '        btnSubmit.disabled = false;' +
  '      }' +
  '    });' +
  '  <\/script>' +
  '</body>' +
  '</html>';
}
