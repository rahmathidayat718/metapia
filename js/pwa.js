/* ==========================================================================
   METAPIA — pwa.js
   Dimuat di SEMUA halaman. Isinya:
   1) Daftarin service worker (sw.js) -> web bisa dibuka offline & dipasang
      ke layar utama HP (PWA).
   2) Penanda "Sedang offline" yang muncul otomatis waktu internet putus,
      dan kirim ulang antrean nilai begitu internet nyambung lagi.
   3) Login offline: akun yang pernah login di perangkat ini disimpan
      (nama + sidik PIN, BUKAN PIN aslinya) supaya bisa masuk tanpa internet.
   4) Deteksi jaringan lambat / mode hemat data (dipakai halaman Game).
   ========================================================================== */

/* ---------- 1) SERVICE WORKER ---------- */
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    // path relatif -> otomatis benar di subfolder GitHub Pages (/metapia/)
    navigator.serviceWorker.register("sw.js").catch((e) => console.warn("[METAPIA] service worker gagal:", e));
  });
}

/* ---------- 2) PENANDA OFFLINE ---------- */
(function () {
  let el = null;
  function tampil() {
    if (!el) {
      el = document.createElement("div");
      el.className = "penanda-offline";
      el.setAttribute("role", "status");
      el.innerHTML = '<span aria-hidden="true">📴</span> <span class="penanda-teks">Sedang offline – nilaimu disimpan dulu dan dikirim nanti</span><span class="penanda-singkat">Offline</span>';
      // ketuk = tampilkan lagi pesan lengkapnya
      el.addEventListener("click", () => { el.classList.remove("is-kecil"); kecilkanNanti(); });
      document.body.appendChild(el);
    }
    const off = navigator.onLine === false;
    el.hidden = !off;
    if (off) { el.classList.remove("is-kecil"); kecilkanNanti(); }
  }
  // setelah 5 detik penanda mengecil jadi "📴 Offline" biar gak nutupin layar
  let timer = null;
  function kecilkanNanti() {
    clearTimeout(timer);
    timer = setTimeout(() => el && el.classList.add("is-kecil"), 5000);
  }
  window.addEventListener("offline", tampil);
  window.addEventListener("online", () => {
    tampil();
    // internet nyambung lagi -> kirim nilai yang masih ngantre (lihat js/sheet.js)
    if (typeof kirimAntrean === "function") kirimAntrean();
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tampil);
  else tampil();
})();

/* ---------- 3) LOGIN OFFLINE ---------- */
const KUNCI_AKUN = "metapia_akun";

/** sidik (hash SHA-256) dari nama+PIN; kalau browser gak dukung, pakai teks biasa */
async function sidikPin(nama, pin) {
  const teks = `metapia|${nama.toLowerCase()}|${pin}`;
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(teks));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    return "polos:" + teks;
  }
}
function bacaAkun() {
  try { return JSON.parse(localStorage.getItem(KUNCI_AKUN)) || {}; } catch (e) { return {}; }
}
/** simpan akun di perangkat ini (dipanggil tiap berhasil login online) */
async function ingatAkun(nama, pin) {
  const akun = bacaAkun();
  akun[nama.toLowerCase()] = { nama, sidik: await sidikPin(nama, pin) };
  localStorage.setItem(KUNCI_AKUN, JSON.stringify(akun));
}
/** cek akun saat offline: { status: "cocok" | "pin_salah" | "belum_pernah", nama } */
async function cekAkunOffline(nama, pin) {
  const a = bacaAkun()[nama.toLowerCase()];
  if (!a) return { status: "belum_pernah" };
  return a.sidik === (await sidikPin(a.nama, pin)) ? { status: "cocok", nama: a.nama } : { status: "pin_salah", nama: a.nama };
}
// siswa yang SUDAH login sebelum fitur ini ada -> akunnya ikut diingat
(function () {
  try {
    const u = JSON.parse(localStorage.getItem("metapia_user"));
    if (u && u.nama && /^\d{4}$/.test(u.pin || "") && !bacaAkun()[u.nama.toLowerCase()]) ingatAkun(u.nama, u.pin);
  } catch (e) {}
})();

/* ---------- 4) JARINGAN LAMBAT / HEMAT DATA ---------- */
/** true kalau mode hemat data aktif atau jaringan terdeteksi 2G/3G */
function jaringanLambat() {
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!c) return false;
  return !!c.saveData || ["slow-2g", "2g", "3g"].includes(c.effectiveType);
}
