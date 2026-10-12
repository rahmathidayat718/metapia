/* ==========================================================================
   METAPIA — game3d/mesin3d.js
   Alat bantu 3D yang DIPAKAI BARENG 3 game 3D (Three.js dari CDN, lihat
   importmap di game.html):
   - buatDunia()   : renderer + scene + kamera + loop animasi + resize + jeda
   - buatLabel()   : tulisan tajam di objek 3D (CanvasTexture)
   - Partikel      : ledakan konfeti 3D
   - Musik         : musik latar sederhana dibuat dari kode (Web Audio)
   - grafisRingan(): cek/atur mode grafis "Ringan" (buat HP murah)
   ========================================================================== */
import * as THREE from "three";

export { THREE };

/* ==========================================================================
   MODE GRAFIS
   "ringan" = resolusi rendah, tanpa antialias & bayangan, objek lebih sedikit.
   Otomatis "ringan" di perangkat yang kelihatannya lemah; bisa diganti siswa
   dari layar pembuka (disimpan di localStorage "metapia_grafis").
   ========================================================================== */
export function grafisRingan() {
  const simpan = localStorage.getItem("metapia_grafis");
  if (simpan) return simpan === "ringan";
  const inti = navigator.hardwareConcurrency || 4;
  const memori = navigator.deviceMemory || 4;
  return inti <= 4 || memori <= 3;
}

/* ==========================================================================
   DUNIA 3D
   ========================================================================== */
/**
 * Bikin dunia 3D di dalam elemen `wadah`.
 * opsi.update(dt, t)  : dipanggil tiap frame (dt = detik sejak frame lalu)
 * opsi.warnaLangit    : warna background scene
 * opsi.fov            : sudut pandang kamera (otomatis dilebarin di layar tegak)
 */
export function buatDunia(wadah, opsi = {}) {
  const ringan = grafisRingan();
  const renderer = new THREE.WebGLRenderer({ antialias: !ringan, powerPreference: "low-power" });
  const rasioMaks = ringan ? 1 : 1.5;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, rasioMaks));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = "g3d-canvas";
  wadah.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(opsi.warnaLangit ?? 0xbfe7f7);
  const kamera = new THREE.PerspectiveCamera(opsi.fov ?? 55, 1, 0.1, 400);

  // cahaya: matahari + cahaya langit (tanpa bayangan biar ringan)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7fc0, 1.6));
  const matahari = new THREE.DirectionalLight(0xffffff, 1.4);
  matahari.position.set(5, 10, 6);
  scene.add(matahari);

  const dunia = {
    THREE, scene, kamera, renderer, ringan,
    lebar: 1, tinggi: 1,
    jeda: false,
    goyang: 0, // getaran kamera (berkurang sendiri)
    kameraDasar: new THREE.Vector3(),
    tujuanKamera: new THREE.Vector3(),
    update: opsi.update || (() => {}),
    saatResize: opsi.saatResize || (() => {}),
    hancur: false,
  };

  function resize() {
    const w = Math.max(wadah.clientWidth, 1);
    const h = Math.max(wadah.clientHeight, 1);
    dunia.lebar = w; dunia.tinggi = h;
    renderer.setSize(w, h, false);
    kamera.aspect = w / h;
    // layar tegak (HP): sudut pandang dilebarin biar sisi kiri-kanan tetap kelihatan
    const fovDasar = opsi.fov ?? 55;
    kamera.fov = kamera.aspect < 1 ? Math.min(fovDasar / Math.max(kamera.aspect, 0.5) * 0.85, 95) : fovDasar;
    kamera.updateProjectionMatrix();
    // saatResize baru dipanggil setelah game selesai nyiapin variabelnya
    if (dunia.siapResize) dunia.saatResize(w, h);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(wadah);
  resize();
  queueMicrotask(() => { dunia.siapResize = true; resize(); });

  // loop animasi (dt dibatasi biar gak "loncat" habis tab ditinggal)
  const jam = new THREE.Clock();
  let t = 0;
  let fpsHitung = 0, fpsWaktu = 0, sudahTurun = false;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(jam.getDelta(), 1 / 20);
    if (!dunia.jeda) {
      t += dt;
      dunia.update(dt, t);
    }
    // getaran kamera
    kamera.position.copy(dunia.kameraDasar);
    if (dunia.goyang > 0) {
      dunia.goyang = Math.max(0, dunia.goyang - dt * 2.5);
      const g = dunia.goyang * 0.35;
      kamera.position.x += (Math.random() - 0.5) * g;
      kamera.position.y += (Math.random() - 0.5) * g;
    }
    kamera.lookAt(dunia.tujuanKamera);
    renderer.render(scene, kamera);

    // HP lambat (< 28 fps selama 3 detik) -> resolusi diturunin otomatis
    fpsHitung++; fpsWaktu += dt;
    if (fpsWaktu > 3) {
      if (!sudahTurun && fpsHitung / fpsWaktu < 28 && renderer.getPixelRatio() > 0.75) {
        renderer.setPixelRatio(Math.max(0.75, renderer.getPixelRatio() - 0.5));
        resize();
        sudahTurun = true;
      }
      fpsHitung = 0; fpsWaktu = 0;
    }
  });

  // tab disembunyikan -> otomatis jeda
  function saatSembunyi() {
    if (document.hidden && typeof dunia.saatSembunyi === "function") dunia.saatSembunyi();
  }
  document.addEventListener("visibilitychange", saatSembunyi);

  dunia.getar = (kuat = 1) => { dunia.goyang = Math.max(dunia.goyang, kuat); };
  dunia.hapus = () => {
    if (dunia.hancur) return;
    dunia.hancur = true;
    renderer.setAnimationLoop(null);
    ro.disconnect();
    document.removeEventListener("visibilitychange", saatSembunyi);
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
    });
    renderer.dispose();
    renderer.domElement.remove();
  };
  /** posisi layar (px, relatif wadah) -> ray dari kamera */
  dunia.ray = (x, y) => {
    const r = new THREE.Raycaster();
    r.setFromCamera(new THREE.Vector2((x / dunia.lebar) * 2 - 1, -(y / dunia.tinggi) * 2 + 1), kamera);
    return r;
  };
  /** titik 3D -> posisi layar (px, relatif wadah) */
  dunia.keLayar = (v) => {
    const p = v.clone().project(kamera);
    return { x: (p.x + 1) / 2 * dunia.lebar, y: (1 - p.y) / 2 * dunia.tinggi, depan: p.z < 1 };
  };
  return dunia;
}

/* ==========================================================================
   LABEL TULISAN (CanvasTexture)
   ========================================================================== */
const FONT = "'Baloo 2', 'Nunito', system-ui, sans-serif";

/**
 * Bikin texture berisi tulisan (otomatis turun baris & dikecilin biar muat).
 * opsi: lebar, tinggi (px canvas), warna, latar (null = transparan),
 *       garis (warna tepi), ukuran (px font maksimal), tebal, radius
 */
export function buatTeksturTeks(teks, opsi = {}) {
  const L = opsi.lebar ?? 512, T = opsi.tinggi ?? 256;
  const c = document.createElement("canvas");
  c.width = L; c.height = T;
  const g = c.getContext("2d");
  if (opsi.latar) {
    const r = opsi.radius ?? 40;
    g.fillStyle = opsi.latar;
    g.beginPath();
    g.roundRect(6, 6, L - 12, T - 12, r);
    g.fill();
    if (opsi.garis) { g.lineWidth = 10; g.strokeStyle = opsi.garis; g.stroke(); }
  }
  g.fillStyle = opsi.warna ?? "#2C2450";
  g.textAlign = "center";
  g.textBaseline = "middle";
  let ukuran = opsi.ukuran ?? 96;
  const tebal = opsi.tebal ?? 800;
  const pad = opsi.pad ?? 36;
  let baris;
  // kecilin font sampai semua baris muat
  for (; ukuran > 18; ukuran -= 4) {
    g.font = `${tebal} ${ukuran}px ${FONT}`;
    baris = [];
    let kini = "";
    for (const kata of String(teks).split(/\s+/)) {
      const coba = kini ? `${kini} ${kata}` : kata;
      if (g.measureText(coba).width > L - pad * 2 && kini) { baris.push(kini); kini = kata; }
      else kini = coba;
    }
    baris.push(kini);
    const lebarMaks = Math.max(...baris.map((b) => g.measureText(b).width));
    if (baris.length * ukuran * 1.12 <= T - pad * 1.2 && lebarMaks <= L - pad * 2) break;
  }
  const tinggiTeks = baris.length * ukuran * 1.12;
  baris.forEach((b, i) => {
    const y = T / 2 - tinggiTeks / 2 + ukuran * 1.12 * (i + 0.5);
    if (opsi.tepiTeks) { g.lineWidth = ukuran * 0.16; g.strokeStyle = opsi.tepiTeks; g.lineJoin = "round"; g.strokeText(b, L / 2, y); }
    g.fillText(b, L / 2, y);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** papan datar berisi tulisan (selalu ngadep kamera kalau `billboard`) */
export function buatLabel(teks, opsi = {}) {
  const lebarDunia = opsi.lebarDunia ?? 2;
  const L = opsi.lebar ?? 512, T = opsi.tinggi ?? 256;
  const tex = buatTeksturTeks(teks, opsi);
  const mat = opsi.billboard
    ? new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
    : new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const obj = opsi.billboard
    ? new THREE.Sprite(mat)
    : new THREE.Mesh(new THREE.PlaneGeometry(lebarDunia, lebarDunia * T / L), mat);
  if (opsi.billboard) obj.scale.set(lebarDunia, lebarDunia * T / L, 1);
  obj.renderOrder = 5;
  return obj;
}

/* ==========================================================================
   PARTIKEL (ledakan konfeti 3D)
   ========================================================================== */
const WARNA_KONFETI = [0xffc93c, 0xff7aae, 0x4fc3f7, 0x3fddb0, 0x8a6bff, 0xffffff];

export class Partikel {
  constructor(scene, ringan) {
    this.scene = scene;
    this.maks = ringan ? 70 : 160;
    this.geo = new THREE.BoxGeometry(0.16, 0.16, 0.05);
    this.daftar = [];
  }
  /** ledakan di posisi `pos` */
  ledak(pos, { jumlah = 40, warna = null, kuat = 6 } = {}) {
    jumlah = Math.min(jumlah, this.maks - this.daftar.length);
    for (let i = 0; i < jumlah; i++) {
      const m = new THREE.Mesh(this.geo, new THREE.MeshBasicMaterial({
        color: warna ?? WARNA_KONFETI[i % WARNA_KONFETI.length], transparent: true,
      }));
      m.position.copy(pos);
      const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI - Math.PI / 2;
      m.userData = {
        v: new THREE.Vector3(Math.cos(a) * Math.cos(b), Math.abs(Math.sin(b)) + 0.4, Math.sin(a) * Math.cos(b)).multiplyScalar(kuat * (0.5 + Math.random())),
        putar: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8),
        umur: 1.2 + Math.random() * 0.6,
      };
      this.scene.add(m);
      this.daftar.push(m);
    }
  }
  update(dt) {
    for (let i = this.daftar.length - 1; i >= 0; i--) {
      const m = this.daftar[i], d = m.userData;
      d.v.y -= 9 * dt;
      m.position.addScaledVector(d.v, dt);
      m.rotation.x += d.putar.x * dt; m.rotation.y += d.putar.y * dt;
      d.umur -= dt;
      m.material.opacity = Math.min(1, d.umur * 2);
      if (d.umur <= 0) { this.scene.remove(m); m.material.dispose(); this.daftar.splice(i, 1); }
    }
  }
}

/* ==========================================================================
   MUSIK LATAR (Web Audio, gak butuh file). Ikut tombol 🔊 di HUD.
   ========================================================================== */
export class Musik {
  /** pola = deretan nada (Hz, 0 = diam), tempo = ketukan per menit */
  constructor(nyalaFn, { pola, bass, tempo = 120, volume = 0.035 } = {}) {
    this.nyala = nyalaFn;
    this.pola = pola || [523, 659, 784, 659, 587, 698, 880, 698];
    this.bass = bass || [131, 131, 175, 175];
    this.ketuk = 60 / tempo / 2;
    this.volume = volume;
    this.jalan = false;
    this.i = 0;
  }
  mulai() {
    if (this.jalan) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = this.ctx || new AC();
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.jalan = true;
    this.berikut = this.ctx.currentTime + 0.05;
    this.timer = setInterval(() => this.jadwal(), 60);
  }
  jadwal() {
    if (!this.jalan) return;
    while (this.berikut < this.ctx.currentTime + 0.2) {
      if (this.nyala()) {
        const f = this.pola[this.i % this.pola.length];
        if (f) this.nada(f, this.berikut, this.ketuk * 0.9, this.volume, "triangle");
        if (this.i % 2 === 0) this.nada(this.bass[(this.i / 2) % this.bass.length | 0], this.berikut, this.ketuk * 1.8, this.volume * 1.2, "sine");
      }
      this.berikut += this.ketuk;
      this.i++;
    }
  }
  nada(f, t, dur, vol, tipe) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = tipe; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  /** efek suara pendek (pakai context yang sama) */
  efek(f1, f2, dur = 0.2, vol = 0.08, tipe = "square") {
    if (!this.nyala() || !this.ctx) return;
    const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = tipe;
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t); o.stop(t + dur);
  }
  berhenti() {
    this.jalan = false;
    clearInterval(this.timer);
  }
}

/* ==========================================================================
   ALAT BANTU KECIL
   ========================================================================== */
export const lerp = (a, b, t) => a + (b - a) * t;
export const acakAntara = (a, b) => a + Math.random() * (b - a);

/** material warna polos "low-poly" (flat shading) */
export function warna(hex, opsi = {}) {
  return new THREE.MeshLambertMaterial({ color: hex, flatShading: true, ...opsi });
}
