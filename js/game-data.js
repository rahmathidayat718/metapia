/* ==========================================================================
   METAPIA — game-data.js
   SEMUA DATA SOAL GAME ada di sini, biar gampang diedit.
   Urutan soal & urutan pilihan jawaban SENGAJA TETAP (gak diacak) karena
   dipakai untuk penelitian.

   Catatan isian:
   - jawaban  : index pilihan yang benar -> 0 = A, 1 = B, 2 = C
   - majas    : harus salah satu dari JENIS_MAJAS di bawah (tulisannya sama)
   - petunjuk : muncul (lewat Kak Rara) waktu siswa salah
   - pembahasan : muncul setelah soal selesai
   ========================================================================== */

/* urutan tombol/keranjang jenis majas (tetap) */
const JENIS_MAJAS = ["Metafora", "Personifikasi", "Hiperbola"];

/* warna & ikon tiap jenis majas (dipakai tombol stempel & keranjang) */
const GAYA_MAJAS = {
  Metafora:      { ikon: "🌟", warna: "kuning" },
  Personifikasi: { ikon: "🗣️", warna: "biru" },
  Hiperbola:     { ikon: "📢", warna: "pink" },
};

const DATA_GAME = {
  /* ======================================================================
     GAME 1 — TEBAK GAMBAR (MENGENALI)
     Langkah 1: pilih kalimat yang cocok dengan gambar (boleh coba 2x)
     Langkah 2: pilih jenis majasnya (1x)
     Skor: langkah 1 benar +10, langkah 2 benar +10 -> maks 100
     ====================================================================== */
  1: {
    id: 1,
    judul: "Tebak Gambar",
    label: "MENGENALI",
    ikon: "🖼️",
    warna: "kuning",
    deskripsi: "Lihat gambarnya, temukan kalimat bermajas yang cocok, lalu tebak jenis majasnya!",
    caraMain: [
      "Perhatikan gambar baik-baik.",
      "Pilih kalimat yang paling cocok dengan gambar.",
      "Tebak jenis majasnya: Metafora, Personifikasi, atau Hiperbola.",
    ],
    soal: [
      {
        gambar: "assets/game/g1-soal1.jpg",
        deskripsiGambar: "Pohon kelapa yang daunnya bergoyang, di sampingnya ada tangan melambai.",
        pilihan: [
          "Daun kelapa jatuh ke tanah.",
          "Daun kelapa melambai-lambai ditiup angin.",
          "Daun kelapa berwarna hijau.",
        ],
        jawaban: 1,
        majas: "Personifikasi",
        petunjuk: "Lihat tangan yang melambai di samping pohon. Daunnya bergerak seperti apa?",
        pembahasan: "Melambai adalah gerakan tangan manusia. Daun kelapa dibuat seolah-olah bisa melambai, jadi ini personifikasi.",
      },
      {
        gambar: "assets/game/g1-soal2.jpg",
        deskripsiGambar: "Bulan dengan dua mata kecil muncul dari balik awan.",
        pilihan: [
          "Bulan mengintip dari balik awan.",
          "Bulan bersinar terang malam ini.",
          "Bulan berbentuk bulat.",
        ],
        jawaban: 0,
        majas: "Personifikasi",
        petunjuk: "Bulannya punya mata dan sedang bersembunyi di balik awan. Sedang apa dia?",
        pembahasan: "Mengintip adalah perbuatan manusia. Bulan dibuat seolah-olah bisa mengintip, jadi ini personifikasi.",
      },
      {
        gambar: "assets/game/g1-soal3.jpg",
        deskripsiGambar: "Anak laki-laki berlari, di belakangnya ada kilatan petir.",
        pilihan: [
          "Anak itu berjalan ke sekolah.",
          "Anak itu memakai sepatu baru.",
          "Anak itu berlari secepat kilat.",
        ],
        jawaban: 2,
        majas: "Hiperbola",
        petunjuk: "Ada kilatan petir di belakang anak itu. Secepat apa larinya?",
        pembahasan: "Tidak ada anak yang benar-benar secepat kilat. Kalimat ini melebih-lebihkan, jadi ini hiperbola.",
      },
      {
        gambar: "assets/game/g1-soal4.jpg",
        deskripsiGambar: "Murid perempuan memegang piala, di atas kepalanya ada bintang besar bersinar.",
        pilihan: [
          "Rina membawa bintang ke kelas.",
          "Rina adalah bintang kelas.",
          "Rina suka melihat bintang.",
        ],
        jawaban: 1,
        majas: "Metafora",
        petunjuk: "Rina memegang piala dan ada bintang di atas kepalanya. Artinya dia murid yang bagaimana?",
        pembahasan: "Rina langsung disebut \"bintang kelas\" tanpa kata seperti. Artinya murid yang berprestasi, jadi ini metafora.",
      },
      {
        gambar: "assets/game/g1-soal5.jpg",
        deskripsiGambar: "Anak duduk di depan tumpukan buku PR yang sangat tinggi sampai menyentuh awan.",
        pilihan: [
          "Tumpukan PR-ku setinggi gunung.",
          "Aku mengerjakan PR di meja.",
          "Buku PR-ku bersampul biru.",
        ],
        jawaban: 0,
        majas: "Hiperbola",
        petunjuk: "Lihat tumpukan PR-nya, tingginya sampai menyentuh awan!",
        pembahasan: "PR tidak mungkin setinggi gunung. Kalimat ini melebih-lebihkan banyaknya PR, jadi ini hiperbola.",
      },
    ],
  },

  /* ======================================================================
     GAME 2 — KERANJANG MAJAS (MENGELOMPOKKAN)
     Seret kartu kalimat ke keranjang yang benar. 30 detik per soal.
     Skor: benar percobaan ke-1 +20, ke-2 +10 -> maks 100
     ====================================================================== */
  2: {
    id: 2,
    judul: "Keranjang Majas",
    label: "MENGELOMPOKKAN",
    ikon: "🧺",
    warna: "biru",
    detikPerSoal: 30,
    deskripsi: "Seret kartu kalimat ke keranjang majas yang tepat sebelum waktunya habis!",
    caraMain: [
      "Seret kartu kalimat ke keranjang yang tepat.",
      "Bisa juga: ketuk kartunya, lalu ketuk keranjangnya.",
      "Cepat! Tiap soal cuma 30 detik.",
    ],
    soal: [
      {
        kalimat: "Tumpukan PR-ku setinggi gunung.",
        majas: "Hiperbola",
        petunjuk: "Apakah PR bisa benar-benar setinggi gunung? Ada yang dilebih-lebihkan, lho!",
        pembahasan: "Tidak ada PR yang benar-benar setinggi gunung. Kalimat ini melebih-lebihkan banyaknya PR.",
      },
      {
        kalimat: "Angin berbisik pelan di telingaku.",
        majas: "Personifikasi",
        petunjuk: "Berbisik itu biasanya dilakukan siapa? Angin dibuat seperti siapa?",
        pembahasan: "Berbisik adalah perbuatan manusia. Angin dibuat seolah-olah bisa berbisik.",
      },
      {
        kalimat: "Adik adalah buah hati Ayah dan Ibu.",
        majas: "Metafora",
        petunjuk: "Adik langsung disebut sebagai sesuatu yang lain, tanpa kata \"seperti\".",
        pembahasan: "Buah hati adalah kata kiasan untuk anak yang sangat disayangi.",
      },
      {
        kalimat: "Lonceng sekolah memanggil kami masuk kelas.",
        majas: "Personifikasi",
        petunjuk: "Memanggil itu perbuatan siapa? Lonceng dibuat seperti siapa?",
        pembahasan: "Memanggil adalah perbuatan manusia. Lonceng dibuat seolah-olah bisa memanggil.",
      },
      {
        kalimat: "Ayah adalah tulang punggung keluarga.",
        majas: "Metafora",
        petunjuk: "Ayah langsung disebut sebagai sesuatu yang lain, tanpa kata \"seperti\".",
        pembahasan: "Tulang punggung adalah kata kiasan untuk orang yang bekerja memenuhi kebutuhan keluarga.",
      },
    ],
  },

  /* ======================================================================
     GAME 3 — UBAH KALIMATKU (MENERAPKAN)
     Ubah kalimat biasa jadi kalimat bermajas. Maks 3 percobaan per soal.
     Skor: percobaan ke-1 = 3 bintang (20), ke-2 = 2 bintang (10),
           ke-3 = 1 bintang (5) -> maks 100 poin / 15 bintang
     ====================================================================== */
  3: {
    id: 3,
    judul: "Ubah Kalimatku",
    label: "MENERAPKAN",
    ikon: "🪄",
    warna: "pink",
    deskripsi: "Pakai tongkat ajaibmu! Ubah kalimat biasa menjadi kalimat bermajas.",
    caraMain: [
      "Baca kalimat biasa dan jenis majas yang diminta.",
      "Pilih kalimat bermajas yang tepat.",
      "Makin sedikit salah, makin banyak bintangmu!",
    ],
    soal: [
      {
        kalimatBiasa: "Kamarnya sangat berantakan.",
        target: "Hiperbola",
        pilihan: [
          "Kamarnya kotor dan berdebu.",
          "Kamarnya berantakan seperti habis diterjang badai.",
          "Kamarnya menangis minta dirapikan.",
        ],
        jawaban: 1,
        petunjuk: "Hiperbola itu MELEBIH-LEBIHKAN. Cari kalimat yang keadaannya dibuat sangat berlebihan.",
        pembahasan: "Kamar tidak benar-benar diterjang badai. Ungkapan ini melebih-lebihkan keadaan kamar.",
      },
      {
        kalimatBiasa: "Angin bertiup pelan.",
        target: "Personifikasi",
        pilihan: [
          "Angin berbisik lembut di telingaku.",
          "Angin bertiup sangat kencang.",
          "Angin bertiup di sawah.",
        ],
        jawaban: 0,
        petunjuk: "Personifikasi membuat benda seolah-olah bisa berbuat seperti MANUSIA.",
        pembahasan: "Berbisik adalah perbuatan manusia, jadi angin dibuat seperti manusia.",
      },
      {
        kalimatBiasa: "Budi adalah murid paling pintar di kelas.",
        target: "Metafora",
        pilihan: [
          "Budi belajar setiap hari.",
          "Pintarnya Budi setinggi langit.",
          "Budi adalah bintang kelas.",
        ],
        jawaban: 2,
        petunjuk: "Metafora langsung MENYEBUT Budi sebagai sesuatu yang lain, tanpa kata \"seperti\".",
        pembahasan: "Bintang kelas adalah kata kiasan untuk murid yang paling berprestasi. Pilihan B adalah hiperbola.",
      },
      {
        kalimatBiasa: "Adik menangis sangat keras.",
        target: "Hiperbola",
        pilihan: [
          "Adik menangis di kamar.",
          "Tangisan adik terdengar sampai ke ujung dunia.",
          "Bantal ikut menangis bersama adik.",
        ],
        jawaban: 1,
        petunjuk: "Hiperbola itu MELEBIH-LEBIHKAN. Seberapa jauh suara tangisannya terdengar?",
        pembahasan: "Suara tangisan tidak mungkin terdengar sampai ujung dunia. Pilihan C adalah personifikasi.",
      },
      {
        kalimatBiasa: "Hujan turun di pagi hari.",
        target: "Personifikasi",
        pilihan: [
          "Hujan menyapa pagi dengan lembut.",
          "Hujan turun deras sekali.",
          "Hujan adalah air dari langit.",
        ],
        jawaban: 0,
        petunjuk: "Personifikasi membuat benda seolah-olah bisa berbuat seperti MANUSIA. Siapa yang biasanya menyapa?",
        pembahasan: "Menyapa adalah perbuatan manusia, jadi hujan dibuat seperti manusia.",
      },
    ],
  },
};
