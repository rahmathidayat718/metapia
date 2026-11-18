/* ==========================================================================
   METAPIA — game-tebak.js
   GAME 1 versi 2D: PECAH BALON MAJAS (MENGENALI)
   (versi 3D-nya: js/game3d/pecah-balon.js — namanya sama)
   Tiap soal:
   1) Gambar muncul (efek kartu dibalik)
   2) Langkah 1: 3 BALON kalimat (A, B, C) melayang goyang tipis. Ketuk balon
      yang cocok dengan gambar -> balon PECAH (suara "dor!").
      Benar -> pecahannya jadi tanda benar (hijau). Salah -> tanda salah +
      petunjuk, boleh coba 1x lagi. Salah lagi -> balon yang benar pecah
      sendiri & ditunjukkan (0 poin).
   3) Langkah 2: 3 BALON jenis majas. 1x kesempatan.
   Skor: langkah 1 benar +10, langkah 2 benar +10 (maks 100).
   Data soal: DATA_GAME[1] di js/game-data.js
   ========================================================================== */

Game.daftar(1, {
  main(api) {
    const soal = api.data.soal;
    const HURUF = ["A", "B", "C"];
    const WARNA_BALON = ["kuning", "biru", "pink"];
    let idx = 0;
    let langkahBenar = 0; // total langkah benar (dari 10)
    const rekap = [];

    /** langkah 1: balon bulat berhuruf (A/B/C) + talinya mengikat kartu kalimat */
    const htmlBalonKalimat = (warna, huruf, kalimat, i) => `
      <button class="balon-2d warna-${warna}" data-i="${i}">
        <span class="balon-bulat"><span class="balon-label">${huruf}</span></span>
        <span class="balon-isi">${kalimat}</span>
      </button>`;
    /** langkah 2: balon besar berisi ikon + nama jenis majas */
    const htmlBalonMajas = (warna, ikon, nama) => `
      <button class="balon-2d balon-besar warna-${warna}" data-majas="${nama}">
        <span class="balon-bulat"><span class="balon-label">${ikon}</span><span class="balon-nama">${nama}</span></span>
      </button>`;

    /** balon pecah (+ suara), lalu berubah jadi tanda benar / salah */
    function pecahkan(btn, status) {
      btn.classList.add("is-pecah");
      api.suara.pecah();
      setTimeout(() => btn.classList.add(status), 260);
    }

    function tampilkanSoal() {
      const s = soal[idx];
      let salahLangkah1 = 0;
      let poinSoal = 0;
      api.soalKe(idx);
      // muat diam-diam gambar soal BERIKUTNYA selagi siswa mengerjakan soal ini,
      // biar pas pindah soal gambarnya langsung muncul (gak nunggu internet)
      if (soal[idx + 1]) new Image().src = soal[idx + 1].gambar;

      api.body.innerHTML = `
        <div class="tg">
          <figure class="tg-gambar">
            <span class="tg-selotip"></span>
            <img src="${s.gambar}" width="880" height="657" decoding="async" alt="${api.esc(s.deskripsiGambar)}" draggable="false">
          </figure>

          <div class="tg-sisi">
            <div class="langkah-judul"><span class="langkah-no">1</span> Pecahkan balon kalimat yang cocok dengan gambar!</div>
            <div class="tg-opsi">
              ${s.pilihan.map((p, i) => htmlBalonKalimat(WARNA_BALON[i], HURUF[i], api.esc(p), i)).join("")}
            </div>

            <div class="tg-langkah2" hidden>
              <div class="langkah-judul"><span class="langkah-no">2</span> Pecahkan balon jenis majasnya!</div>
              <div class="balon-baris">
                ${JENIS_MAJAS.map((m) => htmlBalonMajas(GAYA_MAJAS[m].warna, GAYA_MAJAS[m].ikon, m)).join("")}
              </div>
            </div>
          </div>
        </div>`;

      // gambar belum ada / gagal dimuat -> placeholder berisi deskripsi
      const img = api.body.querySelector(".tg-gambar img");
      img.addEventListener("error", () => {
        img.replaceWith(Object.assign(document.createElement("div"), {
          className: "tg-placeholder",
          innerHTML: `<i class="fa-regular fa-image"></i><p>${api.esc(s.deskripsiGambar)}</p>`,
        }));
      });

      api.guru(
        idx === 0 ? "Perhatikan gambarnya, lalu pecahkan balon kalimat yang cocok! 🎈" :
        api.acak(["Gambar baru! Balon mana yang cocok?", "Lihat gambarnya dulu, lalu pecahkan balonnya!", "Ayo pecahkan balon lagi! 🎈"]),
        { poseAkhir: "nunjuk" }
      );

      /* ---------- LANGKAH 1: pilih balon kalimat ---------- */
      const tombolOpsi = [...api.body.querySelectorAll(".tg-opsi .balon-2d")];
      tombolOpsi.forEach((btn) => btn.addEventListener("click", () => pilihKalimat(Number(btn.dataset.i), btn)));

      function pilihKalimat(i, btn) {
        api.hapusPetunjuk();
        if (i === s.jawaban) {
          tombolOpsi.forEach((b) => (b.disabled = true));
          pecahkan(btn, "is-benar");
          poinSoal += 10;
          langkahBenar++;
          api.tambahSkor(10, btn);
          setTimeout(() => api.suara.benar(), 200);
          api.guruLompat();
          api.guru(salahLangkah1 ? "Nah, itu dia! Benar! 👏" : api.acak(["Dor! Tepat sekali! 🎉", "Benar! Matamu jeli! 👀", "Hebat! Kalimatnya cocok! 🎈"]));
          setTimeout(bukaLangkah2, 1000);
          return;
        }

        salahLangkah1++;
        btn.disabled = true;
        pecahkan(btn, "is-salah");
        setTimeout(() => api.suara.salah(), 200);

        if (salahLangkah1 === 1) {
          api.guru("Aduh, bukan balon itu! Baca petunjuknya, lalu coba sekali lagi! 💡", { poseAkhir: "bicara" });
          api.petunjuk(s.petunjuk);
        } else {
          // salah 2x -> balon yang benar pecah sendiri & ditunjukkan, 0 poin
          tombolOpsi.forEach((b) => (b.disabled = true));
          setTimeout(() => pecahkan(tombolOpsi[s.jawaban], "is-benar"), 700);
          setTimeout(() => tombolOpsi[s.jawaban].classList.add("is-ditunjukkan"), 1000);
          api.guru("Tidak apa-apa! Ini kalimat yang cocok. Lanjut ke langkah 2, ya!", { poseAkhir: "nunjuk" });
          setTimeout(bukaLangkah2, 1800);
        }
      }

      /* ---------- LANGKAH 2: pilih balon jenis majas ---------- */
      function bukaLangkah2() {
        const el = api.body.querySelector(".tg-langkah2");
        el.hidden = false;
        api.suara.ambil();
        api.guru("Sekarang pecahkan balon jenis majasnya! 🤔", { poseAkhir: "nunjuk" });
        el.querySelectorAll(".balon-2d").forEach((btn) => btn.addEventListener("click", () => pilihMajas(btn)));
      }

      function pilihMajas(btn) {
        const semua = [...api.body.querySelectorAll(".tg-langkah2 .balon-2d")];
        semua.forEach((b) => (b.disabled = true));
        const benar = btn.dataset.majas === s.majas;

        if (benar) {
          pecahkan(btn, "is-benar");
          poinSoal += 10;
          langkahBenar++;
          api.tambahSkor(10, btn);
          setTimeout(() => api.suara.benar(), 200);
          api.guruLompat();
          api.guru(poinSoal === 20 ? `Sempurna, ${api.namaPanggilan}! Dua-duanya benar! 🌟` : "Benar! Jenis majasnya tepat! 👏");
        } else {
          pecahkan(btn, "is-salah");
          setTimeout(() => api.suara.salah(), 200);
          const btnBenar = semua.find((b) => b.dataset.majas === s.majas);
          setTimeout(() => pecahkan(btnBenar, "is-benar"), 700);
          setTimeout(() => btnBenar.classList.add("is-ditunjukkan"), 1000);
          api.guru(`Belum tepat. Jawabannya ${s.majas}. Baca penjelasannya, ya! 💡`, { poseAkhir: "bicara" });
        }

        const status = poinSoal === 20 ? "penuh" : poinSoal > 0 ? "sebagian" : "nol";
        rekap.push(status);
        api.tandaiSoal(idx, status);

        const terakhir = idx === soal.length - 1;
        api.umpan({
          jenis: benar ? "benar" : "salah",
          judul: `${s.majas}! ${poinSoal > 0 ? `+${poinSoal} poin` : "0 poin"}`,
          teks: s.pembahasan,
          tombol: terakhir ? "Lihat Skor" : "Lanjut",
          onLanjut: () => {
            if (terakhir) {
              api.selesai({ rekap, benar: langkahBenar, dari: soal.length * 2, satuan: "langkah" });
            } else {
              idx++;
              tampilkanSoal();
            }
          },
        });
      }
    }

    tampilkanSoal();
  },
});
