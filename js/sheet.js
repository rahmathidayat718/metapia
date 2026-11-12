/* ==========================================================================
   METAPIA — sheet.js
   Komunikasi dengan Google Sheet (lewat Google Apps Script).
   Dipakai di: index.html (login siswa/guru + daftar sekolah), kuis.html &
   game.html (kirim nilai), dashboard.html (ambil nilai terbaru),
   guru.html (rekap nilai siswa satu sekolah).

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
  // MODE GURU (guru mencoba kuis/game di kelas): gak dikirim & gak diantre,
  // biar rekap nilai siswa gak kecampur nilai guru
  if (!data.pin && !bacaUserLokal()) {
    let guru = null;
    try { guru = JSON.parse(localStorage.getItem("metapia_guru")); } catch (e) {}
    if (guru && guru.nama === data.nama) return { status: "guru" };
  }
  // sekolah ikut dikirim (data lama di antrean yang belum punya sekolah
  // dilengkapi dari akun yang sedang masuk)
  if (!data.sekolah) {
    const u = bacaUserLokal();
    if (u && u.sekolah && u.nama === data.nama) data = { ...data, sekolah: u.sekolah };
  }
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
    case "guru": return { teks: `Mode guru: ${apa.toLowerCase()} tidak disimpan (hanya untuk mencoba dan mengajar).`, kelas: "is-ok" };
    case "pin_salah": return { teks: `${apa} ditolak server: PIN tidak cocok. Coba keluar, lalu masuk lagi.`, kelas: "is-gagal" };
    case "versi_lama": return { teks: `${apa} belum terkirim: server Google Sheet perlu diperbarui oleh guru. ${apa} disimpan dan dikirim otomatis nanti.`, kelas: "is-gagal" };
    case "offline": return { teks: `${apa} belum terkirim (internet lambat/putus). Akan dikirim otomatis nanti.`, kelas: "is-gagal" };
    default: return { teks: `${apa} belum terkirim (server bermasalah). Akan dikirim otomatis nanti.`, kelas: "is-gagal" };
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

function bacaUserLokal() {
  try { return JSON.parse(localStorage.getItem("metapia_user")); } catch (e) { return null; }
}

/* ==========================================================================
   KODE SEKOLAH (6 huruf/angka, dibuat otomatis). Tiap GURU punya KODE
   SISWA sendiri (dibagikan ke siswanya lewat link/QR) -> siswa tercatat
   sebagai siswa guru itu. Tiap sekolah punya KODE GURU (khusus untuk guru
   lain yang mau bergabung ke sekolah itu).
   Kode yang pernah cocok disimpan di perangkat ("metapia_kode") biar nama
   sekolahnya tetap bisa ditampilkan waktu offline.
   ========================================================================== */
/** "k7q-2mx " -> "K7Q2MX" ("" kalau bukan 6 huruf/angka) */
function rapikanKodeSekolah(teks) {
  const k = String(teks || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return k.length === 6 ? k : "";
}

/** GET ke Apps Script, balas JSON (null kalau gagal / kelamaan) */
async function ambilSheet(param) {
  const kontrol = new AbortController();
  const timer = setTimeout(() => kontrol.abort(), 20000);
  try {
    const res = await fetch(`${GOOGLE_SHEET_URL}?${new URLSearchParams(param)}`, { signal: kontrol.signal });
    return await res.json();
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Cek kode sekolah. jenis: "siswa" | "guru" | "semua". Hasil:
 *  { ok: true, sekolah, guru, kode }  -> kode benar (guru: pemilik kode siswa)
 *  { ok: false, kode: "kode_salah" }
 *  null                         -> gak bisa dicek (offline & belum pernah dipakai di perangkat ini)
 */
async function cekKodeSekolah(teks, jenis = "siswa") {
  const kode = rapikanKodeSekolah(teks);
  if (!kode) return { ok: false, kode: "kode_salah" };
  let simpan = {};
  try { simpan = JSON.parse(localStorage.getItem("metapia_kode")) || {}; } catch (e) {}
  const dariSimpan = jenis === "siswa" && simpan[kode] ? { ok: true, sekolah: simpan[kode], kode, offline: true } : null;
  if (navigator.onLine === false) return dariSimpan;
  const hasil = await ambilSheet({ aksi: "cekKode", kode, jenis });
  if (!hasil || (!hasil.ok && hasil.kode !== "kode_salah")) return dariSimpan; // gagal konek / Apps Script versi lama
  if (hasil.ok && jenis === "siswa") {
    simpan[kode] = hasil.sekolah;
    localStorage.setItem("metapia_kode", JSON.stringify(simpan));
  }
  return hasil;
}

/** perlu kode pembuat sekolah (KODE_DAFTAR_GURU di Code.gs)? null = gak tau */
async function infoServer() {
  const hasil = await ambilSheet({ aksi: "info" });
  return hasil && hasil.ok ? hasil : null;
}

/** Ambil nilai kuis terakhir siswa dari sheet (buat Dashboard). Gagal -> null. */
async function ambilStatusSiswa(nama, pin, sekolah = "") {
  if (!GOOGLE_SHEET_URL || !pin) return null; // mode guru: gak ada data di sheet
  try {
    const url = `${GOOGLE_SHEET_URL}?aksi=status&nama=${encodeURIComponent(nama)}&pin=${encodeURIComponent(pin)}&sekolah=${encodeURIComponent(sekolah)}`;
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
