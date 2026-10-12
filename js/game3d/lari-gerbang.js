/* ==========================================================================
   METAPIA — game3d/lari-gerbang.js
   GAME 1 versi 3D: "LARI GERBANG MAJAS" (pengganti Tebak Gambar)
   -------------------------------------------------------------------------
   Endless runner 3 jalur. Tiap soal:
   - Gambar + kalimat A/B/C tampil di papan atas layar.
   - Gelombang 1: 3 gerbang A/B/C datang. Masuk gerbang kalimat yang cocok.
       benar +10 | salah -> tersandung, nyawa -1, petunjuk, gerbang datang lagi
       (1x coba lagi) | salah lagi -> jawaban ditunjukkan, 0 poin
   - Gelombang 2: 3 gerbang Metafora/Personifikasi/Hiperbola. 1x kesempatan.
       benar +10 | salah -> tersandung, nyawa -1
   - Pembahasan muncul, tombol Lanjut. Soal berikutnya larinya makin cepat.
   Skor resmi sama persis dengan versi 2D (maks 100). Combo = Poin Bonus.
   Data soal: DATA_GAME[1] di js/game-data.js (gak diubah)
   ========================================================================== */
import { THREE, Partikel, warna, buatLabel, lerp } from "./mesin3d.js";
import { siapkanGame, kontrolGeser, esc } from "./ui3d.js";

const JALUR = [-2.3, 0, 2.3];
const HURUF = ["A", "B", "C"];
const WARNA_GERBANG = [0xffc93c, 0x4fc3f7, 0xff7aae];
const PANJANG = 140; // panjang potongan jalan yang di-"daur ulang"

export default {
  main(api) {
    const data = api.data;
    const soal = data.soal;
    const kecepatan = data.kecepatan3d || [9, 10.5, 12, 13.5, 15];

    const g = siapkanGame(api,
      { warnaLangit: 0xd9c8ff, fov: 60, update },
      { tempo: 132, pola: [659, 784, 880, 784, 659, 587, 523, 587], bass: [131, 165, 175, 147] });
    const { dunia } = g;
    const { scene } = dunia;
    const ringan = dunia.ringan;
    scene.fog = new THREE.Fog(0xd9c8ff, 35, 120);
    dunia.kameraDasar.set(0, 3.4, 7.2);
    dunia.tujuanKamera.set(0, 1.2, -8);

    /* ================================================================
       DUNIA: tanah, jalan, garis jalur, pohon, awan, bukit
       ================================================================ */
    const tanah = new THREE.Mesh(new THREE.PlaneGeometry(200, 260), warna(0x9bd872));
    tanah.rotation.x = -Math.PI / 2;
    tanah.position.z = -100;
    scene.add(tanah);

    const jalan = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 260), warna(0xf1c9a5));
    jalan.rotation.x = -Math.PI / 2;
    jalan.position.set(0, 0.01, -100);
    scene.add(jalan);
    // pinggir jalan
    [-3.95, 3.95].forEach((x) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 260), warna(0xffffff));
      p.position.set(x, 0.09, -100);
      scene.add(p);
    });

    // potongan2 yang bergerak (garis jalur, pohon, bunga) -> digeser maju terus
    const bergerak = [];
    const geoGaris = new THREE.BoxGeometry(0.14, 0.02, 2.2);
    const matGaris = warna(0xffffff);
    for (let z = 0; z < PANJANG; z += 6) {
      [-1.15, 1.15].forEach((x) => {
        const m = new THREE.Mesh(geoGaris, matGaris);
        m.position.set(x, 0.03, -z + 10);
        scene.add(m); bergerak.push(m);
      });
    }
    const geoBatang = new THREE.CylinderGeometry(0.18, 0.24, 1.4, 6);
    const geoDaun = new THREE.ConeGeometry(1.1, 2.4, 6);
    const geoDaunBulat = new THREE.IcosahedronGeometry(1.1, 0);
    const matBatang = warna(0x9a6a4a);
    const matDaun = [warna(0x5cbf6b), warna(0x7fd36a), warna(0x48a86b)];
    const matBunga = [warna(0xff7aae), warna(0xffc93c), warna(0xffffff), warna(0xb79bff)];
    const jarakPohon = ringan ? 9 : 6;
    for (let z = 0; z < PANJANG; z += jarakPohon) {
      [-1, 1].forEach((sisi) => {
        const pohon = new THREE.Group();
        const batang = new THREE.Mesh(geoBatang, matBatang);
        batang.position.y = 0.7;
        const daun = new THREE.Mesh(Math.random() < 0.5 ? geoDaun : geoDaunBulat, matDaun[(z / jarakPohon + (sisi > 0 ? 1 : 0)) % 3 | 0]);
        daun.position.y = 2.2;
        pohon.add(batang, daun);
        const s = 0.8 + Math.random() * 0.6;
        pohon.scale.set(s, s, s);
        pohon.position.set(sisi * (5.5 + Math.random() * 4), 0, -z - Math.random() * 3);
        scene.add(pohon); bergerak.push(pohon);
      });
      if (!ringan) {
        const bunga = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), matBunga[(z / 6) % 4 | 0]);
        bunga.position.set((Math.random() < 0.5 ? -1 : 1) * (4.4 + Math.random() * 0.8), 0.25, -z);
        scene.add(bunga); bergerak.push(bunga);
      }
    }
    // bukit & awan (diam, jauh)
    [[-30, -110, 22, 0xb4e08f], [25, -120, 28, 0xa6db84], [0, -140, 30, 0xc3e89e]].forEach(([x, z, r, c]) => {
      const b = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 6), warna(c));
      b.position.set(x, -r * 0.55, z);
      scene.add(b);
    });
    const awan = [];
    const matAwan = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
    for (let i = 0; i < (ringan ? 3 : 6); i++) {
      const a = new THREE.Group();
      for (let j = 0; j < 3; j++) {
        const bola = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 + Math.random(), 0), matAwan);
        bola.position.set(j * 1.6 - 1.6, Math.random() * 0.6, 0);
        a.add(bola);
      }
      a.position.set(-25 + i * 10, 12 + Math.random() * 5, -70 - Math.random() * 20);
      scene.add(a); awan.push(a);
    }

    /* ================================================================
       PELARI: anak low-poly (dilihat dari belakang)
       ================================================================ */
    const pelari = new THREE.Group();
    const badan = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.45), warna(0x5b3fd9));
    badan.position.y = 1.15;
    const tas = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.25), warna(0xffc93c));
    tas.position.set(0, 1.2, 0.33);
    const kepala = new THREE.Mesh(new THREE.IcosahedronGeometry(0.38, 1), warna(0xffd2b0));
    kepala.position.y = 1.85;
    const rambut = new THREE.Mesh(new THREE.SphereGeometry(0.41, 8, 6, 0, Math.PI * 2, 0, Math.PI / 1.7), warna(0x2f4a3a));
    rambut.position.y = 1.9;
    rambut.rotation.x = 0.35;
    function anggota(lebar, panjang, warnaHex, x, y) {
      const sendi = new THREE.Group();
      const m = new THREE.Mesh(new THREE.BoxGeometry(lebar, panjang, lebar), warna(warnaHex));
      m.position.y = -panjang / 2;
      sendi.add(m);
      sendi.position.set(x, y, 0);
      return sendi;
    }
    const kakiKiri = anggota(0.24, 0.75, 0x3a3f6b, -0.18, 0.78);
    const kakiKanan = anggota(0.24, 0.75, 0x3a3f6b, 0.18, 0.78);
    const tanganKiri = anggota(0.18, 0.6, 0xffd2b0, -0.47, 1.5);
    const tanganKanan = anggota(0.18, 0.6, 0xffd2b0, 0.47, 1.5);
    pelari.add(badan, tas, kepala, rambut, kakiKiri, kakiKanan, tanganKiri, tanganKanan);
    const bayangan = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 }));
    bayangan.rotation.x = -Math.PI / 2;
    bayangan.position.y = 0.02;
    scene.add(pelari, bayangan);

    /* ================================================================
       GERBANG
       ================================================================ */
    const partikel = new Partikel(scene, ringan);
    const geoTiang = new THREE.BoxGeometry(0.28, 3.2, 0.28);
    const geoAtap = new THREE.BoxGeometry(2.2, 0.35, 0.4);
    let gelombang = null; // { grup, gerbang:[...], jenis, label, sudahLewat }

    function buatGerbang(label, i, mati) {
      const grup = new THREE.Group();
      const c = mati ? 0xb7b0d6 : WARNA_GERBANG[i];
      const matT = warna(c);
      const tiangKiri = new THREE.Mesh(geoTiang, matT); tiangKiri.position.set(-0.98, 1.6, 0);
      const tiangKanan = new THREE.Mesh(geoTiang, matT); tiangKanan.position.set(0.98, 1.6, 0);
      const atap = new THREE.Mesh(geoAtap, matT); atap.position.y = 3.25;
      const portal = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.9),
        new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: mati ? 0.15 : 0.35, side: THREE.DoubleSide, depthWrite: false }));
      portal.position.y = 1.6;
      const teks = label.length <= 2 ? label : label;
      const papan = buatLabel(mati ? `✖ ${teks}` : teks, {
        lebarDunia: 2.1, lebar: 512, tinggi: 220,
        latar: "#ffffff", garis: "#2C2450", ukuran: label.length <= 2 ? 170 : 92,
        warna: mati ? "#B7B0D6" : "#2C2450",
      });
      papan.position.set(0, 4.05, 0);
      grup.add(tiangKiri, tiangKanan, atap, portal, papan);
      grup.position.x = JALUR[i];
      grup.userData = { portal, mati };
      return grup;
    }

    /**
     * Kirim 1 gelombang gerbang.
     * jenis "kalimat" (A/B/C) atau "majas"; mati = index gerbang yang sudah dicoret
     */
    function kirimGelombang(jenis, label, waktuDatang, mati = -1) {
      if (gelombang) { scene.remove(gelombang.grup); }
      const grup = new THREE.Group();
      const gerbang = label.map((l, i) => {
        const gb = buatGerbang(l, i, i === mati);
        grup.add(gb);
        return gb;
      });
      const jarak = kecepatanSekarang() * waktuDatang;
      grup.position.z = -jarak;
      scene.add(grup);
      gelombang = { grup, gerbang, jenis, jarakAwal: jarak, sudahLewat: false };
      api.suara.ambil();
    }

    /* ================================================================
       STATE PERMAINAN
       ================================================================ */
    let idx = 0;
    let jalur = 1;                 // 0 kiri, 1 tengah, 2 kanan
    let tahap = "lari";            // "kalimat" | "majas" | "baca" | "selesai"
    let salahKalimat = 0;
    let poinSoal = 0;
    let langkahBenar = 0;
    const rekap = [];
    let bonusLaju = 1;             // dorongan kecepatan habis jawaban benar
    let laju = 2;                  // kecepatan sekarang (dihaluskan)
    let sandung = 0;               // >0 = lagi tersandung
    let loncat = 0;                // >0 = lagi loncat kecil
    let elJarak = null;

    function kecepatanSekarang() { return kecepatan[Math.min(idx, kecepatan.length - 1)]; }
    function lajuTujuan() {
      if (tahap === "baca" || tahap === "selesai") return 2.5;
      return kecepatanSekarang() * bonusLaju;
    }

    // kontrol pindah jalur
    function pindah(arah) {
      if (sandung > 0.35 || tahap === "selesai" || dunia.jeda) return;
      const baru = Math.max(0, Math.min(2, jalur + arah));
      if (baru !== jalur) { jalur = baru; g.musik.efek(500, 800, 0.08, 0.04, "sine"); }
    }
    kontrolGeser(g, { kiri: () => pindah(-1), kanan: () => pindah(1) });

    // tombol panah di layar (buat HP)
    const tombol = document.createElement("div");
    tombol.className = "g3d-tombol-jalur";
    tombol.innerHTML = `<button aria-label="Pindah ke kiri"><i class="fa-solid fa-arrow-left"></i></button>
                        <button aria-label="Pindah ke kanan"><i class="fa-solid fa-arrow-right"></i></button>`;
    g.lapis.appendChild(tombol);
    const [btnKiri, btnKanan] = tombol.querySelectorAll("button");
    g.dengar(btnKiri, "pointerdown", (e) => { e.stopPropagation(); pindah(-1); });
    g.dengar(btnKanan, "pointerdown", (e) => { e.stopPropagation(); pindah(1); });

    /* ================================================================
       ALUR SOAL
       ================================================================ */
    function waktuBaca(langkah) {
      // detik sampai gerbang tiba (makin tinggi soal makin cepat, tapi tetap cukup buat baca)
      return langkah === 1 ? [11, 10, 9.5, 9, 8.5][idx] : [7, 6.5, 6, 5.5, 5][idx];
    }

    function mulaiSoal() {
      const s = soal[idx];
      salahKalimat = 0;
      poinSoal = 0;
      tahap = "kalimat";
      api.soalKe(idx);
      api.hapusPetunjuk();
      tampilkanPapanKalimat(-1);
      if (idx > 0) g.sorak(`Level ${idx + 1}! Makin cepat! ⚡`, "level");
      api.guru(idx === 0
        ? `Lihat gambar di langit! Kalimat mana yang cocok? Masuk gerbang hurufnya, ya!`
        : api.acak(["Gambar baru! Cari kalimat yang cocok! 🔍", "Ayo, baca kalimatnya dan pilih gerbangnya!", "Fokus! Gerbang huruf mana yang benar?"]),
        { poseAkhir: "nunjuk" });
      setTimeout(() => kirimGelombang("kalimat", HURUF, waktuBaca(1)), idx === 0 ? 600 : 300);
    }

    function tampilkanPapanKalimat(mati) {
      const s = soal[idx];
      g.papan(`
        <div class="papan-judul"><span class="papan-langkah">1</span> Kalimat mana yang cocok dengan gambar?</div>
        <div class="papan-isi">
          <img class="papan-gambar" src="${s.gambar}" alt="${esc(s.deskripsiGambar)}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'papan-gambar is-kosong',textContent:'🖼️ ' + this.alt}))">
          <ol class="papan-pilihan">
            ${s.pilihan.map((p, i) => `<li class="${i === mati ? "is-mati" : ""}" style="--warna:${["#FFC93C", "#4FC3F7", "#FF7AAE"][i]}"><b>${HURUF[i]}</b>${esc(p)}</li>`).join("")}
          </ol>
        </div>
        <div class="papan-jarak"><span></span></div>`);
      elJarak = g.lapis.querySelector(".papan-jarak span");
    }

    function tampilkanPapanMajas() {
      const s = soal[idx];
      g.papan(`
        <div class="papan-judul"><span class="papan-langkah">2</span> Kalimat ini memakai majas apa?</div>
        <div class="papan-isi">
          <img class="papan-gambar" src="${s.gambar}" alt="" onerror="this.remove()">
          <p class="papan-kutipan">“${esc(s.pilihan[s.jawaban])}”</p>
        </div>
        <div class="papan-jarak"><span></span></div>`);
      elJarak = g.lapis.querySelector(".papan-jarak span");
    }

    /** gelombang sampai di pelari -> cek gerbang yang dimasuki */
    function lewatGerbang() {
      const s = soal[idx];
      const gb = gelombang.gerbang[jalur];
      const pos = new THREE.Vector3();
      gb.getWorldPosition(pos);
      pos.y = 2;
      const layar = dunia.keLayar(pos);

      if (gelombang.jenis === "kalimat") {
        if (jalur === s.jawaban) {
          ledakkan(gb, pos);
          poinSoal += 10; langkahBenar++;
          g.poin(10, layar.x, layar.y);
          g.benar();
          sorakBenar();
          api.guru(salahKalimat ? "Nah, itu dia! Benar! 👏" : api.acak(["Tepat sekali! 🎉", "Benar! Matamu jeli! 👀", "Hebat! Kalimatnya cocok!"]));
          lanjutKeMajas(900);
        } else {
          salahKalimat++;
          tersandung();
          if (salahKalimat === 1) {
            api.guru("Ups, belum tepat! Baca petunjuknya, lalu coba lagi! 💡", { poseAkhir: "bicara" });
            api.petunjuk(s.petunjuk);
            tampilkanPapanKalimat(jalur);
            setTimeout(() => { if (tahap === "kalimat") kirimGelombang("kalimat", HURUF, waktuBaca(1) * 0.8, jalur); }, 1300);
          } else {
            api.guru(`Gak apa-apa! Jawabannya ${HURUF[s.jawaban]}. Lanjut ke langkah 2, ya!`, { poseAkhir: "nunjuk" });
            g.sorak(`Jawabannya ${HURUF[s.jawaban]} 💡`, "info");
            lanjutKeMajas(1800);
          }
        }
      } else if (gelombang.jenis === "majas") {
        const benar = JENIS_MAJAS[jalur] === s.majas;
        if (benar) {
          ledakkan(gb, pos);
          poinSoal += 10; langkahBenar++;
          g.poin(10, layar.x, layar.y);
          g.benar();
          sorakBenar();
          api.guru(poinSoal === 20 ? `Sempurna, ${api.namaPanggilan}! Dua-duanya benar! 🌟` : "Benar! Jenis majasnya tepat! 👏");
        } else {
          tersandung();
          api.guru(`Belum tepat. Jawabannya ${s.majas}. Baca penjelasannya, ya! 💡`, { poseAkhir: "bicara" });
        }
        selesaiSoal(benar);
      }
    }

    function lanjutKeMajas(jeda) {
      tahap = "majas-tunggu";
      api.hapusPetunjuk();
      setTimeout(() => {
        if (tahap !== "majas-tunggu") return;
        tahap = "majas";
        tampilkanPapanMajas();
        kirimGelombang("majas", JENIS_MAJAS.map((m) => `${GAYA_MAJAS[m].ikon} ${m}`), waktuBaca(2));
      }, jeda);
    }

    function selesaiSoal(benarMajas) {
      const s = soal[idx];
      tahap = "baca";
      const status = poinSoal === 20 ? "penuh" : poinSoal > 0 ? "sebagian" : "nol";
      rekap.push(status);
      api.tandaiSoal(idx, status);
      const terakhir = idx === soal.length - 1;
      setTimeout(() => {
        g.papan(null);
        api.umpan({
          jenis: benarMajas ? "benar" : "salah",
          judul: `${s.majas}! ${poinSoal > 0 ? `+${poinSoal} poin` : "0 poin"}`,
          teks: s.pembahasan,
          tombol: terakhir ? "Lihat Skor" : "Lari Lagi!",
          onLanjut: () => {
            api.hapusUmpan();
            if (terakhir) {
              tahap = "selesai";
              g.bersihkan();
              api.selesai({ rekap, benar: langkahBenar, dari: soal.length * 2, satuan: "langkah" });
            } else {
              idx++;
              mulaiSoal();
            }
          },
        });
      }, 900);
    }

    /* ================================================================
       EFEK
       ================================================================ */
    function ledakkan(gb, pos) {
      partikel.ledak(pos, { jumlah: ringan ? 30 : 60, kuat: 7 });
      gb.visible = false;
      bonusLaju = 1.45;
      loncat = 0.5;
      g.musik.efek(400, 1200, 0.25, 0.06, "triangle");
    }
    function sorakBenar() {
      api.suara.benar();
      api.guruLompat();
    }
    function tersandung() {
      sandung = 0.9;
      bonusLaju = 0.6;
      api.suara.salah();
      g.salah();
    }

    /* ================================================================
       LOOP TIAP FRAME
       ================================================================ */
    function update(dt, t) {
      // kecepatan halus menuju tujuan, dorongan bonus pelan-pelan balik normal
      bonusLaju = lerp(bonusLaju, 1, dt * 0.8);
      laju = lerp(laju, lajuTujuan(), dt * 2.5);
      const maju = laju * dt;

      // dunia bergerak ke arah kamera
      for (const o of bergerak) {
        o.position.z += maju;
        if (o.position.z > 12) o.position.z -= PANJANG;
      }
      awan.forEach((a, i) => { a.position.x += dt * (0.3 + i * 0.05); if (a.position.x > 40) a.position.x = -40; });

      // gerbang mendekat
      if (gelombang && !gelombang.sudahLewat) {
        gelombang.grup.position.z += maju;
        gelombang.gerbang.forEach((gb) => {
          const p = gb.userData.portal;
          p.material.opacity = (gb.userData.mati ? 0.15 : 0.3) + Math.sin(t * 6) * 0.08;
        });
        if (elJarak) elJarak.style.width = `${Math.max(0, Math.min(100, (1 + gelombang.grup.position.z / gelombang.jarakAwal) * 100))}%`;
        if (gelombang.grup.position.z >= 0) {
          gelombang.sudahLewat = true;
          lewatGerbang();
        }
      } else if (gelombang && gelombang.sudahLewat) {
        gelombang.grup.position.z += maju;
        if (gelombang.grup.position.z > 14) { scene.remove(gelombang.grup); gelombang = null; }
      }

      // pelari: pindah jalur halus + animasi lari / sandung / loncat
      pelari.position.x = lerp(pelari.position.x, JALUR[jalur], dt * 12);
      bayangan.position.x = pelari.position.x;
      const ayun = Math.sin(t * laju * 1.3);
      if (sandung > 0) {
        sandung -= dt;
        pelari.rotation.x = -Math.sin(Math.min(1, sandung / 0.9) * Math.PI) * 0.9;
        pelari.position.y = 0;
      } else {
        pelari.rotation.x = -0.12;
        if (loncat > 0) { loncat -= dt; pelari.position.y = Math.sin((1 - loncat / 0.5) * Math.PI) * 0.9; }
        else pelari.position.y = Math.abs(ayun) * 0.12;
      }
      pelari.rotation.z = (JALUR[jalur] - pelari.position.x) * -0.08;
      kakiKiri.rotation.x = ayun * 0.9; kakiKanan.rotation.x = -ayun * 0.9;
      tanganKiri.rotation.x = -ayun * 0.8; tanganKanan.rotation.x = ayun * 0.8;

      // kamera ikut geser dikit ke jalur pelari
      dunia.kameraDasar.x = lerp(dunia.kameraDasar.x, pelari.position.x * 0.45, dt * 4);
      dunia.tujuanKamera.x = dunia.kameraDasar.x * 0.6;

      partikel.update(dt);
    }

    mulaiSoal();
  },
};
