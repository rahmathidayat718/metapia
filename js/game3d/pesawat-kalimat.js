/* ==========================================================================
   METAPIA — game3d/pesawat-kalimat.js
   GAME 3 versi 3D: "PESAWAT PERAKIT KALIMAT" (pengganti Ubah Kalimatku)
   -------------------------------------------------------------------------
   Luar angkasa. Di atas: kalimat biasa + jenis majas yang diminta.
   Kata-kata kalimat bermajas (jawaban soal) + kata pengecoh melayang jadi
   asteroid. Pemain menembak kata SESUAI URUTAN; kalimatnya terbentuk di
   bar bawah.
   - Kontrol: ketuk kata (pesawat otomatis ke bawahnya & menembak),
     atau panah kiri/kanan + Spasi, atau geser pesawat + tombol tembak.
   - Salah kata / salah urutan: pesawat berguncang, nyawa -1, kata mantul.
   - Kalimat lengkap: bar kalimat bercahaya + kalimat biasa "berubah".
   Skor (setara versi 2D, maks 100): 0 salah = 20 (3 bintang),
   1-2 salah = 10 (2 bintang), 3+ salah = 5 (1 bintang).
   Kata = kata-kata dari pilihan yang benar; pengecoh otomatis diambil dari
   pilihan yang salah (atau dari soal.kataPengecoh kalau diisi guru).
   ========================================================================== */
import { THREE, Partikel, warna, buatLabel, lerp, acakAntara } from "./mesin3d.js";
import { siapkanGame, esc } from "./ui3d.js";

const JARAK_KAMERA = 14;
const WARNA_BATU = [0x8a6bff, 0x4fc3f7, 0xff7aae, 0x3fddb0, 0xffc93c];

/** "Angin berbisik lembut." -> ["Angin", "berbisik", "lembut."] */
function pecahKata(kalimat) {
  return kalimat.trim().split(/\s+/);
}
function polos(kata) {
  return kata.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "");
}

/** kata pengecoh: dari soal.kataPengecoh, atau otomatis dari pilihan yang salah */
function ambilPengecoh(s, jumlah) {
  if (Array.isArray(s.kataPengecoh) && s.kataPengecoh.length) return s.kataPengecoh.slice(0, jumlah);
  const target = new Set(pecahKata(s.pilihan[s.jawaban]).map(polos));
  const calon = [];
  s.pilihan.forEach((p, i) => {
    if (i === s.jawaban) return;
    pecahKata(p).forEach((k) => {
      const b = polos(k);
      if (b.length >= 4 && !target.has(b) && !calon.some((c) => polos(c) === b)) calon.push(k.replace(/[.,!?"“”]/g, ""));
    });
  });
  // acak urutan, ambil secukupnya
  for (let i = calon.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [calon[i], calon[j]] = [calon[j], calon[i]]; }
  return calon.slice(0, jumlah);
}

export default {
  main(api) {
    const data = api.data;
    const soal = data.soal;
    const kecepatan = data.kecepatan3d || [0.35, 0.45, 0.55, 0.65, 0.75];
    const POIN = (salah) => (salah === 0 ? 20 : salah <= 2 ? 10 : 5);
    const BINTANG = (salah) => (salah === 0 ? 3 : salah <= 2 ? 2 : 1);

    const g = siapkanGame(api,
      { warnaLangit: 0x160f33, fov: 50, update, saatResize: aturBatas },
      { tempo: 100, pola: [392, 0, 523, 0, 659, 587, 523, 0], bass: [98, 98, 131, 117], tipe: "sine", volume: 0.08, ketukan: "angkasa" });
    const { dunia } = g;
    const { scene } = dunia;
    const ringan = dunia.ringan;
    dunia.kameraDasar.set(0, 0, JARAK_KAMERA);
    dunia.tujuanKamera.set(0, 0, 0);

    /* ================================================================
       LUAR ANGKASA: bintang, planet, nebula
       ================================================================ */
    const jumlahBintang = ringan ? 350 : 900;
    const posBintang = new Float32Array(jumlahBintang * 3);
    for (let i = 0; i < jumlahBintang; i++) {
      posBintang[i * 3] = acakAntara(-40, 40);
      posBintang[i * 3 + 1] = acakAntara(-30, 30);
      posBintang[i * 3 + 2] = acakAntara(-60, -5);
    }
    const geoBintang = new THREE.BufferGeometry();
    geoBintang.setAttribute("position", new THREE.BufferAttribute(posBintang, 3));
    const bintang = new THREE.Points(geoBintang, new THREE.PointsMaterial({ color: 0xffffff, size: 0.18, sizeAttenuation: true }));
    scene.add(bintang);
    const planet1 = new THREE.Mesh(new THREE.IcosahedronGeometry(4, 1), warna(0xff7aae));
    planet1.position.set(-22, 13, -45);
    const cincin = new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.35, 4, 24), warna(0xffc93c));
    cincin.rotation.x = 1.2;
    planet1.add(cincin);
    const planet2 = new THREE.Mesh(new THREE.IcosahedronGeometry(2.5, 1), warna(0x4fc3f7));
    planet2.position.set(22, -10, -40);
    scene.add(planet1, planet2);

    /* ================================================================
       PESAWAT
       ================================================================ */
    const pesawat = new THREE.Group();
    const badan = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.8, 6), warna(0xffffff));
    const kaca = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), warna(0x4fc3f7));
    kaca.position.set(0, 0.15, 0.32);
    const sayap = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 0.25), warna(0xff7aae));
    sayap.position.y = -0.45;
    const ekorKiri = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), warna(0x8a6bff));
    ekorKiri.position.set(-0.9, -0.45, 0);
    const ekorKanan = ekorKiri.clone(); ekorKanan.position.x = 0.9;
    const api_ = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.9, 6), new THREE.MeshBasicMaterial({ color: 0xffc93c }));
    api_.rotation.x = Math.PI; api_.position.y = -1.25;
    pesawat.add(badan, kaca, sayap, ekorKiri, ekorKanan, api_);
    scene.add(pesawat);

    // laser
    const laser = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1, 0.12), new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0 }));
    scene.add(laser);
    const partikel = new Partikel(scene, ringan);

    /* ================================================================
       BATAS LAYAR (ngikutin ukuran canvas & sudut kamera)
       ================================================================ */
    const batas = { x: 6, atas: 3, bawah: -3, kapal: -5 };
    /** px dari atas canvas -> koordinat y dunia (di bidang z=0) */
    function yDunia(px, H) { return H * (1 - (2 * px) / Math.max(dunia.tinggi, 1)); }
    function aturBatas() {
      const H = Math.tan(THREE.MathUtils.degToRad(dunia.kamera.fov / 2)) * JARAK_KAMERA;
      const W = H * dunia.kamera.aspect;
      batas.x = W * 0.86;
      // kata-kata melayang di antara bawah papan soal (HTML) & atas pesawat
      const papan = g.lapis.querySelector(".g3d-papan");
      const bawahPapan = papan && !papan.hidden ? papan.offsetTop + papan.offsetHeight + 58 : dunia.tinggi * 0.2;
      batas.kapal = yDunia(dunia.tinggi - 105, H);        // pesawat di atas bar kalimat
      batas.atas = Math.min(H * 0.6, yDunia(bawahPapan, H));
      batas.bawah = batas.kapal + 1.9;
      if (batas.bawah > batas.atas) batas.bawah = batas.atas;
      batas.W = W; batas.H = H;
      if (asteroid.length) susunSlot();
    }

    /* ================================================================
       ASTEROID KATA
       ================================================================ */
    let asteroid = []; // { grup, batu, label, kata, slot:{x,y}, fase, kedip, lepas }
    const geoBatu = new THREE.IcosahedronGeometry(0.75, 0);

    function buatAsteroid(kata, i) {
      const grup = new THREE.Group();
      const batu = new THREE.Mesh(geoBatu, warna(WARNA_BATU[i % WARNA_BATU.length]));
      batu.scale.set(1.25, 0.85, 0.85);
      const label = buatLabel(kata.replace(/[.,!?]$/, ""), {
        billboard: true, lebarDunia: 2.6, lebar: 512, tinggi: 170,
        latar: "#FFFFFF", garis: "#2C2450", ukuran: 92, radius: 60,
      });
      label.position.z = 0.9;
      grup.add(batu, label);
      scene.add(grup);
      return { grup, batu, label, kata, fase: Math.random() * 10, kedip: 0, warnaAsli: batu.material.color.getHex() };
    }

    /** taruh asteroid di "slot" grid biar gak tumpuk (posisi acak) */
    function susunSlot() {
      const n = asteroid.length;
      const tegak = dunia.kamera.aspect < 1;
      const kolom = tegak ? 3 : Math.min(5, Math.max(3, Math.ceil(n / 2)));
      const baris = Math.ceil(n / kolom);
      const urut = asteroid.map((_, i) => i).sort(() => Math.random() - 0.5);
      urut.forEach((ai, k) => {
        const c = k % kolom, r = Math.floor(k / kolom);
        const isiBaris = Math.min(kolom, n - r * kolom);
        const lebarSel = (batas.x * 2) / kolom;
        const x = (c - (isiBaris - 1) / 2) * lebarSel;
        const y = baris === 1 ? (batas.atas + batas.bawah) / 2
          : batas.atas - (r * (batas.atas - batas.bawah)) / (baris - 1);
        asteroid[ai].slot = { x, y };
        // ukuran label nyesuain ruang (HP sempit -> label lebih kecil, gak tumpuk)
        const tinggiSel = baris > 1 ? (batas.atas - batas.bawah) / (baris - 1) : 3;
        const lebarLabel = Math.min(2.6, lebarSel * 0.9, tinggiSel * 0.8 * 512 / 170);
        // seberapa jauh kata boleh melayang dari slot-nya (biar gak nabrak tetangga)
        asteroid[ai].amp = Math.max(0.05, Math.min((lebarSel - lebarLabel) * 0.5, tinggiSel * 0.2, 0.9));
        asteroid[ai].label.scale.set(lebarLabel, lebarLabel * 170 / 512, 1);
        asteroid[ai].batu.scale.set(lebarLabel * 0.48, lebarLabel * 0.33, lebarLabel * 0.33);
      });
    }

    function hapusAsteroid(a) {
      scene.remove(a.grup);
      a.label.material.map.dispose();
      a.label.material.dispose();
      a.batu.material.dispose();
    }

    /* ================================================================
       STATE
       ================================================================ */
    let idx = 0;
    let target = [];        // kata-kata kalimat bermajas (urut)
    let terkumpul = 0;      // sudah berapa kata yang benar
    let salahSoal = 0;
    let totalBintang = 0;
    const rekap = [];
    let keadaan = "main";   // "main" | "jadi"
    let xTujuan = 0;
    let antrianTembak = null; // asteroid yang mau ditembak setelah pesawat sampai
    let elRakit = null;

    api.bintang(0);

    function mulaiSoal() {
      const s = soal[idx];
      asteroid.forEach(hapusAsteroid);
      target = pecahKata(s.pilihan[s.jawaban]);
      const pengecoh = ambilPengecoh(s, ringan ? 2 : 3);
      asteroid = [...target, ...pengecoh].map((k, i) => buatAsteroid(k, i));
      terkumpul = 0;
      salahSoal = 0;
      keadaan = "main";
      api.soalKe(idx);
      api.hapusPetunjuk();
      aturBatas();
      const gaya = GAYA_MAJAS[s.target];
      g.papan(`
        <p class="papan-kutipan">🪄 “${esc(s.kalimatBiasa)}”</p>
        <div class="papan-target">Ubah jadi: <b style="--warna:${{ kuning: "#FFC93C", biru: "#4FC3F7", pink: "#FF7AAE" }[gaya.warna]}">${gaya.ikon} ${s.target}</b>
          <span class="papan-tambahan">· Tembak kata sesuai urutan!</span></div>`);
      aturBatas(); // papan sudah tampil -> hitung ulang area kata
      susunSlot();
      asteroid.forEach((a) => a.grup.position.set(a.slot.x, batas.atas + 8, 0)); // turun dari atas
      tampilkanRakit();
      if (idx > 0) g.sorak(`Level ${idx + 1}! Asteroid makin lincah! ⚡`, "level");
      api.guru(idx === 0
        ? `Tembak kata-kata sesuai urutan biar jadi kalimat ${s.target}! Ketuk katanya! 🚀`
        : api.acak([`Sekarang rakit kalimat ${s.target}! ✨`, "Kata pertamanya yang mana, ya? 🔍", "Ayo pilot, tembak kata yang tepat! 🚀"]),
        { poseAkhir: "nunjuk" });
    }

    function tampilkanRakit(jadi = false) {
      if (!elRakit) {
        elRakit = document.createElement("div");
        elRakit.className = "g3d-rakit";
        g.lapis.appendChild(elRakit);
      }
      elRakit.classList.toggle("is-jadi", jadi);
      elRakit.innerHTML = target.map((k, i) => (i < terkumpul ? `<span class="kata">${esc(k)}</span>` : `<span class="kosong"></span>`)).join("");
    }

    /* ================================================================
       KONTROL
       ================================================================ */
    function posLokal(e) {
      const r = g.wadah.getBoundingClientRect();
      const sk = r.width / g.wadah.clientWidth || 1;
      return { x: (e.clientX - r.left) / sk, y: (e.clientY - r.top) / sk };
    }
    let geser = null;
    g.dengar(g.wadah, "pointerdown", (e) => {
      if (keadaan !== "main" || dunia.jeda || e.target.closest("button, .kuis-umpan, .petunjuk, .lapis-jeda")) return;
      const p = posLokal(e);
      const ray = dunia.ray(p.x, p.y);
      const kena = ray.intersectObjects(asteroid.flatMap((a) => [a.batu, a.label]), false)[0];
      if (kena) {
        const a = asteroid.find((x) => x.batu === kena.object || x.label === kena.object);
        xTujuan = a.grup.position.x;
        antrianTembak = a;
        return;
      }
      // geser pesawat
      geser = { id: e.pointerId };
      gerakKe(p.x);
    });
    g.dengar(window, "pointermove", (e) => {
      if (!geser || e.pointerId !== geser.id) return;
      gerakKe(posLokal(e).x);
    });
    const lepas = () => { geser = null; };
    g.dengar(window, "pointerup", lepas);
    g.dengar(window, "pointercancel", lepas);
    function gerakKe(xLayar) {
      xTujuan = ((xLayar / dunia.lebar) * 2 - 1) * batas.W;
      xTujuan = Math.max(-batas.x, Math.min(batas.x, xTujuan));
    }
    g.dengar(document, "keydown", (e) => {
      if (keadaan !== "main" || dunia.jeda) return;
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") { e.preventDefault(); xTujuan = Math.max(-batas.x, xTujuan - 1.6); }
      if (k === "arrowright" || k === "d") { e.preventDefault(); xTujuan = Math.min(batas.x, xTujuan + 1.6); }
      if (k === " " || k === "arrowup" || k === "w") { e.preventDefault(); tembakLurus(); }
    });
    // tombol tembak (HP)
    const btnTembak = document.createElement("button");
    btnTembak.className = "g3d-tombol-tembak";
    btnTembak.setAttribute("aria-label", "Tembak");
    btnTembak.innerHTML = `<i class="fa-solid fa-bolt"></i>`;
    g.lapis.appendChild(btnTembak);
    g.dengar(btnTembak, "pointerdown", (e) => { e.stopPropagation(); tembakLurus(); });

    /** tembak lurus ke atas: kena asteroid terdekat di atas pesawat */
    function tembakLurus() {
      if (keadaan !== "main") return;
      let terdekat = null;
      for (const a of asteroid) {
        if (Math.abs(a.grup.position.x - pesawat.position.x) < 1.25 && (!terdekat || a.grup.position.y < terdekat.grup.position.y)) terdekat = a;
      }
      tembak(terdekat);
    }

    /** tembakan laser ke asteroid `a` (null = meleset ke atas) */
    function tembak(a) {
      const dari = pesawat.position.clone(); dari.y += 1;
      const ke = a ? a.grup.position.clone() : new THREE.Vector3(pesawat.position.x, batas.H, 0);
      const panjang = ke.y - dari.y;
      laser.position.set(dari.x, dari.y + panjang / 2, 0);
      laser.scale.set(1, Math.max(0.1, panjang), 1);
      laser.material.opacity = 1;
      g.musik.efek(1200, 300, 0.15, 0.05, "square");
      if (a) kena(a);
    }

    /* ================================================================
       CEK KATA
       ================================================================ */
    function kena(a) {
      const s = soal[idx];
      const posLayar = dunia.keLayar(a.grup.position);
      if (polos(a.kata) === polos(target[terkumpul]) && a.kata === target[terkumpul]) {
        // BENAR: kata masuk ke bar
        partikel.ledak(a.grup.position, { jumlah: ringan ? 20 : 40, kuat: 5 });
        hapusAsteroid(a);
        asteroid = asteroid.filter((x) => x !== a);
        terkumpul++;
        g.benar();
        api.suara.ambil();
        tampilkanRakit();
        if (terkumpul === target.length) return kalimatJadi(posLayar);
        if (terkumpul === 1 && salahSoal === 0) api.guru("Mantap! Lanjut kata berikutnya! 👍");
      } else {
        // SALAH: kata pengecoh / salah urutan
        salahSoal++;
        a.kedip = 0.8;
        a.lepas = 1;
        g.salah();
        api.suara.salah();
        pesawat.userData.guncang = 0.6;
        const pengecoh = !target.includes(a.kata);
        if (salahSoal === 1) {
          api.guru(pengecoh ? "Ups, itu kata pengecoh! 💡 Baca petunjuknya, ya." : "Hampir! Tapi urutannya belum pas. 💡", { poseAkhir: "bicara" });
          api.petunjuk(s.petunjuk);
        } else {
          api.guru(pengecoh ? "Itu kata pengecoh! Coba kata lain. 🔍" : `Bukan itu urutannya. Kata ke-${terkumpul + 1} yang mana, ya?`, { poseAkhir: "bicara" });
        }
        if (salahSoal >= 4) api.guru("Psst, lihat kata yang bersinar! Itu kata berikutnya. ✨");
      }
    }

    function kalimatJadi(posLayar) {
      const s = soal[idx];
      keadaan = "jadi";
      const poin = POIN(salahSoal), nb = BINTANG(salahSoal);
      totalBintang += nb;
      api.bintang(totalBintang);
      g.poin(poin, posLayar.x, posLayar.y);
      tampilkanRakit(true);
      // sisa asteroid (pengecoh) meledak semua
      asteroid.forEach((a) => { partikel.ledak(a.grup.position, { jumlah: 12, kuat: 4 }); hapusAsteroid(a); });
      asteroid = [];
      api.suara.benar();
      api.guruLompat();
      g.sorak(`Kalimat jadi! ${"⭐".repeat(nb)}`, "combo");
      g.papan(`
        <div class="papan-judul">✨ Kalimat ${esc(s.target)}:</div>
        <p class="papan-kutipan papan-sihir">“${esc(s.pilihan[s.jawaban])}”</p>`);
      api.guru(salahSoal === 0 ? api.acak([`Sihirnya berhasil, ${api.namaPanggilan}! ✨`, "Wuih, tanpa salah! 3 bintang! 🌟"]) : "Kalimatnya berhasil dirakit! ✨");
      const status = salahSoal === 0 ? "penuh" : "sebagian";
      rekap.push(status);
      api.tandaiSoal(idx, status);
      const terakhir = idx === soal.length - 1;
      setTimeout(() => {
        api.umpan({
          jenis: "benar",
          judul: `${"⭐".repeat(nb)} +${poin} poin`,
          teks: s.pembahasan,
          tombol: terakhir ? "Lihat Skor" : "Terbang Lagi!",
          onLanjut: () => {
            api.hapusUmpan();
            if (terakhir) {
              g.bersihkan();
              api.selesai({ rekap, benar: soal.length, dari: soal.length, satuan: "soal", bintang: totalBintang });
            } else {
              idx++;
              mulaiSoal();
            }
          },
        });
      }, 1500);
    }

    /* ================================================================
       LOOP TIAP FRAME
       ================================================================ */
    function update(dt, t) {
      const laju = kecepatan[Math.min(idx, kecepatan.length - 1)];
      // bintang turun pelan (kesan terbang)
      const pos = geoBintang.attributes.position;
      for (let i = 0; i < jumlahBintang; i++) {
        let y = pos.getY(i) - dt * (2 + laju * 4);
        if (y < -30) y += 60;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      planet1.rotation.y += dt * 0.1; planet2.rotation.y -= dt * 0.15;

      // asteroid melayang di sekitar slot-nya
      const kataBerikut = target[terkumpul];
      asteroid.forEach((a) => {
        a.fase += dt * (0.8 + laju * 2.5);
        const amp = (a.amp ?? 0.3) * (0.5 + laju);
        const tx = a.slot.x + Math.sin(a.fase) * amp;
        const ty = a.slot.y + Math.cos(a.fase * 0.8) * amp * 0.5;
        const k = a.lepas > 0 ? 3 : 4;
        a.grup.position.x = lerp(a.grup.position.x, tx, dt * k);
        a.grup.position.y = lerp(a.grup.position.y, ty + (a.lepas > 0 ? a.lepas * 1.5 : 0), dt * k);
        if (a.lepas > 0) a.lepas -= dt * 1.5;
        a.batu.rotation.x += dt * 0.8; a.batu.rotation.y += dt * 0.6;
        // kedip merah kalau salah, bersinar kalau jadi bantuan (4x salah)
        if (a.kedip > 0) {
          a.kedip -= dt;
          a.batu.material.color.setHex(Math.sin(a.kedip * 30) > 0 ? 0xff3b3b : a.warnaAsli);
        } else if (salahSoal >= 4 && a.kata === kataBerikut) {
          a.batu.material.color.setHex(Math.sin(t * 8) > 0 ? 0xffffff : 0xffe066);
          a.grup.scale.setScalar(1 + Math.sin(t * 8) * 0.06);
        } else {
          a.batu.material.color.setHex(a.warnaAsli);
          a.grup.scale.setScalar(1);
        }
      });

      // pesawat: ke posisi tujuan, miring waktu bergerak, berguncang kalau salah
      const sebelum = pesawat.position.x;
      pesawat.position.x = lerp(pesawat.position.x, xTujuan, dt * 9);
      pesawat.position.y = batas.kapal + Math.sin(t * 3) * 0.12;
      pesawat.rotation.z = (sebelum - pesawat.position.x) * 2.5;
      if (pesawat.userData.guncang > 0) {
        pesawat.userData.guncang -= dt;
        pesawat.position.x += Math.sin(t * 60) * 0.15;
      }
      api_.scale.y = 0.8 + Math.random() * 0.4;
      // tembakan otomatis setelah pesawat sampai di bawah kata yang diketuk
      if (antrianTembak && Math.abs(pesawat.position.x - xTujuan) < 0.25) {
        const a = antrianTembak; antrianTembak = null;
        if (asteroid.includes(a)) tembak(a);
      }
      if (antrianTembak && asteroid.includes(antrianTembak)) xTujuan = antrianTembak.grup.position.x;
      laser.material.opacity = Math.max(0, laser.material.opacity - dt * 6);
      partikel.update(dt);
    }

    // kait khusus tes otomatis (cuma aktif kalau alamat halaman ada "uji3d")
    if (/uji3d/.test(location.search)) window.__uji3 = { daftar: () => asteroid, tembak, target: () => target, terkumpul: () => terkumpul };

    mulaiSoal();
  },
};
