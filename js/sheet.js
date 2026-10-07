/* ==========================================================================
   METAPIA — sheet.js
   Komunikasi dengan Google Sheet (lewat Google Apps Script).
   Dipakai di: index.html (login nama + PIN), kuis.html (kirim nilai),
   dashboard.html (ambil nilai terbaru).

   ISI URL DI BAWAH dengan "URL aplikasi web" (berakhiran /exec) dari
   Google Apps Script. Cara bikinnya ada di google-sheet/Code.gs.
   Selama masih kosong, web jalan "offline": login gak dicek ke sheet.
   ========================================================================== */
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbz-f4OJgQayEX5lfmHgFwRIfang_DOSAZCiBMNEKVYkaHlLPGYtyiijqLlrSWSzYVY-/exec";

/**
 * Kirim data & BACA balasannya (login nama + PIN, kirim nilai kuis).
 * Body sengaja teks biasa (bukan application/json) biar browser gak perlu
 * izin tambahan (preflight) yang gak didukung Apps Script.
 * Gagal konek / kelamaan (15 detik) -> lempar error.
 */
async function tanyaSheet(data) {
  const kontrol = new AbortController();
  const timer = setTimeout(() => kontrol.abort(), 15000);
  try {
    const res = await fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      body: JSON.stringify(data),
      signal: kontrol.signal,
    });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Ambil nilai kuis terakhir siswa dari sheet (buat Dashboard). Gagal -> null. */
async function ambilStatusSiswa(nama, pin) {
  if (!GOOGLE_SHEET_URL) return null;
  try {
    const url = `${GOOGLE_SHEET_URL}?aksi=status&nama=${encodeURIComponent(nama)}&pin=${encodeURIComponent(pin)}`;
    const res = await fetch(url);
    return await res.json();
  } catch (e) {
    return null;
  }
}

/**
 * Simpan nilai kuis terakhir ke browser (localStorage "metapia_nilai"),
 * per nama siswa. Dipakai setelah kuis selesai & setelah ambil data dari sheet.
 */
function simpanNilaiLokal(nama, nilai, tanggal) {
  let semua = {};
  try { semua = JSON.parse(localStorage.getItem("metapia_nilai")) || {}; } catch (e) {}
  const lama = semua[nama] || { terbaik: 0 };
  semua[nama] = {
    terakhir: nilai,
    terbaik: Math.max(lama.terbaik || 0, nilai),
    tanggal: tanggal || new Date().toISOString(),
  };
  localStorage.setItem("metapia_nilai", JSON.stringify(semua));
}

/* ==========================================================================
   SKOR GAME (localStorage "metapia_game"), per nama siswa:
   { "Acel": { skor: { 1: {terbaik, terakhir, tanggal}, ... },
               terakhir: { id, judul, skor, tanggal } } }
   "terakhir" = game yang paling baru dimainkan -> ditampilkan di Dashboard
   ========================================================================== */
function bacaSkorGameLokal(nama) {
  try {
    return (JSON.parse(localStorage.getItem("metapia_game")) || {})[nama] || {};
  } catch (e) {
    return {};
  }
}

/** game terakhir dari Google Sheet (cuma tau judulnya) -> simpan buat Dashboard */
function simpanGameTerakhirLokal(nama, judul, skor, tanggal) {
  let semua = {};
  try { semua = JSON.parse(localStorage.getItem("metapia_game")) || {}; } catch (e) {}
  const data = semua[nama] || {};
  const lama = data.terakhir;
  // jangan timpa kalau yang di browser lebih baru
  if (lama && lama.tanggal && tanggal && new Date(lama.tanggal) > new Date(tanggal)) return;
  data.terakhir = { id: lama && lama.judul === judul ? lama.id : null, judul, skor, tanggal };
  semua[nama] = data;
  localStorage.setItem("metapia_game", JSON.stringify(semua));
}

function simpanSkorGameLokal(nama, id, judul, skor, tanggal) {
  let semua = {};
  try { semua = JSON.parse(localStorage.getItem("metapia_game")) || {}; } catch (e) {}
  const data = semua[nama] || {};
  data.skor = data.skor || {};
  const lama = data.skor[id] || { terbaik: 0 };
  const waktu = tanggal || new Date().toISOString();
  data.skor[id] = { terbaik: Math.max(lama.terbaik || 0, skor), terakhir: skor, tanggal: waktu };
  data.terakhir = { id, judul, skor, tanggal: waktu };
  semua[nama] = data;
  localStorage.setItem("metapia_game", JSON.stringify(semua));
}
