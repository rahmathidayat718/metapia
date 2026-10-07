/* ==========================================================================
   METAPIA — game-keranjang.js
   GAME 2: KERANJANG MAJAS (MENGELOMPOKKAN)
   Tiap soal: 1 kartu kalimat -> diseret ke 1 dari 3 keranjang.
   - Seret pakai mouse ATAU jari (Pointer Events, bukan HTML5 drag)
   - Alternatif: ketuk kartu, lalu ketuk keranjang
   - Benar  : kartu masuk keranjang, +20 (percobaan 1) / +10 (percobaan 2)
   - Salah  : kartu mantul balik + petunjuk. Salah ke-2: keranjang yang benar
              ditunjukkan, 0 poin
   - Waktu  : 30 detik per soal. Habis = 0 poin, jawaban ditunjukkan
   Data soal: DATA_GAME[2] di js/game-data.js
   ========================================================================== */

Game.daftar(2, {
  main(api) {
    const soal = api.data.soal;
    const DETIK = api.data.detikPerSoal || 30;
    let idx = 0;
    let jumlahBenar = 0;
    const rekap = [];
    const masuk = []; // isi rak "Sudah masuk"
    let timer = null;

    Game.saatKeluar = () => clearInterval(timer);

    function tampilkanSoal() {
      const s = soal[idx];
      let percobaan = 0;
      let terkunci = false;
      let sisa = DETIK;
      api.soalKe(idx);

      api.body.innerHTML = `
        <div class="kr">
          <div class="kr-atas">
            <div class="kr-slot">
              <div class="kr-kartu" tabindex="0" role="button" aria-label="Kartu kalimat: ${api.esc(s.kalimat)}. Seret ke keranjang, atau tekan lalu pilih keranjang.">
                <span class="kr-pegangan"><i class="fa-solid fa-hand"></i> Seret aku!</span>
                <p>“${api.esc(s.kalimat)}”</p>
              </div>
            </div>
          </div>

          <div class="kr-keranjang-baris">
            ${JENIS_MAJAS.map((m) => `
              <button class="keranjang warna-${GAYA_MAJAS[m].warna}" data-majas="${m}">
                <span class="keranjang-gagang"></span>
                <span class="keranjang-badan">
                  <span class="keranjang-ikon">${GAYA_MAJAS[m].ikon}</span>
                  <span class="keranjang-nama">${m}</span>
                </span>
              </button>`).join("")}
          </div>

          <div class="kr-rak">
            <span class="kr-rak-judul"><i class="fa-solid fa-box-archive"></i> Sudah masuk:</span>
            ${masuk.length ? masuk.map((m) => `<span class="kr-chip warna-${GAYA_MAJAS[m.majas].warna}" title="${api.esc(m.kalimat)}">${GAYA_MAJAS[m.majas].ikon} ${api.esc(m.kalimat)}</span>`).join("") : `<span class="kr-rak-kosong">belum ada</span>`}
          </div>
        </div>`;

      const kartu = api.body.querySelector(".kr-kartu");
      const keranjang = [...api.body.querySelectorAll(".keranjang")];

      api.guru(
        idx === 0 ? "Seret kartunya ke keranjang majas yang tepat! Cepat, ada waktunya! ⏱️" :
        api.acak(["Kartu baru! Masuk keranjang mana, ya?", "Ayo, seret ke keranjang yang tepat!", "Cepat tapi teliti, ya! 🧺"]),
        { poseAkhir: "nunjuk" }
      );

      /* ---------- TIMER 30 detik ---------- */
      clearInterval(timer);
      api.waktu(sisa, DETIK);
      timer = setInterval(() => {
        sisa--;
        api.waktu(sisa, DETIK);
        if (sisa > 0 && sisa <= 5) api.suara.tik();
        if (sisa <= 0) {
          clearInterval(timer);
          if (!terkunci) waktuHabis();
        }
      }, 1000);

      /* ---------- SERET (mouse + sentuh) ---------- */
      let mulaiX = 0, mulaiY = 0, menyeret = false, ditekan = false;
      let keranjangSorot = null;

      kartu.addEventListener("pointerdown", (e) => {
        if (terkunci) return;
        ditekan = true;
        menyeret = false;
        mulaiX = e.clientX;
        mulaiY = e.clientY;
        kartu.setPointerCapture(e.pointerId);
      });

      kartu.addEventListener("pointermove", (e) => {
        if (!ditekan || terkunci) return;
        const dx = e.clientX - mulaiX;
        const dy = e.clientY - mulaiY;
        if (!menyeret && Math.hypot(dx, dy) > 6) {
          menyeret = true;
          kartu.classList.remove("is-dipilih");
          kartu.classList.add("is-seret");
          api.suara.ambil();
        }
        if (!menyeret) return;
        // halaman bisa di-zoom di layar besar -> geseran dibagi skala biar pas di bawah jari
        const sk = api.skalaHalaman();
        kartu.style.transform = `translate(${dx / sk}px, ${dy / sk}px) rotate(${Math.max(-8, Math.min(8, dx / 25))}deg)`;
        sorot(keranjangDiTitik(e.clientX, e.clientY));
      });

      kartu.addEventListener("pointerup", (e) => {
        if (!ditekan) return;
        ditekan = false;
        if (terkunci) return;
        if (menyeret) {
          const target = keranjangDiTitik(e.clientX, e.clientY);
          kartu.classList.remove("is-seret");
          sorot(null);
          if (target) jatuhkan(target);
          else kembalikanKartu();
        } else {
          // cuma diketuk -> mode "ketuk kartu, lalu ketuk keranjang"
          pilihKartu();
        }
      });

      kartu.addEventListener("pointercancel", () => {
        ditekan = false;
        kartu.classList.remove("is-seret");
        sorot(null);
        kembalikanKartu();
      });

      // keyboard: Enter/Spasi = pilih kartu
      kartu.addEventListener("keydown", (e) => {
        if ((e.key === "Enter" || e.key === " ") && !terkunci) {
          e.preventDefault();
          pilihKartu();
        }
      });

      /* ---------- KETUK KERANJANG ---------- */
      keranjang.forEach((k) => k.addEventListener("click", () => {
        if (terkunci) return;
        if (!kartu.classList.contains("is-dipilih")) {
          k.classList.remove("is-goyang");
          void k.offsetWidth;
          k.classList.add("is-goyang");
          api.guru("Seret kartunya ke sini, atau ketuk kartunya dulu, ya! 😊");
          return;
        }
        kartu.classList.remove("is-dipilih");
        jatuhkan(k);
      }));

      function pilihKartu() {
        const dipilih = kartu.classList.toggle("is-dipilih");
        api.suara.klik();
        if (dipilih) api.guru("Sekarang ketuk keranjang yang tepat! 🧺", { poseAkhir: "nunjuk" });
      }

      /** keranjang yang ada di bawah jari/kursor (kartu disembunyiin sebentar biar gak ketutup) */
      function keranjangDiTitik(x, y) {
        kartu.style.visibility = "hidden";
        const el = document.elementFromPoint(x, y);
        kartu.style.visibility = "";
        return el ? el.closest(".keranjang") : null;
      }

      function sorot(k) {
        if (k === keranjangSorot) return;
        if (keranjangSorot) keranjangSorot.classList.remove("is-sorot");
        keranjangSorot = k;
        if (k) k.classList.add("is-sorot");
      }

      function kembalikanKartu() {
        kartu.classList.add("is-mantul");
        kartu.style.transform = "";
        setTimeout(() => kartu.classList.remove("is-mantul"), 450);
      }

      /** animasi kartu terbang & mengecil masuk ke keranjang */
      function terbangKe(k) {
        const rk = kartu.getBoundingClientRect();
        const rb = k.getBoundingClientRect();
        const sk = api.skalaHalaman();
        // posisi sekarang (transform) + selisih pusat kartu -> pusat keranjang
        const m = new DOMMatrixReadOnly(getComputedStyle(kartu).transform === "none" ? undefined : getComputedStyle(kartu).transform);
        const dx = m.m41 + (rb.left + rb.width / 2 - (rk.left + rk.width / 2)) / sk;
        const dy = m.m42 + (rb.top + rb.height * 0.45 - (rk.top + rk.height / 2)) / sk;
        kartu.classList.add("is-terbang");
        kartu.style.transform = `translate(${dx}px, ${dy}px) scale(.15) rotate(-10deg)`;
        setTimeout(() => {
          k.classList.add("is-terima");
          setTimeout(() => k.classList.remove("is-terima"), 600);
        }, 380);
      }

      /* ---------- CEK JAWABAN ---------- */
      function jatuhkan(k) {
        percobaan++;
        const benar = k.dataset.majas === s.majas;

        if (benar) {
          const poin = percobaan === 1 ? 20 : 10;
          kunci();
          terbangKe(k);
          setTimeout(() => api.tambahSkor(poin, k), 400);
          api.suara.benar();
          api.guruLompat();
          api.guru(percobaan === 1 ? api.acak([`Masuk! Hebat, ${api.namaPanggilan}! 🎉`, "Tepat sasaran! 🎯", "Yes! Keranjangnya pas! 🧺"]) : "Nah, itu dia! Sekarang benar! 👏");
          selesaiSoal(percobaan === 1 ? "penuh" : "sebagian", poin, true);
          return;
        }

        // salah
        k.classList.remove("is-tolak");
        void k.offsetWidth;
        k.classList.add("is-tolak");
        api.suara.salah();
        kembalikanKartu();

        if (percobaan === 1) {
          api.guru("Ups, bukan di situ! Baca petunjuknya, lalu coba lagi! 💡", { poseAkhir: "bicara" });
          api.petunjuk(s.petunjuk);
        } else {
          tunjukkanJawaban("Belum tepat lagi. Lihat, ini keranjang yang benar! 💡");
        }
      }

      function waktuHabis() {
        api.suara.habis();
        tunjukkanJawaban("Waktunya habis! ⏰ Ini keranjang yang benar.");
      }

      /** salah 2x / waktu habis: keranjang benar disorot, kartu masuk ke sana, 0 poin */
      function tunjukkanJawaban(pesan) {
        kunci();
        const kBenar = keranjang.find((k) => k.dataset.majas === s.majas);
        kBenar.classList.add("is-ditunjukkan");
        api.guru(pesan, { poseAkhir: "nunjuk" });
        setTimeout(() => terbangKe(kBenar), 700);
        selesaiSoal("nol", 0, false);
      }

      function kunci() {
        terkunci = true;
        clearInterval(timer);
        kartu.classList.remove("is-dipilih", "is-seret");
        keranjang.forEach((k) => (k.disabled = true));
      }

      function selesaiSoal(status, poin, benar) {
        if (benar) jumlahBenar++;
        rekap.push(status);
        api.tandaiSoal(idx, status);
        masuk.push({ kalimat: s.kalimat, majas: s.majas });

        const terakhir = idx === soal.length - 1;
        setTimeout(() => {
          api.umpan({
            jenis: benar ? "benar" : "salah",
            judul: `${s.majas}! ${poin ? `+${poin} poin` : "0 poin"}`,
            teks: s.pembahasan,
            tombol: terakhir ? "Lihat Skor" : "Lanjut",
            onLanjut: () => {
              if (terakhir) {
                Game.saatKeluar = null;
                api.selesai({ rekap, benar: jumlahBenar, dari: soal.length, satuan: "soal" });
              } else {
                idx++;
                tampilkanSoal();
              }
            },
          });
        }, 650);
      }
    }

    tampilkanSoal();
  },
});
