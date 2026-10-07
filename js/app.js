/* ==========================================================================
   METAPIA — app.js
   Dipakai di semua halaman setelah login (dashboard, materi, video, kuis, game)
   ========================================================================== */

/**
 * Ambil data user yang sedang login dari localStorage.
 */
function getCurrentUser() {
  const raw = localStorage.getItem("metapia_user");
  return raw ? JSON.parse(raw) : null;
}

/**
 * Kalau belum login, tendang balik ke halaman login.
 * Panggil ini di halaman yang butuh login (dashboard, materi, dst).
 */
function requireLogin() {
  const user = getCurrentUser();
  if (!user || user.masukPakai !== "nama" || !/^\d{4}$/.test(user.pin || "")) {
    window.location.replace("index.html");
  }
  return user;
}

function logout() {
  localStorage.removeItem("metapia_user");
  window.location.href = "index.html";
}

/**
 * Tampilkan nama & avatar user di navbar (elemen dengan id #navUserName / #navAvatar).
 */
function renderUserInNav() {
  const user = getCurrentUser();
  if (!user) return;

  const nameEl = document.getElementById("navUserName");
  const avatarEl = document.getElementById("navAvatar");

  if (nameEl) nameEl.textContent = user.nama.split(" ")[0];
  if (avatarEl) {
    // tampilkan nama lengkap; kalau kepanjangan CSS motong jadi "..."
    avatarEl.innerHTML = `<span class="avatar-ikon"><i class="fa-solid fa-user"></i></span><span class="avatar-nama"></span>`;
    avatarEl.querySelector(".avatar-nama").textContent = user.nama;
    avatarEl.title = user.nama; // nama lengkap muncul pas kursor diarahkan
    avatarEl.classList.toggle("nama-panjang", user.nama.length > 14);
  }
}

/**
 * Kunci perbandingan lebar:tinggi elemen tokoh (.tokoh) sesuai ukuran asli
 * gambarnya. Tanpa ini, di panel yang sempit (mis. panel Kak Rara di
 * halaman Kuis) browser bisa nyempitin lebarnya -> tokoh keliatan gepeng.
 */
function aturRasioTokoh(el, img) {
  const pasang = () => {
    if (img.naturalWidth) el.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
  };
  if (img.complete) pasang();
  else img.addEventListener("load", pasang, { once: true });
}

/**
 * Toggle menu navbar versi mobile.
 */
function initNavToggle() {
  const toggleBtn = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  if (!toggleBtn || !navLinks) return;

  toggleBtn.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNavToggle();
  renderUserInNav();
});
