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
    avatarEl.title = `${user.nama} — klik untuk keluar`; // nama lengkap muncul pas kursor diarahkan
    avatarEl.classList.toggle("nama-panjang", user.nama.length > 14);
    // pil nama = tombol Keluar (footer disembunyikan di halaman layar penuh)
    avatarEl.setAttribute("role", "button");
    avatarEl.tabIndex = 0;
    const tanyaKeluar = () => {
      if (confirm(`Keluar dari METAPIA, ${user.nama.split(" ")[0]}?`)) logout();
    };
    avatarEl.addEventListener("click", tanyaKeluar);
    avatarEl.addEventListener("keydown", (e) => { if (e.key === "Enter") tanyaKeluar(); });
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

/**
 * Menu bawah ala aplikasi (cuma muncul di HP/tablet, lihat common.css).
 * Isinya diambil dari menu navbar yang sudah ada, jadi gak perlu nulis
 * ulang di tiap halaman HTML.
 */
function initMenuBawah() {
  const navLinks = document.getElementById("navLinks");
  if (!navLinks) return;
  const menu = document.createElement("nav");
  menu.className = "menu-bawah";
  menu.setAttribute("aria-label", "Menu utama");
  navLinks.querySelectorAll("a").forEach((a) => {
    const item = document.createElement("a");
    item.href = a.getAttribute("href");
    if (a.classList.contains("active")) {
      item.className = "is-aktif";
      item.setAttribute("aria-current", "page");
    }
    const ikon = a.querySelector("i");
    item.innerHTML = `<span class="menu-bawah-ikon">${ikon ? ikon.outerHTML : ""}</span><span class="menu-bawah-teks"></span>`;
    item.querySelector(".menu-bawah-teks").textContent = a.textContent.trim();
    menu.appendChild(item);
  });
  document.body.appendChild(menu);
  document.body.classList.add("ada-menu-bawah");
}

document.addEventListener("DOMContentLoaded", () => {
  initNavToggle();
  initMenuBawah();
  renderUserInNav();
});
