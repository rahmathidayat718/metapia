/* ==========================================================================
   METAPIA — cek-login.js
   Dipasang di <head> SEMUA halaman siswa selain index.html (dashboard,
   materi, video, kuis, game). Kalau siswa belum masuk, langsung dilempar
   ke halaman login SEBELUM isi halaman sempat tampil.
   ========================================================================== */
(function () {
  try {
    const user = JSON.parse(localStorage.getItem("metapia_user"));
    // harus login versi nama + PIN. Sesi lama (login Google / demo / nama
    // tanpa PIN) dianggap belum login, biar siswanya bikin PIN dulu
    if (
      user && user.masukPakai === "nama" &&
      typeof user.nama === "string" && user.nama.trim() &&
      /^\d{4}$/.test(user.pin || "")
    ) {
      // akun dari sebelum ada pilihan sekolah -> ke halaman masuk buat milih
      // sekolah (namanya sudah terisi). Kalau lagi offline, boleh lanjut dulu.
      if (user.sekolah || navigator.onLine === false) return;
      window.location.replace("index.html");
      return;
    }
  } catch (e) {}
  localStorage.removeItem("metapia_user");
  window.location.replace("index.html");
})();
