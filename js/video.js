/* ==========================================================================
   METAPIA — video.js
   Halaman Video isinya simpel: 1 video + 2 bocah yang lagi senyum +
   ajakan nonton. Tombolnya cuma tombol PLAY di tengah layar.

   CARA PASANG VIDEO:
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
  ajakan: "Yuk, nonton video majas bareng kami! 🎬",     // balon kata bocah kiri (pendek aja)
  link: "",                                              // link YouTube / Google Drive
};

/* 2 bocah yang nemenin (pose senyum) */
const BOCAH_KIRI = { nama: "Dito", gambar: "assets/karakter/murid/dito-diam.png" };
const BOCAH_KANAN = { nama: "Sari", gambar: "assets/karakter/murid/sari.png" };

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
      <div class="tokoh-body"><img class="pose is-active" src="${data.gambar}" alt="${data.nama}" draggable="false"></div>
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
const info = bacaLink(VIDEO.link);

function tampilkanCover() {
  const cover = document.createElement("button");
  cover.className = "layar-cover" + (info ? "" : " is-kosong");
  cover.setAttribute("aria-label", info ? "Putar video" : "Video segera hadir");
  if (info && info.thumbnail) cover.style.backgroundImage = `url('${info.thumbnail}')`;
  cover.innerHTML = `
    <span class="tombol-play"><i class="fa-solid fa-play"></i></span>
    <span class="label-play">${info ? "Putar Video" : "Video segera hadir!"}</span>`;

  cover.addEventListener("click", () => {
    if (info) {
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
}

/* ==========================================================================
   5) MULAI!
   ========================================================================== */
document.getElementById("comicCaption").textContent = VIDEO.judul;
document.getElementById("teksAjakan").textContent = VIDEO.ajakan;
tampilkanCover();

// balon ajakan "keluar" dari bocah kiri setelah halaman kebuka sebentar
setTimeout(() => document.getElementById("bubbleAjakan").classList.add("is-show"), 500);
