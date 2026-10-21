/* ==========================================================================
   METAPIA — sw.js (service worker)
   Bikin METAPIA bisa dibuka OFFLINE setelah pernah dibuka sekali.

   Cara kerja:
   - Saat pertama dibuka (install): semua file di DAFTAR_FILE diunduh &
     disimpan di cache perangkat (precache).
   - Selanjutnya file diambil dari cache dulu (cepat & tetap jalan offline):
       * HTML/CSS/JS  : tampil dari cache, lalu diam-diam dicek versi baru di
                        internet (stale-while-revalidate) -> update ikut
                        kepakai di kunjungan berikutnya.
       * gambar/font/three.js : dari cache saja (cache-first), unduh kalau
                        belum ada. three.js baru disimpan waktu halaman Game
                        pertama kali dibuka (biar kunjungan pertama ringan).
   - Request ke server lain (Google Apps Script, YouTube, Google Drive)
     TIDAK disentuh/di-cache sama sekali -> nilai tetap lewat antrean sheet.js.

   CACHE_VERSI & DAFTAR_FILE diperbarui otomatis oleh:
       python docs/perbarui-sw.py
   (jalankan setiap kali selesai mengubah file, sebelum git push). Versi yang
   berubah bikin cache lama di HP siswa dihapus & diganti yang baru.
   ========================================================================== */

const CACHE_VERSI = "metapia-a3fde489c6"; // diatur docs/perbarui-sw.py
const DAFTAR_FILE = [
  // diatur docs/perbarui-sw.py
  "assets/bgMateri.webp",
  "assets/bocah.webp",
  "assets/font/baloo2.woff2",
  "assets/font/fa-regular.woff2",
  "assets/font/fa-solid.woff2",
  "assets/font/nunito.woff2",
  "assets/game/g1-soal1.webp",
  "assets/game/g1-soal2.webp",
  "assets/game/g1-soal3.webp",
  "assets/game/g1-soal4.webp",
  "assets/game/g1-soal5.webp",
  "assets/ikon/apple-touch-icon.png",
  "assets/ikon/favicon-48.png",
  "assets/ikon/ikon-192.png",
  "assets/ikon/ikon-512.png",
  "assets/ikon/ikon-maskable-512.png",
  "assets/karakter/guru/guru-bicara-tutup.webp",
  "assets/karakter/guru/guru-bicara.webp",
  "assets/karakter/guru/guru-nunjuk-tutup.webp",
  "assets/karakter/guru/guru-nunjuk.webp",
  "assets/karakter/guru/guru-senyum.webp",
  "assets/karakter/murid/bima.webp",
  "assets/karakter/murid/dito-bicara-tutup.webp",
  "assets/karakter/murid/dito-bicara.webp",
  "assets/karakter/murid/dito-diam.webp",
  "assets/karakter/murid/dito-ide-tutup.webp",
  "assets/karakter/murid/dito-ide.webp",
  "assets/karakter/murid/dito-senang.webp",
  "assets/karakter/murid/keke.webp",
  "assets/karakter/murid/sari.webp",
  "assets/kupu-pink.webp",
  "assets/kupu-ungu.webp",
  "css/common.css",
  "css/dashboard.css",
  "css/game.css",
  "css/game3d.css",
  "css/ikon.css",
  "css/index.css",
  "css/komik.css",
  "css/kuis.css",
  "css/materi.css",
  "css/panduan.css",
  "css/video.css",
  "dashboard.html",
  "game.html",
  "index.html",
  "js/app.js",
  "js/auth.js",
  "js/cek-login.js",
  "js/game-data.js",
  "js/game-keranjang.js",
  "js/game-tebak.js",
  "js/game-ubah.js",
  "js/game.js",
  "js/game3d/index.js",
  "js/game3d/mesin3d.js",
  "js/game3d/pabrik-sortir.js",
  "js/game3d/pecah-balon.js",
  "js/game3d/pesawat-kalimat.js",
  "js/game3d/ui3d.js",
  "js/kuis.js",
  "js/kupu.js",
  "js/materi.js",
  "js/pwa.js",
  "js/sheet.js",
  "js/video.js",
  "kuis.html",
  "manifest.json",
  "materi.html",
  "panduan.html",
  "video.html",
];

/* ---------- install: simpan semua file ---------- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSI)
      // satu per satu: kalau 1 file gagal, yang lain tetap tersimpan
      .then((cache) => Promise.all(DAFTAR_FILE.map((f) => cache.add(f).catch((e) => console.warn("[sw] gagal simpan", f, e)))))
      .then(() => self.skipWaiting())
  );
});

/* ---------- activate: hapus cache versi lama ---------- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((nama) => Promise.all(nama.filter((n) => n.startsWith("metapia-") && n !== CACHE_VERSI).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

/* ---------- fetch: ambil dari cache ---------- */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Apps Script, YouTube, Drive: langsung ke internet

  const teks = req.mode === "navigate" || /\.(html|css|js|json)$/.test(url.pathname) || url.pathname.endsWith("/");
  const bukanVendor = !url.pathname.includes("/js/vendor/");
  event.respondWith(teks && bukanVendor ? staleWhileRevalidate(req) : cacheFirst(req));
});

/** tampilkan dari cache, sambil ambil versi baru di belakang layar */
async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_VERSI);
  // ignoreSearch: game.html?main=2 tetap ketemu walau yang disimpan game.html
  const lama = await cache.match(req, { ignoreSearch: true });
  const baru = fetch(req).then((res) => {
    if (res.ok) cache.put(stripQuery(req), res.clone());
    return res;
  }).catch(() => null);
  if (lama) return lama;
  return (await baru) || halamanOffline(req);
}

/** dari cache; kalau belum ada, unduh lalu simpan */
async function cacheFirst(req) {
  const cache = await caches.open(CACHE_VERSI);
  const lama = await cache.match(req, { ignoreSearch: true });
  if (lama) return lama;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(stripQuery(req), res.clone());
    return res;
  } catch (e) {
    return halamanOffline(req);
  }
}

function stripQuery(req) {
  const u = new URL(req.url);
  if (!u.search) return req;
  u.search = "";
  return new Request(u.toString());
}

/** halaman belum pernah disimpan & sedang offline -> arahkan ke login (yang pasti tersimpan) */
async function halamanOffline(req) {
  if (req.mode === "navigate") {
    const cache = await caches.open(CACHE_VERSI);
    const awal = await cache.match("index.html");
    if (awal) return awal;
  }
  return new Response("Sedang offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
