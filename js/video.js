/* ==========================================================================
   METAPIA — video.js
   Halaman Video isinya simpel: 1 video + 2 bocah yang lagi senyum +
   ajakan nonton. Tombolnya cuma tombol PLAY di tengah layar.

   CARA PASANG VIDEO (pilih salah satu):
   A) FILE MP4 SENDIRI (disarankan — BISA DITONTON OFFLINE):
      Taruh file video di folder assets/video/, lalu isi VIDEO.file,
      contoh: file: "assets/video/video-majas.mp4". Kecilkan dulu ke ±480p
      biar ringan (cara lengkapnya di docs/video-offline.md).
      Siswa tekan "Simpan ke perangkat" sekali waktu ada internet ->
      setelah itu video bisa diputar walau tanpa internet.
   B) LINK YouTube / Google Drive (TIDAK bisa offline):
   Isi VIDEO.link di bawah dengan link YouTube atau Google Drive,
   langsung copy-paste dari browser aja, contoh:
     YouTube : "https://www.youtube.com/watch?v=XXXXXXXXXXX"
               "https://youtu.be/XXXXXXXXXXX"
     Drive   : "https://drive.google.com/file/d/XXXXXXXX/view?usp=sharing"
               (file Drive-nya harus di-share "Siapa saja yang memiliki link")
   Kalau link masih kosong, tombol play-nya abu-abu + tulisan
   "Video segera hadir".

   CATATAN: video YouTube gak mau diputar kalau halaman dibuka langsung
   dari file (alamatnya file:///...). Buka lewat Live Server di VS Code
   atau dari hosting, baru videonya jalan.
   ========================================================================== */

/* ==========================================================================
   1) DATA — ISI DI SINI
   ========================================================================== */
const VIDEO = {
  judul: "Video Majas",                                  // tulisan di kotak kuning pojok
  ajakan: "Ayo, kita tonton video majas bersama! 🎬",     // balon kata bocah kiri (pendek aja)
  file: "",                                              // file MP4 di assets/video/ (bisa offline)
  link: "",                                              // link YouTube / Google Drive (dipakai kalau file kosong)
};
const CACHE_VIDEO = "video-metapia"; // sama dengan di sw.js

/* 2 bocah yang nemenin (pose senyum) */
const BOCAH_KIRI = { nama: "Dito", gambar: "assets/karakter/murid/dito-diam.webp" };
const BOCAH_KANAN = { nama: "Sari", gambar: "assets/karakter/murid/sari.webp" };

/* ==========================================================================
   2) UBAH LINK BIASA -> LINK EMBED (biar bisa diputar di dalam halaman)
   ========================================================================== */
function bacaLink(link) {
  if (!link) return null;
  link = link.trim();

  // YouTube: watch?v=ID, youtu.be/ID, shorts/ID, embed/ID
  const yt = link.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) {
    return {
      embed: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1&autoplay=1`,
      thumbnail: `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`,
    };
  }

  // Google Drive: /file/d/ID/... atau open?id=ID (Drive gak ada thumbnail publik)
  const drive = link.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/);
  if (drive) return { embed: `https://drive.google.com/file/d/${drive[1]}/preview`, thumbnail: null };

  return null; // link gak dikenal
}

/* ==========================================================================
   3) BOCAH — sama strukturnya kayak tokoh di materi.js (1 pose aja)
   ========================================================================== */
function pasangBocah(el, data) {
  el.innerHTML = `
    <div class="tokoh-figure">
      <div class="tokoh-shadow"></div>
      <div class="tokoh-body"><img class="pose is-active" src="${data.gambar}" decoding="async" alt="${data.nama}" draggable="false"></div>
    </div>`;
  aturRasioTokoh(el, el.querySelector("img"));
}
const elKiri = document.getElementById("bocahKiri");
const elKanan = document.getElementById("bocahKanan");
pasangBocah(elKiri, BOCAH_KIRI);
pasangBocah(elKanan, BOCAH_KANAN);

/* sesekali salah satu bocah lompat kecil biar hidup */
setInterval(() => {
  const el = Math.random() < 0.5 ? elKiri : elKanan;
  el.classList.add("is-bounce");
  setTimeout(() => el.classList.remove("is-bounce"), 600);
}, 2600);

/* ==========================================================================
   4) LAYAR VIDEO — cover + tombol play, diklik baru videonya dimuat
   ========================================================================== */
const elLayar = document.getElementById("layarVideo");
const info = VIDEO.file ? { file: VIDEO.file, thumbnail: null } : bacaLink(VIDEO.link);
const urlFile = VIDEO.file ? new URL(VIDEO.file, location.href).href : "";

function tampilkanCover() {
  const cover = document.createElement("button");
  cover.className = "layar-cover" + (info ? "" : " is-kosong");
  cover.setAttribute("aria-label", info ? "Putar video" : "Video segera hadir");
  if (info && info.thumbnail) cover.style.backgroundImage = `url('${info.thumbnail}')`;
  cover.innerHTML = `
    <span class="tombol-play"><i class="fa-solid fa-play"></i></span>
    <span class="label-play">${info ? "Putar Video" : "Video segera hadir!"}</span>`;

  cover.addEventListener("click", () => {
    if (info && info.file) {
      // file sendiri: diputar lewat <video> (offline pun jalan kalau sudah disimpan)
      elLayar.innerHTML = `<video src="${info.file}" controls autoplay playsinline preload="auto"></video>`;
      pasangTombolSimpan();
    } else if (info) {
      elLayar.innerHTML = `<iframe src="${info.embed}" title="${VIDEO.judul}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen></iframe>`;
    } else {
      // belum ada video: tombol goyang "geleng-geleng"
      cover.classList.remove("is-goyang");
      void cover.offsetWidth; // restart animasi
      cover.classList.add("is-goyang");
    }
  });

  elLayar.innerHTML = "";
  elLayar.appendChild(cover);
  if (info && info.file) pasangTombolSimpan();
}

/* ==========================================================================
   4b) SIMPAN VIDEO UNTUK OFFLINE (khusus VIDEO.file)
   Video diunduh utuh sekali, disimpan di penyimpanan browser (cache
   "video-metapia"). sw.js lalu memutar video dari simpanan itu, termasuk
   waktu offline. Simpanan ini gak ikut terhapus walau web di-update.
   ========================================================================== */
let sedangSimpan = false;
let persenSimpan = 0;

async function videoTersimpan() {
  if (!urlFile || !("caches" in window)) return false;
  try {
    const c = await caches.open(CACHE_VIDEO);
    return !!(await c.match(urlFile, { ignoreSearch: true }));
  } catch (e) {
    return false;
  }
}

async function pasangTombolSimpan() {
  if (!("caches" in window) || !navigator.serviceWorker) return;
  let btn = elLayar.querySelector(".tombol-simpan");
  if (!btn) {
    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tombol-simpan";
    btn.addEventListener("click", (e) => { e.stopPropagation(); klikSimpan(); });
    elLayar.appendChild(btn);
  }
  if (sedangSimpan) {
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan ${persenSimpan}%`;
    return;
  }
  const ada = await videoTersimpan();
  btn.classList.toggle("is-tersimpan", ada);
  btn.innerHTML = ada
    ? '<i class="fa-solid fa-circle-check"></i> Sudah tersimpan'
    : '<i class="fa-solid fa-download"></i> Simpan ke perangkat';
  btn.title = ada ? "Video sudah tersimpan di perangkat ini. Klik untuk menghapusnya." : "Unduh video sekali, lalu bisa ditonton tanpa internet";
}

async function klikSimpan() {
  if (sedangSimpan) return;
  if (await videoTersimpan()) {
    if (confirm("Video sudah tersimpan di perangkat ini.\nHapus simpanannya untuk mengosongkan memori?")) {
      await (await caches.open(CACHE_VIDEO)).delete(urlFile, { ignoreSearch: true });
      pasangTombolSimpan();
    }
    return;
  }
  if (navigator.onLine === false) {
    alert("Menyimpan video memerlukan internet. Coba lagi saat ada internet, ya.");
    return;
  }
  sedangSimpan = true;
  persenSimpan = 0;
  pasangTombolSimpan();
  try {
    // minta browser jangan menghapus simpanan ini kalau memori mulai penuh
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    const res = await fetch(urlFile, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const total = Number(res.headers.get("Content-Length")) || 0;
    const reader = res.body.getReader();
    const potongan = [];
    let dapat = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      potongan.push(value);
      dapat += value.length;
      if (total) {
        const p = Math.floor((dapat / total) * 100);
        if (p !== persenSimpan) { persenSimpan = p; pasangTombolSimpan(); }
      }
    }
    const blob = new Blob(potongan, { type: res.headers.get("Content-Type") || "video/mp4" });
    const c = await caches.open(CACHE_VIDEO);
    await c.put(urlFile, new Response(blob, { headers: { "Content-Type": blob.type, "Content-Length": String(blob.size) } }));
    sedangSimpan = false;
    pasangTombolSimpan();
    alert("Video tersimpan! 🎉 Sekarang, video bisa ditonton walaupun tanpa internet.");
  } catch (e) {
    console.warn("[METAPIA] video gagal disimpan:", e);
    sedangSimpan = false;
    pasangTombolSimpan();
    alert("Video gagal disimpan (internet putus atau memori perangkat penuh). Coba lagi, ya.");
  }
}

/* ==========================================================================
   5) SAAT OFFLINE — video yang SUDAH DISIMPAN tetap bisa diputar. Kalau
      belum disimpan (atau pakai YouTube/Drive), yang tampil Ibu Rara dengan
      pesan ramah + tombol ke Materi (Materi bisa offline)
   ========================================================================== */
function tampilkanOffline() {
  const pesan = info && info.file
    ? '<b>Video belum disimpan di perangkat ini.</b> Nanti saat ada internet, tekan "Simpan ke perangkat" di layar video. Sekarang, ayo baca Materi dulu! 📖'
    : "<b>Video butuh internet.</b> Sambil menunggu, ayo baca Materi dulu! 📖";
  elLayar.innerHTML = `
    <div class="layar-offline">
      <img src="assets/karakter/guru/guru-senyum.webp" width="546" height="520" decoding="async" alt="Ibu Rara">
      <div class="layar-offline-teks">
        <p>${pesan}</p>
        <a class="comic-btn comic-btn-primary" href="materi.html"><i class="fa-solid fa-book"></i> Buka Materi</a>
      </div>
    </div>`;
}
async function aturLayar() {
  if (navigator.onLine === false && !(await videoTersimpan())) tampilkanOffline();
  else tampilkanCover();
}
window.addEventListener("offline", async () => {
  if (!elLayar.querySelector("iframe, video") && !(await videoTersimpan())) tampilkanOffline();
});
window.addEventListener("online", () => { if (elLayar.querySelector(".layar-offline")) tampilkanCover(); });

/* ==========================================================================
   6) MULAI!
   ========================================================================== */
document.getElementById("comicCaption").textContent = VIDEO.judul;
document.getElementById("teksAjakan").textContent = VIDEO.ajakan;
aturLayar();

// balon ajakan "keluar" dari bocah kiri setelah halaman kebuka sebentar
setTimeout(() => document.getElementById("bubbleAjakan").classList.add("is-show"), 500);
