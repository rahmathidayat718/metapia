/* ==========================================================================
   METAPIA — kupu.js
   2 kupu-kupu di background (bgMateri.webp) yang KEPAK-KEPAK sayap.
   -------------------------------------------------------------------------
   Kupu-kupu aslinya sudah dihapus dari bgMateri.webp dan dipotong jadi
   gambar sendiri (assets/kupu-pink.webp & kupu-ungu.webp). Script ini naruh
   lagi kedua gambar itu PERSIS di posisi aslinya di background, lalu CSS
   (lihat common.css, "KUPU-KUPU") bikin sayapnya buka-tutup.

   Posisinya dihitung ulang tiap ukuran layar berubah, ngikutin cara
   background "cover" ditaruh (posisi background diambil dari CSS body).
   ========================================================================== */
(function () {
  const BG_W = 1376, BG_H = 768; // ukuran asli bgMateri.webp
  // x, y, w, h = kotak kupu-kupu di gambar asli; poros = titik badan (sumbu kepak)
  const KUPU = [
    { src: "assets/kupu-pink.webp", x: 1286, y: 506, w: 68, h: 72, poros: "22% 80%", jeda: 0 },
    { src: "assets/kupu-ungu.webp", x: 1171, y: 593, w: 63, h: 62, poros: "72% 78%", jeda: 0.35 },
  ];

  const els = KUPU.map((k) => {
    const wadah = document.createElement("div");
    wadah.className = "kupu";
    wadah.style.animationDelay = `${k.jeda}s`;
    const img = document.createElement("img");
    img.decoding = "async"; // gambar dibongkar di belakang layar, halaman gak tersendat
    img.src = k.src;
    img.alt = "";
    img.draggable = false;
    img.style.transformOrigin = k.poros;
    img.style.animationDelay = `${k.jeda}s`;
    wadah.appendChild(img);
    return wadah;
  });

  /** "50%" / "center" / "18%" -> 0..1 */
  function persen(nilai) {
    if (nilai === "left" || nilai === "top") return 0;
    if (nilai === "right" || nilai === "bottom") return 1;
    if (nilai === "center") return 0.5;
    const n = parseFloat(nilai);
    return Number.isFinite(n) ? n / 100 : 0.5;
  }

  function atur() {
    const gaya = getComputedStyle(document.body);
    if (!gaya.backgroundImage.includes("bgMateri")) {
      els.forEach((el) => (el.hidden = true));
      return;
    }
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const skala = Math.max(vw / BG_W, vh / BG_H); // background-size: cover
    const px = persen(gaya.backgroundPositionX.split(",")[0].trim());
    const py = persen(gaya.backgroundPositionY.split(",")[0].trim());
    const geserX = (vw - BG_W * skala) * px;
    const geserY = (vh - BG_H * skala) * py;
    KUPU.forEach((k, i) => {
      const el = els[i];
      el.hidden = false;
      el.style.left = `${geserX + k.x * skala}px`;
      el.style.top = `${geserY + k.y * skala}px`;
      el.style.width = `${k.w * skala}px`;
      el.style.height = `${k.h * skala}px`;
    });
  }

  function pasang() {
    els.forEach((el) => document.body.prepend(el));
    atur();
    window.addEventListener("resize", atur);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", pasang);
  else pasang();
})();
