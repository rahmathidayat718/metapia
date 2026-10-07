/* ==========================================================================
   METAPIA — game-ubah.js
   GAME 3: UBAH KALIMATKU (MENERAPKAN)
   Tiap soal: kalimat biasa + jenis majas yang diminta -> pilih 1 dari 3
   kalimat bermajas. Salah -> pilihan ditandai, petunjuk, coba lagi
   (maks 3 percobaan). Benar -> "kartu mantra" berubah jadi kalimat bermajas.
   Skor: percobaan 1 = 3 bintang (20 poin), 2 = 2 bintang (10), 3 = 1 bintang (5)
   Maks 100 poin / 15 bintang. Data soal: DATA_GAME[3] di js/game-data.js
   ========================================================================== */

Game.daftar(3, {
  main(api) {
    const soal = api.data.soal;
    const HURUF = ["A", "B", "C"];
    const POIN = [20, 10, 5];
    const MAKS_COBA = 3;
    let idx = 0;
    let totalBintang = 0;
    let jumlahBenar = 0;
    const rekap = [];

    api.bintang(0);

    function tampilkanSoal() {
      const s = soal[idx];
      const gaya = GAYA_MAJAS[s.target];
      let salah = 0;
      let terkunci = false;
      api.soalKe(idx);

      api.body.innerHTML = `
        <div class="uk">
          <div class="uk-mantra">
            <div class="uk-asal">
              <span class="uk-tag">Kalimat biasa</span>
              <p>“${api.esc(s.kalimatBiasa)}”</p>
            </div>
            <div class="uk-tongkat">🪄</div>
            <div class="uk-target warna-${gaya.warna}">
              <span class="uk-tag">Ubah jadi</span>
              <b>${gaya.ikon} ${s.target}</b>
            </div>
          </div>

          <div class="uk-bintang-soal" aria-label="Bintang soal ini">
            <span>Bintang soal ini:</span>
            <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
          </div>

          <div class="uk-opsi">
            ${s.pilihan.map((p, i) => `
              <button class="uk-pilihan" data-i="${i}">
                <span class="opsi-huruf">${HURUF[i]}</span>
                <span class="uk-pilihan-teks">${api.esc(p)}</span>
              </button>`).join("")}
          </div>
        </div>`;

      const tombol = [...api.body.querySelectorAll(".uk-pilihan")];
      const bintangSoal = [...api.body.querySelectorAll(".uk-bintang-soal i")];

      api.guru(
        idx === 0 ? `Ayo pakai tongkat ajaibmu! Ubah kalimatnya jadi ${s.target}! 🪄` :
        api.acak([`Kali ini ubah jadi ${s.target}, ya!`, `Kalimat ${s.target} yang mana, nih? ✨`, "Ayo, sihir kalimatnya! 🪄"]),
        { poseAkhir: "nunjuk" }
      );

      tombol.forEach((btn) => btn.addEventListener("click", () => pilih(Number(btn.dataset.i), btn)));

      function pilih(i, btn) {
        if (terkunci) return;

        if (i === s.jawaban) {
          const bintang = MAKS_COBA - salah; // 3 / 2 / 1
          const poin = POIN[salah];
          terkunci = true;
          tombol.forEach((b) => (b.disabled = true));
          btn.classList.add("is-benar");
          jumlahBenar++;
          totalBintang += bintang;
          api.bintang(totalBintang);
          api.tambahSkor(poin, btn);
          api.suara.benar();
          api.guruLompat();
          ubahKartu(s.pilihan[s.jawaban]);
          api.guru(salah === 0 ? api.acak([`Sihirnya berhasil, ${api.namaPanggilan}! ✨`, "Wuih, langsung benar! 3 bintang! 🌟", "Hebat! Kalimatnya jadi bermajas! 🪄"]) : "Nah, berhasil! Kalimatnya sudah berubah! ✨");
          selesai(salah === 0 ? "penuh" : "sebagian", bintang, poin, true);
          return;
        }

        // salah: tandai, 1 bintang soal ini rontok, kasih petunjuk
        salah++;
        btn.classList.add("is-salah");
        btn.disabled = true;
        const rontok = bintangSoal[MAKS_COBA - salah];
        if (rontok) rontok.classList.add("is-rontok");
        api.suara.salah();

        if (salah < MAKS_COBA) {
          api.guru(`Hmm, belum tepat. Bintangnya tinggal ${MAKS_COBA - salah}. Ayo coba lagi! 💡`, { poseAkhir: "bicara" });
          api.petunjuk(s.petunjuk);
        } else {
          // (jaga-jaga, dengan 3 pilihan harusnya gak sampai sini)
          terkunci = true;
          tombol.forEach((b) => (b.disabled = true));
          tombol[s.jawaban].classList.add("is-benar", "is-ditunjukkan");
          ubahKartu(s.pilihan[s.jawaban]);
          api.guru("Gak apa-apa! Ini jawaban yang benar. 💡", { poseAkhir: "nunjuk" });
          selesai("nol", 0, 0, false);
        }
      }

      /** efek sihir: kartu "kalimat biasa" berubah jadi kalimat bermajas */
      function ubahKartu(kalimatBaru) {
        const asal = api.body.querySelector(".uk-asal");
        asal.classList.add("is-berubah");
        setTimeout(() => {
          asal.innerHTML = `<span class="uk-tag">✨ Kalimat ${api.esc(s.target)}</span><p>“${api.esc(kalimatBaru)}”</p>`;
        }, 250);
      }

      function selesai(status, bintang, poin, benar) {
        rekap.push(status);
        api.tandaiSoal(idx, status);
        const terakhir = idx === soal.length - 1;
        api.umpan({
          jenis: benar ? "benar" : "salah",
          judul: benar ? `${"⭐".repeat(bintang)} +${poin} poin` : "0 poin",
          teks: s.pembahasan,
          tombol: terakhir ? "Lihat Skor" : "Lanjut",
          onLanjut: () => {
            if (terakhir) {
              api.selesai({ rekap, benar: jumlahBenar, dari: soal.length, satuan: "soal", bintang: totalBintang });
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
