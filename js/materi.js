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
   - tanya         : (opsional) pertanyaan "paham?" sendiri. Kosong =
                     "Sudah paham tentang <nama majas>?"
   - papanJawaban  : (opsional) adegan papan waktu murid menjawab "paham?"
                     Kosong = contoh terakhir tetap di papan.
   - jawabanMurid  : jawaban murid waktu ditanya "paham?" (usahakan pendek,
                     maksimal ~70 huruf biar muat di balon kata)
   ========================================================================== */
const SAPAAN_GURU = "Halo, teman-teman! Hari ini kita akan belajar majas. Teman-teman siap?";
const SAPAAN_MURID = "Siap, Ibu Rara! Aku sudah tidak sabar!";

const DAFTAR_MAJAS = [
  {
    nama: "Apa itu Majas?",
    kategori: "Pengantar",
    dialog: [
      {
        teks: "Majas adalah gaya bahasa yang memakai *kata-kata kiasan*, yaitu kata-kata yang artinya bukan arti sebenarnya. Majas membuat kalimat kita lebih hidup dan menarik.",
        reaksi: [[0, "ide", 1800]],
      },
      {
        teks: "Contohnya, daripada berkata \"Dia pintar sekali.\", kita bisa berkata \"Dia adalah bintang kelas.\" Lebih menarik didengar, bukan?",
        papan: "biasa-vs-majas",
        reaksi: [[1, "malu", 2300], [2, "tepuk", 2900], [0, "senang", 3200]],
      },
    ],
    tanya: "Sudah paham apa itu majas?",
    jawabanMurid: "Paham, Bu! Majas itu gaya bahasa yang memakai kata-kata kiasan!",
  },
  {
    nama: "Jenis-jenis Majas",
    kategori: "Pengantar",
    dialog: [
      {
        teks: "Majas ada beberapa jenis. Hari ini kita belajar *tiga jenis majas* yaitu metafora, personifikasi, dan hiperbola!",
        reaksi: [[3, "tepuk", 2600], [1, "tepuk", 2800], [2, "tepuk", 3000], [0, "senang", 3200]],
      },
      {
        teks: "Kita bahas satu per satu, ya!",
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
        teks: "Yang pertama *metafora*! Metafora adalah majas yang memakai *kata lain atau simbol* untuk menggantikan makna sebenarnya.",
        reaksi: [[2, "bingung", 2400]],
      },
      {
        teks: "Contohnya, \"*Sari adalah bintang kelas* di sekolah kami.\"",
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
        teks: "Bukan, Bima! Kalau bintangnya bintang sungguhan, jadinya lucu seperti ini...",
        papan: "bintang-harfiah",
        reaksi: [[2, "tertawa", 2400, 0], [0, "senang", 2800]],
      },
      {
        teks: "*Bintang kelas* artinya *murid yang paling pintar*. Seperti Sari yang nilainya selalu bagus!",
        papan: "bintang-makna", // pose "bicara": tangan menadah ke papan
        reaksi: [[1, "bangga", 1400, 0], [2, "tepuk", 2100], [3, "tepuk", 2300], [0, "senang", 2600]],
      },
    ],
    jawabanMurid: "Paham, Bu! Bintang kelas artinya murid paling pintar, bukan bintang di langit!",
  },
  {
    nama: "Personifikasi",
    kategori: "Jenis 2",
    dialog: [
      {
        teks: "Yang kedua adalah *personifikasi*! Personifikasi adalah majas yang membuat *benda mati* seolah-olah bisa berbuat dan merasa *seperti manusia*.",
        reaksi: [[2, "bingung", 2400]],
      },
      {
        teks: "Contohnya, \"Angin berbisik lembut di telinga Keke.\" Padahal, angin tidak bisa berbisik sungguhan, ya!",
        papan: "angin-berbisik",
        // Keke disebut -> kamera nyorot Keke (seperti Sari di contoh bintang kelas)
        kamera: { ke: 3, skala: 1.22, jeda: 900, lama: 2200 },
        reaksi: [[3, "tepuk", 1000, 2600], [0, "ide", 1800], [2, "tertawa", 3000]],
      },
    ],
    jawabanMurid: "Aku paham! Personifikasi membuat benda mati seolah-olah bisa berbuat seperti manusia!",
  },
  {
    nama: "Hiperbola",
    kategori: "Jenis 3",
    dialog: [
      {
        teks: "Yang ketiga sekaligus yang terakhir adalah *hiperbola*! Hiperbola adalah majas yang *melebih-lebihkan* sesuatu supaya terdengar lebih hebat dan lebih kuat.",
        reaksi: [[2, "tertawa", 2400], [0, "senang", 2800]],
      },
      {
        teks: "Contohnya, \"Aku sudah mengatakannya beribu-ribu kali, tetapi kamu tetap saja lupa!\"",
        papan: "beribu-kali",
        kamera: { ke: "guru", skala: 1.12, jeda: 300 }, // kalimat dramatis -> kamera mendekat ke guru
        reaksi: [[2, "tertawa", 2200], [1, "tepuk", 2600], [0, "senang", 2900]],
      },
    ],
    jawabanMurid: "Paham sekali! Hiperbola itu melebih-lebihkan, seperti \"PR-ku segunung\"!",
    papanJawaban: "pr-segunung",
  },
  {
    // penutup: ngarahin siswa ke halaman Video (alur Materi -> Video -> Kuis -> Game)
    nama: "Ayo Menonton Video!",
    kategori: "Penutup",
    dialog: [
      {
        teks: "Hebat, teman-teman! Kita sudah belajar tiga jenis majas, yaitu metafora, personifikasi, dan hiperbola.",
        reaksi: [[1, "tepuk", 1400, 0], [2, "tepuk", 1600, 0], [3, "tepuk", 1800, 0], [0, "senang", 2000, 0]],
      },
      {
        teks: "Supaya makin paham, ayo kita tonton video majas! Tekan tombol \"Lanjut ke Video\" di bawah, ya.",
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
      <div class="meja"><span>KELAS V</span></div>
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
    <div class="adegan-label is-benar">Bintang kelas artinya murid paling pintar ✅</div>`,

  // PENGANTAR: kalimat biasa (datar) -> kalimat bermajas (hidup)
  "biasa-vs-majas": `
    <div class="adegan adegan-banding">
      <div class="kartu-kalimat is-biasa">
        <small>Kalimat biasa 😐</small>
        <b>“Dia pintar sekali.”</b>
      </div>
      <div class="panah-ubah">⬇️ <span>memakai majas</span></div>
      <div class="kartu-kalimat is-majas">
        <small>Kalimat bermajas 🤩</small>
        <b>“Dia adalah bintang kelas!”</b>
        <span class="kerlip" style="right:4%;top:-14%">⭐</span>
        <span class="kerlip" style="left:3%;bottom:-12%;animation-delay:.5s">✨</span>
      </div>
    </div>
    <div class="adegan-label is-benar">Majas membuat kalimat lebih hidup dan menarik ✅</div>`,

  // PERSONIFIKASI: tiupan angin ala kartun (kepala bulat berpipi kembung +
  // ekor pusaran angin) "berbisik" ke telinga Keke (karakter asli)
  "angin-berbisik": `
    <div class="adegan">
      <div class="angin-wajah">
        <svg viewBox="0 0 150 100" aria-hidden="true">
          <g fill="none" stroke-linecap="round">
            <!-- ekor pusaran angin (garis tepi gelap + isi terang) -->
            <g stroke="#2C2450" stroke-width="10">
              <path d="M6 30 C26 22 44 30 70 34 M18 30 C10 20 18 10 28 14 C34 17 32 24 26 23"/>
              <path d="M2 58 C24 52 44 60 68 56"/>
              <path d="M10 84 C30 76 50 86 74 74 M22 82 C14 92 24 100 32 94 C37 90 33 85 29 87"/>
            </g>
            <g stroke="#EAF6FF" stroke-width="5">
              <path d="M6 30 C26 22 44 30 70 34 M18 30 C10 20 18 10 28 14 C34 17 32 24 26 23"/>
              <path d="M2 58 C24 52 44 60 68 56"/>
              <path d="M10 84 C30 76 50 86 74 74 M22 82 C14 92 24 100 32 94 C37 90 33 85 29 87"/>
            </g>
          </g>
          <!-- kepala angin -->
          <path d="M96 22 C112 14 136 24 138 46 C140 70 118 84 98 78 C78 74 68 58 74 42 C70 34 78 22 92 26 C90 18 98 12 104 16"
                fill="#EAF6FF" stroke="#2C2450" stroke-width="3.5" stroke-linejoin="round"/>
          <path d="M100 18 C106 10 116 14 112 22 C110 26 104 24 106 20" fill="none" stroke="#2C2450" stroke-width="3" stroke-linecap="round"/>
          <!-- mata tertutup (lagi berbisik pelan) -->
          <path d="M92 44 Q97 39 102 44" fill="none" stroke="#2C2450" stroke-width="3" stroke-linecap="round"/>
          <path d="M110 42 Q115 37 120 42" fill="none" stroke="#2C2450" stroke-width="3" stroke-linecap="round"/>
          <!-- pipi kembung + mulut monyong ke kanan -->
          <ellipse cx="96" cy="56" rx="7" ry="5" fill="#FF8FA3" opacity=".55"/>
          <ellipse cx="124" cy="54" rx="7" ry="5" fill="#FF8FA3" opacity=".55"/>
          <ellipse cx="134" cy="60" rx="5" ry="4" fill="#2C2450"/>
        </svg>
      </div>
      <div class="hembus"><i></i><i></i><i></i></div>
      <span class="daun d1">🍃</span><span class="daun d2">🍃</span>
      <div class="bisikan">psst… 🤫</div>
      <div class="keke-dengar"><img src="${MURID[3].pose.diam}" alt="Keke"></div>
    </div>
    <div class="adegan-label is-benar">Angin “berbisik” seperti manusia. Itulah personifikasi. ✅</div>`,

  // HIPERBOLA: hitungan "sudah bilang" melesat sampai 1.000 kali
  "beribu-kali": `
    <div class="adegan">
      <div class="hitungan"><b data-hitung="1000">1</b><small>kali!</small></div>
      <span class="balon-mini m1">Jangan lupa!</span>
      <span class="balon-mini m2">Jangan lupa!</span>
      <span class="balon-mini m3">Jangan lupa!</span>
      <span class="balon-mini m4">Jangan lupa!</span>
      <div class="dito-lupa"><img src="${MURID[0].pose.diam}" alt="Dito"><span>❓</span></div>
    </div>
    <div class="adegan-label is-benar">Beribu-ribu kali? Sebenarnya hanya beberapa kali. Itulah hiperbola. ✅</div>`,

  // HIPERBOLA (jawaban murid): tumpukan buku PR menjulang sampai puncak gunung
  "pr-segunung": `
    <div class="adegan">
      <svg class="gunung" viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 120 L70 22 L96 50 L122 8 L200 120 Z" fill="#7FB77E" stroke="#2C2450" stroke-width="3" stroke-linejoin="round"/>
        <path d="M110 26 L122 8 L134 26 L127 22 L122 28 L116 22 Z" fill="#FDFBF2" stroke="#2C2450" stroke-width="2" stroke-linejoin="round"/>
      </svg>
      <div class="tumpukan-pr">
        <i style="--w:72%;--c:#FF8FA3"></i><i style="--w:66%;--c:#FFD43B"></i><i style="--w:76%;--c:#8EC5FF"></i>
        <i style="--w:62%;--c:#B9A6EE"></i><i style="--w:70%;--c:#FF8FA3"></i><i style="--w:64%;--c:#C6F6B8"></i>
        <i style="--w:74%;--c:#FFD43B"></i><i style="--w:60%;--c:#8EC5FF"></i><i style="--w:68%;--c:#B9A6EE"></i>
        <b>PR</b>
      </div>
      <div class="dito-lupa dito-pr"><img src="${MURID[0].pose.diam}" alt="Dito"><span>😱</span></div>
    </div>
    <div class="adegan-label is-benar">PR segunung? Sebenarnya hanya beberapa lembar. Itulah hiperbola. ✅</div>`,
};

/** angka [data-hitung] di adegan melesat dari 1 ke angka tujuannya (mis. 1 -> 1.000) */
function jalankanHitung(wadah) {
  wadah.querySelectorAll("[data-hitung]").forEach((el) => {
    const tujuan = Number(el.dataset.hitung) || 0;
    const mulai = performance.now() + 500; // tunggu papan selesai "digambar"
    const lama = 2200;
    (function langkah(t) {
      if (!el.isConnected) return;
      const p = Math.min(1, Math.max(0, (t - mulai) / lama));
      const n = Math.max(1, Math.round(tujuan * p * p)); // makin lama makin cepat
      el.textContent = n.toLocaleString("id-ID");
      if (p < 1) requestAnimationFrame(langkah);
      else el.classList.add("is-selesai");
    })(performance.now());
  });
}

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
let tokenBicara = 0;    // naik tiap bicara() -> balasan suara yang telat diabaikan
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

/* --------------------------------------------------------------------------
   VOICE OVER (rekaman suara asli per kalimat)
   -------------------------------------------------------------------------
   Kunci = posisi baris:
     "sapaan" / "sapaan-murid"  -> pembuka (Ibu Rara & Dito)
     "<bagian>-<baris>"         -> DAFTAR_MAJAS[bagian].dialog[baris]
     "<bagian>-tanya"           -> "Bagaimana, teman-teman? Sudah paham ...?"
     "<bagian>-jawab"           -> jawabanMurid
   Kalau urutan/isi dialog diubah, kuncinya ikut dicek ya (rekaman lama
   bisa jadi gak cocok lagi). File di assets/audio/materi/ = rekaman asli.
   src    : file rekaman
   vol    : volume (0..1) biar semua rekaman sama keras (murid cowok
            rekamannya lebih keras -> dikecilkan)
   segmen : [mulai, selesai] (detik) bagian yang BERSUARA. Diukur otomatis
            dari rekaman (bagian hening dilewati). Dipakai untuk:
            - memutar mulai segmen pertama, berhenti di segmen terakhir
              (hening di awal/akhir rekaman gak ikut diputar)
            - mengetik teks HANYA selama ada suara -> teks jalan bareng suara,
              berhenti sebentar waktu guru jeda napas
   Baris yang punya voice over: suara ketik "tik-tik" dimatikan.
   -------------------------------------------------------------------------- */
const VOICE_OVER = {
  "sapaan": { src: "assets/audio/materi/vo-sapaan.m4a", vol: 0.96, segmen: [[1.9, 3.42], [3.72, 4.6], [4.94, 6.8], [7.32, 8.76]] }, // Guru (1).m4a
  "sapaan-murid": { src: "assets/audio/materi/vo-sapaan-murid.m4a", vol: 1, segmen: [[0.16, 1.28], [1.56, 3]] }, // Murid cowok 1.m4a
  "0-0": { src: "assets/audio/materi/vo-0-0.m4a", vol: 0.89, segmen: [[1.02, 6.8], [7.44, 12.3], [13, 16.48], [16.74, 17.74]] }, // Guru (2).m4a
  "0-1": { src: "assets/audio/materi/vo-0-1.m4a", vol: 0.84, segmen: [[0.7, 1.6], [2.02, 3.92], [4.64, 6.14], [6.68, 8.14], [8.62, 11.22], [11.92, 14.04]] }, // Guru (3).m4a
  "0-tanya": { src: "assets/audio/materi/vo-0-tanya.m4a", vol: 1, segmen: [[1.14, 2.66], [3, 4.98]] }, // Guru (4).m4a
  "0-jawab": { src: "assets/audio/materi/vo-0-jawab.m4a", vol: 0.92, segmen: [[0.84, 1.64], [2.08, 3.06], [3.38, 4.38], [4.78, 5.76], [6.3, 6.38], [6.84, 7.98]] }, // Sari.m4a
  "1-0": { src: "assets/audio/materi/vo-1-0.m4a", vol: 1, segmen: [[1.26, 3.6], [4.2, 4.94], [5.2, 7.84], [8.38, 8.94], [9.3, 10.28], [10.86, 12.2], [12.6, 14.02]] }, // Guru (5).m4a
  "1-1": { src: "assets/audio/materi/vo-1-1.m4a", vol: 0.96, segmen: [[0.96, 3.34]] }, // Guru (6).m4a
  "2-0": { src: "assets/audio/materi/vo-2-0.m4a", vol: 1, segmen: [[0.36, 2.56], [3.12, 5.56], [6.02, 9.5], [9.96, 13.18]] }, // revisi materi.mp4 (pengertian metafora baru)
  "2-1": { src: "assets/audio/materi/vo-2-1.m4a", vol: 0.95, segmen: [[1.12, 1.78], [2.28, 5.94]] }, // Guru (8).m4a
  "2-2": { src: "assets/audio/materi/vo-2-2.m4a", vol: 0.56, segmen: [[0.2, 1.24], [1.78, 2.54], [2.94, 5.06]] }, // Murid cowok 2.m4a
  "2-3": { src: "assets/audio/materi/vo-2-3.m4a", vol: 0.74, segmen: [[1.24, 2.34], [2.64, 5.04], [5.5, 7.52]] }, // Guru (9).m4a
  "2-4": { src: "assets/audio/materi/vo-2-4.m4a", vol: 0.83, segmen: [[0.68, 3.14], [3.6, 5.56], [6.24, 8.44], [8.72, 9.74]] }, // Guru (10).m4a
  "2-tanya": { src: "assets/audio/materi/vo-2-tanya.m4a", vol: 0.85, segmen: [[1.2, 2.74], [3.02, 5.42]] }, // Guru (11).m4a
  "2-jawab": { src: "assets/audio/materi/vo-2-jawab.m4a", vol: 0.95, segmen: [[0.7, 1.46], [1.8, 2.9], [3.18, 3.88], [4.5, 5.78], [6.42, 7.58]] }, // Keke.m4a
  "3-0": { src: "assets/audio/materi/vo-3-0.m4a", vol: 0.91, segmen: [[0.76, 3.68], [4.22, 8.56], [8.98, 13.3]] }, // Guru (12).m4a
  "3-1": { src: "assets/audio/materi/vo-3-1.m4a", vol: 0.94, segmen: [[0.62, 1.46], [2.08, 5.72], [6.48, 7.18], [7.88, 10.56]] }, // Guru (13).m4a
  "3-tanya": { src: "assets/audio/materi/vo-3-tanya.m4a", vol: 1, segmen: [[0.78, 2.48], [2.96, 5.84]] }, // Guru 15.m4a
  "3-jawab": { src: "assets/audio/materi/vo-3-jawab.m4a", vol: 0.52, segmen: [[0.4, 0.88], [1.58, 1.76], [2.04, 3.8], [4.16, 7.12]] }, // Murid cowok 11.m4a
  "4-0": { src: "assets/audio/materi/vo-4-0.m4a", vol: 0.78, segmen: [[0.86, 3.96], [4.24, 5.62], [6.16, 10.92], [11.34, 13.26], [13.52, 14.6]] }, // Guru 16.m4a
  "4-1": { src: "assets/audio/materi/vo-4-1.m4a", vol: 0.73, segmen: [[0.5, 1.3], [1.88, 4.14], [4.48, 6], [6.62, 7.6], [7.92, 8.92]] }, // Guru 17.m4a
  "4-tanya": { src: "assets/audio/materi/vo-4-tanya.m4a", vol: 0.74, segmen: [[0.86, 4.54]] }, // Guru 18.m4a
  "4-jawab": { src: "assets/audio/materi/vo-4-jawab.m4a", vol: 0.94, segmen: [[0.58, 1.6], [2.14, 3.46], [3.82, 5.08], [5.36, 5.94], [6.46, 7.04], [7.38, 8.04]] }, // Sari-1.m4a
  "5-0": { src: "assets/audio/materi/vo-5-0.m4a", vol: 0.89, segmen: [[0.88, 2.04], [2.34, 5.38], [5.82, 7.68], [8.04, 8.52], [8.84, 10.76]] }, // Guru 18-1.m4a
  "5-1": { src: "assets/audio/materi/vo-5-1.m4a", vol: 0.74, segmen: [[1.14, 2.66], [2.92, 5.26], [5.88, 6.7], [7.02, 9.68]] }, // Guru 19.m4a
};

// satu pemutar dipakai ulang: di iPhone pemutar yang sudah "dibuka" lewat
// sentuhan boleh memutar lagi tanpa disentuh
const pemutarVO = new Audio();
pemutarVO.preload = "auto";
const urlVO = {}; // src -> Promise(blob URL). Diunduh utuh dulu (lebih andal di iPhone & bisa offline)

function muatVO(vo) {
  if (!urlVO[vo.src]) {
    urlVO[vo.src] = fetch(vo.src)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.blob(); })
      .then((b) => URL.createObjectURL(b));
    urlVO[vo.src].catch(() => delete urlVO[vo.src]);
  }
  return urlVO[vo.src];
}

/** buka kunci suara di HP: panggil DI DALAM sentuhan/klik (putar hening sekejap) */
function bukaKunciSuara() {
  pastikanAudioSiap();
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  // WAV hening 1 sampel
  pemutarVO.src = "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQIAAAAAAA==";
  pemutarVO.play().then(() => pemutarVO.pause()).catch(() => {});
}

// iPhone mengabaikan audio.volume -> volume diatur lewat Web Audio (GainNode).
// Cuma kalau Web Audio sudah "jalan" (dibuka lewat sentuhan); kalau belum,
// pakai audio.volume biasa (laptop/Android menurutinya).
let gainVO = null;
function aturVolumeVO(vol) {
  if (!gainVO && audioCtx && audioCtx.state === "running") {
    try {
      gainVO = audioCtx.createGain();
      audioCtx.createMediaElementSource(pemutarVO).connect(gainVO).connect(audioCtx.destination);
    } catch (e) { gainVO = null; }
  }
  if (gainVO) {
    if (audioCtx.state !== "running") audioCtx.resume().catch(() => {});
    gainVO.gain.value = vol;
    pemutarVO.volume = 1;
  } else {
    pemutarVO.volume = vol;
  }
}

/** unduh duluan rekaman beberapa baris ke depan biar gak nunggu */
function muatVODuluan(...kunci) {
  kunci.forEach((k) => VOICE_OVER[k] && muatVO(VOICE_OVER[k]).catch(() => {}));
}

let sesiVO = 0; // naik tiap baris baru -> pemutaran lama yang telat mulai dibatalkan
function hentikanVO() {
  sesiVO++;
  pemutarVO.pause();
}

/**
 * Putar voice over. Resolve true kalau suara benar-benar jalan,
 * false kalau gagal (file gak ada / diblokir browser) -> ketik biasa.
 */
async function putarVO(vo) {
  const sesi = ++sesiVO;
  try {
    const url = await muatVO(vo);
    if (sesi !== sesiVO) return false;
    pemutarVO.src = url;
    await new Promise((ok, gagal) => {
      if (pemutarVO.readyState >= 1) return ok();
      pemutarVO.onloadedmetadata = ok;
      pemutarVO.onerror = gagal;
    });
    if (sesi !== sesiVO) return false;
    // mulai sedikit sebelum suara pertama: bunyi awal yang pelan (mis. "Y" di
    // "Yang") gak kepotong, & HP sering "telat bangun" ±0,1 dtk waktu play
    pemutarVO.currentTime = Math.max(0, vo.segmen[0][0] - 0.3);
    aturVolumeVO(vo.vol == null ? 1 : vo.vol);
    await pemutarVO.play();
    if (sesi !== sesiVO) { pemutarVO.pause(); return false; } // keburu dibatalkan
    return true;
  } catch (e) {
    return false;
  }
}

/** berapa bagian (0..1) dari "waktu bersuara" yang sudah lewat di detik t */
function progresVO(vo, t) {
  let total = 0, lewat = 0;
  vo.segmen.forEach(([a, b]) => {
    total += b - a;
    lewat += Math.min(Math.max(t - a, 0), b - a);
  });
  return total ? lewat / total : 1;
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
  // kalimat sangat panjang -> huruf sedikit dikecilkan biar muat di balon (HP)
  p.bubble.classList.toggle("is-panjang", teks.replace(/\*/g, "").length > 150);
  p.isi.textContent = "";
  p.cursor.classList.remove("is-hidden");
  p.tokoh.gantiPose(pembicaraAktif.poseNgomong);
  p.tokoh.el.classList.add("is-talking");
  mulaiMulut(p.tokoh, pembicaraAktif.poseNgomong);
  const token = ++tokenBicara;
  const vo = suaraNyala && opsi.vo ? VOICE_OVER[opsi.vo] : null;

  // diketik per potongan: potongan *sorot* masuk ke <span class="sorot">
  const potongan = pecahSorot(teks);
  const totalHuruf = potongan.reduce((j, x) => j + x.t.length, 0);
  let iPotong = 0, iHuruf = 0, n = 0, wadah = null, ditulis = 0;
  /** tulis 1 huruf berikutnya; false kalau sudah habis */
  function tulisSatu() {
    if (iPotong >= potongan.length) return false;
    const pt = potongan[iPotong];
    if (!wadah) {
      wadah = document.createElement("span");
      if (pt.sorot) wadah.className = "sorot";
      p.isi.appendChild(wadah);
    }
    wadah.textContent += pt.t.charAt(iHuruf++);
    ditulis++;
    if (iHuruf >= pt.t.length) {
      if (pt.sorot) playTing();
      iPotong++; iHuruf = 0; wadah = null;
    }
    return true;
  }
  // tanpa voice over: huruf per huruf + suara "tik"
  function ketikBiasa() {
    if (!tulisSatu()) return selesaiNgetik();
    if (n++ % 2 === 0) playTick(siapa !== "guru");
    timerKetik = setTimeout(ketikBiasa, 26);
  }
  if (!vo) return ketikBiasa();

  // dengan voice over: jumlah huruf yang tampil mengikuti posisi suara
  // sinyal lambat: kalau 4 detik suara belum mulai, ketik biasa (rekaman batal)
  const batasTunggu = new Promise((ok) => setTimeout(() => ok("lambat"), 4000));
  Promise.race([putarVO(vo), batasTunggu]).then((jalan) => {
    if (jalan === "lambat") { if (token === tokenBicara && pembicaraAktif) hentikanVO(); jalan = false; }
    if (token !== tokenBicara || !pembicaraAktif) return; // sudah pindah baris
    if (!jalan) return ketikBiasa(); // suara gagal -> ketik biasa
    const akhir = vo.segmen[vo.segmen.length - 1][1];
    (function ikutiSuara() {
      const t = pemutarVO.currentTime;
      const target = Math.floor(progresVO(vo, t) * totalHuruf);
      while (ditulis < target && tulisSatu());
      if (t >= akhir + 0.15 || pemutarVO.paused || pemutarVO.ended) {
        pemutarVO.pause();
        return selesaiNgetik();
      }
      timerKetik = setTimeout(ikutiSuara, 30);
    })();
  });
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
  hentikanVO();

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
  hentikanVO();
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
    jalankanHitung(elPapanIsi);
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
/**
 * langsung = true -> guru sudah berdiri di kelas (datang lewat menu, lalu
 * tombol "Mulai Belajar" di papan ditekan): gak ada animasi jalan masuk,
 * langsung menyapa.
 */
function renderIntro(langsung = false) {
  renderProgress();
  tulisJudul("Ayo Belajar!");

  if (!langsung) {
    guru.el.classList.add("is-masuk");
    playMasuk();
  }

  // tunggu guru selesai jalan masuk, baru ngomong. Dito jawab nanti,
  // setelah tombol "Siap!" ditekan
  introDijawab = false;
  setTimeout(() => {
    guru.el.classList.remove("is-masuk");
    bicara("guru", SAPAAN_GURU, { vo: "sapaan" });
  }, langsung ? 250 : 1350);

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
  // rekaman 2 langkah berikutnya diunduh duluan (bagian ini & awal bagian berikutnya)
  muatVODuluan(`${idxMajas}-${idxDialog + 1}`, `${idxMajas}-${idxDialog + 2}`, `${idxMajas}-tanya`, `${idxMajas}-jawab`, `${idxMajas + 1}-0`);

  if (diPromptPaham) {
    // guru nanya, murid jawab di langkah berikutnya (setelah tombol ditekan).
    // Papan tulis contoh terakhir tetap ditampilkan biar bisa dilihat lagi.
    aturKamera(null);
    bicara("guru", `Bagaimana, teman-teman? ${majas.tanya || `Sudah paham tentang ${majas.nama.toLowerCase()}?`}`, { vo: `${idxMajas}-tanya` });
    // murid yang nanti menjawab ANGKAT TANGAN dulu ("Aku, Bu!"), ditahan
    // sampai gilirannya ngomong. (Dito: telunjuk ke atas, Keke: angkat tangan)
    jadwalReaksi([[penjawab(idxMajas), "angkat", 1700, 0]]);
    btnAction.innerHTML = 'Paham! <i class="fa-solid fa-thumbs-up"></i>';
  } else if (diJawabMurid) {
    // contoh tetap di papan (atau diganti contoh dari jawaban murid)
    if (majas.papanJawaban) tampilkanPapan(majas.papanJawaban);
    const i = penjawab(idxMajas);
    pilihMurid(i);
    aturKamera({ ke: i, skala: 1.15 });
    bicara("murid", majas.jawabanMurid, { pose: "ide", vo: `${idxMajas}-jawab` });
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
      bicara("murid", baris.teks, { pose: "bicara", selesai: baris.selesai, vo: `${idxMajas}-${idxDialog}` });
    } else {
      // ada papan -> pose "bicara" (tangan menadah ke arah papan di kirinya)
      const poseDefault = baris.papan ? "bicara" : baris.teks.includes("Contoh") ? "nunjuk" : "bicara";
      bicara("guru", baris.teks, { pose: baris.pose || poseDefault, vo: `${idxMajas}-${idxDialog}` });
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
    bicara("murid", SAPAAN_MURID, { vo: "sapaan-murid" });
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
  if (!suaraNyala) pemutarVO.pause(); // voice over ikut diam (teks langsung tampil penuh)
});

/* ==========================================================================
   13) MULAI!
   ========================================================================== */
// - Datang dari tombol "Mulai Belajar" di Beranda (materi.html?mulai=1):
//   langsung mulai, guru masuk & menyapa.
// - Datang dari menu atas/bawah (atau muat ulang): tampil tombol
//   "Mulai Belajar" dulu. Sekalian membuka kunci suara di HP (iPhone cuma mau
//   memutar suara setelah layar disentuh).
// Rekaman sapaan diunduh duluan.
const btnMulai = document.getElementById("btnMulai");
muatVODuluan("sapaan", "sapaan-murid", "0-0", "0-1");
const dariBeranda = new URLSearchParams(location.search).has("mulai");
if (dariBeranda) {
  // buang "?mulai=1" dari alamat -> kalau dimuat ulang, tombol Mulai muncul lagi
  history.replaceState(null, "", location.pathname + location.hash);
  renderIntro();
} else {
  btnMulai.hidden = false;
  btnAction.disabled = btnPrev.disabled = true;
  btnMulai.addEventListener("click", () => {
    bukaKunciSuara();
    btnMulai.hidden = true;
    btnAction.disabled = false;
    renderIntro(true); // guru sudah di kelas -> langsung menyapa
  }, { once: true });
}
