/* ==========================================================================
   METAPIA — cek-login.js
   Dipasang di <head> SEMUA halaman selain index.html (dashboard, materi,
   video, kuis, game). Kalau siswa belum masukin nama, langsung dilempar
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
    ) return;
  } catch (e) {}
  localStorage.removeItem("metapia_user");
  window.location.replace("index.html");
})();
