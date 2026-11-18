/* ==========================================================================
   METAPIA — reset-data.js
   Dipasang PALING AWAL di <head> semua halaman.

   "NOMOR RESET DATA": tiap browser menyimpan nomor reset terakhir yang
   pernah dilihatnya. Kalau nomor di bawah ini BEDA (atau browser masih punya
   data lama tanpa nomor), SEMUA data METAPIA di browser itu dihapus:
   login siswa/guru, akun offline, nilai & bintang Dashboard, antrean
   kiriman ke Google Sheet, dll. Pengguna jadi mulai dari 0 lagi (diarahkan
   ke halaman masuk oleh cek-login.js / guru.html).

   CARA PAKAI: setiap kali Google Sheet dikosongkan (data siswa dihapus),
   GANTI nomor di bawah (mis. pakai tanggal hari ini), lalu push.
   Semua HP/laptop yang membuka METAPIA ikut mulai dari 0.

   Yang TIDAK dihapus: pengaturan kecil (suara, versi 2D/3D, grafis).
   ========================================================================== */
(function () {
  const RESET_DATA = "2026-11-18"; // <-- ganti nomor ini kalau mau semua browser mulai dari 0 lagi
  const KUNCI = "metapia_reset_data";
  const SIMPAN = ["metapia_suara", "metapia_mode_game", "metapia_grafis"];
  try {
    if (localStorage.getItem(KUNCI) === RESET_DATA) return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith("metapia_") && !SIMPAN.includes(k))
      .forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(KUNCI, RESET_DATA);
  } catch (e) {
    /* localStorage diblokir (mode privat ketat): abaikan */
  }
})();
