/* ==========================================================================
   METAPIA — kuis.js
   Alurnya:
   1) Layar MULAI  : sapa siswa pakai nama login -> tombol "Mulai Kuis"
   2) Layar SOAL   : 10 soal pilihan ganda, langsung ketahuan benar/salah
                     + penjelasan singkat, Kak Rara ikut komentar
   3) Layar HASIL  : nilai (benar x 10), bintang, rekap jawaban,
                     nilai dikirim ke Google Sheet (kalau URL-nya sudah diisi)

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
   ========================================================================== */
const PERINTAH = "Pilihlah jawaban yang paling tepat!";

const SOAL = [
  {
    tanya: "Gaya bahasa yang memakai kata-kata kiasan supaya tulisan lebih menarik disebut ...",
    pilihan: ["majas", "kalimat", "paragraf", "puisi"],
    jawaban: 0,
    penjelasan: "Majas adalah gaya bahasa yang memakai kata kiasan biar tulisan lebih hidup dan menarik.",
  },
  {
    kutipan: "Adik adalah buah hati Ayah dan Ibu.",
    tanya: "Arti kata buah hati adalah ...",
    pilihan: ["buah kesukaan Ayah dan Ibu", "anak yang sangat disayangi", "bagian dari hati", "makanan kesukaan Adik"],
    jawaban: 1,
    penjelasan: "\"Buah hati\" adalah kiasan untuk anak yang sangat disayangi.",
  },
  {
    kutipan: "Bulan mengintip dari balik awan.",
    tanya: "Kalimat di atas memakai majas ...",
    pilihan: ["metafora", "hiperbola", "personifikasi", "bukan majas"],
    jawaban: 2,
    penjelasan: "Bulan dibuat seolah bisa mengintip seperti manusia, itu personifikasi.",
  },
  {
    kutipan: "Teriakan penonton membelah langit.",
    tanya: "Kalimat di atas memakai majas ...",
    pilihan: ["personifikasi", "metafora", "bukan majas", "hiperbola"],
    jawaban: 3,
    penjelasan: "Teriakan tidak mungkin membelah langit. Ini melebih-lebihkan, jadi hiperbola.",
  },
  {
    tanya: "Majas yang membuat benda seolah-olah bisa berbuat seperti manusia disebut ...",
    pilihan: ["hiperbola", "personifikasi", "metafora", "bukan majas"],
    jawaban: 1,
    penjelasan: "Personifikasi memberi sifat manusia pada benda mati.",
  },
  {
    tanya: "Kalimat yang memakai majas metafora adalah ...",
    pilihan: [
      "Kucingku berlari secepat kilat.",
      "Pohon itu menari ditiup angin.",
      "Kakak adalah bintang kelas di sekolahnya.",
      "Tangisannya membanjiri seluruh kamar.",
    ],
    jawaban: 2,
    penjelasan: "Kakak langsung dibandingkan dengan \"bintang kelas\" tanpa kata seperti, itu metafora.",
  },
  {
    kutipan: "Ayah adalah tulang punggung keluarga.",
    tanya: "Arti kata tulang punggung adalah ...",
    pilihan: [
      "tulang belakang Ayah",
      "orang yang bekerja untuk memenuhi kebutuhan keluarga",
      "orang yang suka menggendong anaknya",
      "orang yang badannya paling kuat",
    ],
    jawaban: 1,
    penjelasan: "\"Tulang punggung\" adalah kiasan untuk orang yang bekerja mencukupi kebutuhan keluarga.",
  },
  {
    tanya: "Kalimat yang memakai majas hiperbola adalah ...",
    pilihan: [
      "Tumpukan PR-ku setinggi gunung.",
      "Ombak memeluk kaki kami di pantai.",
      "Rani adalah anak emas di kelasnya.",
      "Lonceng sekolah memanggil kami masuk kelas.",
    ],
    jawaban: 0,
    penjelasan: "PR tidak mungkin setinggi gunung. Itu melebih-lebihkan, jadi hiperbola.",
  },
  {
    tanya: "Majas yang memakai kata-kata berlebihan untuk menekankan maksud disebut ...",
    pilihan: ["metafora", "personifikasi", "bukan majas", "hiperbola"],
    jawaban: 3,
    penjelasan: "Hiperbola memakai kata-kata berlebihan untuk menekankan maksud.",
  },
  {
    perintah: "Bacalah paragraf berikut!",
    kutipan: "Pagi itu angin berbisik pelan di telingaku. Aku berlari secepat kilat ke sekolah karena takut terlambat.",
    tanya: "Majas yang ada dalam paragraf tersebut adalah ...",
    pilihan: ["personifikasi dan hiperbola", "metafora dan hiperbola", "personifikasi dan metafora", "hanya hiperbola"],
    jawaban: 0,
    penjelasan: "\"Angin berbisik\" = personifikasi, \"secepat kilat\" = hiperbola.",
  },
];

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
  senyum: "assets/karakter/guru/guru-senyum.png",
  bicara: "assets/karakter/guru/guru-bicara.png",
  nunjuk: "assets/karakter/guru/guru-nunjuk.png",
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
    img.className = "pose";
    img.src = src;
    img.alt = "Kak Rara";
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
const layarHP = window.matchMedia("(max-width:820px)");

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

  let i = 0;
  (function ketik() {
    if (i < teks.length) {
      elIsi.textContent += teks.charAt(i++);
      timerKetik = setTimeout(ketik, 22);
    } else {
      elGuru.classList.remove("is-talking");
      timerPose = setTimeout(() => gantiPose(poseAkhir), 200);
    }
  })();
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
        <p class="sapa">Halo, <b>${esc(user.nama)}</b>! Yuk uji seberapa jago kamu mengenali majas.</p>
        <div class="info-kuis">
          <span><i class="fa-solid fa-list-ol"></i> ${SOAL.length} soal</span>
          <span><i class="fa-solid fa-circle-check"></i> Pilihan ganda</span>
          <span><i class="fa-solid fa-star"></i> Nilai maks 100</span>
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
  renderSoal();
}

/* ==========================================================================
   6) LAYAR SOAL
   ========================================================================== */
function renderSoal() {
  const s = SOAL[idxSoal];
  sudahJawab = false;

  elCard.innerHTML = `
    <div class="layar">
      <div class="kuis-head">
        <span class="kuis-nomor">Soal ${idxSoal + 1}<small>/${SOAL.length}</small></span>
        <div class="kuis-bar"><span style="width:${(idxSoal / SOAL.length) * 100}%"></span></div>
        <span class="kuis-skor" id="skor"><i class="fa-solid fa-star"></i> ${Math.round(jumlahBenar * POIN_PER_SOAL)}</span>
        <button class="btn-suara ${suaraNyala ? "" : "is-muted"}" id="btnSuara" title="Nyalakan/matikan suara">
          <i class="fa-solid ${suaraNyala ? "fa-volume-high" : "fa-volume-xmark"}"></i>
        </button>
      </div>

      <div class="kuis-body">
        <span class="kuis-perintah">${esc(s.perintah || PERINTAH)}</span>
        ${s.kutipan ? `<blockquote class="kuis-kutipan">“${esc(s.kutipan)}”</blockquote>` : ""}
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
      `Ayo ${namaPanggilan}, kamu pasti bisa!`,
      `Soal ${idxSoal + 1}. Pelan-pelan saja, gak usah buru-buru.`,
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
      "Tepat sekali! Kamu jago majas! ⭐",
      "Keren! Benar banget! 👏",
      "Mantap! Lanjut ke soal berikutnya, yuk!",
    ]));
  } else {
    suaraSalah();
    guruBilang(acak([
      "Hmm, belum tepat. Gak apa-apa, baca penjelasannya ya! 💡",
      "Yah, sedikit lagi! Coba lihat penjelasannya.",
      "Belum benar, tapi kamu sudah berani mencoba! 💪",
    ]), { poseAkhir: "bicara" });
  }
}

function lanjut() {
  if (!sudahJawab) return;
  suaraKlik();
  if (idxSoal < SOAL.length - 1) {
    idxSoal++;
    renderSoal();
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
    "Ayo semangat! Baca materinya lagi, lalu coba lagi ya! 💪";

  elCard.innerHTML = `
    <div class="layar">
      <div class="layar-tengah">
        <div class="bintang">
          ${[0, 1, 2].map((i) => `<i class="fa-solid fa-star ${i < jumlahBintang ? "is-nyala" : ""}"></i>`).join("")}
        </div>
        <h1>Kuis Selesai!</h1>
        <div class="nilai-bulat"><b>${nilai}</b><small>NILAI</small></div>
        <p class="sapa"><b>${esc(user.nama)}</b> menjawab benar <b>${jumlahBenar}</b> dari ${SOAL.length} soal.<br>${pesan}</p>
        <div class="rekap" aria-label="Rekap jawaban">
          ${SOAL.map((s, i) => `<span class="${jawabanSiswa[i] === s.jawaban ? "is-benar" : "is-salah"}" title="Soal ${i + 1}">${i + 1}</span>`).join("")}
        </div>
        <p class="status-kirim" id="statusKirim"></p>
        <div class="tombol-baris">
          <button class="comic-btn comic-btn-ghost" id="btnUlang"><i class="fa-solid fa-rotate-right"></i> Ulangi Kuis</button>
          <a class="comic-btn comic-btn-primary" href="dashboard.html"><i class="fa-solid fa-house"></i> Ke Beranda</a>
        </div>
      </div>
    </div>`;
  document.getElementById("btnUlang").addEventListener("click", mulaiKuis);

  suaraSelesai();
  if (nilai >= 70) tebarKonfeti();
  guruBilang(nilai >= 70 ? `Selamat, ${namaPanggilan}! Nilaimu ${nilai}! 🎉` : `Nilaimu ${nilai}. Ayo belajar lagi, kamu pasti bisa!`);

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
  elStatus.textContent = "Mengirim nilai ke guru...";
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
