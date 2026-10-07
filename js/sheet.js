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
 * Kirim data & BACA balasannya (login nama + PIN, kirim nilai kuis/game).
 * Body sengaja teks biasa (bukan application/json) biar browser gak perlu
 * izin tambahan (preflight) yang gak didukung Apps Script.
 * Gagal konek / kelamaan (30 detik — Apps Script yang baru "bangun" bisa
 * lambat) -> lempar error.
 */
async function tanyaSheet(data) {
  const kontrol = new AbortController();
  const timer = setTimeout(() => kontrol.abort(), 30000);
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

/* ==========================================================================
   KIRIM NILAI / SKOR + ANTREAN
   Kalau gagal terkirim (internet putus, server lambat, Apps Script belum
   diperbarui), data disimpan di antrean (localStorage "metapia_antrean")
   lalu dikirim ulang OTOMATIS tiap kali siswa membuka Dashboard/Kuis/Game.
   ========================================================================== */
const KUNCI_ANTREAN = "metapia_antrean";

function bacaAntrean() {
  try { return JSON.parse(localStorage.getItem(KUNCI_ANTREAN)) || []; } catch (e) { return []; }
}
function tulisAntrean(daftar) {
  localStorage.setItem(KUNCI_ANTREAN, JSON.stringify(daftar.slice(-50)));
}

/**
 * Kirim 1 data ke sheet. Hasilnya { status, pesan }:
 *  "ok"         -> tersimpan di sheet
 *  "pin_salah"  -> ditolak (PIN gak cocok), gak diantre
 *  "versi_lama" -> Apps Script belum diperbarui, diantre
 *  "offline"    -> gak nyambung / kelamaan, diantre
 *  "error"      -> error di Apps Script, diantre
 */
async function kirimData(data, { antreKalauGagal = true } = {}) {
  let balas = null;
  try {
    balas = await tanyaSheet(data);
  } catch (e) {
    balas = null;
  }

  let hasil;
  if (balas && balas.ok) hasil = { status: "ok" };
  else if (!balas) hasil = { status: "offline" };
  else if (balas.kode === "pin_salah") hasil = { status: "pin_salah" };
  else if (balas.kode === "aksi_salah") hasil = { status: "versi_lama" };
  else hasil = { status: "error", pesan: balas.pesan || balas.kode };

  if (hasil.status !== "ok") console.warn("[METAPIA] gagal kirim ke Google Sheet:", hasil, balas);
  if (antreKalauGagal && ["offline", "versi_lama", "error"].includes(hasil.status)) {
    const daftar = bacaAntrean();
    daftar.push({ ...data, dikirimPada: new Date().toISOString() });
    tulisAntrean(daftar);
  }
  return hasil;
}

/** kalimat status buat ditampilkan ke siswa di layar hasil */
function pesanKirim(hasil, apa = "Nilai") {
  switch (hasil.status) {
    case "ok": return { teks: `✓ ${apa} sudah tersimpan!`, kelas: "is-ok" };
    case "pin_salah": return { teks: `${apa} ditolak server: PIN tidak cocok. Coba keluar lalu masuk lagi.`, kelas: "is-gagal" };
    case "versi_lama": return { teks: `${apa} belum terkirim: server Google Sheet perlu diperbarui guru. ${apa} disimpan & dikirim otomatis nanti.`, kelas: "is-gagal" };
    case "offline": return { teks: `${apa} belum terkirim (internet lambat/putus). Akan dikirim otomatis nanti.`, kelas: "is-gagal" };
    default: return { teks: `${apa} belum terkirim (server error). Akan dikirim otomatis nanti.`, kelas: "is-gagal" };
  }
}

/** kirim ulang semua data di antrean (yang berhasil / ditolak dibuang dari antrean) */
let sedangKirimAntrean = false;
async function kirimAntrean() {
  if (!GOOGLE_SHEET_URL || sedangKirimAntrean) return;
  const daftar = bacaAntrean();
  if (!daftar.length) return;
  sedangKirimAntrean = true;
  const sisa = [];
  for (const data of daftar) {
    const hasil = await kirimData(data, { antreKalauGagal: false });
    if (hasil.status !== "ok" && hasil.status !== "pin_salah") sisa.push(data);
  }
  // data baru yang masuk antrean selama proses ini juga dipertahankan
  const tambahan = bacaAntrean().slice(daftar.length);
  tulisAntrean(sisa.concat(tambahan));
  sedangKirimAntrean = false;
}

// coba kirim ulang antrean sebentar setelah halaman terbuka (kalau sudah login)
if (typeof window !== "undefined" && localStorage.getItem("metapia_user")) {
  setTimeout(kirimAntrean, 1500);
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
