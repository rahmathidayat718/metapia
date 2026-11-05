/* ==========================================================================
   METAPIA — kuis.js
   Alurnya:
   1) Layar MULAI  : sapa siswa pakai nama login -> tombol "Mulai Kuis"
   2) Layar LEVEL  : pembuka tiap tingkat (Level 1 Mudah, 2 Sedang, 3 HOTS)
   3) Layar SOAL   : 15 soal pilihan ganda (5 per level), langsung ketahuan
                     benar/salah + penjelasan singkat, Kak Rara ikut komentar
   4) Layar HASIL  : nilai 0-100 (benar / 15), bintang, rekap per level,
                     nilai dikirim ke Google Sheet (kalau URL-nya sudah diisi)

   Soal diambil dari "Kisi-Kisi dan Soal Kuis Majas" (Kelas V SD). Nomor
   aslinya di kisi-kisi ditulis di komentar tiap soal (No. x, Cy).

   Bisa juga pakai keyboard: tombol 1-4 / A-D buat jawab, Enter buat lanjut.
   ========================================================================== */

/* ==========================================================================
   1) DATA SOAL
   - perintah   : tulisan kecil di atas soal
   - kutipan    : kalimat/paragraf contoh (boleh dikosongin)
   - tanya      : pertanyaannya
   - pilihan    : 4 pilihan jawaban (urutan A, B, C, D)
   - jawaban    : index jawaban benar -> 0 = A, 1 = B, 2 = C, 3 = D
   - penjelasan : muncul setelah siswa menjawab
   Soal dikelompokkan per TINGKAT (urutan level di kuis = urutan di sini).
   ========================================================================== */
const PERINTAH = "Pilihlah jawaban yang paling tepat!";

const TINGKAT = [
  {
    id: "mudah", nama: "Mudah", ikon: "🌱",
    ket: "Mengingat & memahami pengertian majas.",
    soal: [
      { // No. 1 — TP 1, C1
        tanya: "Majas adalah …",
        pilihan: [
          "kalimat yang berisi pertanyaan",
          "gaya bahasa yang menggunakan kata-kata kiasan agar kalimat lebih menarik",
          "kata-kata yang harus ditulis dengan huruf kapital",
          "kalimat yang hanya berisi fakta",
        ],
        jawaban: 1,
        penjelasan: "Majas adalah gaya bahasa yang memakai kata-kata kiasan supaya kalimat lebih hidup dan menarik.",
      },
      { // No. 4 — TP 1, C1
        tanya: "Ciri majas metafora adalah …",
        pilihan: [
          "membandingkan dua hal secara langsung tanpa kata seperti atau bagaikan",
          "memberi sifat manusia pada benda mati",
          "melebih-lebihkan keadaan",
          "mengulang kata yang sama",
        ],
        jawaban: 0,
        penjelasan: "Metafora membandingkan dua hal secara langsung, tanpa kata \"seperti\" atau \"bagaikan\". Contoh: \"Sari adalah bintang kelas.\"",
      },
      { // No. 7 — TP 1, C2
        tanya: "Tujuan penulis menggunakan majas dalam sebuah tulisan adalah …",
        pilihan: [
          "agar tulisan lebih pendek",
          "agar tulisan tidak bisa dipahami",
          "agar tulisan lebih hidup, indah, dan menarik",
          "agar tulisan berisi angka",
        ],
        jawaban: 2,
        penjelasan: "Majas dipakai supaya tulisan terasa lebih hidup, indah, dan menarik dibaca.",
      },
      { // No. 10 — TP 1, C1
        tanya: "Majas yang membuat benda, hewan, atau tumbuhan seolah-olah bisa berbuat dan merasa seperti manusia disebut …",
        pilihan: ["hiperbola", "metafora", "pantun", "personifikasi"],
        jawaban: 3,
        penjelasan: "Personifikasi memberi sifat manusia (bisa berbuat dan merasa) pada benda, hewan, atau tumbuhan.",
      },
      { // No. 13 — TP 1, C2
        tanya: "Majas hiperbola memiliki ciri …",
        pilihan: [
          "membandingkan dua hal secara langsung",
          "mengungkapkan sesuatu secara berlebihan dari keadaan sebenarnya",
          "memberi sifat manusia pada benda mati",
          "menggunakan kata tanya",
        ],
        jawaban: 1,
        penjelasan: "Hiperbola melebih-lebihkan keadaan yang sebenarnya, misalnya \"PR-ku segunung\".",
      },
    ],
  },
  {
    id: "sedang", nama: "Sedang", ikon: "🔥",
    ket: "Menerapkan: mengenali jenis majas dalam kalimat.",
    soal: [
      { // No. 2 — TP 2, C3
        kutipan: "Jam dinding berdetak memanggil Rina untuk segera bangun.",
        tanya: "Kalimat tersebut mengandung majas …",
        pilihan: ["metafora", "hiperbola", "personifikasi", "bukan majas"],
        jawaban: 2,
        penjelasan: "Jam dinding tidak bisa memanggil seperti manusia. Benda diberi sifat manusia, jadi ini personifikasi.",
      },
      { // No. 5 — TP 2, C3
        kutipan: "Suara adik keras sekali sampai terdengar ke bulan.",
        tanya: "Kalimat tersebut mengandung majas …",
        pilihan: ["hiperbola", "metafora", "personifikasi", "bukan majas"],
        jawaban: 0,
        penjelasan: "Suara tidak mungkin terdengar sampai ke bulan. Kalimat ini melebih-lebihkan, jadi hiperbola.",
      },
      { // No. 9 — TP 2, C3
        kutipan: "Kakek adalah perpustakaan berjalan bagi cucu-cucunya.",
        tanya: "Kalimat tersebut mengandung majas …",
        pilihan: ["personifikasi", "hiperbola", "bukan majas", "metafora"],
        jawaban: 3,
        penjelasan: "Kakek langsung disebut \"perpustakaan berjalan\", simbol orang yang tahu banyak hal. Ini metafora.",
      },
      { // No. 12 — TP 2, C3
        tanya: "Kalimat yang bukan majas adalah …",
        pilihan: [
          "Sepeda itu lelah menunggu pemiliknya.",
          "Ayah adalah pahlawan keluarga.",
          "Keringatnya bercucuran sebanyak air laut.",
          "Kucing itu tidur di atas kursi.",
        ],
        jawaban: 3,
        penjelasan: "\"Kucing itu tidur di atas kursi\" menceritakan keadaan sebenarnya, tanpa kiasan. Pilihan lain: personifikasi (A), metafora (B), hiperbola (C).",
      },
      { // No. 15 — TP 3, C3
        tanya: "Kata yang tepat untuk melengkapi kalimat bermajas personifikasi berikut adalah …",
        kutipan: "Hujan … jendela kamarku sepanjang malam.",
        pilihan: ["turun deras di", "mengetuk-ngetuk", "setinggi gunung di", "adalah air di"],
        jawaban: 1,
        penjelasan: "Mengetuk-ngetuk adalah perbuatan manusia. Hujan dibuat seolah-olah bisa mengetuk, jadi kalimatnya personifikasi.",
      },
    ],
  },
  {
    id: "hots", nama: "HOTS", ikon: "🚀",
    ket: "Tantangan: menganalisis & menilai kalimat bermajas.",
    soal: [
      { // No. 3 — TP 3, C5
        tanya: "Kalimat “Sepatuku sudah sangat tua.” diubah menjadi majas personifikasi. Kalimat yang tepat adalah …",
        pilihan: [
          "Sepatuku berumur seribu tahun.",
          "Sepatuku adalah sahabat setia.",
          "Sepatuku dibeli tahun lalu.",
          "Sepatuku sudah lelah menemani langkahku.",
        ],
        jawaban: 3,
        penjelasan: "\"Sudah lelah menemani langkahku\" memberi sepatu sifat manusia (bisa lelah). A hiperbola, B metafora, C bukan majas.",
      },
      { // No. 6 — TP 2, C5
        tanya: "Beni menulis kalimat “Gelas itu marah lalu jatuh dari meja.” Beni berpendapat kalimat itu majas metafora. Penilaian yang tepat terhadap pendapat Beni adalah …",
        pilihan: [
          "Tepat, karena gelas dibandingkan dengan meja.",
          "Tepat, karena gelas itu benar-benar jatuh.",
          "Kurang tepat, karena kalimat itu personifikasi, yaitu gelas diberi sifat marah seperti manusia.",
          "Kurang tepat, karena kalimat itu hiperbola.",
        ],
        jawaban: 2,
        penjelasan: "Gelas diberi sifat \"marah\" seperti manusia, jadi kalimat itu personifikasi, bukan metafora.",
      },
      { // No. 8 — TP 2, C4
        perintah: "Perhatikan kalimat berikut!",
        kutipan: "(1) Payung itu setia melindungiku dari hujan.\n(2) Antrean kantin itu sepanjang jalan tol.\n(3) Sahabatku adalah obat di kala aku sedih.",
        tanya: "Jenis majas kalimat (1), (2), dan (3) secara berurutan adalah …",
        pilihan: [
          "metafora, hiperbola, personifikasi",
          "personifikasi, hiperbola, metafora",
          "hiperbola, personifikasi, metafora",
          "personifikasi, metafora, hiperbola",
        ],
        jawaban: 1,
        penjelasan: "(1) Payung \"setia\" = personifikasi. (2) Antrean \"sepanjang jalan tol\" = hiperbola. (3) Sahabat \"adalah obat\" = metafora.",
      },
      { // No. 11 — TP 3, C5
        tanya: "Kalimat “Rino sangat pemberani.” diubah menjadi majas metafora. Kalimat yang tepat adalah …",
        pilihan: [
          "Rino berani melawan seribu musuh sendirian.",
          "Rino berani sekali.",
          "Rino adalah singa di lapangan.",
          "Keberanian Rino berteriak memanggil.",
        ],
        jawaban: 2,
        penjelasan: "Rino langsung disebut \"singa\", simbol pemberani. Ini metafora. A hiperbola, B bukan majas, D personifikasi.",
      },
      { // No. 14 — TP 3, C5
        tanya: "Saat lomba lari, Tono berlari sangat cepat sehingga lawannya tertinggal jauh. Kalimat bermajas hiperbola yang paling tepat untuk menggambarkan kejadian itu adalah …",
        pilihan: [
          "Langkah Tono membuat lawannya tertinggal satu benua.",
          "Tono adalah kijang di lintasan lari.",
          "Lintasan lari itu menyambut Tono dengan gembira.",
          "Tono berlari dengan cepat.",
        ],
        jawaban: 0,
        penjelasan: "\"Tertinggal satu benua\" sangat melebih-lebihkan jarak, jadi hiperbola. B metafora, C personifikasi, D bukan majas.",
      },
    ],
  },
];

/* semua soal berurutan (Level 1 -> 3); tiap soal tahu tingkatnya (index) */
const SOAL = TINGKAT.flatMap((t, it) => t.soal.map((s) => ({ ...s, tingkat: it })));

const HURUF = ["A", "B", "C", "D"];
const POIN_PER_SOAL = 100 / SOAL.length;

/* ==========================================================================
   2) STATE & ELEMEN
   ========================================================================== */
const user = getCurrentUser() || { nama: "Teman" };
const namaPanggilan = user.nama.split(" ")[0];

let idxSoal = 0;
let jumlahBenar = 0;
let jawabanSiswa = []; // index pilihan siswa per soal
let sudahJawab = false;
let suaraNyala = true;

const elCard = document.getElementById("kuisCard");

/* ==========================================================================
   3) KAK RARA — pose + balon kata (cara kerjanya sama kayak materi.js)
   ========================================================================== */
const GURU_POSE = {
  // pose yang sudah DISERAGAMKAN (kanvas, tinggi & posisi kaki sama) -> gak
  // getar waktu ganti pose / gerak bibir. Lihat docs/seragamkan-pose.py
  senyum: "assets/karakter/materi/guru-senyum.webp",
  bicara: "assets/karakter/materi/guru-bicara.webp",
  nunjuk: "assets/karakter/materi/guru-nunjuk.webp",
  // versi mulut tertutup -> gantian sama yang terbuka waktu ngomong (lip-sync)
  bicara_tutup: "assets/karakter/materi/guru-bicara-tutup.webp",
  nunjuk_tutup: "assets/karakter/materi/guru-nunjuk-tutup.webp",
};
const elGuru = document.getElementById("teacherSlot");
const elBubble = document.getElementById("bubbleGuru");
const elIsi = elBubble.querySelector(".speech-isi");
const poseEls = {};
let timerKetik = null;
let timerPose = null;

(function buatGuru() {
  elGuru.innerHTML = `<div class="tokoh-figure"><div class="tokoh-shadow"></div><div class="tokoh-body"></div></div>`;
  const body = elGuru.querySelector(".tokoh-body");
  Object.entries(GURU_POSE).forEach(([nama, src]) => {
    const img = document.createElement("img");
    img.decoding = "async"; // gambar dibongkar di belakang layar, halaman gak tersendat
    img.className = "pose";
    img.src = src;
    img.alt = "Ibu Rara";
    img.draggable = false;
    body.appendChild(img);
    poseEls[nama] = img;
  });
  aturRasioTokoh(elGuru, poseEls.senyum);
})();

function gantiPose(nama) {
  Object.entries(poseEls).forEach(([n, img]) => img.classList.toggle("is-active", n === nama));
}

/** di HP Kak Rara ada di atas kartu, jadi pose nunjuk-nya gak dipakai */
const layarHP = window.matchMedia("(max-width:820px), (orientation:portrait) and (max-width:1100px)");

/**
 * Kak Rara ngomong: teks diketik huruf per huruf.
 * poseNgomong : pose selama ngetik, poseAkhir : pose setelah selesai
 */
function guruBilang(teks, { poseNgomong = "bicara", poseAkhir = "senyum" } = {}) {
  clearTimeout(timerKetik);
  clearTimeout(timerPose);
  if (layarHP.matches && poseAkhir === "nunjuk") poseAkhir = "senyum";

  elBubble.classList.add("is-show");
  elIsi.textContent = "";
  gantiPose(poseNgomong);
  elGuru.classList.add("is-talking");
  mulaiMulut(poseNgomong);

  let i = 0;
  (function ketik() {
    if (i < teks.length) {
      elIsi.textContent += teks.charAt(i++);
      timerKetik = setTimeout(ketik, 22);
    } else {
      hentikanMulut();
      gantiPose(poseNgomong);
      elGuru.classList.remove("is-talking");
      timerPose = setTimeout(() => gantiPose(poseAkhir), 200);
    }
  })();
}

/** mulut buka-tutup: gonta-ganti pose "x" <-> "x_tutup" selama ngomong */
let timerMulut = null;
function mulaiMulut(pose) {
  hentikanMulut();
  if (!poseEls[pose + "_tutup"]) return;
  let buka = true;
  (function kedip() {
    buka = !buka;
    gantiPose(buka ? pose : pose + "_tutup");
    timerMulut = setTimeout(kedip, 90 + Math.random() * 110);
  })();
}
function hentikanMulut() {
  clearTimeout(timerMulut);
}

function acak(daftar) {
  return daftar[Math.floor(Math.random() * daftar.length)];
}

/* ==========================================================================
   4) SUARA (Web Audio API — gak butuh file mp3)
   ========================================================================== */
let audioCtx = null;
function nada(frekuensi, mulai, durasi, volume = 0.08, tipe = "sine") {
  if (!suaraNyala) return;
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();
  }
  const t = audioCtx.currentTime + mulai;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = tipe;
  osc.frequency.setValueAtTime(frekuensi, t);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + durasi);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + durasi);
}
function suaraBenar() { nada(523, 0, 0.15); nada(659, 0.1, 0.15); nada(784, 0.2, 0.3); }
function suaraSalah() { nada(220, 0, 0.2, 0.07, "triangle"); nada(175, 0.15, 0.35, 0.07, "triangle"); }
function suaraKlik() { nada(600, 0, 0.08, 0.05); }
function suaraSelesai() { [523, 659, 784, 1047].forEach((f, i) => nada(f, i * 0.12, 0.3)); }
function suaraNaikLevel() { [392, 523, 659].forEach((f, i) => nada(f, i * 0.09, 0.22, 0.06)); }

/* ==========================================================================
   5) LAYAR MULAI
   ========================================================================== */
function esc(teks) {
  const d = document.createElement("div");
  d.textContent = teks;
  return d.innerHTML;
}

function renderMulai() {
  elCard.innerHTML = `
    <div class="layar">
      <div class="layar-tengah">
        <div class="lencana">📝</div>
        <h1>Kuis Majas</h1>
        <p class="sapa">Halo, <b>${esc(user.nama)}</b>! Ayo, uji seberapa pandai kamu mengenali majas!</p>
        <div class="info-kuis">
          <span><i class="fa-solid fa-list-ol"></i> ${SOAL.length} soal</span>
          <span><i class="fa-solid fa-gauge-simple"></i> ${TINGKAT.length} level</span>
          <span><i class="fa-solid fa-star"></i> Nilai maks. 100</span>
        </div>
        <div class="daftar-level">
          ${TINGKAT.map((t, i) => `
            <span class="level-chip level-${t.id}"><b>${t.ikon} Level ${i + 1}</b> ${esc(t.nama)} · ${t.soal.length} soal</span>`).join("")}
        </div>
        <button class="comic-btn comic-btn-primary btn-besar" id="btnMulai">
          Mulai Kuis! <i class="fa-solid fa-play"></i>
        </button>
      </div>
    </div>`;
  document.getElementById("btnMulai").addEventListener("click", mulaiKuis);
}

function mulaiKuis() {
  suaraKlik();
  idxSoal = 0;
  jumlahBenar = 0;
  jawabanSiswa = [];
  renderLevel(0);
}

/* ==========================================================================
   5b) LAYAR LEVEL — pembuka tiap tingkat (Mudah -> Sedang -> HOTS)
   ========================================================================== */
const benarDiLevel = (it) => SOAL.reduce((n, s, i) => n + (s.tingkat === it && jawabanSiswa[i] === s.jawaban ? 1 : 0), 0);

function renderLevel(it) {
  const t = TINGKAT[it];
  const sebelum = it > 0 ? TINGKAT[it - 1] : null;
  elCard.innerHTML = `
    <div class="layar">
      <div class="layar-tengah layar-level level-${t.id}">
        ${sebelum ? `<p class="level-selesai"><i class="fa-solid fa-circle-check"></i> Level ${it} (${esc(sebelum.nama)}) selesai: benar <b>${benarDiLevel(it - 1)}</b> dari ${sebelum.soal.length}</p>` : ""}
        <div class="lencana lencana-level">${t.ikon}</div>
        <p class="level-nomor">LEVEL ${it + 1} DARI ${TINGKAT.length}</p>
        <h1>${esc(t.nama)}</h1>
        <p class="sapa">${esc(t.ket)}<br>Ada <b>${t.soal.length} soal</b> di level ini.</p>
        <button class="comic-btn comic-btn-primary btn-besar" id="btnLevel">
          ${it === 0 ? "Ayo Mulai!" : "Lanjut ke Level " + (it + 1)} <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>`;
  const btn = document.getElementById("btnLevel");
  btn.addEventListener("click", () => { suaraKlik(); renderSoal(); });
  btn.focus({ preventScroll: true });
  suaraNaikLevel();
  guruBilang([
    `Level 1: ${t.nama}! Kita mulai dari yang mudah dulu, ya, ${namaPanggilan}.`,
    `Hebat! Sekarang Level 2: ${t.nama}. Kamu pasti bisa!`,
    `Level terakhir: ${t.nama}! Ini tantangan, baca pelan-pelan, ya. 🚀`,
  ][it] || `Level ${it + 1}: ${t.nama}!`);
}

/* ==========================================================================
   6) LAYAR SOAL
   ========================================================================== */
function renderSoal() {
  const s = SOAL[idxSoal];
  const t = TINGKAT[s.tingkat];
  sudahJawab = false;
  // kutipan 1 baris diberi tanda petik; daftar kalimat (1)(2)(3) tidak
  const kutipan = s.kutipan ? (s.kutipan.includes("\n") ? esc(s.kutipan) : `“${esc(s.kutipan)}”`) : "";

  elCard.innerHTML = `
    <div class="layar">
      <div class="kuis-head">
        <span class="level-lencana level-${t.id}" title="Level ${s.tingkat + 1}: ${esc(t.nama)}">${t.ikon} ${esc(t.nama)}</span>
        <span class="kuis-nomor">Soal ${idxSoal + 1}<small>/${SOAL.length}</small></span>
        <div class="kuis-bar"><span style="width:${(idxSoal / SOAL.length) * 100}%"></span></div>
        <span class="kuis-skor" id="skor"><i class="fa-solid fa-star"></i> ${Math.round(jumlahBenar * POIN_PER_SOAL)}</span>
        <button class="btn-suara ${suaraNyala ? "" : "is-muted"}" id="btnSuara" title="Nyalakan/matikan suara">
          <i class="fa-solid ${suaraNyala ? "fa-volume-high" : "fa-volume-xmark"}"></i>
        </button>
      </div>

      <div class="kuis-body">
        <span class="kuis-perintah">${esc(s.perintah || PERINTAH)}</span>
        ${kutipan ? `<blockquote class="kuis-kutipan">${kutipan}</blockquote>` : ""}
        <h2 class="kuis-tanya">${esc(s.tanya)}</h2>

        <div class="kuis-pilihan">
          ${s.pilihan.map((p, i) => `
            <button class="opsi" data-i="${i}">
              <span class="opsi-huruf">${HURUF[i]}</span>
              <span class="opsi-teks">${esc(p)}</span>
            </button>`).join("")}
        </div>

        <div class="kuis-umpan" id="umpan" hidden></div>
      </div>
    </div>`;

  elCard.querySelectorAll(".opsi").forEach((btn) =>
    btn.addEventListener("click", () => pilihJawaban(Number(btn.dataset.i)))
  );
  document.getElementById("btnSuara").addEventListener("click", gantiSuara);

  guruBilang(
    acak([
      `Soal nomor ${idxSoal + 1}! Baca baik-baik, ya.`,
      `Ayo, ${namaPanggilan}, kamu pasti bisa!`,
      `Soal ${idxSoal + 1}. Pelan-pelan saja, tidak usah terburu-buru.`,
      `Coba perhatikan soal ini baik-baik!`,
    ]),
    { poseAkhir: "nunjuk" }
  );
}

function pilihJawaban(i) {
  if (sudahJawab) return;
  sudahJawab = true;

  const s = SOAL[idxSoal];
  const benar = i === s.jawaban;
  jawabanSiswa[idxSoal] = i;
  if (benar) jumlahBenar++;

  // warnai pilihan: yang benar hijau, pilihan salah merah, sisanya redup
  elCard.querySelectorAll(".opsi").forEach((btn, j) => {
    btn.disabled = true;
    if (j === s.jawaban) btn.classList.add("is-benar");
    else if (j === i) btn.classList.add("is-salah");
    else btn.classList.add("is-redup");
  });

  // update skor & progres
  const elSkor = document.getElementById("skor");
  elSkor.innerHTML = `<i class="fa-solid fa-star"></i> ${Math.round(jumlahBenar * POIN_PER_SOAL)}`;
  if (benar) elSkor.classList.add("is-naik");
  elCard.querySelector(".kuis-bar span").style.width = `${((idxSoal + 1) / SOAL.length) * 100}%`;

  // umpan balik + tombol lanjut
  const terakhir = idxSoal === SOAL.length - 1;
  const umpan = document.getElementById("umpan");
  umpan.className = `kuis-umpan ${benar ? "is-benar" : "is-salah"}`;
  umpan.innerHTML = `
    <span class="umpan-ikon">${benar ? "🎉" : "💡"}</span>
    <p class="umpan-teks">
      <strong>${benar ? "Benar!" : `Belum tepat. Jawabannya ${HURUF[s.jawaban]}.`}</strong>
      ${esc(s.penjelasan)}
    </p>
    <button class="comic-btn comic-btn-primary" id="btnLanjut">
      ${terakhir ? 'Lihat Nilai <i class="fa-solid fa-flag-checkered"></i>' : 'Lanjut <i class="fa-solid fa-arrow-right"></i>'}
    </button>`;
  umpan.hidden = false;
  document.getElementById("btnLanjut").addEventListener("click", lanjut);
  document.getElementById("btnLanjut").focus({ preventScroll: true });
  // di HP kotak penjelasan + tombol Lanjut ada di bawah layar -> gulir ke sana
  if (layarHP.matches) umpan.scrollIntoView({ behavior: "smooth", block: "nearest" });

  if (benar) {
    suaraBenar();
    guruBilang(acak([
      `Hebat, ${namaPanggilan}! Jawabanmu benar! 🎉`,
      "Tepat sekali! Kamu pandai mengenali majas! ⭐",
      "Bagus! Benar sekali! 👏",
      "Mantap! Ayo, lanjut ke soal berikutnya!",
    ]));
  } else {
    suaraSalah();
    guruBilang(acak([
      "Hmm, belum tepat. Tidak apa-apa, baca penjelasannya, ya! 💡",
      "Yah, sedikit lagi! Coba lihat penjelasannya.",
      "Belum benar, tetapi kamu sudah berani mencoba! 💪",
    ]), { poseAkhir: "bicara" });
  }
}

function lanjut() {
  if (!sudahJawab) return;
  suaraKlik();
  if (idxSoal < SOAL.length - 1) {
    idxSoal++;
    // ganti tingkat -> layar pembuka level dulu
    if (SOAL[idxSoal].tingkat !== SOAL[idxSoal - 1].tingkat) renderLevel(SOAL[idxSoal].tingkat);
    else renderSoal();
  } else {
    renderHasil();
  }
}

function gantiSuara() {
  suaraNyala = !suaraNyala;
  const btn = document.getElementById("btnSuara");
  btn.classList.toggle("is-muted", !suaraNyala);
  btn.innerHTML = `<i class="fa-solid ${suaraNyala ? "fa-volume-high" : "fa-volume-xmark"}"></i>`;
}

/* ==========================================================================
   7) LAYAR HASIL
   ========================================================================== */
function renderHasil() {
  const nilai = Math.round(jumlahBenar * POIN_PER_SOAL);
  const salah = SOAL.length - jumlahBenar;
  const jumlahBintang = nilai >= 80 ? 3 : nilai >= 60 ? 2 : nilai > 0 ? 1 : 0;
  const pesan =
    nilai === 100 ? "Sempurna! Kamu juara majas! 🏆" :
    nilai >= 80 ? "Hebat sekali! Kamu sudah paham majas! 🌟" :
    nilai >= 60 ? "Bagus! Sedikit lagi jadi ahli majas! 👍" :
    "Ayo, semangat! Baca materinya lagi, lalu coba lagi, ya! 💪";

  elCard.innerHTML = `
    <div class="layar">
      <div class="layar-tengah">
        <div class="bintang">
          ${[0, 1, 2].map((i) => `<i class="fa-solid fa-star ${i < jumlahBintang ? "is-nyala" : ""}"></i>`).join("")}
        </div>
        <h1>Kuis Selesai!</h1>
        <div class="nilai-bulat"><b>${nilai}</b><small>NILAI</small></div>
        <p class="sapa"><b>${esc(user.nama)}</b> menjawab benar <b>${jumlahBenar}</b> dari ${SOAL.length} soal.<br>${pesan}</p>
        <div class="rekap-level" aria-label="Rekap jawaban per level">
          ${TINGKAT.map((t, it) => `
            <div class="rekap-baris level-${t.id}">
              <span class="rekap-judul">${t.ikon} ${esc(t.nama)} <b>${benarDiLevel(it)}/${t.soal.length}</b></span>
              <div class="rekap">
                ${SOAL.map((s, i) => s.tingkat !== it ? "" : `<span class="${jawabanSiswa[i] === s.jawaban ? "is-benar" : "is-salah"}" title="Soal ${i + 1}">${i + 1}</span>`).join("")}
              </div>
            </div>`).join("")}
        </div>
        <p class="status-kirim" id="statusKirim"></p>
        <div class="tombol-baris">
          <button class="comic-btn comic-btn-ghost" id="btnUlang"><i class="fa-solid fa-rotate-right"></i> Ulangi Kuis</button>
          <a class="comic-btn comic-btn-primary" href="game.html">Lanjut ke Game <i class="fa-solid fa-gamepad"></i></a>
        </div>
      </div>
    </div>`;
  document.getElementById("btnUlang").addEventListener("click", mulaiKuis);

  suaraSelesai();
  if (nilai >= 70) tebarKonfeti();
  guruBilang(nilai >= 70 ? `Selamat, ${namaPanggilan}! Nilaimu ${nilai}! 🎉` : `Nilaimu ${nilai}. Ayo, belajar lagi! Kamu pasti bisa!`);

  simpanNilai(nilai, salah);
}

function tebarKonfeti() {
  const warna = ["#FFC93C", "#FF7AAE", "#4FC3F7", "#3FDDB0", "#8A6BFF"];
  for (let i = 0; i < 60; i++) {
    const k = document.createElement("div");
    k.className = "konfeti";
    k.style.left = `${Math.random() * 100}vw`;
    k.style.background = warna[i % warna.length];
    k.style.animationDuration = `${2 + Math.random() * 2}s`;
    k.style.animationDelay = `${Math.random() * 0.8}s`;
    document.body.appendChild(k);
    setTimeout(() => k.remove(), 5000);
  }
}

/* ==========================================================================
   8) SIMPAN NILAI — ke browser (buat Dashboard) + kirim ke Google Sheet
   ========================================================================== */
async function simpanNilai(nilai, salah) {
  // a) simpan di browser (buat Dashboard), fungsinya ada di js/sheet.js
  simpanNilaiLokal(user.nama, nilai);

  // b) kirim ke Google Sheet (URL-nya diatur di js/sheet.js). Di sheet,
  //    nilai otomatis masuk ke tab tanggal hari ini, mis. "Kuis 07-10-2026"
  const elStatus = document.getElementById("statusKirim");
  if (!GOOGLE_SHEET_URL) {
    elStatus.textContent = "Nilai tersimpan di perangkat ini.";
    return;
  }
  elStatus.textContent = "Mengirim nilai kepada guru...";
  // gagal -> otomatis masuk antrean & dikirim ulang nanti (lihat js/sheet.js)
  const kirim = await kirimData({
    aksi: "nilai",
    nama: user.nama,
    pin: user.pin,
    nilai,
    benar: jumlahBenar,
    salah,
    jawaban: jawabanSiswa.map((j) => HURUF[j]).join(""),
  });
  const pesan = pesanKirim(kirim, "Nilai");
  elStatus.textContent = pesan.teks;
  elStatus.className = `status-kirim ${pesan.kelas}`;
}

/* ==========================================================================
   9) KEYBOARD: 1-4 / A-D = jawab, Enter = lanjut
   ========================================================================== */
document.addEventListener("keydown", (e) => {
  if (!elCard.querySelector(".kuis-pilihan")) return; // cuma di layar soal
  const k = e.key.toUpperCase();
  const idx = ["1", "2", "3", "4"].indexOf(k) >= 0 ? Number(k) - 1 : HURUF.indexOf(k);
  if (idx >= 0 && !sudahJawab) pilihJawaban(idx);
  else if (e.key === "Enter" && sudahJawab && document.activeElement?.id !== "btnLanjut") lanjut();
});

/* ==========================================================================
   10) MULAI!
   ========================================================================== */
gantiPose("senyum");
renderMulai();
setTimeout(() => {
  // sapa cuma kalau masih di layar mulai (belum keburu klik "Mulai Kuis")
  if (document.getElementById("btnMulai")) guruBilang(`Halo, ${namaPanggilan}! Siap mengerjakan kuis majas? 💪`);
}, 400);
