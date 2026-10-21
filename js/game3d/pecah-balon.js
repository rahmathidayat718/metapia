/* ==========================================================================
   METAPIA — game3d/pecah-balon.js
   GAME 1 versi 3D: "PECAH BALON MAJAS" (pengganti Tebak Gambar)
   -------------------------------------------------------------------------
   Langit 3D. Gambar soal tampil besar di papan atas. 3 balon besar berisi
   kalimat naik pelan dari bawah lalu melayang di tempat (GAK ADA batas
   waktu, biar anak santai baca).
   - Langkah 1: ketuk balon kalimat yang cocok dengan gambar.
       benar -> balon meletus (konfeti) +10
       salah -> balon kempis & dicoret, nyawa -1, petunjuk, coba 1x lagi
       salah lagi -> balon yang benar bersinar & meletus sendiri, 0 poin
   - Langkah 2: 3 balon Metafora / Personifikasi / Hiperbola. 1x kesempatan.
   - Pembahasan muncul, tombol "Balon Berikutnya".
   Skor resmi sama persis dengan versi 2D (maks 100). Combo = Poin Bonus.
   Data soal: DATA_GAME[1] di js/game-data.js (gak diubah)
   ========================================================================== */
import { THREE, Partikel, warna, lerp, acakAntara } from "./mesin3d.js";
import { siapkanGame, esc } from "./ui3d.js";

const JARAK_KAMERA = 14;
const WARNA_BALON = [0xffc93c, 0x4fc3f7, 0xff7aae];

export default {
  main(api) {
    const soal = api.data.soal;

    const g = siapkanGame(api,
      { warnaLangit: 0xbfe7f7, fov: 50, update, saatResize: aturBatas },
      { tempo: 112, pola: [523, 659, 784, 659, 698, 880, 784, 0], bass: [131, 175, 147, 196], tipe: "triangle", ketukan: "pop" });
    const { dunia } = g;
    const { scene } = dunia;
    const ringan = dunia.ringan;
    dunia.kameraDasar.set(0, 0, JARAK_KAMERA);
    dunia.tujuanKamera.set(0, 0, 0);

    /* ================================================================
       LANGIT: gradasi, matahari, awan, bukit
       ================================================================ */
    const langit = new THREE.Mesh(new THREE.PlaneGeometry(120, 80),
      new THREE.ShaderMaterial({
        uniforms: {},
        vertexShader: "varying vec2 v; void main(){ v=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
        fragmentShader: "varying vec2 v; void main(){ vec3 a=vec3(.72,.64,.95), b=vec3(.95,.73,.87), c=vec3(.75,.91,.97); vec3 w = v.y>.5 ? mix(b,a,(v.y-.5)*2.) : mix(c,b,v.y*2.); gl_FragColor=vec4(w,1.); }",
        depthWrite: false,
      }));
    langit.position.z = -30;
    scene.add(langit);
    const matahari = new THREE.Mesh(new THREE.CircleGeometry(2.4, 24), new THREE.MeshBasicMaterial({ color: 0xfff1a8 }));
    matahari.position.set(11, 9, -25);
    scene.add(matahari);
    const bukit = [];
    [[-14, 0x9bd872, 16], [6, 0x8fd46b, 20], [20, 0xa6de7c, 14]].forEach(([x, c, r]) => {
      const b = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), warna(c));
      b.position.set(x, -r - 6, -22);
      scene.add(b); bukit.push(b);
    });
    const awan = [];
    const matAwan = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
    for (let i = 0; i < (ringan ? 4 : 8); i++) {
      const a = new THREE.Group();
      for (let j = 0; j < 3; j++) {
        const bola = new THREE.Mesh(new THREE.IcosahedronGeometry(1 + Math.random() * 0.7, 0), matAwan);
        bola.position.set(j * 1.2 - 1.2, Math.random() * 0.5, 0);
        a.add(bola);
      }
      a.position.set(acakAntara(-25, 25), acakAntara(5, 12), acakAntara(-22, -14));
      a.userData.laju = acakAntara(0.3, 0.8);
      scene.add(a); awan.push(a);
    }
    const partikel = new Partikel(scene, ringan);

    /* ================================================================
       BATAS AREA BALON (di bawah papan soal HTML)
       ================================================================ */
    const batas = { W: 8, H: 6, atas: 2, bawah: -4 };
    function yDunia(px) { return batas.H * (1 - (2 * px) / Math.max(dunia.tinggi, 1)); }
    function aturBatas() {
      batas.H = Math.tan(THREE.MathUtils.degToRad(dunia.kamera.fov / 2)) * JARAK_KAMERA;
      batas.W = batas.H * dunia.kamera.aspect;
      const papan = g.lapis.querySelector(".g3d-papan");
      const bawahPapan = papan && !papan.hidden ? papan.offsetTop + papan.offsetHeight : dunia.tinggi * 0.3;
      batas.atas = yDunia(bawahPapan + 70);
      batas.bawah = yDunia(dunia.tinggi - 30);
      if (balon.length) susunSlot();
    }

    /* ================================================================
       BALON (3D) + label kalimat (HTML, nempel ke balon tiap frame)
       ================================================================ */
    let balon = []; // { grup, bola, tali, el, i, slot, fase, keadaan }
    const geoBola = new THREE.SphereGeometry(1, ringan ? 14 : 22, ringan ? 10 : 16);
    const geoSimpul = new THREE.ConeGeometry(0.16, 0.25, 8);
    const elLabel = document.createElement("div");
    elLabel.className = "g3d-balon-label";
    g.lapis.appendChild(elLabel);

    function buatBalon(teks, i, ikon) {
      const grup = new THREE.Group();
      const mat = new THREE.MeshPhongMaterial({ color: WARNA_BALON[i], shininess: 80, specular: 0xffffff });
      const bola = new THREE.Mesh(geoBola, mat);
      bola.scale.set(1, 1.18, 1);
      const kilap = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
      kilap.position.set(-0.38, 0.5, 0.82);
      const simpul = new THREE.Mesh(geoSimpul, mat);
      simpul.position.y = -1.25; simpul.rotation.x = Math.PI;
      const tali = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([0, 1, 2, 3, 4].map((k) => new THREE.Vector3(Math.sin(k) * 0.12, -1.35 - k * 0.45, 0))),
        new THREE.LineBasicMaterial({ color: 0x6b6488 }));
      grup.add(bola, kilap, simpul, tali);
      scene.add(grup);

      const el = document.createElement("button");
      el.className = "balon-teks";
      el.style.setProperty("--warna", ["#FFC93C", "#4FC3F7", "#FF7AAE"][i]);
      el.innerHTML = `${ikon ? `<span class="balon-ikon">${ikon}</span>` : ""}<span>${esc(teks)}</span>`;
      el.addEventListener("click", () => pilih(i));
      elLabel.appendChild(el);
      return { grup, bola, mat, el, i, fase: Math.random() * 6, keadaan: "naik", kempis: 0, sinar: 0 };
    }

    /** posisi tiap balon: layar lebar = 3 sejajar, layar tegak (HP) = zig-zag ke bawah */
    function susunSlot() {
      const tegak = dunia.kamera.aspect < 0.9;
      const tinggi = batas.atas - batas.bawah;
      elLabel.classList.toggle("is-tegak", tegak);
      balon.forEach((b, k) => {
        if (tegak) {
          b.slot = { x: -batas.W * 0.66, y: batas.atas - tinggi * (0.1 + k * 0.4) };
          b.ukuran = Math.min(tinggi * 0.09, batas.W * 0.18);
        } else {
          b.slot = { x: (k - 1) * batas.W * 0.6, y: batas.atas - tinggi * 0.2 };
          b.ukuran = Math.min(tinggi * 0.2, batas.W * 0.14);
        }
        b.tegak = tegak;
      });
    }

    function hapusSemuaBalon() {
      balon.forEach((b) => { scene.remove(b.grup); b.mat.dispose(); });
      balon = [];
      elLabel.innerHTML = "";
    }

    /** munculkan 3 balon baru dari bawah layar */
    function tiupBalon(isi, mati = -1) {
      hapusSemuaBalon();
      balon = isi.map((x, i) => buatBalon(x.teks, i, x.ikon));
      aturBatas();
      susunSlot();
      balon.forEach((b, k) => {
        b.grup.position.set(b.slot.x, batas.bawah - 8 - k * 1.5, 0);
        if (k === mati) jadikanKempis(b, true);
      });
      g.musik.efek(300, 600, 0.3, 0.04, "sine");
    }

    function jadikanKempis(b, langsung) {
      b.keadaan = "kempis";
      b.el.disabled = true;
      b.el.classList.add("is-mati");
      if (langsung) b.kempis = 1;
    }

    /* ================================================================
       STATE & ALUR SOAL
       ================================================================ */
    let idx = 0;
    let langkah = 1;        // 1 = pilih kalimat, 2 = pilih jenis majas
    let salahKalimat = 0;
    let poinSoal = 0;
    let langkahBenar = 0;
    let terkunci = false;
    const rekap = [];

    function mulaiSoal() {
      const s = soal[idx];
      langkah = 1; salahKalimat = 0; poinSoal = 0; terkunci = false;
      // muat diam-diam gambar soal BERIKUTNYA selagi siswa mengerjakan soal ini,
      // biar pas pindah soal gambarnya langsung muncul (gak nunggu internet)
      if (soal[idx + 1]) new Image().src = soal[idx + 1].gambar;
      api.soalKe(idx);
      api.hapusPetunjuk();
      g.papan(`
        <div class="papan-judul"><span class="papan-langkah">1</span> Kalimat mana yang cocok dengan gambar ini?</div>
        <img class="papan-gambar-besar" src="${s.gambar}" width="880" height="657" decoding="async" alt="${esc(s.deskripsiGambar)}"
          onload="window.__aturBalon && window.__aturBalon()"
          onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'papan-gambar-besar is-kosong',textContent:'🖼️ ' + this.alt}))">`);
      tiupBalon(s.pilihan.map((p) => ({ teks: p })));
      if (idx > 0) g.sorak(`Soal ${idx + 1}! 🎈`, "level");
      api.guru(idx === 0
        ? "Lihat gambarnya, lalu ketuk balon kalimat yang cocok! 🎈"
        : api.acak(["Gambar baru! Balon mana yang cocok? 🔍", "Ayo pecahkan balon yang benar! 🎈", "Lihat gambarnya baik-baik, ya!"]),
        { poseAkhir: "nunjuk" });
    }
    window.__aturBalon = () => aturBatas();

    function mulaiLangkah2() {
      const s = soal[idx];
      langkah = 2; terkunci = false;
      api.hapusPetunjuk();
      g.papan(`
        <div class="papan-judul"><span class="papan-langkah">2</span> Kalimat ini memakai majas apa?</div>
        <div class="papan-isi">
          <img class="papan-gambar" src="${s.gambar}" width="880" height="657" decoding="async" alt="" onerror="this.remove()">
          <p class="papan-kutipan">“${esc(s.pilihan[s.jawaban])}”</p>
        </div>`);
      tiupBalon(JENIS_MAJAS.map((m) => ({ teks: m, ikon: GAYA_MAJAS[m].ikon })));
      api.guru("Sekarang pecahkan balon jenis majasnya! 🤔", { poseAkhir: "nunjuk" });
    }

    // keyboard: 1/2/3
    g.dengar(document, "keydown", (e) => {
      const i = { "1": 0, "2": 1, "3": 2 }[e.key];
      if (i !== undefined) pilih(i);
    });
    // ketuk bola balonnya langsung (selain ketuk tulisannya)
    g.dengar(g.wadah, "pointerdown", (e) => {
      if (e.target.closest("button, .kuis-umpan, .lapis-jeda")) return;
      const r = g.wadah.getBoundingClientRect();
      const sk = r.width / g.wadah.clientWidth || 1;
      const ray = dunia.ray((e.clientX - r.left) / sk, (e.clientY - r.top) / sk);
      const kena = ray.intersectObjects(balon.map((b) => b.bola))[0];
      if (kena) pilih(balon.find((b) => b.bola === kena.object).i);
    });

    function pilih(i) {
      const b = balon[i];
      if (!b || terkunci || dunia.jeda || b.keadaan === "kempis" || b.keadaan === "meletus") return;
      const s = soal[idx];
      const benar = langkah === 1 ? i === s.jawaban : JENIS_MAJAS[i] === s.majas;
      if (benar) {
        letuskan(b, true);
        poinSoal += 10; langkahBenar++;
        const p = dunia.keLayar(b.grup.position);
        g.poin(10, p.x, p.y);
        g.benar();
        api.suara.benar();
        api.guruLompat();
        if (langkah === 1) {
          api.guru(salahKalimat ? "Nah, itu dia! Benar! 👏" : api.acak(["Dor! Tepat sekali! 🎉", "Benar! Matamu jeli! 👀", "Hebat! Kalimatnya cocok! 🎈"]));
          terkunci = true;
          setTimeout(mulaiLangkah2, 1300);
        } else {
          api.guru(poinSoal === 20 ? `Sempurna, ${api.namaPanggilan}! Dua-duanya benar! 🌟` : "Benar! Jenis majasnya tepat! 👏");
          selesaiSoal(true);
        }
        return;
      }
      // salah
      jadikanKempis(b);
      api.suara.salah();
      g.salah();
      if (langkah === 1) {
        salahKalimat++;
        if (salahKalimat === 1) {
          api.guru("Ups, balonnya kempis! Baca petunjuknya, lalu coba lagi! 💡", { poseAkhir: "bicara" });
          api.petunjuk(s.petunjuk);
        } else {
          terkunci = true;
          tunjukkanBenar(balon[s.jawaban]);
          api.guru("Gak apa-apa! Ini balon yang benar. Lanjut ke langkah 2, ya!", { poseAkhir: "nunjuk" });
          setTimeout(mulaiLangkah2, 2400);
        }
      } else {
        terkunci = true;
        tunjukkanBenar(balon[JENIS_MAJAS.indexOf(s.majas)]);
        api.guru(`Belum tepat. Jawabannya ${s.majas}. Baca penjelasannya, ya! 💡`, { poseAkhir: "bicara" });
        selesaiSoal(false);
      }
    }

    /** balon yang benar bersinar sebentar lalu meletus sendiri (tanpa poin) */
    function tunjukkanBenar(b) {
      b.sinar = 1.4;
      b.el.classList.add("is-benar");
      setTimeout(() => letuskan(b, false), 1300);
    }

    function letuskan(b, keras) {
      b.keadaan = "meletus";
      b.el.classList.add("is-meletus");
      partikel.ledak(b.grup.position.clone(), { jumlah: ringan ? 30 : (keras ? 70 : 35), kuat: keras ? 8 : 5, warna: keras ? null : WARNA_BALON[b.i] });
      b.grup.visible = false;
      g.musik.efek(900, 120, 0.18, keras ? 0.12 : 0.06, "square");
      if (keras) dunia.getar(0.3);
    }

    function selesaiSoal(benarMajas) {
      const s = soal[idx];
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
          tombol: terakhir ? "Lihat Skor" : "Balon Berikutnya",
          onLanjut: () => {
            api.hapusUmpan();
            if (terakhir) {
              hapusSemuaBalon();
              g.bersihkan();
              delete window.__aturBalon;
              api.selesai({ rekap, benar: langkahBenar, dari: soal.length * 2, satuan: "langkah" });
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
      awan.forEach((a) => { a.position.x += dt * a.userData.laju; if (a.position.x > 30) a.position.x = -30; });

      balon.forEach((b) => {
        if (b.keadaan === "meletus") { b.el.style.opacity = 0; return; }
        b.fase += dt;
        const tx = b.slot.x + Math.sin(b.fase * 0.9) * 0.15;
        const ty = b.slot.y + Math.sin(b.fase * 1.4) * 0.18;
        if (b.keadaan === "naik") {
          b.grup.position.x = lerp(b.grup.position.x, tx, dt * 3);
          b.grup.position.y = lerp(b.grup.position.y, ty, dt * 2.2);
          if (Math.abs(b.grup.position.y - ty) < 0.15) b.keadaan = "melayang";
        } else {
          b.grup.position.x = lerp(b.grup.position.x, tx, dt * 4);
          b.grup.position.y = lerp(b.grup.position.y, ty - (b.keadaan === "kempis" ? 0.6 : 0), dt * 4);
        }
        // kempis: mengecil & jadi abu-abu
        if (b.keadaan === "kempis") {
          b.kempis = Math.min(1, b.kempis + dt * 2);
          b.mat.color.lerp(new THREE.Color(0xc9c3e0), dt * 3);
        }
        const s = b.ukuran * (1 - b.kempis * 0.35) * (b.sinar > 0 ? 1 + Math.sin(t * 14) * 0.06 : 1);
        b.grup.scale.setScalar(s);
        b.grup.rotation.z = Math.sin(b.fase * 1.1) * 0.08;
        if (b.sinar > 0) {
          b.sinar -= dt;
          b.mat.emissive.setHex(Math.sin(t * 14) > 0 ? 0x666600 : 0x000000);
        }
        // label HTML ikut posisi balon. Layar lebar: di BAWAH bola balon (gak
        // nutupin); HP: di samping kanan balon (lihat CSS .is-tegak)
        const p = dunia.keLayar(b.grup.position);
        let yLabel = p.y;
        if (!b.tegak) yLabel = dunia.keLayar(b.grup.position.clone().add(new THREE.Vector3(0, -s * 1.2, 0))).y + 6;
        b.el.style.transform = `translate(${p.x}px, ${yLabel}px)`;
        b.el.style.opacity = b.keadaan === "naik" && b.grup.position.y < batas.bawah ? 0 : 1;
      });
      partikel.update(dt);
    }

    // kait tes otomatis (cuma aktif kalau alamat halaman ada "uji3d")
    if (/uji3d/.test(location.search)) window.__uji1 = { pilih, langkah: () => langkah };

    mulaiSoal();
  },
};
