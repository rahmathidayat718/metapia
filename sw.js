/* ==========================================================================
   METAPIA — sw.js (service worker)
   Bikin METAPIA bisa dibuka OFFLINE setelah pernah dibuka sekali.

   Cara kerja:
   - Saat pertama dibuka (install): semua file di DAFTAR_FILE diunduh &
     disimpan di cache perangkat (precache).
   - Selanjutnya SEMUA file diambil dari cache dulu (cache-first) -> halaman
     langsung tampil, gak layar putih nunggu internet. File yang belum ada
     di cache diunduh lalu disimpan (mis. three.js, baru disimpan waktu
     halaman Game pertama kali dibuka biar kunjungan pertama ringan).
   - Kenapa aman (gak nyangkut kode lama): tiap versi web punya cache
     sendiri (CACHE_VERSI) yang diisi LANGSUNG dari server waktu install
     (cache: "reload", bukan dari HTTP cache browser). Jadi isi 1 cache selalu
     versi yang sama semua. Web di-update -> sw.js berubah -> browser pasang
     versi baru di belakang layar -> dipakai mulai halaman berikutnya.
     (Dulu cache bisa keisi cek-login.js lama -> guru mental balik ke Rekap.)
   - Video MP4 (assets/video/) TIDAK ikut disimpan otomatis (ukurannya
     besar). Siswa menyimpannya sendiri lewat tombol "Simpan untuk offline"
     di halaman Video -> masuk cache "video-metapia" (gak ikut terhapus
     waktu versi web berganti) dan diputar dari sana, termasuk offline.
   - Request ke server lain (Google Apps Script, YouTube, Google Drive)
     TIDAK disentuh/di-cache sama sekali -> nilai tetap lewat antrean sheet.js.

   CACHE_VERSI & DAFTAR_FILE diperbarui otomatis oleh:
       python docs/perbarui-sw.py
   (jalankan setiap kali selesai mengubah file, sebelum git push). Versi yang
   berubah bikin cache lama di HP siswa dihapus & diganti yang baru.
   ========================================================================== */

const CACHE_VERSI = "metapia-45c6a97f64"; // diatur docs/perbarui-sw.py
const CACHE_VIDEO = "video-metapia"; // sama dengan di js/video.js
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
  "assets/ikon/ikon-192.png",
  "assets/ikon/ikon-512.png",
  "assets/ikon/ikon-maskable-512.png",
  "assets/karakter/materi/bima-bicara-tutup.webp",
  "assets/karakter/materi/bima-bicara.webp",
  "assets/karakter/materi/bima-bingung.webp",
  "assets/karakter/materi/bima-diam.webp",
  "assets/karakter/materi/bima-tepuk.webp",
  "assets/karakter/materi/bima-tertawa.webp",
  "assets/karakter/materi/dito-bicara-tutup.webp",
  "assets/karakter/materi/dito-bicara.webp",
  "assets/karakter/materi/dito-diam.webp",
  "assets/karakter/materi/dito-ide-tutup.webp",
  "assets/karakter/materi/dito-ide.webp",
  "assets/karakter/materi/dito-senang.webp",
  "assets/karakter/materi/guru-bangga.webp",
  "assets/karakter/materi/guru-bicara-tutup.webp",
  "assets/karakter/materi/guru-bicara.webp",
  "assets/karakter/materi/guru-kaget.webp",
  "assets/karakter/materi/guru-nunjuk-tutup.webp",
  "assets/karakter/materi/guru-nunjuk.webp",
  "assets/karakter/materi/guru-senyum.webp",
  "assets/karakter/materi/guru-tertawa.webp",
  "assets/karakter/materi/keke-angkat.webp",
  "assets/karakter/materi/keke-bicara-tutup.webp",
  "assets/karakter/materi/keke-bicara.webp",
  "assets/karakter/materi/keke-diam.webp",
  "assets/karakter/materi/keke-tepuk.webp",
  "assets/karakter/materi/sari-bangga.webp",
  "assets/karakter/materi/sari-bicara-tutup.webp",
  "assets/karakter/materi/sari-bicara.webp",
  "assets/karakter/materi/sari-diam.webp",
  "assets/karakter/materi/sari-malu.webp",
  "assets/karakter/materi/sari-tepuk.webp",
  "assets/kupu-pink.webp",
  "assets/kupu-ungu.webp",
  "css/common.css",
  "css/dashboard.css",
  "css/game.css",
  "css/game3d.css",
  "css/guru.css",
  "css/ikon.css",
  "css/index.css",
  "css/komik.css",
  "css/kuis.css",
  "css/materi.css",
  "css/panduan.css",
  "css/video.css",
  "dashboard.html",
  "game.html",
  "guru.html",
  "index.html",
  "js/app.js",
  "js/auth-guru.js",
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
  "js/guru.js",
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
      // cache: "reload" -> ambil langsung dari server, bukan dari HTTP cache
      // browser (GitHub Pages max-age 10 menit bisa ngasih file versi lama)
      .then((cache) => Promise.all(DAFTAR_FILE.map((f) => cache.add(new Request(f, { cache: "reload" })).catch((e) => console.warn("[sw] gagal simpan", f, e)))))
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
  if (url.pathname.includes("/assets/video/")) { event.respondWith(putarVideo(req)); return; }

  // semua file web: dari simpanan versi ini dulu (instan, gak layar putih)
  event.respondWith(cacheFirst(req));
});

/** dari cache (ignoreSearch: game.html?main=2 = game.html); kalau belum ada, unduh lalu simpan */
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

/**
 * Video: kalau sudah disimpan (tombol "Simpan untuk offline"), putar dari
 * simpanan. Pemutar video minta potongan-potongan file (header Range), jadi
 * dibalas potongan yang diminta (status 206). Belum disimpan -> internet.
 */
async function putarVideo(req) {
  const cache = await caches.open(CACHE_VIDEO);
  const simpan = await cache.match(req.url, { ignoreSearch: true });
  if (!simpan) {
    try { return await fetch(req); } catch (e) { return new Response("Video belum disimpan", { status: 503 }); }
  }
  const range = req.headers.get("range");
  if (!range) return simpan;
  const blob = await simpan.blob();
  const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
  let awal = m[1] ? Number(m[1]) : 0;
  let akhir = m[2] ? Number(m[2]) : blob.size - 1;
  if (!m[1] && m[2]) { awal = Math.max(0, blob.size - Number(m[2])); akhir = blob.size - 1; } // "bytes=-500" = 500 byte terakhir
  akhir = Math.min(akhir, blob.size - 1);
  if (awal > akhir) return new Response("", { status: 416, headers: { "Content-Range": `bytes */${blob.size}` } });
  return new Response(blob.slice(awal, akhir + 1), {
    status: 206,
    headers: {
      "Content-Type": simpan.headers.get("Content-Type") || "video/mp4",
      "Content-Range": `bytes ${awal}-${akhir}/${blob.size}`,
      "Content-Length": String(akhir - awal + 1),
      "Accept-Ranges": "bytes",
    },
  });
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
