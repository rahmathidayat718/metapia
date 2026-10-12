/* ==========================================================================
   METAPIA — game3d/pabrik-sortir.js
   GAME 2 versi 3D: "PABRIK SORTIR MAJAS" (pengganti Keranjang Majas)
   -------------------------------------------------------------------------
   Kotak berisi kalimat datang lewat ban berjalan (dari kiri bawah ke tengah).
   Di depan ada 3 tong: Metafora / Personifikasi / Hiperbola.
   Cara main:
   - TARIK kotak lalu lempar ke atas ke arah tong (lintasan melengkung +
     mantul), ATAU ketuk tongnya langsung (kotak otomatis dilempar ke situ).
   - Benar  : tong bersinar, +20 (percobaan 1) / +10 (percobaan 2)
   - Salah  : kotak terpental keluar, nyawa -1, petunjuk. Salah ke-2 ->
              tong yang benar ditunjukkan, 0 poin
   - Waktu  : 30 detik per kotak (sama kayak versi 2D). Habis = 0 poin.
   - Ban berjalan makin cepat tiap soal (kecepatan3d di game-data.js).
   Skor resmi sama persis dengan versi 2D (maks 100). Combo = Poin Bonus.
   ========================================================================== */
import { THREE, Partikel, warna, buatLabel, buatTeksturTeks, lerp } from "./mesin3d.js";
import { siapkanGame, esc } from "./ui3d.js";

const WARNA_TONG = { kuning: 0xffc93c, biru: 0x4fc3f7, pink: 0xff7aae };
const TONG_X = [-3.4, 0, 3.4];
const TONG_Z = -4.2;
const TONG_TINGGI = 1.6;
const TONG_R = 1.25;
const TITIK_AMBIL = new THREE.Vector3(0, 1.25, 3.2); // ujung ban berjalan
const AWAL_BAN = -7.5;                                // x awal kotak di ban (kelihatan di layar)
const GRAVITASI = 22;

export default {
  main(api) {
    const data = api.data;
    const soal = data.soal;
    const DETIK = data.detikPerSoal || 30;
    const kecepatanBan = data.kecepatan3d || [2.2, 2.8, 3.4, 4.0, 4.6];

    const g = siapkanGame(api,
      { warnaLangit: 0xcfe6ff, fov: 52, update, saatResize: aturKamera },
      { tempo: 116, pola: [523, 0, 659, 784, 0, 659, 587, 0], bass: [131, 131, 98, 110] });
    const { dunia } = g;
    const { scene } = dunia;
    const ringan = dunia.ringan;
    // layar tegak (HP): kamera lebih tinggi & mundur, pemandangan digeser turun
    // biar tong gak ketutup papan soal
    function aturKamera(w, h) {
      if (w / h < 1) { dunia.kameraDasar.set(0, 9.5, 12.5); dunia.tujuanKamera.set(0, 3.2, -1.5); }
      else { dunia.kameraDasar.set(0, 6.4, 9.6); dunia.tujuanKamera.set(0, 0.8, -1.8); }
    }
    aturKamera(dunia.lebar, dunia.tinggi);

    /* ================================================================
       PABRIK: lantai, dinding, ban berjalan, tong
       ================================================================ */
    const lantai = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), warna(0xe9e2ff));
    lantai.rotation.x = -Math.PI / 2;
    scene.add(lantai);
    // ubin lantai
    if (!ringan) {
      const geoUbin = new THREE.PlaneGeometry(1.9, 1.9);
      const matUbin = warna(0xdcd2fb);
      for (let x = -14; x <= 14; x += 4) for (let z = -14; z <= 8; z += 4) {
        const u = new THREE.Mesh(geoUbin, matUbin);
        u.rotation.x = -Math.PI / 2; u.position.set(x, 0.005, z);
        scene.add(u);
      }
    }
    const dinding = new THREE.Mesh(new THREE.BoxGeometry(60, 12, 0.5), warna(0xb7a3f2));
    dinding.position.set(0, 6, -11);
    scene.add(dinding);
    // jendela & lampu dekorasi di dinding
    for (let i = -2; i <= 2; i++) {
      const j = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 0.1), warna(0xfff7dd));
      j.position.set(i * 5.5, 6.5, -10.7);
      scene.add(j);
    }
    // papan nama pabrik
    const namaPabrik = buatLabel("🏭 PABRIK SORTIR MAJAS", { lebarDunia: 9, lebar: 1024, tinggi: 160, latar: "#FFC93C", garis: "#2C2450", ukuran: 90 });
    namaPabrik.position.set(0, 9, -10.6);
    scene.add(namaPabrik);
    // roda gigi berputar (hiasan)
    const gigi = [];
    [[-8.5, 3.5], [8.5, 4.5]].forEach(([x, y], i) => {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.4, 10), warna(i ? 0xff7aae : 0x4fc3f7));
      r.rotation.x = Math.PI / 2; r.position.set(x, y, -10.5);
      scene.add(r); gigi.push(r);
    });

    // ban berjalan: dari kiri belakang ke titik ambil
    const ban = new THREE.Group();
    const panjangBan = TITIK_AMBIL.x - AWAL_BAN + 1.4;
    const rangka = new THREE.Mesh(new THREE.BoxGeometry(panjangBan, 0.9, 1.9), warna(0x6b6488));
    rangka.position.y = 0.45;
    ban.add(rangka);
    const matSabuk = new THREE.MeshLambertMaterial({ map: teksturSabuk() });
    const sabuk = new THREE.Mesh(new THREE.PlaneGeometry(panjangBan, 1.7), matSabuk);
    sabuk.rotation.x = -Math.PI / 2; sabuk.position.y = 0.91;
    ban.add(sabuk);
    // penahan di ujung ban
    const penahan = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 1.9), warna(0xff7aae));
    penahan.position.set(panjangBan / 2, 1.1, 0);
    ban.add(penahan);
    ban.position.set((AWAL_BAN + TITIK_AMBIL.x + 1.4) / 2 - 0.7, 0, TITIK_AMBIL.z);
    scene.add(ban);
    function teksturSabuk() {
      const c = document.createElement("canvas"); c.width = 128; c.height = 32;
      const x = c.getContext("2d");
      x.fillStyle = "#4a4466"; x.fillRect(0, 0, 128, 32);
      x.fillStyle = "#6f6893";
      for (let i = 0; i < 128; i += 16) x.fillRect(i, 0, 6, 32);
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(panjangBan / 1.2, 1);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }

    // tong
    const tong = JENIS_MAJAS.map((m, i) => {
      const gaya = GAYA_MAJAS[m];
      const grup = new THREE.Group();
      const c = WARNA_TONG[gaya.warna];
      const badan = new THREE.Mesh(new THREE.CylinderGeometry(TONG_R, TONG_R * 0.85, TONG_TINGGI, 12, 1, true), warna(c, { side: THREE.DoubleSide }));
      badan.position.y = TONG_TINGGI / 2;
      const dasar = new THREE.Mesh(new THREE.CircleGeometry(TONG_R * 0.85, 12), warna(0x2c2450));
      dasar.rotation.x = -Math.PI / 2; dasar.position.y = 0.02;
      const bibir = new THREE.Mesh(new THREE.TorusGeometry(TONG_R, 0.1, 6, 16), warna(0x2c2450));
      bibir.rotation.x = Math.PI / 2; bibir.position.y = TONG_TINGGI;
      const sinar = new THREE.Mesh(new THREE.CylinderGeometry(TONG_R * 0.9, TONG_R * 0.9, 4, 16, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      sinar.position.y = TONG_TINGGI + 2;
      const label = buatLabel(`${gaya.ikon} ${m}`, { lebarDunia: 3.3, lebar: 640, tinggi: 170, latar: "#ffffff", garis: "#2C2450", ukuran: 92 });
      label.position.set(0, TONG_TINGGI + 0.85, 0.3);
      label.rotation.x = -0.25;
      grup.add(badan, dasar, bibir, sinar, label);
      grup.position.set(TONG_X[i], 0, TONG_Z);
      scene.add(grup);
      return { grup, badan, sinar, majas: m, warnaAsli: c, kedip: 0, kedipWarna: 0xffffff, goyang: 0 };
    });

    /* ================================================================
       KOTAK KALIMAT
       ================================================================ */
    const matSisi = warna(0xd9a066);
    const matTutup = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const kotak = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.0, 1.35), [matSisi, matSisi, matTutup, matSisi, matSisi, matSisi]);
    scene.add(kotak);
    const sorotKotak = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.2, 24), new THREE.MeshBasicMaterial({ color: 0xffc93c, transparent: true, opacity: 0, depthWrite: false }));
    sorotKotak.rotation.x = -Math.PI / 2;
    scene.add(sorotKotak);
    const partikel = new Partikel(scene, ringan);

    /* ================================================================
       STATE
       ================================================================ */
    let idx = 0;
    let percobaan = 0;
    let jumlahBenar = 0;
    const rekap = [];
    let keadaan = "ban";       // "ban" | "siap" | "pegang" | "terbang" | "mantul" | "kunci"
    let v = new THREE.Vector3(); // kecepatan kotak
    let sisa = DETIK;
    let akumDetik = 0;
    let terkunci = false;
    let tujuanOtomatis = -1;    // index tong kalau dilempar otomatis

    function mulaiSoal() {
      const s = soal[idx];
      percobaan = 0;
      terkunci = false;
      sisa = DETIK; akumDetik = 0;
      api.soalKe(idx);
      api.hapusPetunjuk();
      api.waktu(sisa, DETIK);
      tong.forEach((t) => { t.kedip = 0; });
      // tutup kotak = tulisan kalimat
      if (matTutup.map) matTutup.map.dispose();
      matTutup.map = buatTeksturTeks(s.kalimat, { lebar: 512, tinggi: 512, latar: "#FFF7DD", garis: "#2C2450", ukuran: 70, radius: 30 });
      matTutup.needsUpdate = true;
      taruhDiBan();
      g.papan(`
        <div class="papan-judul papan-tambahan">📦 Masukkan kotak ini ke tong yang tepat!</div>
        <p class="papan-kutipan">📦 “${esc(s.kalimat)}”</p>`);
      if (idx > 0) g.sorak(`Level ${idx + 1}! Ban makin cepat! ⚡`, "level");
      api.guru(idx === 0
        ? "Kotak kalimat datang! Tarik lalu lempar ke tong yang tepat, atau ketuk tongnya! 📦"
        : api.acak(["Kotak baru datang! Masuk tong mana, ya?", "Ayo, sortir kalimatnya! 🏭", "Cepat tapi teliti, ya! 🧺"]),
        { poseAkhir: "nunjuk" });
    }

    function taruhDiBan() {
      kotak.position.set(AWAL_BAN, 1.4, TITIK_AMBIL.z);
      kotak.rotation.set(0, 0, 0);
      kotak.scale.setScalar(1);
      kotak.visible = true;
      v.set(0, 0, 0);
      keadaan = "ban";
    }

    /* ================================================================
       KONTROL: tarik & lempar, atau ketuk tong
       ================================================================ */
    let jejak = []; // posisi pointer terakhir (buat hitung kecepatan lempar)
    let pointerId = null;
    const bidangPegang = new THREE.Plane(new THREE.Vector3(0, 0, 1), -TITIK_AMBIL.z);
    const titik = new THREE.Vector3();

    function posLokal(e) {
      const r = g.wadah.getBoundingClientRect();
      const sk = r.width / g.wadah.clientWidth || 1; // halaman bisa di-zoom (lihat common.css)
      return { x: (e.clientX - r.left) / sk, y: (e.clientY - r.top) / sk };
    }

    g.dengar(g.wadah, "pointerdown", (e) => {
      if (terkunci || dunia.jeda || e.target.closest("button, .kuis-umpan, .petunjuk, .lapis-jeda")) return;
      const p = posLokal(e);
      const ray = dunia.ray(p.x, p.y);
      // ketuk tong -> lempar otomatis
      const kena = ray.intersectObjects(tong.map((t) => t.grup), true)[0];
      if (kena && (keadaan === "ban" || keadaan === "siap")) {
        const i = tong.findIndex((t) => t.grup === kena.object.parent || t.grup === kena.object);
        if (i >= 0) return lemparKe(i);
      }
      // pegang kotak (boleh ketuk di mana saja dekat kotak)
      if (keadaan === "ban" || keadaan === "siap") {
        const layarKotak = dunia.keLayar(kotak.position);
        const dekat = Math.hypot(layarKotak.x - p.x, layarKotak.y - p.y) < Math.max(110, dunia.lebar * 0.16);
        if (ray.intersectObject(kotak)[0] || dekat) {
          keadaan = "pegang";
          pointerId = e.pointerId;
          jejak = [{ ...p, t: performance.now() }];
          sorotKotak.material.opacity = 0.9;
          api.suara.ambil();
        }
      }
    });
    g.dengar(window, "pointermove", (e) => {
      if (keadaan !== "pegang" || e.pointerId !== pointerId) return;
      const p = posLokal(e);
      jejak.push({ ...p, t: performance.now() });
      if (jejak.length > 6) jejak.shift();
      // kotak ngikut jari (di bidang depan, dibatasi)
      if (dunia.ray(p.x, p.y).ray.intersectPlane(bidangPegang, titik)) {
        kotak.position.x = Math.max(-4.5, Math.min(4.5, titik.x));
        kotak.position.y = Math.max(1.2, Math.min(4.5, titik.y));
      }
    });
    function lepas(e) {
      if (keadaan !== "pegang" || (e && e.pointerId !== pointerId)) return;
      sorotKotak.material.opacity = 0;
      const a = jejak[0], b = jejak[jejak.length - 1];
      const dtMs = Math.max(16, b.t - a.t);
      const vx = (b.x - a.x) / dtMs, vy = (b.y - a.y) / dtMs; // px per ms
      if (vy < -0.25) {
        // lempar! arah ke depan dari kecepatan ke atas, ke samping dari geser kiri/kanan
        const kuat = Math.min(2.2, -vy);
        lempar(new THREE.Vector3(vx * 6.5 * (900 / dunia.lebar), 7 + kuat * 2.2, -(6 + kuat * 3.2)));
      } else {
        // cuma dilepas -> balik ke ujung ban
        keadaan = "siap";
      }
    }
    g.dengar(window, "pointerup", lepas);
    g.dengar(window, "pointercancel", lepas);
    // keyboard: 1/2/3 atau A/S/D = lempar ke tong
    g.dengar(document, "keydown", (e) => {
      const i = { "1": 0, "2": 1, "3": 2, a: 0, s: 1, d: 2 }[e.key.toLowerCase()];
      if (i !== undefined && (keadaan === "ban" || keadaan === "siap") && !terkunci && !dunia.jeda) lemparKe(i);
    });

    /** lempar dengan kecepatan awal tertentu (+ sedikit "bantuan bidik") */
    function lempar(vAwal) {
      keadaan = "terbang";
      tujuanOtomatis = -1;
      v.copy(vAwal);
      // bantuan bidik: kalau mendarat dekat tong, arahkan pas ke tong itu
      const waktuTiba = perkiraanWaktu(kotak.position, v, TONG_Z);
      if (waktuTiba) {
        const xJatuh = kotak.position.x + v.x * waktuTiba;
        const i = TONG_X.reduce((b, x, j) => (Math.abs(x - xJatuh) < Math.abs(TONG_X[b] - xJatuh) ? j : b), 0);
        if (Math.abs(TONG_X[i] - xJatuh) < 1.9) v.x = (TONG_X[i] - kotak.position.x) / waktuTiba;
      }
      g.musik.efek(300, 700, 0.25, 0.05, "triangle");
    }
    /** lempar otomatis tepat ke tong ke-i */
    function lemparKe(i) {
      const dari = kotak.position.clone();
      if (keadaan === "ban") dari.x = Math.max(dari.x, TITIK_AMBIL.x - 2);
      kotak.position.copy(dari);
      const T = 0.9;
      const dz = TONG_Z - dari.z, dx = TONG_X[i] - dari.x, dy = TONG_TINGGI + 0.6 - dari.y;
      v.set(dx / T, (dy + 0.5 * GRAVITASI * T * T) / T, dz / T);
      keadaan = "terbang";
      tujuanOtomatis = i;
      g.musik.efek(300, 700, 0.25, 0.05, "triangle");
    }
    function perkiraanWaktu(p, vel, zTujuan) {
      if (vel.z >= 0) return null;
      return (zTujuan - p.z) / vel.z;
    }

    /* ================================================================
       CEK JAWABAN
       ================================================================ */
    function masukTong(i) {
      const s = soal[idx];
      const t = tong[i];
      percobaan++;
      const pos = t.grup.position.clone(); pos.y = TONG_TINGGI + 0.5;
      const layar = dunia.keLayar(pos);
      t.goyang = 0.5;
      if (t.majas === s.majas) {
        const poin = percobaan === 1 ? 20 : 10;
        terkunci = true;
        kotak.visible = false;
        keadaan = "kunci";
        t.kedip = 1.5; t.kedipWarna = 0x3fddb0;
        partikel.ledak(pos, { jumlah: ringan ? 30 : 60, kuat: 6 });
        g.poin(poin, layar.x, layar.y);
        g.benar();
        api.suara.benar();
        api.guruLompat();
        api.guru(percobaan === 1 ? api.acak([`Masuk! Hebat, ${api.namaPanggilan}! 🎉`, "Tepat sasaran! 🎯", "Yes! Tongnya pas! 🧺"]) : "Nah, itu dia! Sekarang benar! 👏");
        selesaiSoal(percobaan === 1 ? "penuh" : "sebagian", poin, true);
        return;
      }
      // salah: kotak terpental keluar
      t.kedip = 1; t.kedipWarna = 0xff5c5c;
      api.suara.salah();
      g.salah();
      keadaan = "mantul";
      kotak.position.set(t.grup.position.x, TONG_TINGGI + 0.3, TONG_Z);
      v.set((Math.random() < 0.5 ? -1 : 1) * 3, 9, 7);
      if (percobaan === 1) {
        api.guru("Ups, bukan tong itu! Baca petunjuknya, lalu coba lagi! 💡", { poseAkhir: "bicara" });
        api.petunjuk(s.petunjuk);
      } else {
        tunjukkanJawaban("Belum tepat lagi. Lihat, ini tong yang benar! 💡");
      }
    }

    function waktuHabis() {
      if (terkunci) return;
      api.suara.habis();
      g.sorak("Waktu habis! ⏰", "salah");
      g.salah();
      tunjukkanJawaban("Waktunya habis! ⏰ Ini tong yang benar.");
    }

    /** salah 2x / waktu habis: tong benar disorot, kotak dilempar ke sana, 0 poin */
    function tunjukkanJawaban(pesan) {
      const s = soal[idx];
      terkunci = true;
      api.hapusPetunjuk();
      const i = tong.findIndex((t) => t.majas === s.majas);
      tong[i].kedip = 2.5; tong[i].kedipWarna = 0x3fddb0;
      api.guru(pesan, { poseAkhir: "nunjuk" });
      setTimeout(() => {
        if (keadaan !== "kunci") { kotak.visible = true; kotak.position.copy(TITIK_AMBIL); kotak.rotation.set(0, 0, 0); lemparKe(i); tujuanOtomatis = -2; }
      }, 900);
      selesaiSoal("nol", 0, false);
    }

    function selesaiSoal(status, poin, benar) {
      const s = soal[idx];
      if (benar) jumlahBenar++;
      rekap.push(status);
      api.tandaiSoal(idx, status);
      const terakhir = idx === soal.length - 1;
      setTimeout(() => {
        g.papan(null);
        api.umpan({
          jenis: benar ? "benar" : "salah",
          judul: `${s.majas}! ${poin ? `+${poin} poin` : "0 poin"}`,
          teks: s.pembahasan,
          tombol: terakhir ? "Lihat Skor" : "Kotak Berikutnya",
          onLanjut: () => {
            api.hapusUmpan();
            if (terakhir) {
              g.bersihkan();
              api.selesai({ rekap, benar: jumlahBenar, dari: soal.length, satuan: "soal" });
            } else {
              idx++;
              mulaiSoal();
            }
          },
        });
      }, 1400);
    }

    /* ================================================================
       LOOP TIAP FRAME
       ================================================================ */
    function update(dt, t) {
      const lajuBan = kecepatanBan[Math.min(idx, kecepatanBan.length - 1)];
      matSabuk.map.offset.x -= lajuBan * dt * 0.8;
      gigi.forEach((r, i) => (r.rotation.y += dt * lajuBan * (i ? -0.4 : 0.4)));

      // waktu 30 detik
      if (!terkunci) {
        akumDetik += dt;
        if (akumDetik >= 1) {
          akumDetik -= 1;
          sisa--;
          api.waktu(Math.max(0, sisa), DETIK);
          if (sisa > 0 && sisa <= 5) api.suara.tik();
          if (sisa <= 0) waktuHabis();
        }
      }

      if (keadaan === "ban") {
        kotak.position.x = Math.min(TITIK_AMBIL.x, kotak.position.x + lajuBan * dt);
        kotak.position.y = TITIK_AMBIL.y + 0.15;
        if (kotak.position.x >= TITIK_AMBIL.x) keadaan = "siap";
      } else if (keadaan === "siap") {
        kotak.position.lerp(new THREE.Vector3(TITIK_AMBIL.x, TITIK_AMBIL.y + 0.15 + Math.abs(Math.sin(t * 3)) * 0.15, TITIK_AMBIL.z), dt * 8);
        kotak.rotation.set(0, Math.sin(t * 2) * 0.08, 0);
      } else if (keadaan === "pegang") {
        kotak.rotation.z = Math.sin(t * 10) * 0.05;
      } else if (keadaan === "terbang" || keadaan === "mantul") {
        v.y -= GRAVITASI * dt;
        kotak.position.addScaledVector(v, dt);
        kotak.rotation.x -= dt * 5; kotak.rotation.z += v.x * dt * 0.3;
        if (keadaan === "terbang") cekTabrakan();
        else if (kotak.position.y < 0.5) {
          // selesai mantul -> balik ke ban (kalau soal belum dikunci)
          kotak.position.y = 0.5;
          if (!terkunci) taruhDiBan(); else kotak.visible = false;
        }
      }
      sorotKotak.position.set(kotak.position.x, 0.02, kotak.position.z);

      // tong: kedip warna & goyang
      tong.forEach((tg) => {
        if (tg.kedip > 0) {
          tg.kedip -= dt;
          const on = Math.sin(tg.kedip * 14) > 0;
          tg.badan.material.color.setHex(on ? tg.kedipWarna : tg.warnaAsli);
          tg.sinar.material.color.setHex(tg.kedipWarna);
          tg.sinar.material.opacity = Math.max(0, Math.min(0.45, tg.kedip * 0.4));
        } else {
          tg.badan.material.color.setHex(tg.warnaAsli);
          tg.sinar.material.opacity = 0;
        }
        if (tg.goyang > 0) { tg.goyang -= dt; tg.grup.scale.set(1 + Math.sin(tg.goyang * 30) * 0.06, 1 - Math.sin(tg.goyang * 30) * 0.06, 1); }
        else tg.grup.scale.set(1, 1, 1);
      });
      partikel.update(dt);
    }

    /** kotak lagi terbang: masuk tong? mantul di lantai? */
    function cekTabrakan() {
      const p = kotak.position;
      // masuk tong: lagi turun, setinggi bibir tong, dekat pusat tong
      if (v.y < 0 && p.y <= TONG_TINGGI + 0.4 && p.y > 0.3) {
        for (let i = 0; i < tong.length; i++) {
          const dx = p.x - TONG_X[i], dz = p.z - TONG_Z;
          if (dx * dx + dz * dz < TONG_R * TONG_R * 1.2) {
            if (tujuanOtomatis === -2) { keadaan = "kunci"; kotak.visible = false; tong[i].goyang = 0.5; partikel.ledak(new THREE.Vector3(TONG_X[i], 2, TONG_Z), { jumlah: 20 }); return; }
            return masukTong(i);
          }
        }
      }
      // kena lantai / meleset -> mantul lalu balik ke ban
      if (p.y < 0.5 || p.z < TONG_Z - 3 || Math.abs(p.x) > 9) {
        keadaan = "mantul";
        p.y = Math.max(p.y, 0.5);
        v.set(v.x * 0.4, 5, Math.abs(v.z) * 0.3);
        api.suara.salah();
        g.sorak("Meleset! Coba lagi 🎯", "info");
      }
    }

    g.saatJeda = () => {};
    mulaiSoal();
  },
};
