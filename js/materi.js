/* ==========================================================================
   METAPIA — materi.js
   Alurnya (konsep komik):
   1) Guru jalan masuk dari kiri -> sapa "Siap?" -> Dito jawab "Siap, Ibu Rara!"
   2) Guru jelasin tiap majas lewat balon kata -> di akhir nanya "Paham?"
      -> Dito jawab pakai balon katanya sendiri (nunjukin dia paham)
   3) Majas terakhir -> tombol "Lanjut ke Video" -> pindah ke video.html
      (alur belajar: Materi -> Video -> Kuis -> Game)

   POSE (otomatis + bisa diatur per baris dialog lewat "reaksi"):
   - Guru : senyum (diam) / bicara (ngomong) / nunjuk (kalimat ada "Contoh")
            + tertawa / bangga / kaget
   - Murid: diam / bicara (ngomong) + pose ekspresi masing-masing
   ========================================================================== */

/* ==========================================================================
   1) DATA KARAKTER
   -------------------------------------------------------------------------
   Gambar pose KHUSUS halaman ini ada di assets/karakter/materi/, sudah
   diseragamkan (kanvas sama, tinggi badan sama, posisi kaki sama) pakai
   docs/seragamkan-pose.py -> gak "getar" waktu ganti pose. Kalau nambah
   pose, daftarkan di skrip itu dulu. Pose PERTAMA di daftar = pose awal.
   ========================================================================== */
const POSE_DIR = "assets/karakter/materi/";
/** "sari", ["diam","malu"], ["bicara"] -> { diam: ".../sari-diam.webp", ..., bicara_tutup: ... } */
function daftarPose(tokoh, biasa, pakaiTutup = []) {
  const hasil = {};
  biasa.forEach((p) => { hasil[p] = `${POSE_DIR}${tokoh}-${p}.webp`; });
  // versi mulut TERTUTUP -> gantian sama yang terbuka waktu ngomong (lip-sync)
  pakaiTutup.forEach((p) => { hasil[p + "_tutup"] = `${POSE_DIR}${tokoh}-${p}-tutup.webp`; });
  return hasil;
}

const GURU = {
  nama: "Ibu Rara",
  pose: daftarPose("guru", ["senyum", "bicara", "nunjuk", "tertawa", "bangga", "kaget"], ["bicara", "nunjuk"]),
};

/* 4 murid, GANTIAN menjawab pertanyaan guru (lihat penjawab() di bawah) */
const MURID = [
  { nama: "Dito", pose: daftarPose("dito", ["diam", "senang", "bicara", "ide"], ["bicara", "ide"]) },
  { nama: "Sari", pose: daftarPose("sari", ["diam", "bicara", "malu", "bangga", "tepuk"], ["bicara"]) },
  { nama: "Bima", pose: daftarPose("bima", ["diam", "bicara", "bingung", "tertawa", "tepuk"], ["bicara"]) },
  { nama: "Keke", pose: daftarPose("keke", ["diam", "bicara", "angkat", "tepuk"], ["bicara"]) },
];

/* pose yang gak dipunya tokoh -> pakai penggantinya (urut dari kiri) */
const POSE_PENGGANTI = {
  ide: ["bicara"],
  senang: ["bangga", "tertawa", "tepuk"],
  tertawa: ["senang", "bangga"],
  bangga: ["senang", "tepuk"],
  tepuk: ["senang", "bangga"],
  angkat: ["ide", "bicara"],
  bingung: [],
  malu: ["senang"],
};

/* ==========================================================================
   2) DATA MAJAS
   - dialog        : kalimat-kalimat guru (tanda \n gak wajib, teks di balon
                     kata otomatis turun baris sendiri). Tiap baris boleh:
                       * teks biasa  -> diucapkan Ibu Rara
                       * objek       -> { teks, oleh, pose, papan, reaksi }
                           oleh    : nomor murid yang ngomong (0 Dito, 1 Sari,
                                     2 Bima, 3 Keke). Kosong = Ibu Rara
                           pose    : pose guru ("bicara" / "nunjuk")
                           papan   : nama adegan di PAPAN TULIS samping guru
                                     (lihat ADEGAN di bawah). Kosong = papan
                                     disembunyikan
                           reaksi  : tokoh ganti POSE sebentar (ekspresi),
                                     [siapa, pose, jeda ms, lama ms]
                                     siapa = nomor murid atau "guru"
                                     lama 0 = ditahan sampai baris ini selesai
                                     (default 2200)
                           selesai : pose murid setelah selesai ngomong
                           kamera  : zoom ke tokoh (cuma di layar LEBAR:
                                     laptop & tablet tidur),
                                     { ke: siapa, skala, jeda ms, lama ms }
                                     (lama kosong = ditahan). Tanpa ini:
                                     murid ngomong -> kamera dekati murid itu.
                     Tulis *kata* -> kata itu disorot stabilo + bunyi "ting".
   - jawabanMurid  : jawaban murid waktu ditanya "paham?" (usahakan pendek,
                     maksimal ~70 huruf biar muat di balon kata)
   ========================================================================== */
const SAPAAN_GURU = "Halo, teman-teman! 👋 Hari ini kita akan belajar MAJAS. Teman-teman siap?";
const SAPAAN_MURID = "Siap, Ibu Rara! Aku sudah tidak sabar! 🙌";

const DAFTAR_MAJAS = [
  {
    nama: "Apa itu Majas?",
    kategori: "Pengantar",
    dialog: [
      {
        teks: "Majas adalah gaya bahasa yang memakai KATA-KATA KIASAN\nsupaya kalimat kita lebih hidup dan menarik, teman-teman!",
        reaksi: [[0, "ide", 1800]],
      },
      {
        teks: "Contoh: daripada berkata “dia pintar sekali”,\nkita bisa berkata “dia adalah bintang kelas”.\nLebih menarik didengar, bukan?",
        reaksi: [[1, "malu", 2300], [2, "tepuk", 2900], [0, "senang", 3200]],
      },
    ],
    jawabanMurid: "Paham, Bu! Majas itu gaya bahasa yang memakai kata-kata kiasan!",
  },
  {
    nama: "Jenis-jenis Majas",
    kategori: "Pengantar",
    dialog: [
      {
        teks: "Majas itu ada beberapa jenis. Hari ini kita belajar 3 JENIS MAJAS, teman-teman: METAFORA, PERSONIFIKASI, dan HIPERBOLA!",
        reaksi: [[3, "tepuk", 2600], [1, "tepuk", 2800], [2, "tepuk", 3000], [0, "senang", 3200]],
      },
      {
        teks: "Kita bahas satu per satu, ya!\nDimulai dari yang pertama: METAFORA.",
        reaksi: [[0, "senang", 1400]],
      },
    ],
    // tanpa jawabanMurid -> murid gak ditanya "paham?", langsung lanjut ke Metafora
  },
  {
    nama: "Metafora",
    kategori: "Jenis 1",
    dialog: [
      {
        teks: "Yang pertama: *METAFORA*!\nMetafora adalah majas yang menggunakan kata\nsebagai *SIMBOL* dari makna sebenarnya.",
        reaksi: [[2, "bingung", 2400]],
      },
      {
        teks: "Contoh: \"*Sari adalah bintang kelas* di sekolah kami.\"",
        pose: "nunjuk",
        // Sari disebut -> kamera nyorot Sari yang malu-malu
        kamera: { ke: 1, skala: 1.22, jeda: 900, lama: 2200 },
        reaksi: [[1, "malu", 900, 0], [0, "senang", 1600], [3, "tepuk", 1800], [2, "bingung", 2600, 0]],
      },
      {
        oleh: 2, // Bima salah paham dulu
        teks: "Hah? Bintang? Maksudnya Sari itu bintang yang di langit, Bu?",
        selesai: "bingung",
        reaksi: [[1, "malu", 0, 0], ["guru", "kaget", 1300, 1000], ["guru", "tertawa", 2400, 0], [0, "senang", 2600]],
      },
      {
        teks: "Hihi, bukan, Bima! Kalau bintangnya bintang betulan, jadinya lucu begini...",
        papan: "bintang-harfiah",
        reaksi: [[2, "tertawa", 2400, 0], [0, "senang", 2800]],
      },
      {
        teks: "*Bintang kelas* itu SIMBOL untuk *murid paling pintar*.\nSeperti Sari yang nilainya selalu bagus!",
        papan: "bintang-makna", // pose "bicara": tangan menadah ke papan
        reaksi: [[1, "bangga", 1400, 0], [2, "tepuk", 2100], [3, "tepuk", 2300], [0, "senang", 2600]],
      },
    ],
    jawabanMurid: "Paham, Bu! Bintang kelas itu simbol murid paling pintar, bukan bintang di langit!",
  },
  {
    nama: "Personifikasi",
    kategori: "Jenis 2",
    dialog: [
      {
        teks: "Yang kedua: PERSONIFIKASI!\nIni majas yang memberi benda mati sifat seperti manusia,\nseolah-olah bisa bergerak atau memiliki perasaan.",
        reaksi: [[2, "bingung", 2400]],
      },
      {
        teks: "Contoh: \"Angin berbisik lembut di telinga Rani.\"\n(Padahal, angin tidak bisa berbicara sungguhan, ya!)",
        reaksi: [[0, "ide", 1800], [2, "tertawa", 3000], [3, "tepuk", 3300]],
      },
    ],
    jawabanMurid: "Aku paham! Personifikasi membuat benda mati seperti manusia!",
  },
  {
    nama: "Hiperbola",
    kategori: "Jenis 3",
    dialog: [
      {
        teks: "Yang ketiga, terakhir: HIPERBOLA!\nMajas yang MELEBIH-LEBIHKAN sesuatu,\nagar kesannya lebih dramatis.",
        reaksi: [[2, "tertawa", 2400], [0, "senang", 2800]],
      },
      {
        teks: "Contoh: \"Aku sudah mengatakannya beribu-ribu kali,\ntetapi kamu tetap saja lupa!\"",
        kamera: { ke: "guru", skala: 1.12, jeda: 300 }, // kalimat dramatis -> kamera mendekat ke guru
        reaksi: [[2, "tertawa", 2200], [1, "tepuk", 2600], [0, "senang", 2900]],
      },
    ],
    jawabanMurid: "Paham sekali! Hiperbola itu melebih-lebihkan, seperti “PR-ku segunung”!",
  },
  {
    // penutup: ngarahin siswa ke halaman Video (alur Materi -> Video -> Kuis -> Game)
    nama: "Ayo Menonton Video!",
    kategori: "Penutup",
    dialog: [
      {
        teks: "Hebat, teman-teman! Kita sudah belajar 3 jenis majas: METAFORA, PERSONIFIKASI, dan HIPERBOLA. 🎉",
        reaksi: [[1, "tepuk", 1400, 0], [2, "tepuk", 1600, 0], [3, "tepuk", 1800, 0], [0, "senang", 2000, 0]],
      },
      {
        teks: "Supaya makin paham, ayo kita tonton VIDEO majas!\nTekan tombol \"Lanjut ke Video\" di bawah, ya. 🎬",
        reaksi: [[0, "senang", 1600], [3, "tepuk", 1900]],
      },
    ],
  },
];

/* ==========================================================================
   2b) ADEGAN PAPAN TULIS — contoh yang ditunjukkan Ibu Rara di papan.
   Dibikin dari gambar yang sudah ada + emoji + gambar SVG/CSS sederhana.
   Animasinya di css/materi.css (bagian "isi adegan").
   ========================================================================== */
const SVG_BINTANG_HIDUP = `
<svg viewBox="0 0 100 96" aria-hidden="true">
  <path d="M50 4 L62 34 L95 36 L69 57 L78 90 L50 71 L22 90 L31 57 L5 36 L38 34 Z"
        fill="#FFD43B" stroke="#2C2450" stroke-width="4" stroke-linejoin="round"/>
  <ellipse cx="40" cy="48" rx="4" ry="5.5" fill="#2C2450"/>
  <ellipse cx="60" cy="48" rx="4" ry="5.5" fill="#2C2450"/>
  <circle cx="41.5" cy="46" r="1.5" fill="#fff"/><circle cx="61.5" cy="46" r="1.5" fill="#fff"/>
  <ellipse cx="33" cy="58" rx="5" ry="3" fill="#FF8FA3" opacity=".7"/>
  <ellipse cx="67" cy="58" rx="5" ry="3" fill="#FF8FA3" opacity=".7"/>
  <path d="M42 60 Q50 68 58 60" fill="none" stroke="#2C2450" stroke-width="3.5" stroke-linecap="round"/>
</svg>`;

const ADEGAN = {
  // arti HARFIAH (salah): bintang beneran duduk di bangku kelas -> dicoret
  "bintang-harfiah": `
    <div class="adegan">
      <span class="kerlip" style="left:6%;top:6%">✨</span>
      <span class="kerlip" style="right:8%;top:16%;animation-delay:.4s">⭐</span>
      <span class="kerlip" style="left:16%;top:40%;animation-delay:.7s">✦</span>
      <div class="bintang-hidup">${SVG_BINTANG_HIDUP}</div>
      <div class="meja"><span>KELAS 5</span></div>
      <div class="cap-silang">❌</div>
    </div>
    <div class="adegan-label is-salah">Bintang di langit? Bukan!</div>`,

  // MAKNA sebenarnya: Sari = murid paling pintar
  "bintang-makna": `
    <div class="adegan">
      <div class="adegan-sari"><img src="${MURID[1].pose.diam}" alt="Sari"><span class="mahkota-bintang">🌟</span></div>
      <div class="kertas-nilai">100</div>
      <div class="piala">🏆</div>
      <span class="kerlip" style="left:10%;bottom:12%;animation-delay:.3s">✨</span>
      <span class="kerlip" style="right:12%;top:8%;animation-delay:.6s">✨</span>
    </div>
    <div class="adegan-label is-benar">Bintang kelas = murid paling pintar ✅</div>`,
};

/** baris dialog bisa teks biasa atau objek -> selalu jadi objek */
function bacaBaris(baris) {
  return typeof baris === "string" ? { teks: baris } : baris;
}

/** langkah terakhir 1 bagian materi: dialog guru (+2 kalau ada pertanyaan
    "paham?": 1 langkah guru bertanya, 1 langkah murid menjawab) */
function langkahTerakhir(majas) {
  return majas.dialog.length - 1 + (majas.jawabanMurid ? 2 : 0);
}

/* ==========================================================================
   3) STATE
   ========================================================================== */
const TAHAP = { INTRO: "intro", KONTEN: "konten" };
let tahap = TAHAP.INTRO;
// intro: murid baru menjawab sapaan setelah tombol ditekan (kasih jeda buat
// guru di kelas nanya ke siswa dulu)
let introDijawab = false;
let idxMajas = 0;
let idxDialog = 0;
let suaraNyala = true;

let pembicaraAktif = null; // siapa yang lagi ngetik (guru / dito), null = gak ada
let teksSekarang = "";     // teks lengkap baris yang lagi diketik
let timerKetik = null;
let timerGiliran = null;   // jeda sebelum Dito jawab
let giliranBerikut = null; // fungsi yang dijalanin pas jeda itu habis

/* ==========================================================================
   4) ELEMEN HTML
   ========================================================================== */
const elProgress = document.getElementById("comicProgress");
const elTeacherSlot = document.getElementById("teacherSlot");
const elAudienceRow = document.getElementById("audienceRow");
const btnPrev = document.getElementById("btnPrev");
const btnAction = document.getElementById("btnAction");
const btnMute = document.getElementById("btnMute");
const muteIcon = document.getElementById("muteIcon");

/* ==========================================================================
   5) SUARA (Web Audio API — gak butuh file mp3)
   ========================================================================== */
let audioCtx = null;
function pastikanAudioSiap() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
}
function nadaPendek(freqAwal, freqAkhir, durasi, volume) {
  if (!suaraNyala) return;
  pastikanAudioSiap();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freqAwal, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freqAkhir, audioCtx.currentTime + durasi);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durasi);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + durasi);
}
/* suara ketik guru lebih rendah, murid lebih tinggi (biar kebedain) */
function playTick(nadaTinggi) {
  const dasar = nadaTinggi ? 750 : 500;
  nadaPendek(dasar + Math.random() * 200, dasar - 100, 0.05, 0.05);
}
function playPop() { nadaPendek(300, 700, 0.15, 0.08); }
function playMasuk() { nadaPendek(200, 500, 0.12, 0.05); }
function playTing() { nadaPendek(1320, 1760, 0.18, 0.06); }               // kata kunci disorot
/* goresan kapur: beberapa "srek" pendek bernada tinggi */
function playKapur() {
  for (let i = 0; i < 6; i++) setTimeout(() => nadaPendek(1700 + Math.random() * 500, 1100, 0.05, 0.018), i * 120);
}
function playHapus() { nadaPendek(520, 180, 0.32, 0.04); }               // penghapus disapukan
function playCap() { setTimeout(() => nadaPendek(180, 60, 0.25, 0.12), 1400); } // cap ❌

/** coba muter file suara asli; kalau belum ada / gagal, diabaikan aja (gak error) */
function playSuaraAsli(src) {
  if (!suaraNyala || !src) return;
  const audio = new Audio(src);
  audio.volume = 0.8;
  audio.play().catch(() => {});
}

/* ==========================================================================
   6) TOKOH — bikin elemen + ganti pose
   -------------------------------------------------------------------------
   Semua pose dimuat sekaligus sebagai <img> yang ditumpuk, lalu cuma
   satu yang dikasih class "is-active". Jadi ganti pose instan, gak kedip
   nunggu gambar dimuat.
   ========================================================================== */
function buatTokoh(data, el) {
  el.innerHTML = `<div class="tokoh-figure"><div class="tokoh-shadow"></div><div class="tokoh-body"></div></div>`;
  const body = el.querySelector(".tokoh-body");
  const poseEls = {};

  Object.entries(data.pose).forEach(([nama, src]) => {
    const img = document.createElement("img");
    img.decoding = "async"; // gambar dibongkar di belakang layar, halaman gak tersendat
    img.className = "pose";
    img.src = src;
    img.alt = data.nama;
    img.draggable = false;
    body.appendChild(img);
    poseEls[nama] = img;
  });

  const posePertama = Object.keys(data.pose)[0];
  const tokoh = {
    el,
    poseEls,
    poseSekarang: posePertama,
    /** nama pose yang beneran dipakai: pose itu, penggantinya, atau pose pertama */
    cariPose(nama) {
      if (poseEls[nama]) return nama;
      const ganti = (POSE_PENGGANTI[nama] || []).find((p) => poseEls[p]);
      return ganti || posePertama;
    },
    /** ganti pose (langsung, tanpa animasi biar gak "getar") */
    gantiPose(nama) {
      nama = tokoh.cariPose(nama);
      tokoh.poseSekarang = nama;
      Object.entries(poseEls).forEach(([n, img]) => img.classList.toggle("is-active", n === nama));
    },
    punyaPose(nama) { return !!poseEls[nama]; },
  };
  tokoh.gantiPose(Object.keys(data.pose)[0]); // pose pertama = pose awal
  aturRasioTokoh(el, Object.values(poseEls)[0]);
  return tokoh;
}

const guru = buatTokoh(GURU, elTeacherSlot);

const murid = MURID.map((data, i) => {
  const el = document.createElement("div");
  el.className = `tokoh murid murid-${i + 1}`;
  elAudienceRow.appendChild(el);
  return buatTokoh(data, el);
});
const dito = murid[0];

/* ==========================================================================
   7) PEMBICARA — tiap pembicara punya balon kata & pose sendiri
   ========================================================================== */
function siapkanPembicara(tokoh, idBubble, pose) {
  const bubble = document.getElementById(idBubble);
  return {
    tokoh,
    bubble,
    isi: bubble.querySelector(".speech-isi"),
    cursor: bubble.querySelector(".speech-cursor"),
    pose, // { ngomong, selesai, diam }
  };
}
const PEMBICARA = {
  guru: siapkanPembicara(guru, "bubbleGuru", { ngomong: "bicara", selesai: "senyum", diam: "senyum" }),
  // "murid" = siapa pun murid yang lagi jawab (diganti lewat pilihMurid)
  murid: siapkanPembicara(dito, "bubbleMurid", { ngomong: "bicara", selesai: "senang", diam: "diam" }),
};

/**
 * Pilih murid ke-i (0 Dito, 1 Sari, 2 Bima, 3 Keke) jadi yang jawab, lalu
 * pindahin EKOR balon kata murid biar nunjuk ke kepala murid itu.
 */
function pilihMurid(i) {
  const p = PEMBICARA.murid;
  murid.forEach((m) => m.gantiPose("diam"));
  p.tokoh = murid[i];

  const balon = p.bubble;
  // posisi tengah murid (kaki) relatif ke balon, dalam persen lebar balon
  const tengah = p.tokoh.el.offsetLeft;
  const rel = ((tengah - balon.offsetLeft) / balon.offsetWidth) * 100;
  const ujung = Math.round(rel + 6);                    // ujung ekor (ke kepala)
  const pangkal = Math.max(22, Math.min(66, ujung - 8)); // pangkal ekor harus di dalam elips
  // HP: balon murid ada di atas panggung (tempat yang sama dengan balon guru)
  // -> ekornya pendek, cukup NUNJUK ke arah murid, gak nusuk ke papan tulis
  const hp = window.matchMedia("(max-width:820px), (orientation:portrait) and (max-width:1100px)").matches;
  const yUjung = hp ? 118 : 136;
  balon.querySelectorAll(".tail-desktop, .tail-mobile").forEach((path) => {
    path.setAttribute("d",
      `M${pangkal} 88 Q${(pangkal + ujung) / 2} 112 ${ujung} ${yUjung} Q${(pangkal + 12 + ujung) / 2 + 3} 112 ${pangkal + 14} 95 Z`);
  });
  balon.style.transformOrigin = `${ujung}% ${yUjung}%`;
}

/* urutan murid yang jawab "paham?" tiap bagian materi (gantian) */
function penjawab(idx) {
  return (idx + 1) % murid.length; // pembuka = Dito, lalu Sari, Bima, Keke, Dito, ...
}

/* ==========================================================================
   8) BALON KATA + EFEK NGETIK
   ========================================================================== */
/**
 * Tampilkan balon kata pembicara & ketik teksnya huruf per huruf.
 * opsi.pose  : pose waktu ngomong (default: pose.ngomong pembicara)
 * opsi.lalu  : fungsi yang dijalanin setelah selesai ngomong (mis. giliran Dito)
 */
function bicara(siapa, teks, opsi = {}) {
  hentikanSemua();
  const p = PEMBICARA[siapa];

  // cuma 1 balon yang keliatan (punya yang lagi ngomong), yang lain balik pose diam
  Object.values(PEMBICARA).forEach((x) => {
    x.bubble.classList.toggle("is-show", x === p);
    if (x !== p) x.tokoh.gantiPose(x.pose.diam);
  });

  // pose yang beneran dipakai (mis. Sari gak punya "ide" -> pakai "bicara")
  pembicaraAktif = { siapa, ...opsi, poseNgomong: p.tokoh.cariPose(opsi.pose || p.pose.ngomong) };
  teksSekarang = teks;
  p.isi.textContent = "";
  p.cursor.classList.remove("is-hidden");
  p.tokoh.gantiPose(pembicaraAktif.poseNgomong);
  p.tokoh.el.classList.add("is-talking");
  mulaiMulut(p.tokoh, pembicaraAktif.poseNgomong);
  playSuaraAsli(opsi.suara);

  // diketik per potongan: potongan *sorot* masuk ke <span class="sorot">
  const potongan = pecahSorot(teks);
  let iPotong = 0, iHuruf = 0, n = 0, wadah = null;
  (function ketikSatuHuruf() {
    if (iPotong < potongan.length) {
      const pt = potongan[iPotong];
      if (!wadah) {
        wadah = document.createElement("span");
        if (pt.sorot) wadah.className = "sorot";
        p.isi.appendChild(wadah);
      }
      wadah.textContent += pt.t.charAt(iHuruf++);
      if (!opsi.suara && n++ % 2 === 0) playTick(siapa !== "guru");
      if (iHuruf >= pt.t.length) {
        if (pt.sorot) playTing();
        iPotong++; iHuruf = 0; wadah = null;
      }
      timerKetik = setTimeout(ketikSatuHuruf, 26);
    } else {
      selesaiNgetik();
    }
  })();
}

/** "a *b* c" -> [{t:"a "}, {t:"b", sorot:true}, {t:" c"}] */
function pecahSorot(teks) {
  return teks.split(/\*([^*]+)\*/).map((t, i) => ({ t, sorot: i % 2 === 1 })).filter((x) => x.t);
}
function tulisPenuh(el, teks) {
  el.textContent = "";
  pecahSorot(teks).forEach((pt) => {
    const s = document.createElement("span");
    if (pt.sorot) s.className = "sorot";
    s.textContent = pt.t;
    el.appendChild(s);
  });
}

/** selesaiin ketikan sekarang (dipanggil otomatis, atau pas tombol/balon diklik) */
function selesaiNgetik() {
  if (!pembicaraAktif) return;
  const { siapa, poseNgomong, lalu, selesai } = pembicaraAktif;
  const p = PEMBICARA[siapa];
  pembicaraAktif = null;
  clearTimeout(timerKetik);

  // kalau di-skip, langsung tampil penuh
  if (p.isi.textContent !== teksSekarang.replace(/\*/g, "")) tulisPenuh(p.isi, teksSekarang);
  p.cursor.classList.add("is-hidden");
  p.tokoh.el.classList.remove("is-talking");
  hentikanMulut();
  p.tokoh.gantiPose(poseNgomong);

  // habis ngomong ganti pose "selesai" (pose nunjuk/ide ditahan sebentar biar keliatan)
  const tahan = poseNgomong === "nunjuk" || poseNgomong === "ide" ? 1100 : 250;
  const poseSelesai = selesai || p.pose.selesai;
  p.timerPose = setTimeout(() => p.tokoh.gantiPose(poseSelesai), tahan);

  // giliran berikutnya (mis. Dito jawab) setelah jeda sebentar
  if (lalu) {
    giliranBerikut = lalu;
    timerGiliran = setTimeout(jalankanGiliranBerikut, 700);
  }
}

function jalankanGiliranBerikut() {
  const fn = giliranBerikut;
  giliranBerikut = null;
  clearTimeout(timerGiliran);
  if (fn) fn();
}

/**
 * Mulut buka-tutup: gonta-ganti pose "bicara" <-> "bicara_tutup" (gambarnya
 * sama persis, cuma beda mulut) dengan jeda acak biar kayak ngomong beneran.
 * Kalau tokohnya gak punya versi "_tutup", ya diam aja (cuma badan goyang).
 */
let timerMulut = null;
function mulaiMulut(tokoh, pose) {
  hentikanMulut();
  if (!tokoh.punyaPose(pose + "_tutup")) return;
  let buka = true;
  (function kedip() {
    buka = !buka;
    tokoh.gantiPose(buka ? pose : pose + "_tutup");
    timerMulut = setTimeout(kedip, 90 + Math.random() * 110);
  })();
}
function hentikanMulut() {
  clearTimeout(timerMulut);
  timerMulut = null;
}

/** stop semua ketikan/jeda yang lagi jalan (dipakai sebelum pindah baris) */
function hentikanSemua() {
  clearTimeout(timerKetik);
  hentikanMulut();
  clearTimeout(timerGiliran);
  giliranBerikut = null;
  Object.values(PEMBICARA).forEach((p) => {
    clearTimeout(p.timerPose);
    p.tokoh.el.classList.remove("is-talking");
  });
  pembicaraAktif = null;
}

/** true kalau masih ada yang ngomong / nunggu giliran -> klik = skip dulu */
function lagiAdaYangNgomong() {
  return pembicaraAktif !== null || giliranBerikut !== null;
}
function skip() {
  if (pembicaraAktif) selesaiNgetik();
  else if (giliranBerikut) jalankanGiliranBerikut();
}

Object.values(PEMBICARA).forEach((p) => p.bubble.addEventListener("click", skip));

/* (9) Gerakan "lompat sesekali" dihapus. Sekarang tokoh yang diam cuma
   "bernapas" pelan (CSS di materi.css) + ganti pose ekspresi (REAKSI). */

/* ==========================================================================
   9b) REAKSI — tokoh yang lagi gak ngomong ganti pose ekspresi sebentar
   (malu, bingung, tertawa, tepuk tangan, ...), lalu balik ke pose diamnya.
   ========================================================================== */
let timerReaksi = [];
const poseIstirahat = (t) => (t === guru ? "senyum" : "diam");
function tokohKe(siapa) {
  return siapa === "guru" ? guru : murid[siapa];
}
/** batalkan reaksi yang belum jalan + balikin semua yang gak ngomong ke pose diam */
function bersihkanReaksi() {
  timerReaksi.forEach(clearTimeout);
  timerReaksi = [];
  [guru, ...murid].forEach((t) => {
    if (!t.el.classList.contains("is-talking")) t.gantiPose(poseIstirahat(t));
  });
}
/** daftar = [[siapa, pose, jedaMs, lamaMs], ...]  (lama 0 = ditahan) */
function jadwalReaksi(daftar) {
  (daftar || []).forEach(([siapa, pose, jeda = 800, lama = 2200]) => {
    timerReaksi.push(setTimeout(() => {
      const t = tokohKe(siapa);
      // yang lagi ngomong gak diganggu (pose ngomong + gerak bibir)
      if (!t || t.el.classList.contains("is-talking")) return;
      t.gantiPose(pose);
      if (lama > 0) {
        timerReaksi.push(setTimeout(() => {
          if (!t.el.classList.contains("is-talking") && t.poseSekarang === t.cariPose(pose)) t.gantiPose(poseIstirahat(t));
        }, lama));
      }
    }, jeda));
  });
}

/* ==========================================================================
   9d) KAMERA — panggung (tokoh + papan + background) zoom pelan ke 1 titik.
   CUMA di layar LEBAR (laptop & tablet tidur). Di HP & tablet berdiri
   panggungnya sempit -> zoom bikin papan/tokoh kepotong, jadi dimatikan.
   Titik zoom = kepala tokoh -> ekor balon kata tetap nunjuk pas.
   Balon kata TIDAK ikut zoom (tetap terbaca).
   Background: lapisan body::before (body.kamera) di-zoom dengan titik sama.
   ========================================================================== */
const elPanel = document.getElementById("scene");
const elDunia = document.getElementById("dunia");
const gerakDikurangi = window.matchMedia("(prefers-reduced-motion: reduce)");
// sama dengan batas tata letak tegak di css/komik.css & css/materi.css
const layarSempit = window.matchMedia("(max-width:820px), (orientation:portrait) and (max-width:1100px)");
let shotSekarang = { ke: null, skala: 1 };

/** titik kepala tokoh dalam koordinat panel (px, sebelum di-zoom) */
function titikKepala(t) {
  const el = t.el;
  return { x: el.offsetLeft, y: el.offsetTop + el.offsetHeight * (t === guru ? 0.2 : 0.18) };
}
/** arahkan kamera: ke = "guru" / nomor murid / null (lebar). skala 1 = normal */
function kamera(ke, skala = 1) {
  shotSekarang = { ke, skala };
  const t = ke == null ? null : tokohKe(ke);
  if (!t || skala === 1 || gerakDikurangi.matches || layarSempit.matches) {
    elDunia.style.transform = "";
    document.body.style.setProperty("--kamera-skala", 1);
    return;
  }
  const p = titikKepala(t);
  elDunia.style.transformOrigin = `${p.x}px ${p.y}px`;
  elDunia.style.transform = `scale(${skala})`;
  // titik yang sama di layar, buat lapisan background
  const r = elPanel.getBoundingClientRect();
  const rasio = r.width / elPanel.offsetWidth; // panel bisa di-zoom (--skala layar besar)
  const kx = r.left + p.x * rasio, ky = r.top + p.y * rasio;
  document.body.style.setProperty("--kamera-x", `${kx}px`);
  document.body.style.setProperty("--kamera-y", `${ky}px`);
  document.body.style.setProperty("--kamera-skala", skala);
  // kupu-kupu (js/kupu.js) nempel di background -> ikut di-zoom dari titik yang sama
  document.querySelectorAll(".kupu").forEach((k) => {
    k.style.transformOrigin = `${kx - parseFloat(k.style.left || 0)}px ${ky - parseFloat(k.style.top || 0)}px`;
  });
}
let timerKamera = [];
/** atur kamera 1 langkah: shot utama + (opsional) sorotan sementara */
function aturKamera(utama, sorot) {
  timerKamera.forEach(clearTimeout);
  timerKamera = [];
  kamera(utama ? utama.ke : null, utama ? utama.skala : 1);
  if (!sorot) return;
  timerKamera.push(setTimeout(() => {
    kamera(sorot.ke, sorot.skala || 1.2);
    if (sorot.lama) timerKamera.push(setTimeout(() => kamera(utama ? utama.ke : null, utama ? utama.skala : 1), sorot.lama));
  }, sorot.jeda || 0));
}
// ukuran/arah layar berubah -> titik zoom dihitung ulang (atau dimatikan)
// (ditunda 1 frame: posisi kupu-kupu dihitung ulang kupu.js dulu)
window.addEventListener("resize", () => requestAnimationFrame(() => kamera(shotSekarang.ke, shotSekarang.skala)));

/* ==========================================================================
   9c) PAPAN TULIS di samping Ibu Rara — SELALU ADA.
   - tulisJudul(): judul materi ditulis kapur di papan (gantiin label kuning).
   - tampilkanPapan(): contoh/adegan (lihat ADEGAN) "digambar" kapur di bawah
     judul. Ganti adegan -> dihapus dulu, lalu digambar. Tanpa adegan ->
     contoh dihapus & judul balik besar di tengah papan.
   ========================================================================== */
const elPapan = document.getElementById("papan");
const elPapanIsi = document.getElementById("papanIsi");
const elPapanJudul = document.getElementById("papanJudul");
let adeganTergambar = null; // adegan yang sudah selesai digambar di papan
let timerPapan = null;
let timerJudul = null;
let judulSekarang = "Ayo Belajar!|";

/** tulis judul di papan; kalau beda dari yang sekarang: hapus dulu, lalu tulis */
function tulisJudul(nama, kategori = "") {
  const kunci = `${nama}|${kategori}`;
  if (kunci === judulSekarang) return;
  judulSekarang = kunci;
  clearTimeout(timerJudul);
  elPapanJudul.classList.remove("is-tulis");
  elPapanJudul.classList.add("is-hapus");
  timerJudul = setTimeout(() => {
    elPapanJudul.querySelector(".papan-kategori").textContent = kategori;
    elPapanJudul.querySelector(".papan-nama").textContent = nama;
    elPapanJudul.classList.remove("is-hapus");
    void elPapanJudul.offsetWidth; // restart animasi
    elPapanJudul.classList.add("is-tulis");
    playKapur();
  }, 320);
}

function tampilkanPapan(nama) {
  clearTimeout(timerPapan);
  if (!nama || !ADEGAN[nama]) {
    // gak ada contoh: hapus contoh (kalau ada), judul balik ke tengah
    if (adeganTergambar) {
      elPapanIsi.classList.remove("is-gambar");
      elPapanIsi.classList.add("is-hapus");
      timerPapan = setTimeout(() => { elPapanIsi.innerHTML = ""; }, 380);
    }
    adeganTergambar = null;
    elPapan.classList.remove("ada-contoh");
    return;
  }
  // adegan sama & sudah tergambar -> biarin, gak diulang
  if (adeganTergambar === nama) {
    elPapanIsi.classList.remove("is-hapus");
    elPapan.classList.add("ada-contoh");
    return;
  }
  const adaIsi = !!adeganTergambar;
  adeganTergambar = null;
  const gambar = () => {
    elPapanIsi.innerHTML = ADEGAN[nama];
    elPapanIsi.classList.remove("is-hapus", "is-gambar");
    void elPapanIsi.offsetWidth; // restart animasi
    elPapanIsi.classList.add("is-gambar");
    adeganTergambar = nama;
    playKapur();
    if (elPapanIsi.querySelector(".cap-silang")) playCap();
  };
  elPapan.classList.add("ada-contoh"); // judul naik ke atas papan
  if (adaIsi) {
    // isi lama dihapus dulu (disapu penghapus), lalu digambar yang baru
    elPapanIsi.classList.remove("is-gambar");
    elPapanIsi.classList.add("is-hapus");
    playHapus();
    timerPapan = setTimeout(gambar, 380);
  } else {
    elPapanIsi.innerHTML = "";
    timerPapan = setTimeout(gambar, 450); // tunggu judul selesai naik
  }
}

/* ==========================================================================
   10) RENDER TIAP TAHAP
   ========================================================================== */
function renderIntro() {
  renderProgress();
  tulisJudul("Ayo Belajar!");

  guru.el.classList.add("is-masuk");
  playMasuk();

  // tunggu guru selesai jalan masuk, baru ngomong. Dito jawab nanti,
  // setelah tombol "Siap!" ditekan
  introDijawab = false;
  setTimeout(() => {
    guru.el.classList.remove("is-masuk");
    bicara("guru", SAPAAN_GURU);
  }, 1350);

  btnPrev.disabled = true;
  btnAction.innerHTML = 'Siap! <i class="fa-solid fa-arrow-right"></i>';
}

function renderKonten() {
  const majas = DAFTAR_MAJAS[idxMajas];
  const diPromptPaham = idxDialog === majas.dialog.length;
  const diJawabMurid = idxDialog > majas.dialog.length;
  const diMajasTerakhir = idxMajas === DAFTAR_MAJAS.length - 1;
  const diLangkahTerakhir = diMajasTerakhir && idxDialog >= langkahTerakhir(majas);

  renderProgress();
  tulisJudul(majas.nama, majas.kategori);
  bersihkanReaksi();

  if (diPromptPaham) {
    // guru nanya, murid jawab di langkah berikutnya (setelah tombol ditekan).
    // Papan tulis contoh terakhir tetap ditampilkan biar bisa dilihat lagi.
    aturKamera(null);
    bicara("guru", `Bagaimana, teman-teman? Sudah paham tentang “${majas.nama}”? 😊`);
    // murid yang nanti menjawab ANGKAT TANGAN dulu ("Aku, Bu!"), ditahan
    // sampai gilirannya ngomong. (Dito: telunjuk ke atas, Keke: angkat tangan)
    jadwalReaksi([[penjawab(idxMajas), "angkat", 1700, 0]]);
    btnAction.innerHTML = 'Paham! <i class="fa-solid fa-thumbs-up"></i>';
  } else if (diJawabMurid) {
    // contoh tetap di papan sampai pindah ke bagian berikutnya
    const i = penjawab(idxMajas);
    pilihMurid(i);
    aturKamera({ ke: i, skala: 1.15 });
    bicara("murid", majas.jawabanMurid, { pose: "ide" });
    jadwalReaksi([["guru", "bangga", 1800, 0]]); // guru bangga muridnya paham
    btnAction.innerHTML = 'Lanjut <i class="fa-solid fa-arrow-right"></i>';
  } else {
    const baris = bacaBaris(majas.dialog[idxDialog]);
    const kam = baris.kamera;
    const sorot = kam && kam.lama ? kam : null;             // sorotan sementara
    let utama = kam && !kam.lama ? kam : null;              // shot sepanjang baris
    if (!utama && baris.oleh != null) utama = { ke: baris.oleh, skala: 1.15 };

    tampilkanPapan(baris.papan);
    aturKamera(utama, sorot);
    if (baris.oleh != null) {
      pilihMurid(baris.oleh);
      bicara("murid", baris.teks, { pose: "bicara", selesai: baris.selesai });
    } else {
      // ada papan -> pose "bicara" (tangan menadah ke arah papan di kirinya)
      const poseDefault = baris.papan ? "bicara" : baris.teks.includes("Contoh") ? "nunjuk" : "bicara";
      bicara("guru", baris.teks, { pose: baris.pose || poseDefault });
    }
    jadwalReaksi(baris.reaksi);
    btnAction.innerHTML = 'Lanjut <i class="fa-solid fa-arrow-right"></i>';
  }
  if (diLangkahTerakhir) btnAction.innerHTML = 'Lanjut ke Video <i class="fa-solid fa-clapperboard"></i>';

  btnPrev.disabled = idxMajas === 0 && idxDialog === 0;
}

function renderProgress() {
  elProgress.innerHTML = "";
  DAFTAR_MAJAS.forEach((m, i) => {
    const dot = document.createElement("button");
    dot.className = "comic-dot";
    dot.setAttribute("aria-label", `Lompat ke materi ${m.nama}`);
    if (tahap === TAHAP.KONTEN) {
      if (i === idxMajas) dot.classList.add("is-active");
      else if (i < idxMajas) dot.classList.add("is-done");
    }
    dot.addEventListener("click", () => {
      if (guru.el.classList.contains("is-masuk")) return;
      tahap = TAHAP.KONTEN;
      idxMajas = i;
      idxDialog = 0;
      renderKonten();
    });
    elProgress.appendChild(dot);
  });
}

/* ==========================================================================
   11) TOMBOL AKSI
   ========================================================================== */
btnAction.addEventListener("click", () => {
  // klik pertama waktu masih ada yang ngomong = skip ketikan dulu
  if (lagiAdaYangNgomong()) {
    skip();
    return;
  }
  // jangan bisa lanjut selagi guru masih jalan masuk
  if (guru.el.classList.contains("is-masuk")) return;

  playPop();

  if (tahap === TAHAP.INTRO && !introDijawab) {
    introDijawab = true;
    pilihMurid(0);
    aturKamera({ ke: 0, skala: 1.15 });
    bicara("murid", SAPAAN_MURID);
    jadwalReaksi([[3, "tepuk", 900], [1, "tepuk", 1100], [2, "tepuk", 1300]]);
    btnAction.innerHTML = 'Mulai Belajar <i class="fa-solid fa-arrow-right"></i>';
    return;
  }
  if (tahap === TAHAP.INTRO) {
    tahap = TAHAP.KONTEN;
    idxMajas = 0;
    idxDialog = 0;
    renderKonten();
    return;
  }

  const majas = DAFTAR_MAJAS[idxMajas];

  if (idxDialog < langkahTerakhir(majas)) {
    idxDialog++;
    renderKonten();
  } else if (idxMajas < DAFTAR_MAJAS.length - 1) {
    idxMajas++;
    idxDialog = 0;
    renderKonten();
  } else {
    window.location.href = "video.html"; // alur: Materi -> Video -> Kuis -> Game
  }
});

btnPrev.addEventListener("click", () => {
  if (tahap !== TAHAP.KONTEN) return;
  playPop();

  if (idxDialog > 0) {
    idxDialog--;
  } else if (idxMajas > 0) {
    idxMajas--;
    idxDialog = langkahTerakhir(DAFTAR_MAJAS[idxMajas]);
  }
  renderKonten();
});

/* ==========================================================================
   12) TOMBOL MUTE
   ========================================================================== */
btnMute.addEventListener("click", () => {
  suaraNyala = !suaraNyala;
  btnMute.classList.toggle("is-muted", !suaraNyala);
  muteIcon.className = suaraNyala ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark";
});

/* ==========================================================================
   13) MULAI!
   ========================================================================== */
renderIntro();
