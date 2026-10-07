/* ==========================================================================
   METAPIA — game-tebak.js
   GAME 1: TEBAK GAMBAR (MENGENALI)
   Tiap soal:
   1) Gambar muncul (efek kartu dibalik)
   2) Langkah 1: pilih kalimat yang cocok (3 balon kata). Salah -> petunjuk,
      boleh coba 1x lagi. Salah lagi -> jawaban benar ditunjukkan (0 poin).
   3) Langkah 2: tebak jenis majas (3 "stempel"). 1x kesempatan.
   Skor: langkah 1 benar +10, langkah 2 benar +10 (maks 100).
   Data soal: DATA_GAME[1] di js/game-data.js
   ========================================================================== */

Game.daftar(1, {
  main(api) {
    const soal = api.data.soal;
    const HURUF = ["A", "B", "C"];
    let idx = 0;
    let langkahBenar = 0; // total langkah benar (dari 10)
    const rekap = [];

    function tampilkanSoal() {
      const s = soal[idx];
      let salahLangkah1 = 0;
      let poinSoal = 0;
      api.soalKe(idx);

      api.body.innerHTML = `
        <div class="tg">
          <figure class="tg-gambar">
            <span class="tg-selotip"></span>
            <img src="${s.gambar}" alt="${api.esc(s.deskripsiGambar)}" draggable="false">
          </figure>

          <div class="tg-sisi">
            <div class="langkah-judul"><span class="langkah-no">1</span> Kalimat mana yang cocok dengan gambar?</div>
            <div class="tg-opsi">
              ${s.pilihan.map((p, i) => `
                <button class="gelembung" data-i="${i}">
                  <span class="gelembung-huruf">${HURUF[i]}</span>
                  <span>${api.esc(p)}</span>
                </button>`).join("")}
            </div>

            <div class="tg-langkah2" hidden>
              <div class="langkah-judul"><span class="langkah-no">2</span> Kalimat itu memakai majas apa?</div>
              <div class="stempel-baris">
                ${JENIS_MAJAS.map((m) => `
                  <button class="stempel warna-${GAYA_MAJAS[m].warna}" data-majas="${m}">
                    <span class="stempel-ikon">${GAYA_MAJAS[m].ikon}</span>
                    <span>${m}</span>
                  </button>`).join("")}
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
        idx === 0 ? "Perhatikan gambarnya baik-baik! Kalimat mana yang cocok?" :
        api.acak(["Gambar baru! Kalimat mana yang cocok?", "Lihat gambarnya dulu, lalu pilih kalimatnya!", "Ayo tebak lagi! 🔍"]),
        { poseAkhir: "nunjuk" }
      );

      /* ---------- LANGKAH 1: pilih kalimat ---------- */
      const tombolOpsi = [...api.body.querySelectorAll(".gelembung")];
      tombolOpsi.forEach((btn) => btn.addEventListener("click", () => pilihKalimat(Number(btn.dataset.i), btn)));

      function pilihKalimat(i, btn) {
        api.hapusPetunjuk();
        if (i === s.jawaban) {
          btn.classList.add("is-benar");
          tombolOpsi.forEach((b) => (b.disabled = true));
          poinSoal += 10;
          langkahBenar++;
          api.tambahSkor(10, btn);
          api.suara.benar();
          api.guruLompat();
          api.guru(salahLangkah1 ? "Nah, itu dia! Benar! 👏" : api.acak(["Tepat sekali! 🎉", "Benar! Matamu jeli! 👀", "Hebat! Kalimatnya cocok!"]));
          setTimeout(bukaLangkah2, 900);
          return;
        }

        salahLangkah1++;
        btn.classList.add("is-salah");
        btn.disabled = true;
        api.suara.salah();

        if (salahLangkah1 === 1) {
          api.guru("Hmm, belum tepat. Baca petunjuknya, lalu coba sekali lagi! 💡", { poseAkhir: "bicara" });
          api.petunjuk(s.petunjuk);
        } else {
          // salah 2x -> tunjukkan jawaban benar, 0 poin untuk langkah ini
          tombolOpsi.forEach((b) => (b.disabled = true));
          tombolOpsi[s.jawaban].classList.add("is-benar", "is-ditunjukkan");
          api.guru("Gak apa-apa! Ini kalimat yang cocok. Lanjut ke langkah 2, ya!", { poseAkhir: "nunjuk" });
          setTimeout(bukaLangkah2, 1400);
        }
      }

      /* ---------- LANGKAH 2: tebak jenis majas ---------- */
      function bukaLangkah2() {
        const el = api.body.querySelector(".tg-langkah2");
        el.hidden = false;
        api.suara.ambil();
        api.guru("Sekarang tebak: kalimat itu majas apa? 🤔", { poseAkhir: "nunjuk" });
        el.querySelectorAll(".stempel").forEach((btn) => btn.addEventListener("click", () => pilihMajas(btn)));
      }

      function pilihMajas(btn) {
        const semua = [...api.body.querySelectorAll(".stempel")];
        semua.forEach((b) => (b.disabled = true));
        const benar = btn.dataset.majas === s.majas;

        if (benar) {
          btn.classList.add("is-benar");
          poinSoal += 10;
          langkahBenar++;
          api.tambahSkor(10, btn);
          api.suara.benar();
          api.guruLompat();
          api.guru(poinSoal === 20 ? `Sempurna, ${api.namaPanggilan}! Dua-duanya benar! 🌟` : "Benar! Jenis majasnya tepat! 👏");
        } else {
          btn.classList.add("is-salah");
          semua.find((b) => b.dataset.majas === s.majas).classList.add("is-benar", "is-ditunjukkan");
          api.suara.salah();
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
