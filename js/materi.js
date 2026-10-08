/* ==========================================================================
   METAPIA — materi.js
   Alurnya (konsep komik):
   1) Guru jalan masuk dari kiri -> sapa "Siap?" -> Dito jawab "Siap, Kak!"
   2) Guru jelasin tiap majas lewat balon kata -> di akhir nanya "Paham?"
      -> Dito jawab pakai balon katanya sendiri (nunjukin dia paham)
   3) Majas terakhir -> tombol "Lanjut ke Video" -> pindah ke video.html
      (alur belajar: Materi -> Video -> Kuis -> Game)

   POSE (otomatis, gak perlu diatur manual):
   - Guru : senyum (diam) / bicara (ngomong) / nunjuk (kalimat ada "Contoh")
   - Dito : diam / bicara / ide (pas jawab "paham") / senang (habis jawab)
   - Sari, Bima, Keke cuma 1 pose, sesekali lompat kecil biar hidup
   ========================================================================== */

/* ==========================================================================
   1) DATA KARAKTER
   -------------------------------------------------------------------------
   Gambar pose di assets/karakter/guru/ dan assets/karakter/murid/ sudah
   diseragamkan (ukuran kanvas sama, posisi kaki sama). Kalau nanti
   nambah/ganti pose, gambarnya juga harus diseragamkan dulu biar gak
   "lompat" pas gantian. Pose PERTAMA di daftar = pose awal.
   ========================================================================== */
const GURU = {
  nama: "Kak Rara",
  pose: {
    senyum: "assets/karakter/guru/guru-senyum.png",
    bicara: "assets/karakter/guru/guru-bicara.png",
    nunjuk: "assets/karakter/guru/guru-nunjuk.png",
    // versi mulut TERTUTUP -> gantian sama yang terbuka waktu ngomong (lip-sync)
    bicara_tutup: "assets/karakter/guru/guru-bicara-tutup.png",
    nunjuk_tutup: "assets/karakter/guru/guru-nunjuk-tutup.png",
  },
};

/* 4 murid, GANTIAN menjawab pertanyaan guru (lihat PENJAWAB di bawah).
   Dito punya banyak pose; Sari, Bima, Keke baru 1 pose (diam). */
const MURID = [
  {
    nama: "Dito",
    pose: {
      diam: "assets/karakter/murid/dito-diam.png",
      senang: "assets/karakter/murid/dito-senang.png",
      bicara: "assets/karakter/murid/dito-bicara.png",
      ide: "assets/karakter/murid/dito-ide.png",
      bicara_tutup: "assets/karakter/murid/dito-bicara-tutup.png",
      ide_tutup: "assets/karakter/murid/dito-ide-tutup.png",
    },
  },
  { nama: "Sari", pose: { diam: "assets/karakter/murid/sari.png" } },
  { nama: "Bima", pose: { diam: "assets/karakter/murid/bima.png" } },
  { nama: "Keke", pose: { diam: "assets/karakter/murid/keke.png" } },
];

/* ==========================================================================
   2) DATA MAJAS
   - dialog        : kalimat-kalimat guru (tanda \n gak wajib, teks di balon
                     kata otomatis turun baris sendiri)
   - jawabanMurid  : jawaban Dito waktu ditanya "paham?" (usahakan pendek,
                     maksimal ~70 huruf biar muat di balon kata)
   ========================================================================== */
const SAPAAN_GURU = "Halo teman-teman! 👋 Hari ini kita mau belajar MAJAS. Teman-teman siap?";
const SAPAAN_MURID = "Siap, Kak Rara! Aku udah gak sabar! 🙌";

const DAFTAR_MAJAS = [
  {
    nama: "Apa itu Majas?",
    kategori: "Pengantar",
    dialog: [
      "Majas adalah gaya bahasa yang memakai KATA-KATA KIASAN\nsupaya kalimat kita lebih hidup dan menarik, teman-teman!",
      "Contoh: daripada bilang 'dia pintar banget',\nkita bisa bilang 'dia itu bintang kelas'.\nLebih seru kan dengernya?",
    ],
    jawabanMurid: "Paham, Kak! Majas itu gaya bahasa yang memakai kata-kata kiasan!",
  },
  {
    nama: "Jenis-jenis Majas",
    kategori: "Pengantar",
    dialog: [
      "Majas itu ada beberapa jenis. Hari ini kita belajar 3 JENIS MAJAS, teman-teman: METAFORA, PERSONIFIKASI, dan HIPERBOLA!",
      "Kita bahas satu per satu, ya!\nDimulai dari yang pertama: METAFORA.",
    ],
    jawabanMurid: "Siap, Kak! Ada 3 jenis: metafora, personifikasi, dan hiperbola!",
  },
  {
    nama: "Metafora",
    kategori: "Jenis 1",
    dialog: [
      "Yang pertama: METAFORA!\nMetafora adalah majas yang menggunakan kata\nsebagai SIMBOL dari makna sebenarnya.",
      "Contoh: \"Dia adalah bintang kelas di sekolah kami.\"\n(\"Bintang kelas\" itu simbol untuk murid paling pintar!)",
    ],
    jawabanMurid: "Paham, Kak! Metafora memakai kata sebagai simbol dari makna sebenarnya!",
  },
  {
    nama: "Personifikasi",
    kategori: "Jenis 2",
    dialog: [
      "Yang kedua: PERSONIFIKASI!\nIni waktu benda mati dikasih sifat kayak manusia,\nseolah-olah bisa bergerak atau punya perasaan.",
      "Contoh: \"Angin berbisik lembut di telinga Rani.\"\n(Padahal angin kan gak bisa ngomong beneran, hehe)",
    ],
    jawabanMurid: "Aku paham! Personifikasi bikin benda mati seolah hidup kayak manusia!",
  },
  {
    nama: "Hiperbola",
    kategori: "Jenis 3",
    dialog: [
      "Yang ketiga, terakhir: HIPERBOLA!\nMajas yang MELEBIH-LEBIHKAN sesuatu,\nbiar kesannya lebih dramatis.",
      "Contoh: \"Aku udah bilang beribu-ribu kali,\ntapi kamu tetep aja lupa!\"",
    ],
    jawabanMurid: "Paham banget! Hiperbola itu melebih-lebihkan, kayak 'PR-ku segunung'!",
  },
];

/* ==========================================================================
   3) STATE
   ========================================================================== */
const TAHAP = { INTRO: "intro", KONTEN: "konten" };
let tahap = TAHAP.INTRO;
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
const elCaption = document.getElementById("comicCaption");
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
    /** ganti pose; kalau tokoh ini gak punya pose itu, pakai pose pertamanya */
    gantiPose(nama) {
      if (!poseEls[nama]) nama = posePertama;
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
  const hp = window.matchMedia("(max-width:820px)").matches;
  const yUjung = hp ? 135 : 136;
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

  pembicaraAktif = { siapa, ...opsi, poseNgomong: opsi.pose || p.pose.ngomong };
  teksSekarang = teks;
  p.isi.textContent = "";
  p.cursor.classList.remove("is-hidden");
  p.tokoh.gantiPose(pembicaraAktif.poseNgomong);
  p.tokoh.el.classList.add("is-talking");
  mulaiMulut(p.tokoh, pembicaraAktif.poseNgomong);
  playSuaraAsli(opsi.suara);

  let i = 0;
  (function ketikSatuHuruf() {
    if (i < teks.length) {
      p.isi.textContent += teks.charAt(i);
      if (!opsi.suara && i % 2 === 0) playTick(siapa !== "guru");
      i++;
      timerKetik = setTimeout(ketikSatuHuruf, 26);
    } else {
      selesaiNgetik();
    }
  })();
}

/** selesaiin ketikan sekarang (dipanggil otomatis, atau pas tombol/balon diklik) */
function selesaiNgetik() {
  if (!pembicaraAktif) return;
  const { siapa, poseNgomong, lalu } = pembicaraAktif;
  const p = PEMBICARA[siapa];
  pembicaraAktif = null;
  clearTimeout(timerKetik);

  p.isi.textContent = teksSekarang; // kalau di-skip, langsung tampil penuh
  p.cursor.classList.add("is-hidden");
  p.tokoh.el.classList.remove("is-talking");
  hentikanMulut();
  p.tokoh.gantiPose(poseNgomong);

  // habis ngomong ganti pose "selesai" (pose nunjuk/ide ditahan sebentar biar keliatan)
  const tahan = poseNgomong === "nunjuk" || poseNgomong === "ide" ? 1100 : 250;
  const poseSelesai = p.pose.selesai;
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

/* ==========================================================================
   9) GERAKAN SESEKALI — 1 tokoh random lompat kecil (kalau lagi gak ngomong)
   ========================================================================== */
function mulaiGerakanSesekali() {
  const semua = [guru, ...murid];
  setInterval(() => {
    const t = semua[Math.floor(Math.random() * semua.length)];
    const lagiSibuk = ["is-talking", "is-masuk", "is-bounce"].some((c) => t.el.classList.contains(c));
    if (lagiSibuk) return;
    t.el.classList.add("is-bounce");
    setTimeout(() => t.el.classList.remove("is-bounce"), 600);
  }, 2200);
}

/* ==========================================================================
   10) RENDER TIAP TAHAP
   ========================================================================== */
function renderIntro() {
  renderProgress();
  elCaption.textContent = "Ayo Belajar!";

  guru.el.classList.add("is-masuk");
  playMasuk();

  // tunggu guru selesai jalan masuk, baru ngomong -> lalu Dito jawab
  setTimeout(() => {
    guru.el.classList.remove("is-masuk");
    bicara("guru", SAPAAN_GURU, {
      lalu: () => { pilihMurid(0); bicara("murid", SAPAAN_MURID); },
    });
  }, 1350);

  btnPrev.disabled = true;
  btnAction.innerHTML = 'Siap! <i class="fa-solid fa-arrow-right"></i>';
}

function renderKonten() {
  const majas = DAFTAR_MAJAS[idxMajas];
  const diPromptPaham = idxDialog >= majas.dialog.length;
  const diMajasTerakhir = idxMajas === DAFTAR_MAJAS.length - 1;

  renderProgress();
  elCaption.textContent = majas.nama;

  if (diPromptPaham) {
    bicara("guru", `Gimana teman-teman, paham soal "${majas.nama}"? 😊`, {
      lalu: () => { pilihMurid(penjawab(idxMajas)); bicara("murid", majas.jawabanMurid, { pose: "ide" }); },
    });
    btnAction.innerHTML = diMajasTerakhir ? 'Lanjut ke Video <i class="fa-solid fa-clapperboard"></i>' : 'Paham! <i class="fa-solid fa-thumbs-up"></i>';
  } else {
    const baris = majas.dialog[idxDialog];
    bicara("guru", baris, { pose: baris.includes("Contoh") ? "nunjuk" : "bicara" });
    btnAction.innerHTML = 'Lanjut <i class="fa-solid fa-arrow-right"></i>';
  }

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

  if (tahap === TAHAP.INTRO) {
    tahap = TAHAP.KONTEN;
    idxMajas = 0;
    idxDialog = 0;
    renderKonten();
    return;
  }

  const majas = DAFTAR_MAJAS[idxMajas];
  const diPromptPaham = idxDialog >= majas.dialog.length;

  if (!diPromptPaham) {
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
    idxDialog = DAFTAR_MAJAS[idxMajas].dialog.length;
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
mulaiGerakanSesekali();
