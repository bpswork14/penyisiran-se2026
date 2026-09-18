# Monitoring Penyisiran SE2026 — Provinsi Sumatera Barat

Dashboard monitoring progress penyisiran Sensus Ekonomi 2026 (UMKM) Provinsi Sumatera Barat berbasis web dengan database Google Sheets berkecepatan tinggi.

## Fitur Utama & Optimasi Performa
- **Format 2D Array Compact**: Mengurangi beban payload Google Sheets dari ~25 MB menjadi ~3 MB (hemat bandwidth >80%).
- **Instant Load (IndexedDB Caching)**: Memuat data dari cache lokal seketika (0 detik) saat aplikasi dibuka, lalu melakukan sinkronisasi otomatis di latar belakang (*Stale-While-Revalidate*).
- **Precomputed Tree Deltas**: Perhitungan perbandingan H vs H-1 dilakukan secara bottom-up $O(N)$ di awal, sehingga expand/collapse dropdown baris berlangsung instan $O(1)$ tanpa lag.
- **Tabel Berjenjang**: Dropdown dari Kabupaten/Kota → Kecamatan → Desa/Nagari → SLS → Sub SLS.
- **Grouped Columns Status Assignment**:
  - **Pencacah**: Open, Draft, Submitted respondent, Submitted by pencacah, Rejected by pengawas.
  - **Pengawas**: Revoked by pengawas, Edited by pengawas, Approved by pengawas, Rejected by admin kabupaten.
  - **Admin Kab/Kota**: Revoked by admin kabupaten, Edited by admin kabupaten, Completed by admin kabupaten.
  - **Ringkasan**: Total Assignment, Total Responden Didata, % Progres Didata.
- **Tombol Refresh Data**: Tombol interaktif di Header untuk menarik paksa data terbaru dari Google Sheets kapan saja.
- **Midnight Transfer**: Otomasi Apps Script setiap tengah malam memindahkan `data hari ini` ke `data kemarin`, dan mengarsipkan `data kemarin` ke `history data`.

---

## Panduan Setup

### 1. Update Kode di Google Apps Script (Sangat Penting untuk Kecepatan)
1. Buka spreadsheet Google: [Google Sheets Monitoring SE2026](https://docs.google.com/spreadsheets/d/1O_8QbynLBl4uSt-B-VdIRyLJUOWPl_EJgHqVZ4bCt4c/edit)
2. Klik menu **Extensions** → **Apps Script**.
3. Buka file `apps_script.gs` di project ini, **copy semua kodenya** dan paste ke editor Google Apps Script (menimpa kode lama).
4. Klik **Deploy** → **Manage deployments**.
5. Klik ikon **Edit (Pensil)** pada Web App deployment yang aktif.
6. Pada dropdown **Version**, pilih **New version**.
7. Pastikan:
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
8. Klik **Deploy**.
9. Jika URL Web App berubah, update nilai `VITE_WEBAPP_URL` di file `.env`.

### 2. Jalankan di Lokal
```bash
cd web
npm install
npm run dev
```
Buka browser di `http://localhost:5173/`.

### 3. Deploy ke Vercel
1. Push branch / repo ke GitHub.
2. Hubungkan repository di [Vercel](https://vercel.com).
3. Set Environment Variable di Vercel Dashboard:
   - `VITE_WEBAPP_URL`: URL Web App Apps Script Anda (`https://script.google.com/macros/s/.../exec`)
4. Deploy!
