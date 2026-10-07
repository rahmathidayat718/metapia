/* ==========================================================================
   METAPIA — game.js
   "Mesin" yang dipakai bareng 3 game (data soal ada di js/game-data.js,
   aturan main tiap game ada di game-tebak.js / game-keranjang.js /
   game-ubah.js). Isinya:
   - Kak Rara (pose + balon kata), efek suara, konfeti, angka "+10" melayang
   - Layar MENU (peta 3 level), layar PEMBUKA, HUD (header game), layar HASIL
   - Simpan skor: ke browser (buat Dashboard) + Google Sheet (js/sheet.js)

   Alamat halaman:
     game.html          -> menu peta
     game.html?main=2   -> langsung ke layar pembuka Game 2
   ========================================================================== */

const Game = (() => {
  const user = getCurrentUser() || { nama: "Teman", pin: "" };
  const namaPanggilan = user.nama.split(" ")[0];
  const elCard = document.getElementById("gameCard");
  const mesin = {}; // aturan main tiap game, didaftarin lewat Game.daftar()
  let sedangMain = false;

  /* ========================================================================
     1) KAK RARA — pose + balon kata (sama kayak di kuis.js)
     ======================================================================== */
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
  const layarHP = window.matchMedia("(max-width:820px)");

  elGuru.innerHTML = `<div class="tokoh-figure"><div class="tokoh-shadow"></div><div class="tokoh-body"></div></div>`;
  Object.entries(GURU_POSE).forEach(([nama, src]) => {
    const img = document.createElement("img");
    img.className = "pose";
    img.src = src;
    img.alt = "Kak Rara";
    img.draggable = false;
    elGuru.querySelector(".tokoh-body").appendChild(img);
    poseEls[nama] = img;
  });
  aturRasioTokoh(elGuru, poseEls.senyum);

  function gantiPose(nama) {
    Object.entries(poseEls).forEach(([n, img]) => img.classList.toggle("is-active", n === nama));
  }

  /** Kak Rara ngomong (teks diketik huruf per huruf) */
  function guru(teks, { poseNgomong = "bicara", poseAkhir = "senyum" } = {}) {
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
        timerKetik = setTimeout(ketik, 20);
      } else {
        elGuru.classList.remove("is-talking");
        timerPose = setTimeout(() => gantiPose(poseAkhir), 200);
      }
    })();
  }

  /** Kak Rara lompat kecil (buat ngerayain jawaban benar) */
  function guruLompat() {
    elGuru.classList.remove("is-bounce");
    void elGuru.offsetWidth;
    elGuru.classList.add("is-bounce");
    setTimeout(() => elGuru.classList.remove("is-bounce"), 600);
  }

  /* ========================================================================
     2) SUARA (Web Audio API — gak butuh file mp3). Bisa dimatiin (🔊).
     ======================================================================== */
  let suaraNyala = localStorage.getItem("metapia_suara") !== "0";
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
  const suara = {
    benar() { nada(523, 0, 0.15); nada(659, 0.1, 0.15); nada(784, 0.2, 0.3); },
    salah() { nada(220, 0, 0.2, 0.07, "triangle"); nada(175, 0.15, 0.35, 0.07, "triangle"); },
    klik() { nada(600, 0, 0.08, 0.05); },
    ambil() { nada(440, 0, 0.08, 0.05); nada(660, 0.05, 0.08, 0.05); },
    tik() { nada(1000, 0, 0.05, 0.04, "square"); },
    habis() { nada(330, 0, 0.25, 0.08, "sawtooth"); nada(250, 0.2, 0.4, 0.08, "sawtooth"); },
    selesai() { [523, 659, 784, 1047].forEach((f, i) => nada(f, i * 0.12, 0.3)); },
  };
  function gantiSuara(btn) {
    suaraNyala = !suaraNyala;
    localStorage.setItem("metapia_suara", suaraNyala ? "1" : "0");
    btn.classList.toggle("is-muted", !suaraNyala);
    btn.innerHTML = `<i class="fa-solid ${suaraNyala ? "fa-volume-high" : "fa-volume-xmark"}"></i>`;
  }

  /* ========================================================================
     3) ALAT BANTU
     ======================================================================== */
  function esc(teks) {
    const d = document.createElement("div");
    d.textContent = teks;
    return d.innerHTML;
  }
  function acak(daftar) {
    return daftar[Math.floor(Math.random() * daftar.length)];
  }
  /** skala zoom halaman di layar besar (lihat common.css) */
  function skalaHalaman() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--skala")) || 1;
  }

  /** angka "+10" yang melayang ke atas dari dekat elemen tertentu */
  function poinMelayang(teks, elDekat, jenis = "plus") {
    const kartu = elCard.getBoundingClientRect();
    const r = elDekat.getBoundingClientRect();
    const s = skalaHalaman();
    const el = document.createElement("span");
    el.className = `poin-melayang is-${jenis}`;
    el.textContent = teks;
    el.style.left = `${(r.left + r.width / 2 - kartu.left) / s}px`;
    el.style.top = `${(r.top - kartu.top) / s}px`;
    elCard.appendChild(el);
    setTimeout(() => el.remove(), 1300);
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

  function jumlahBintang(skor) {
    return skor >= 80 ? 3 : skor >= 60 ? 2 : skor > 0 ? 1 : 0;
  }
  function htmlBintang(n, kelas = "") {
    return [0, 1, 2].map((i) => `<i class="fa-solid fa-star ${i < n ? "is-nyala" : ""} ${kelas}"></i>`).join("");
  }

  /* ========================================================================
     4) SKOR TERSIMPAN (browser) — fungsi simpan/baca-nya ada di js/sheet.js
     ======================================================================== */
  function skorTersimpan(id) {
    const data = bacaSkorGameLokal(user.nama);
    return (data.skor && data.skor[id]) || null;
  }

  /* ========================================================================
     5) LAYAR MENU — peta 3 level
     ======================================================================== */
  function renderMenu() {
    sedangMain = false;
    const daftar = Object.values(DATA_GAME);
    elCard.innerHTML = `
      <div class="layar layar-menu">
        <div class="peta-judul">
          <span class="peta-ikon">🗺️</span>
          <div>
            <h1>Petualangan Majas</h1>
            <p>Taklukkan 3 level, mulai dari yang paling mudah!</p>
          </div>
        </div>
        <div class="peta">
          ${daftar.map((g) => {
            const s = skorTersimpan(g.id);
            return `
              <a class="pulau warna-${g.warna}" href="game.html?main=${g.id}">
                <div class="pulau-lencana">
                  <span class="pulau-ikon">${g.ikon}</span>
                  <span class="pulau-level">${g.id}</span>
                </div>
                <span class="pulau-label">${g.label}</span>
                <h3>${esc(g.judul)}</h3>
                <p class="pulau-desk">${esc(g.deskripsi)}</p>
                <div class="pulau-bintang">${htmlBintang(s ? jumlahBintang(s.terbaik) : 0)}</div>
                <p class="pulau-skor">${s ? `Skor terbaik: <b>${s.terbaik}</b>` : "Belum dimainkan"}</p>
                <span class="comic-btn comic-btn-primary pulau-main">${s ? "Main Lagi" : "Main!"} <i class="fa-solid fa-play"></i></span>
              </a>`;
          }).join("")}
        </div>
      </div>`;

    const sudah = daftar.filter((g) => skorTersimpan(g.id)).length;
    gantiPose("senyum");
    guru(
      sudah === 0 ? `Halo, ${namaPanggilan}! Ayo mulai petualangan dari Level 1, ya! 🗺️` :
      sudah < daftar.length ? `Keren, ${namaPanggilan}! Sudah ${sudah} level. Lanjut ke level berikutnya, yuk!` :
      `Wah, semua level sudah kamu mainkan! Coba kejar 3 bintang semua! ⭐`,
      { poseAkhir: "nunjuk" }
    );
  }

  /* ========================================================================
     6) LAYAR PEMBUKA tiap game
     ======================================================================== */
  function renderPembuka(id) {
    sedangMain = false;
    const g = DATA_GAME[id];
    const s = skorTersimpan(id);
    elCard.innerHTML = `
      <div class="layar">
        <div class="layar-tengah layar-pembuka warna-${g.warna}">
          <div class="lencana">${g.ikon}</div>
          <span class="pulau-label">LEVEL ${g.id} · ${g.label}</span>
          <h1>${esc(g.judul)}</h1>
          <p class="sapa">Halo, <b>${esc(user.nama)}</b>! ${esc(g.deskripsi)}</p>
          <ol class="cara-main">
            ${g.caraMain.map((c, i) => `<li><span>${i + 1}</span>${esc(c)}</li>`).join("")}
          </ol>
          <div class="info-kuis">
            <span><i class="fa-solid fa-list-ol"></i> ${g.soal.length} soal</span>
            <span><i class="fa-solid fa-trophy"></i> Skor maks 100</span>
            ${g.detikPerSoal ? `<span><i class="fa-solid fa-stopwatch"></i> ${g.detikPerSoal} detik/soal</span>` : ""}
            ${s ? `<span><i class="fa-solid fa-star"></i> Terbaikmu: ${s.terbaik}</span>` : ""}
          </div>
          <div class="tombol-baris">
            <a class="comic-btn comic-btn-ghost" href="game.html"><i class="fa-solid fa-map"></i> Menu</a>
            <button class="comic-btn comic-btn-primary btn-besar" id="btnMulai">Mulai! <i class="fa-solid fa-play"></i></button>
          </div>
        </div>
      </div>`;
    document.getElementById("btnMulai").addEventListener("click", () => {
      suara.klik();
      mainkan(id);
    });
    guru(`Siap main ${g.judul}, ${namaPanggilan}? Baca cara mainnya dulu, ya!`);
  }

  /* ========================================================================
     7) MAIN — bikin HUD + area main, lalu serahkan ke aturan main game-nya
     ======================================================================== */
  function mainkan(id) {
    const g = DATA_GAME[id];
    sedangMain = true;
    elCard.innerHTML = `
      <div class="layar">
        <div class="kuis-head hud">
          <span class="hud-level warna-${g.warna}">${g.ikon} Lv ${g.id}</span>
          <span class="kuis-nomor">Soal <b class="hud-no">1</b><small>/${g.soal.length}</small></span>
          <div class="hud-titik">${g.soal.map(() => "<span></span>").join("")}</div>
          <span class="hud-waktu" hidden><i class="fa-solid fa-stopwatch"></i> <b>0</b><i class="hud-waktu-bar"></i></span>
          <span class="hud-bintang" hidden><i class="fa-solid fa-star"></i> <b>0</b><small>/15</small></span>
          <span class="kuis-skor hud-skor"><i class="fa-solid fa-trophy"></i> <b>0</b></span>
          <button class="btn-suara ${suaraNyala ? "" : "is-muted"}" title="Nyalakan/matikan suara">
            <i class="fa-solid ${suaraNyala ? "fa-volume-high" : "fa-volume-xmark"}"></i>
          </button>
          <button class="btn-suara btn-keluar" title="Keluar ke menu game"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="game-body"></div>
      </div>`;

    const hud = elCard.querySelector(".hud");
    hud.querySelector(".btn-suara").addEventListener("click", (e) => gantiSuara(e.currentTarget));
    hud.querySelector(".btn-keluar").addEventListener("click", () => {
      if (confirm("Keluar dari game? Skor permainan ini tidak akan disimpan.")) keluar();
    });

    let skor = 0;
    const api = {
      data: g,
      body: elCard.querySelector(".game-body"),
      user,
      namaPanggilan,
      guru,
      guruLompat,
      gantiPose,
      suara,
      esc,
      acak,
      poinMelayang,
      skalaHalaman,

      /** pindah ke soal ke-i (mulai dari 0) */
      soalKe(i) {
        hud.querySelector(".hud-no").textContent = i + 1;
        hud.querySelectorAll(".hud-titik span").forEach((t, j) => t.classList.toggle("is-sekarang", j === i));
      },
      /** tandai titik progres: "penuh" | "sebagian" | "nol" */
      tandaiSoal(i, status) {
        const t = hud.querySelectorAll(".hud-titik span")[i];
        t.classList.remove("is-sekarang");
        t.classList.add(`is-${status}`);
      },
      tambahSkor(n, elDekat) {
        if (n <= 0) return;
        skor += n;
        const el = hud.querySelector(".hud-skor");
        el.querySelector("b").textContent = skor;
        el.classList.remove("is-naik");
        void el.offsetWidth;
        el.classList.add("is-naik");
        if (elDekat) poinMelayang(`+${n}`, elDekat);
      },
      get skor() { return skor; },
      /** timer di HUD (Game 2). sisa = detik tersisa, total = detik penuh */
      waktu(sisa, total) {
        const el = hud.querySelector(".hud-waktu");
        el.hidden = false;
        el.querySelector("b").textContent = sisa;
        el.querySelector(".hud-waktu-bar").style.width = `${(sisa / total) * 100}%`;
        el.classList.toggle("is-mepet", sisa <= 10);
      },
      /** bintang di HUD (Game 3) */
      bintang(jumlah) {
        const el = hud.querySelector(".hud-bintang");
        el.hidden = false;
        el.querySelector("b").textContent = jumlah;
        el.classList.remove("is-naik");
        void el.offsetWidth;
        el.classList.add("is-naik");
      },
      /**
       * Kotak umpan balik di bawah + tombol lanjut.
       * jenis: "benar" | "salah" | "info"
       */
      umpan({ jenis, judul, teks, tombol, onLanjut }) {
        api.hapusPetunjuk();
        let el = api.body.querySelector(".kuis-umpan");
        if (!el) {
          el = document.createElement("div");
          api.body.appendChild(el);
        }
        el.className = `kuis-umpan game-umpan is-${jenis === "benar" ? "benar" : "salah"}`;
        el.innerHTML = `
          <span class="umpan-ikon">${jenis === "benar" ? "🎉" : jenis === "salah" ? "💡" : "📌"}</span>
          <p class="umpan-teks"><strong>${esc(judul)}</strong>${esc(teks || "")}</p>
          <button class="comic-btn comic-btn-primary">${tombol} <i class="fa-solid fa-arrow-right"></i></button>`;
        const btn = el.querySelector("button");
        btn.addEventListener("click", () => { suara.klik(); onLanjut(); }, { once: true });
        btn.focus({ preventScroll: true });
        if (layarHP.matches) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      },
      /** kotak petunjuk kuning di kartu (petunjuk panjang gak muat di balon Kak Rara) */
      petunjuk(teks) {
        let el = api.body.querySelector(".petunjuk");
        if (!el) {
          el = document.createElement("div");
          el.className = "petunjuk";
          api.body.appendChild(el);
        }
        el.innerHTML = `<span class="petunjuk-ikon">💡</span><p><strong>Petunjuk:</strong> ${esc(teks)}</p>`;
        el.classList.remove("is-muncul");
        void el.offsetWidth;
        el.classList.add("is-muncul");
      },
      hapusPetunjuk() {
        const el = api.body.querySelector(".petunjuk");
        if (el) el.remove();
      },
      hapusUmpan() {
        const el = api.body.querySelector(".kuis-umpan");
        if (el) el.remove();
      },
      /** game selesai -> layar hasil */
      selesai(hasil) {
        sedangMain = false;
        renderHasil(id, { ...hasil, skor });
      },
    };

    mesin[id].main(api);
  }

  function keluar() {
    sedangMain = false; // biar gak muncul peringatan "tinggalkan halaman?"
    if (typeof Game.saatKeluar === "function") Game.saatKeluar();
    Game.saatKeluar = null;
    window.location.href = "game.html";
  }

  /* ========================================================================
     8) LAYAR HASIL
     hasil = { skor, rekap: ["penuh"|"sebagian"|"nol", ...], benar, dari, satuan }
     ======================================================================== */
  function renderHasil(id, hasil) {
    const g = DATA_GAME[id];
    const n = jumlahBintang(hasil.skor);
    const predikat =
      hasil.skor === 100 ? "Sempurna! Kamu Juara Majas! 🏆" :
      hasil.skor >= 80 ? "Hebat sekali! 🌟" :
      hasil.skor >= 60 ? "Bagus! Sedikit lagi sempurna! 👍" :
      "Ayo coba lagi, kamu pasti bisa! 💪";
    const berikut = DATA_GAME[id + 1];

    elCard.innerHTML = `
      <div class="layar">
        <div class="layar-tengah layar-hasil">
          <div class="bintang">${htmlBintang(n)}</div>
          <h1>Level ${g.id} Selesai!</h1>
          <div class="nilai-bulat"><b>${hasil.skor}</b><small>SKOR</small></div>
          <p class="sapa"><b>${esc(user.nama)}</b> — ${esc(hasil.benar)} ${esc(hasil.satuan)} benar dari ${hasil.dari}${hasil.bintang !== undefined ? `, dapat <b>${hasil.bintang}/15 ⭐</b>` : ""}.<br>${predikat}</p>
          <div class="rekap" aria-label="Rekap tiap soal">
            ${hasil.rekap.map((r, i) => `<span class="is-${r}" title="Soal ${i + 1}">${i + 1}</span>`).join("")}
          </div>
          <p class="status-kirim" id="statusKirim"></p>
          <div class="tombol-baris">
            <button class="comic-btn comic-btn-ghost" id="btnUlang"><i class="fa-solid fa-rotate-right"></i> Main Lagi</button>
            <a class="comic-btn comic-btn-ghost" href="game.html"><i class="fa-solid fa-map"></i> Menu Game</a>
            ${berikut ? `<a class="comic-btn comic-btn-primary" href="game.html?main=${berikut.id}">Level ${berikut.id} <i class="fa-solid fa-arrow-right"></i></a>` : ""}
          </div>
        </div>
      </div>`;
    document.getElementById("btnUlang").addEventListener("click", () => { suara.klik(); mainkan(id); });

    suara.selesai();
    if (hasil.skor >= 70) tebarKonfeti();
    guru(
      hasil.skor >= 80 ? `Luar biasa, ${namaPanggilan}! Skormu ${hasil.skor}! 🎉` :
      hasil.skor >= 60 ? `Bagus, ${namaPanggilan}! Skormu ${hasil.skor}. Main lagi biar dapat 3 bintang!` :
      `Skormu ${hasil.skor}. Gak apa-apa, coba lagi ya! Kamu pasti bisa! 💪`
    );

    simpanSkor(g, hasil);
  }

  /* ========================================================================
     9) SIMPAN SKOR — ke browser + Google Sheet (tab "Game DD-MM-YYYY")
     ======================================================================== */
  async function simpanSkor(g, hasil) {
    simpanSkorGameLokal(user.nama, g.id, g.judul, hasil.skor);

    const elStatus = document.getElementById("statusKirim");
    if (!GOOGLE_SHEET_URL) {
      elStatus.textContent = "Skor tersimpan di perangkat ini.";
      return;
    }
    elStatus.textContent = "Menyimpan skor...";
    // gagal -> otomatis masuk antrean & dikirim ulang nanti (lihat js/sheet.js)
    const kirim = await kirimData({
      aksi: "game",
      nama: user.nama,
      pin: user.pin,
      gameId: g.id,
      game: g.judul,
      skor: hasil.skor,
      benar: `${hasil.benar} dari ${hasil.dari}`, // bukan "8/10": Sheets bakal ngira itu tanggal
    });
    const pesan = pesanKirim(kirim, "Skor");
    elStatus.textContent = pesan.teks;
    elStatus.className = `status-kirim ${pesan.kelas}`;
  }

  /* ========================================================================
     10) MULAI — baca alamat (?main=1/2/3), tampilkan menu / pembuka
     ======================================================================== */
  function mulai() {
    gantiPose("senyum");
    const id = Number(new URLSearchParams(location.search).get("main"));
    if (DATA_GAME[id] && mesin[id]) renderPembuka(id);
    else renderMenu();
  }

  // peringatan kalau nutup/pindah halaman di tengah game
  window.addEventListener("beforeunload", (e) => {
    if (sedangMain) e.preventDefault();
  });

  return {
    mulai,
    /** dipanggil file game-xxx.js: Game.daftar(1, { main(api) { ... } }) */
    daftar(id, aturan) { mesin[id] = aturan; },
    saatKeluar: null,
    get sedangMain() { return sedangMain; },
    set sedangMain(v) { sedangMain = v; },
  };
})();
