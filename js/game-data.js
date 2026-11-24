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

   VERSI 3D (js/game3d/): pakai data soal yang SAMA persis. NAMA game sama
   untuk 2D & 3D ("judul", juga yang dicatat di Google Sheet). Yang beda
   cuma deskripsi & cara main versi 3D (deskripsi3d, caraMain3d) dan
   pengaturan kecepatan (kecepatan3d).
   ========================================================================== */

/* urutan tombol/keranjang jenis majas (tetap) */
const JENIS_MAJAS = ["Metafora", "Personifikasi", "Hiperbola"];

/* warna & ikon tiap jenis majas (dipakai balon Game 1 & keranjang Game 2) */
const GAYA_MAJAS = {
  Metafora:      { ikon: "🌟", warna: "kuning" },
  Personifikasi: { ikon: "🗣️", warna: "biru" },
  Hiperbola:     { ikon: "📢", warna: "pink" },
};

const DATA_GAME = {
  /* ======================================================================
     GAME 1 — PECAH BALON MAJAS (MENGENALI)
     Langkah 1: pilih kalimat yang cocok dengan gambar (boleh coba 2x)
     Langkah 2: pilih jenis majasnya (1x)
     Skor: langkah 1 benar +10, langkah 2 benar +10 -> maks 100
     ====================================================================== */
  1: {
    id: 1,
    judul: "Pecah Balon Majas",
    label: "MENGENALI",
    ikon: "🖼️",
    warna: "kuning",
    deskripsi: "Lihat gambarnya, lalu pecahkan balon kalimat yang cocok dan balon jenis majasnya!",
    deskripsi3d: "Lihat gambarnya, lalu pecahkan balon kalimat yang cocok dan balon jenis majasnya!",
    caraMain3d: [
      "Lihat gambar di atas baik-baik. Santai, tidak ada batas waktu!",
      "Ketuk balon berisi kalimat yang cocok dengan gambar. Dor! 🎈",
      "Lalu ketuk balon jenis majasnya. Benar terus = poin bonus! 🔥",
    ],
    caraMain: [
      "Perhatikan gambar baik-baik. Santai, tidak ada batas waktu!",
      "Ketuk balon kalimat yang cocok dengan gambar. Dor! 🎈",
      "Lalu pecahkan balon jenis majasnya: Metafora, Personifikasi, atau Hiperbola.",
    ],
    soal: [
      {
        gambar: "assets/game/g1-soal1.webp",
        deskripsiGambar: "Bunga-bunga di taman berwajah tersenyum dan bergoyang ke kanan-kiri seperti sedang menari, ada garis angin di sekitarnya.",
        pilihan: [
          "Bunga di taman itu berwarna merah.",
          "Bunga-bunga menari tertiup angin.",
          "Taman itu adalah surga kecil kami.",
        ],
        jawaban: 1,
        majas: "Personifikasi",
        petunjuk: "Lihat bunganya bergoyang ke kanan dan ke kiri. Bunga itu seperti sedang melakukan apa?",
        pembahasan: "Menari adalah perbuatan manusia. Bunga dibuat seolah-olah bisa menari, jadi ini personifikasi.",
      },
      {
        gambar: "assets/game/g1-soal2.webp",
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
        gambar: "assets/game/g1-soal3.webp",
        deskripsiGambar: "Anak memegang kepalanya di depan buku soal matematika, di kepalanya ada garis retak kartun dan tanda tanya.",
        pilihan: [
          "Aku mengerjakan soal matematika.",
          "Kepalaku hampir pecah memikirkan soal itu.",
          "Soal itu menertawakanku.",
        ],
        jawaban: 1,
        majas: "Hiperbola",
        petunjuk: "Lihat kepala anak itu ada retakannya. Apakah kepala bisa benar-benar pecah?",
        pembahasan: "Kepala tidak mungkin pecah karena memikirkan soal. Kalimat ini melebih-lebihkan rasa bingung, jadi ini hiperbola.",
      },
      {
        gambar: "assets/game/g1-soal4.webp",
        deskripsiGambar: "Ibu berdiri tersenyum di depan rumah, di belakangnya ada matahari besar bersinar, anak-anaknya tampak gembira.",
        pilihan: [
          "Ibu memasak di dapur.",
          "Matahari bersinar di atas rumah.",
          "Ibu adalah matahari di rumah kami.",
        ],
        jawaban: 2,
        majas: "Metafora",
        petunjuk: "Ada matahari bersinar di belakang Ibu dan anak-anaknya gembira. Ibu disebut sebagai apa?",
        pembahasan: "Ibu langsung disebut \"matahari\" tanpa kata \"seperti\". Artinya Ibu membuat rumah terasa hangat dan ceria, jadi ini metafora.",
      },
      {
        gambar: "assets/game/g1-soal5.webp",
        deskripsiGambar: "Anak berdiri di pantai, di depannya ada ombak yang menjulang sangat tinggi sampai menyentuh awan.",
        pilihan: [
          "Ombak itu setinggi langit.",
          "Ombak datang ke pantai.",
          "Ombak memeluk kaki kami.",
        ],
        jawaban: 0,
        majas: "Hiperbola",
        petunjuk: "Lihat ombaknya, tingginya sampai menyentuh awan!",
        pembahasan: "Ombak tidak mungkin setinggi langit. Kalimat ini melebih-lebihkan tingginya ombak, jadi ini hiperbola.",
      },
    ],
  },

  /* ======================================================================
     GAME 2 — PABRIK SORTIR MAJAS (MENGELOMPOKKAN)
     Seret kartu kalimat ke keranjang yang benar. 30 detik per soal.
     Skor: benar percobaan ke-1 +20, ke-2 +10 -> maks 100
     ====================================================================== */
  2: {
    id: 2,
    judul: "Pabrik Sortir Majas",
    label: "MENGELOMPOKKAN",
    ikon: "🧺",
    warna: "biru",
    detikPerSoal: 30,
    deskripsi: "Sortir kalimatnya! Seret kartu kalimat ke keranjang majas yang tepat sebelum waktunya habis!",
    deskripsi3d: "Kotak kalimat datang di ban berjalan. Lempar kotaknya ke tong majas yang tepat!",
    caraMain3d: [
      "Baca kalimat di kotak yang datang lewat ban berjalan.",
      "Tarik kotaknya lalu lempar ke atas ke tong yang tepat (atau ketuk tongnya).",
      "Cepat! Tiap kotak hanya 30 detik, ban makin cepat tiap soal.",
    ],
    // kecepatan ban berjalan tiap soal (makin besar makin cepat). Soal 1..5
    kecepatan3d: [2.2, 2.8, 3.4, 4.0, 4.6],
    caraMain: [
      "Seret kartu kalimat ke keranjang yang tepat.",
      "Bisa juga: ketuk kartunya, lalu ketuk keranjangnya.",
      "Cepat! Tiap soal hanya 30 detik.",
    ],
    soal: [
      {
        kalimat: "Aku sudah menunggumu seabad lamanya.",
        majas: "Hiperbola",
        petunjuk: "Apakah orang bisa benar-benar menunggu sampai seratus tahun? Pasti ada yang dilebih-lebihkan!",
        pembahasan: "Seabad artinya seratus tahun. Kalimat ini melebih-lebihkan lamanya menunggu.",
      },
      {
        kalimat: "Pensilku menari-nari di atas kertas.",
        majas: "Personifikasi",
        petunjuk: "Menari itu biasanya dilakukan siapa? Pensil dibuat seperti siapa?",
        pembahasan: "Menari adalah perbuatan manusia. Pensil dibuat seolah-olah bisa menari.",
      },
      {
        kalimat: "Bu Guru adalah pelita bagi murid-muridnya.",
        majas: "Metafora",
        petunjuk: "Bu Guru langsung disebut sebagai sesuatu yang lain, tanpa kata \"seperti\".",
        pembahasan: "Pelita adalah kata kiasan untuk orang yang memberi ilmu dan petunjuk.",
      },
      {
        kalimat: "Mobil tua itu batuk-batuk saat dinyalakan.",
        majas: "Personifikasi",
        petunjuk: "Batuk itu biasanya dialami siapa? Mobil dibuat seperti siapa?",
        pembahasan: "Batuk dialami oleh manusia. Mobil dibuat seolah-olah bisa batuk.",
      },
      {
        kalimat: "Dewi adalah kembang desa di kampungnya.",
        majas: "Metafora",
        petunjuk: "Dewi langsung disebut sebagai sesuatu yang lain, tanpa kata \"seperti\".",
        pembahasan: "Kembang desa adalah kata kiasan untuk gadis yang paling cantik di desanya.",
      },
    ],
  },

  /* ======================================================================
     GAME 3 — PESAWAT PERAKIT KALIMAT (MENERAPKAN)
     Ubah kalimat biasa jadi kalimat bermajas. Maks 3 percobaan per soal.
     Skor: percobaan ke-1 = 3 bintang (20), ke-2 = 2 bintang (10),
           ke-3 = 1 bintang (5) -> maks 100 poin / 15 bintang
     ====================================================================== */
  3: {
    id: 3,
    judul: "Pesawat Perakit Kalimat",
    label: "MENERAPKAN",
    ikon: "🪄",
    warna: "pink",
    deskripsi: "Terbangkan pesawatmu! Ubah kalimat biasa menjadi kalimat bermajas.",
    deskripsi3d: "Terbang di luar angkasa! Tembak kata-kata sesuai urutan untuk merakit kalimat bermajas.",
    caraMain3d: [
      "Baca kalimat biasa dan jenis majas yang diminta.",
      "Ketuk kata (atau tembak dengan tombol Spasi) SESUAI URUTAN kalimat bermajasnya.",
      "Hati-hati kata pengecoh! Makin sedikit salah, makin banyak bintang.",
    ],
    // kecepatan kata melayang tiap soal (makin besar makin cepat). Soal 1..5
    kecepatan3d: [0.35, 0.45, 0.55, 0.65, 0.75],
    /* kata pengecoh otomatis diambil dari pilihan yang salah. Kalau mau
       nentuin sendiri, tambahin di soalnya:  kataPengecoh: ["batu", "meja"] */
    caraMain: [
      "Baca kalimat biasa dan jenis majas yang diminta.",
      "Pilih pesawat berisi kalimat bermajas yang tepat. 🚀",
      "Makin sedikit salah, makin banyak bintangmu!",
    ],
    soal: [
      {
        kalimatBiasa: "Rumah nenek sangat jauh.",
        target: "Hiperbola",
        pilihan: [
          "Rumah nenek ada di desa.",
          "Rumah nenek jauhnya melewati seribu gunung.",
          "Rumah nenek menunggu kami datang.",
        ],
        jawaban: 1,
        petunjuk: "Hiperbola itu melebih-lebihkan. Cari kalimat yang jaraknya dibuat sangat berlebihan.",
        pembahasan: "Tidak perlu melewati seribu gunung untuk ke rumah nenek. Ungkapan ini melebih-lebihkan jarak. Pilihan C adalah personifikasi.",
      },
      {
        kalimatBiasa: "Lampu kamar berkedip-kedip.",
        target: "Personifikasi",
        pilihan: [
          "Lampu kamar mengedipkan mata kepadaku.",
          "Lampu kamar berwarna putih.",
          "Lampu kamar adalah bintang di malam hari.",
        ],
        jawaban: 0,
        petunjuk: "Personifikasi membuat benda seolah-olah bisa berbuat seperti manusia. Siapa yang biasanya mengedipkan mata?",
        pembahasan: "Mengedipkan mata adalah perbuatan manusia, jadi lampu dibuat seperti manusia. Pilihan C adalah metafora.",
      },
      {
        kalimatBiasa: "Lina sangat baik hati dan suka menolong.",
        target: "Metafora",
        pilihan: [
          "Lina menolong temannya setiap hari.",
          "Kebaikan Lina seluas samudra.",
          "Lina adalah anak berhati emas.",
        ],
        jawaban: 2,
        petunjuk: "Metafora langsung menyebut sesuatu dengan kata kiasan, tanpa kata \"seperti\".",
        pembahasan: "Berhati emas adalah kata kiasan untuk orang yang sangat baik hati. Pilihan B adalah hiperbola.",
      },
      {
        kalimatBiasa: "Kakak sangat lelah setelah bekerja.",
        target: "Hiperbola",
        pilihan: [
          "Kakak tidur setelah bekerja.",
          "Kasur memanggil Kakak untuk beristirahat.",
          "Badan Kakak serasa remuk setelah bekerja seharian.",
        ],
        jawaban: 2,
        petunjuk: "Hiperbola itu melebih-lebihkan. Seberapa lelah badan Kakak digambarkan?",
        pembahasan: "Badan tidak benar-benar remuk. Ungkapan ini melebih-lebihkan rasa lelah. Pilihan B adalah personifikasi.",
      },
      {
        kalimatBiasa: "Daun kering jatuh dari pohon.",
        target: "Personifikasi",
        pilihan: [
          "Daun kering berwarna cokelat.",
          "Daun kering melompat turun dari dahan.",
          "Daun kering jatuh sebanyak jutaan helai.",
        ],
        jawaban: 1,
        petunjuk: "Personifikasi membuat benda seolah-olah bisa berbuat seperti manusia. Siapa yang biasanya melompat?",
        pembahasan: "Melompat adalah perbuatan manusia, jadi daun dibuat seperti manusia. Pilihan C adalah hiperbola.",
      },
    ],
  },
};
