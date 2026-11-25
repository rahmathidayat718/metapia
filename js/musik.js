/* ==========================================================================
   METAPIA — musik.js
   MUSIK LATAR dibuat dari kode (Web Audio API) -> gak butuh file mp3,
   ringan, & tetap jalan offline. Dipakai Kuis, Game 2D, dan Game 3D.

   Tiap halaman/game punya LAGU SENDIRI (lihat LAGU_METAPIA di bawah):
     kuis    : santai & tenang (lo-fi) biar siswa tetap fokus mikir
     balon   : Game 1 — ceria & memantul
     pabrik  : Game 2 — groove mesin (kunci minor, bass "dug-dug")
     pesawat : Game 3 — luar angkasa (arpeggio berkelip, pad panjang)

   Cara pakai:
     const m = new MusikLatar("kuis", { nyala: () => suaraNyala });
     m.mulai();      // panggil SETELAH siswa menekan tombol (aturan browser)
     m.berhenti();
   Kalau suara dimatikan (nyala() = false), musik diam sendiri. Musik juga
   berhenti otomatis waktu tab/aplikasi ditinggal, lalu lanjut lagi.

   Format lagu (1 bar = 8 langkah, 1 langkah = 1/8 ketukan):
     melodi : "C5 . E5 -" -> nada, "." = diam, "-" = nada sebelumnya ditahan
     akor   : satu akor per bar (nada terendah = akar untuk bass)
     bass   : pola 8 langkah, angka = naik berapa semitone dari akar, "." = diam
     drum   : kick/snare/hat, pola 8 langkah "x" = bunyi
   ========================================================================== */
(function () {
  const NAMA_NADA = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };
  /** "A4" -> 440 Hz */
  function frek(nama) {
    const m = /^([A-G][#b]?)(\d)$/.exec(nama);
    if (!m) return 0;
    const midi = (Number(m[2]) + 1) * 12 + NAMA_NADA[m[1]];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  const LAGU_METAPIA = {
    /* KUIS — santai, pelan, gak ramai (F mayor) */
    kuis: {
      tempo: 84, volume: 0.05,
      melodiTipe: "sine", melodiVol: 0.9, gate: 0.95,
      akor: ["F3 A3 C4", "D3 F3 A3", "Bb2 D3 F3", "C3 E3 G3", "F3 A3 C4", "A2 C3 E3", "Bb2 D3 F3", "C3 E3 G3"],
      melodi: [
        "C5 - A4 - . . F4 G4", "A4 - - - . . D5 C5", "D5 - F4 - . G4 A4 Bb4", "G4 - - - . . . .",
        "C5 - A4 C5 F5 - E5 D5", "C5 - - - E4 - A4 -", "Bb4 - A4 G4 F4 - G4 A4", "G4 - - - - - . .",
      ],
      pad: 0.35, padTipe: "triangle",
      bass: "0 . . . 7 . . .", bassVol: 0.9,
      drum: { kick: "x . . . . x . .", hat: ". . x . . . x .", snare: "" }, drumVol: 0.45,
    },

    /* GAME 1 — PECAH BALON: ceria, memantul (C mayor, cepat) */
    balon: {
      tempo: 132, volume: 0.065,
      melodiTipe: "triangle", melodiVol: 1, gate: 0.5,
      akor: ["C4 E4 G4", "A3 C4 E4", "F3 A3 C4", "G3 B3 D4", "C4 E4 G4", "A3 C4 E4", "F3 A3 C4", "G3 B3 D4"],
      melodi: [
        "E5 . G5 . C6 . G5 .", "A5 . G5 E5 C5 . E5 .", "F5 . A5 . C6 . A5 F5", "G5 . D5 . B4 . G4 .",
        "C5 E5 G5 E5 C6 . B5 .", "A5 . E5 . A5 G5 E5 .", "F5 . F5 A5 G5 . E5 D5", "D5 . B4 . G4 . . .",
      ],
      pad: 0, bass: "0 . 12 . 0 . 12 .", bassVol: 0.8,
      drum: { kick: "x . . . x . . .", snare: ". . x . . . x .", hat: ". x . x . x . x", pop: true }, drumVol: 0.7,
    },

    /* GAME 2 — PABRIK SORTIR: groove mesin (A minor) */
    pabrik: {
      tempo: 116, volume: 0.05,
      melodiTipe: "square", melodiVol: 0.55, gate: 0.6,
      akor: ["A2 C3 E3", "G2 B2 D3", "F2 A2 C3", "E2 G#2 B2", "A2 C3 E3", "G2 B2 D3", "F2 A2 C3", "E2 G#2 B2"],
      melodi: [
        "A4 . C5 . E5 . C5 .", "B4 . D5 . G5 . D5 .", "C5 . F5 . A5 . F5 .", "G#5 . E5 . B4 . G#4 .",
        "E5 E5 . A5 . G5 E5 .", "D5 D5 . G5 . F5 D5 .", "C5 C5 . F5 . E5 C5 .", "B4 . G#4 . E4 . . .",
      ],
      pad: 0, bass: "0 . 0 12 . 0 12 0", bassVol: 1.1, bassTipe: "square",
      drum: { kick: "x . . . x . . .", snare: ". . x . . . x .", hat: "x x x x x x x x", logam: true }, drumVol: 0.75,
    },

    /* GAME 3 — PESAWAT: luar angkasa, berkelip (D minor, pelan & luas) */
    pesawat: {
      tempo: 96, volume: 0.06,
      melodiTipe: "triangle", melodiVol: 0.8, gate: 0.95,
      akor: ["D3 F3 A3", "Bb2 D3 F3", "F2 A2 C3", "C3 E3 G3", "D3 F3 A3", "Bb2 D3 F3", "G2 Bb2 D3", "A2 C#3 E3"],
      melodi: [
        "D5 - - - F5 - A5 -", "Bb5 - - - A5 - F5 -", "A5 - - - G5 - F5 -", "E5 - - - - - . .",
        "F5 - E5 - D5 - A4 -", "D5 - - - F5 - Bb5 -", "A5 - G5 - F5 - D5 -", "C#5 - - - E5 - - -",
      ],
      pad: 0.45, padTipe: "sine", arp: true,
      bass: "0 . . . . . . .", bassVol: 1.2, bassTipe: "sawtooth",
      drum: { kick: "x . . . . . . .", hat: ". . . . x . . .", snare: "" }, drumVol: 0.5,
    },
  };

  /** "x . . x" -> [true,false,false,true] */
  const pola = (s) => (s || "").split(/\s+/).filter(Boolean).map((t) => t === "x");

  class MusikLatar {
    /**
     * @param {string} nama   kunci di LAGU_METAPIA
     * @param {object} opsi   nyala: () => boolean (ikut tombol suara)
     *                        ctx/tujuan: pakai AudioContext & node keluaran yang sudah ada
     */
    constructor(nama, { nyala = () => true, ctx = null, tujuan = null } = {}) {
      this.lagu = LAGU_METAPIA[nama] || LAGU_METAPIA.kuis;
      this.nyala = nyala;
      this.ctx = ctx;
      this.tujuan = tujuan;
      this.jalan = false;
      this.i = 0;
      const L = this.lagu;
      this.langkah = 60 / L.tempo / 2; // 1 langkah = 1/8 ketukan
      // pecah melodi jadi daftar langkah: { f, panjang } / null
      this.melodi = [];
      L.melodi.join(" ").split(/\s+/).forEach((t) => {
        if (t === "-") { const akhir = [...this.melodi].reverse().find((x) => x); if (akhir) akhir.panjang++; this.melodi.push(null); }
        else this.melodi.push(t === "." ? null : { f: frek(t), panjang: 1 });
      });
      this.akor = L.akor.map((a) => a.split(" ").map(frek));
      this.bass = (L.bass || "").split(/\s+/).map((t) => (t === "." ? null : Number(t)));
      this.drum = { kick: pola(L.drum?.kick), snare: pola(L.drum?.snare), hat: pola(L.drum?.hat) };
      this._saatSembunyi = () => {
        if (!this.jalan) return;
        if (document.hidden) { clearInterval(this.timer); this.timer = null; }
        else if (!this.timer) { this.berikut = this.ctx.currentTime + 0.05; this.timer = setInterval(() => this.jadwal(), 60); }
      };
    }

    siapkanCtx() {
      if (this.ctx) return true;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      const kompresor = this.ctx.createDynamicsCompressor();
      kompresor.threshold.value = -14;
      kompresor.ratio.value = 4;
      this.tujuan = this.ctx.createGain();
      this.tujuan.gain.value = 1.4;
      this.tujuan.connect(kompresor).connect(this.ctx.destination);
      return true;
    }

    mulai() {
      if (this.jalan || !this.siapkanCtx()) return;
      if (!this.utama) {
        this.utama = this.ctx.createGain(); // volume lagu + fade in/out
        this.utama.connect(this.tujuan);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      const t = this.ctx.currentTime;
      this.utama.gain.cancelScheduledValues(t);
      this.utama.gain.setValueAtTime(0.0001, t);
      this.utama.gain.exponentialRampToValueAtTime(this.lagu.volume, t + 1.2); // masuk pelan
      this.jalan = true;
      this.berikut = t + 0.05;
      this.timer = setInterval(() => this.jadwal(), 60);
      document.addEventListener("visibilitychange", this._saatSembunyi);
    }

    berhenti() {
      if (!this.jalan) return;
      this.jalan = false;
      clearInterval(this.timer);
      this.timer = null;
      document.removeEventListener("visibilitychange", this._saatSembunyi);
      if (this.ctx && this.utama) {
        const t = this.ctx.currentTime;
        this.utama.gain.cancelScheduledValues(t);
        this.utama.gain.setValueAtTime(Math.max(this.utama.gain.value, 0.0001), t);
        this.utama.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); // keluar pelan
      }
    }

    jadwal() {
      if (!this.jalan) return;
      while (this.berikut < this.ctx.currentTime + 0.25) {
        if (this.nyala()) this.mainkanLangkah(this.i, this.berikut);
        this.berikut += this.langkah;
        this.i++;
      }
    }

    mainkanLangkah(i, t) {
      const L = this.lagu, d = this.langkah;
      const n = this.melodi.length;
      const k = i % 8; // posisi di dalam bar
      const bar = Math.floor((i % n) / 8) % this.akor.length;
      const akor = this.akor[bar];

      // melodi
      const m = this.melodi[i % n];
      if (m && m.f) this.nada(m.f, t, d * m.panjang * L.gate, L.melodiVol, L.melodiTipe, 0.012);

      // pad akor (awal bar, tahan 1 bar)
      if (L.pad && k === 0) akor.forEach((f) => this.nada(f * 2, t, d * 8, L.pad / akor.length, L.padTipe || "triangle", 0.3));

      // arpeggio berkelip (naik-turun nada akor, 2 oktaf di atas)
      if (L.arp) {
        const urut = [0, 1, 2, 1];
        this.nada(akor[urut[k % 4]] * 4, t, d * 0.8, 0.22, "sine", 0.005);
      }

      // bass
      const b = this.bass[k];
      if (b !== null && b !== undefined && !Number.isNaN(b)) {
        this.nada((akor[0] / 2) * Math.pow(2, b / 12), t, d * 1.6, 0.9 * (L.bassVol || 1), L.bassTipe || "sine", 0.01);
      }

      // drum
      const v = L.drumVol || 0.5;
      if (this.drum.kick[k]) this.kick(t, v);
      if (this.drum.snare[k]) this.derau(t, 0.12, 1800, "bandpass", v * 0.5);
      if (this.drum.hat[k]) this.derau(t, L.drum.logam ? 0.03 : 0.05, 7000, "highpass", v * (L.drum.logam ? 0.35 : 0.25));
      if (L.drum.pop && k === 4) this.nada(1400, t, 0.05, 0.25 * v, "sine", 0.002);
    }

    /** satu nada dengan sedikit "serangan" & lepas biar halus */
    nada(f, t, dur, vol, tipe, serang = 0.01) {
      if (!f) return;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = tipe; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), t + serang);
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, serang + 0.02));
      o.connect(g).connect(this.utama);
      o.start(t); o.stop(t + dur + 0.05);
    }
    kick(t, vol) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      g.gain.setValueAtTime(vol * 1.6, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(g).connect(this.utama);
      o.start(t); o.stop(t + 0.22);
    }
    derau(t, dur, frekSaring, jenis, vol) {
      if (!this.bufDerau) {
        const len = Math.floor(this.ctx.sampleRate * 0.2);
        this.bufDerau = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.bufDerau.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      const s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
      s.buffer = this.bufDerau;
      f.type = jenis; f.frequency.value = frekSaring;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f).connect(g).connect(this.utama);
      s.start(t); s.stop(t + dur + 0.02);
    }
  }

  window.MusikLatar = MusikLatar;
  window.LAGU_METAPIA = LAGU_METAPIA;
})();
