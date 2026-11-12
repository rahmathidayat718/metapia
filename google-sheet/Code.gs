/* ==========================================================================
   METAPIA — Google Apps Script penerima & pemberi data untuk website
   --------------------------------------------------------------------------
   File ini BUKAN bagian website. Isinya di-copy ke Google Apps Script.
   VERSI 6: sekolah ber-KODE + akun guru + TIAP GURU PUNYA KODE SISWA
   SENDIRI (1 SD bisa punya beberapa kelas 5, mis. 5A & 5B: guru 5A cuma
   melihat siswa 5A, guru 5B cuma melihat siswa 5B).

   CARA KERJA KODE (mirip Google Classroom). Semua kode = 6 huruf/angka acak,
   dibuat otomatis:
   - KODE GURU sekolah (mis. T4HR8W, tab "Daftar Sekolah"): HANYA untuk guru
     lain yang mau bergabung ke sekolah itu. Dibuat waktu guru PERTAMA
     mendaftarkan sekolahnya.
   - KODE SISWA milik TIAP GURU (mis. K7Q2MX, tab "Daftar Guru"): dibagikan
     guru itu ke siswanya lewat LINK/QR (kodenya langsung terisi) atau
     diketik. Siswa yang masuk dengan kode ini tercatat sebagai siswa guru
     itu (kolom "Guru" di "Daftar Siswa") & hanya tampil di rekap guru itu.
     Guru pertama memakai kode siswa sekolah yang lama (kolom "Kode Siswa"
     di "Daftar Sekolah"), jadi link/QR yang sudah dibagikan tetap jalan.
   - Guru masuk dengan kode sekolah/kode guru/kode siswanya + nama + PIN.
   - Kode bocor? Ganti isi selnya (6 huruf/angka bebas). Siswa yang sudah
     terdaftar tidak terpengaruh.
   - Siswa pindah kelas? Cukup masuk lagi dengan kode siswa guru barunya,
     atau ganti isi kolom "Guru"-nya di "Daftar Siswa".

   YANG DICATAT DI GOOGLE SHEET (1 file sheet untuk SEMUA sekolah; tiap baris
   punya kolom "Sekolah", jadi nilai SD A & SD B tidak tercampur):

   1) Tab "Daftar Sekolah" -> sekolah yang didaftarkan guru
        Nama Sekolah | Kode Siswa | Kode Guru | Dibuat | Dibuat Oleh
      Nama sekolah tidak boleh kembar (tambahkan nama kota/kecamatan kalau
      perlu, mis. "SD Negeri 1 Ceria Makassar").

   2) Tab "Daftar Guru" -> 1 guru = 1 baris
        Nama | Sekolah | PIN | Pertama Masuk | Terakhir Masuk | Jumlah Masuk |
        Status | Kode Siswa
      "Kode Siswa" = kode untuk siswa guru itu (dibuat otomatis kalau kosong).
      Guru daftar sendiri di web (tab "Guru" di halaman masuk) dengan PIN
      6 angka. Guru cuma bisa MELIHAT nilai siswa di sekolahnya sendiri,
      tidak bisa mengubah apa pun.
      - Ada guru yang mencurigakan? Ubah kolom Status jadi "Nonaktif" ->
        akun itu langsung tidak bisa masuk / melihat nilai.
      - Kalau guru lupa PIN: KOSONGKAN sel PIN-nya -> guru bisa bikin PIN
        baru waktu masuk berikutnya.

   3) Tab "Daftar Siswa" -> 1 siswa = 1 baris
        Nama | Pertama Masuk | Terakhir Masuk | Jumlah Masuk | PIN |
        Nilai Kuis Terakhir | Kuis Terakhir | Game Terakhir | ... | Sekolah | Guru
      - "Guru" = guru pemilik kode siswa yang dipakai siswa waktu masuk.
        Kosong (siswa lama) = dianggap siswa guru pertama sekolah itu.
      - Nama gak boleh dobel DI SEKOLAH YANG SAMA ("acel" = "Acel").
        "Andi" di SD A dan "Andi" di SD B = 2 siswa berbeda.
      - Kalau siswa lupa PIN: guru bisa lihat PIN-nya di halaman Guru, atau
        KOSONGKAN sel PIN -> siswa bikin PIN baru waktu masuk berikutnya.
      - Siswa lama (sebelum ada sekolah, kolom Sekolah kosong) diminta
        memasukkan kode sekolah sekali; nilai lamanya otomatis ikut.

   4) Tab "Kuis DD-MM-YYYY" -> nilai kuis, DIPISAH PER TANGGAL
        No | Nama | Nilai Pertama | Nilai Terbaik | Nilai Terakhir |
        Jumlah Mencoba | Jawaban Terakhir | Jam Terakhir | Sekolah | Guru
   5) Tab "Game DD-MM-YYYY" -> skor game, DIPISAH PER TANGGAL
        No | Nama | Game | Skor Pertama | Skor Terbaik | Skor Terakhir |
        Jumlah Main | Benar Terakhir | Jam Terakhir | Sekolah | Guru
      Mau lihat 1 sekolah / 1 kelas saja di Google Sheet: Data -> Buat
      filter -> saring kolom "Sekolah" / "Guru".

   CARA PASANG PERTAMA KALI:
   1. Buat Google Sheet baru -> menu Ekstensi -> Apps Script.
   2. Hapus semua isi Code.gs di sana, paste SELURUH isi file ini, Simpan (💾).
   3. "Terapkan" (Deploy) -> "Deployment baru" -> jenis "Aplikasi web":
      - Jalankan sebagai: "Saya"   - Yang memiliki akses: "Siapa saja"
      - Terapkan, izinkan akses (Advanced -> Go to ... (unsafe) -> Allow).
   4. Copy "URL aplikasi web" (berakhiran /exec) ke js/sheet.js.
   5. Cek: buka URL itu di browser -> muncul "METAPIA siap menerima data ✓".

   CARA UPDATE (kalau isi file ini berubah, mis. ke versi 6 ini):
   1. Paste ulang SELURUH isi file ini ke Code.gs di Apps Script, Simpan.
   2. "Terapkan" -> "Kelola deployment" -> klik ✏️ (edit) ->
      Versi: "Versi baru" -> "Terapkan".  (URL /exec-nya TETAP SAMA)
   ========================================================================== */

const ZONA_WAKTU = "Asia/Jakarta"; // WIB. Ganti "Asia/Makassar" (WITA) / "Asia/Jayapura" (WIT) kalau perlu

/* KODE PEMBUAT SEKOLAH (opsional). Bergabung ke sekolah yang SUDAH ADA
   selalu butuh kode sekolah. Kalau ini diisi, mis. "MAJAS2026", MEMBUAT
   SEKOLAH BARU juga butuh kode ini (biar orang iseng gak bikin sekolah
   palsu). Kosong ("") = siapa saja boleh membuat sekolah baru. */
const KODE_DAFTAR_GURU = "";

const SHEET_SISWA = "Daftar Siswa";
const SHEET_GURU = "Daftar Guru";
const SHEET_SEKOLAH = "Daftar Sekolah";
const KOLOM_SISWA = ["Nama", "Pertama Masuk", "Terakhir Masuk", "Jumlah Masuk", "PIN", "Nilai Kuis Terakhir", "Kuis Terakhir",
                     "Game Terakhir", "Skor Game Terakhir", "Waktu Game Terakhir", "Sekolah", "Guru"];
const KOLOM_GURU = ["Nama", "Sekolah", "PIN", "Pertama Masuk", "Terakhir Masuk", "Jumlah Masuk", "Status", "Kode Siswa"];
const KOLOM_SEKOLAH = ["Nama Sekolah", "Kode Siswa", "Kode Guru", "Dibuat", "Dibuat Oleh"];
const HURUF_KODE = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // tanpa 0/O, 1/I/L biar gak ketuker
const KOLOM_NILAI = ["No", "Nama", "Nilai Pertama", "Nilai Terbaik", "Nilai Terakhir", "Jumlah Mencoba", "Jawaban Terakhir", "Jam Terakhir", "Sekolah", "Guru"];
const KOLOM_GAME = ["No", "Nama", "Game", "Skor Pertama", "Skor Terbaik", "Skor Terakhir", "Jumlah Main", "Benar Terakhir", "Jam Terakhir", "Sekolah", "Guru"];

/* ==========================================================================
   PINTU MASUK
   SISWA
   - POST {aksi:"masuk", nama, pin, kodeSekolah}      -> daftar / masuk (kodeSekolah = kode siswa milik guru)
   - POST {aksi:"nilai", nama, pin, sekolah, nilai, benar, salah, jawaban}
   - POST {aksi:"game",  nama, pin, sekolah, gameId, game, skor, benar}
   - GET  ?aksi=status&nama=..&pin=..&sekolah=..      -> nilai & game terakhir
   GURU
   - POST {aksi:"guruDaftar", mode:"baru", nama, pin, sekolah, kode}   -> bikin sekolah baru (+ kode sekolah)
   - POST {aksi:"guruDaftar", mode:"gabung", nama, pin, kodeSekolah}  -> gabung sekolah (kodeSekolah = KODE GURU)
   - POST {aksi:"guruMasuk",  nama, pin, kodeSekolah}  (kode siswa / kode guru)
   - POST {aksi:"guruRekap",  nama, pin, kodeSekolah}  -> nilai siswa GURU ITU saja (lihat saja)
     Balasan guruDaftar/guruMasuk/guruRekap: kodeSekolah = KODE SISWA milik guru itu.
   UMUM
   - GET  ?aksi=cekKode&kode=..&jenis=siswa|guru|semua -> nama sekolah (+ guru) dari kode
   - GET  ?aksi=info             -> { butuhKode } (perlu kode pembuat sekolah?)
   - GET  (tanpa aksi)           -> cek script hidup
   ========================================================================== */
function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return balas({ ok: false, kode: "error", pesan: String(err) });
  }
  // cuma baca data -> gak perlu antre kunci
  if (data.aksi === "guruRekap") {
    try { return balas(guruRekap(data)); } catch (err) { return balas({ ok: false, kode: "error", pesan: String(err) }); }
  }

  // kunci biar kalau banyak siswa kirim barengan, datanya gak tabrakan
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    if (data.aksi === "masuk") return balas(masukDenganKode(data));
    if (data.aksi === "nilai") return balas(catatNilai(data));
    if (data.aksi === "game") return balas(catatGame(data));
    if (data.aksi === "guruDaftar") return balas(guruDaftar(data));
    if (data.aksi === "guruMasuk") return balas(guruMasuk(data));
    return balas({ ok: false, kode: "aksi_salah" });
  } catch (err) {
    return balas({ ok: false, kode: "error", pesan: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.aksi === "status") return balas(status(p.nama, p.pin, p.sekolah));
    if (p.aksi === "cekKode") {
      const jenis = p.jenis || "siswa";
      if (jenis === "siswa") {
        const k = kelasDariKode(p.kode);
        return balas(k ? { ok: true, sekolah: k.sekolah, guru: k.guru, kode: k.kode } : { ok: false, kode: "kode_salah" });
      }
      const s = sekolahDariKode(p.kode, jenis) || (jenis === "semua" && kelasDariKode(p.kode));
      return balas(s ? { ok: true, sekolah: s.nama || s.sekolah, kode: s.kode } : { ok: false, kode: "kode_salah" });
    }
    if (p.aksi === "info") return balas({ ok: true, versi: 6, butuhKode: !!KODE_DAFTAR_GURU });
  } catch (err) {
    return balas({ ok: false, kode: "error", pesan: String(err) });
  }
  return ContentService.createTextOutput("METAPIA siap menerima data ✓ (versi 6: kode siswa per guru + akun guru + kuis + game)");
}

/** siswa masuk pakai KODE SISWA milik gurunya (dari link/QR/ketik) */
function masukDenganKode(data) {
  const k = kelasDariKode(data.kodeSekolah);
  if (!k) return { ok: false, kode: rapikanKode(data.kodeSekolah) ? "kode_salah" : "perlu_sekolah" };
  const hasil = masuk(data.nama, data.pin, k.sekolah, k.guru);
  if (hasil.ok) { hasil.kodeSekolah = k.kode; hasil.guru = k.guru; }
  return hasil;
}

/* ==========================================================================
   1) SISWA: MASUK / DAFTAR
   ========================================================================== */
/** guruNama: guru pemilik kode yang dipakai ("" = tidak diubah) */
function masuk(namaMentah, pinMentah, sekolahMentah, guruNama) {
  const nama = rapikanNama(namaMentah);
  const pin = rapikanPin(pinMentah);
  if (!nama) return { ok: false, kode: "nama_kosong" };
  if (!pin) return { ok: false, kode: "pin_salah_format" };
  if (!rapikanSekolah(sekolahMentah)) return { ok: false, kode: "perlu_sekolah" };
  const sekolah = cariSekolah(sekolahMentah);
  if (!sekolah) return { ok: false, kode: "sekolah_tidak_ada" };

  const sheet = sheetSiswa();
  const K = petaKolom(sheet, KOLOM_SISWA);
  const sekarang = new Date();
  let baris = cariBarisSekolah(sheet, K["Nama"], nama, K["Sekolah"], sekolah);

  // siswa lama (sebelum ada sekolah): nama sama + kolom Sekolah kosong + PIN cocok
  // -> pindahkan ke sekolah ini (nilai lamanya ikut)
  if (!baris) {
    const lama = cariBarisSekolah(sheet, K["Nama"], nama, K["Sekolah"], "");
    if (lama) {
      const pinLama = rapikanPin(sheet.getRange(lama, K["PIN"]).getValue());
      if (!pinLama || pinLama === pin) {
        sheet.getRange(lama, K["Sekolah"]).setValue(amankan(sekolah));
        pindahkanNilaiLama(String(sheet.getRange(lama, K["Nama"]).getValue()).replace(/^'/, ""), sekolah);
        baris = lama;
      }
    }
  }

  // a) nama baru di sekolah ini -> daftar
  if (!baris) {
    const r = sheet.getLastRow() + 1;
    sheet.getRange(r, K["Nama"]).setValue(amankan(nama));
    sheet.getRange(r, K["Sekolah"]).setValue(amankan(sekolah));
    if (guruNama) sheet.getRange(r, K["Guru"]).setValue(amankan(guruNama));
    sheet.getRange(r, K["Pertama Masuk"]).setValue(sekarang).setNumberFormat("dd/MM/yyyy HH:mm");
    sheet.getRange(r, K["Terakhir Masuk"]).setValue(sekarang).setNumberFormat("dd/MM/yyyy HH:mm");
    sheet.getRange(r, K["Jumlah Masuk"]).setValue(1);
    sheet.getRange(r, K["PIN"]).setNumberFormat("@").setValue(pin); // "@" = teks, biar 0123 gak jadi 123
    return { ok: true, status: "baru", nama, sekolah, nilai: null };
  }

  // b) nama sudah ada di sekolah ini -> cek PIN
  const namaAsli = String(sheet.getRange(baris, K["Nama"]).getValue()).replace(/^'/, "");
  const pinLama = rapikanPin(sheet.getRange(baris, K["PIN"]).getValue());
  if (pinLama && pinLama !== pin) {
    return { ok: false, kode: "pin_salah", nama: namaAsli };
  }
  if (!pinLama) sheet.getRange(baris, K["PIN"]).setNumberFormat("@").setValue(pin); // siswa lama / PIN dikosongin guru

  const jumlah = Number(sheet.getRange(baris, K["Jumlah Masuk"]).getValue()) || 0;
  sheet.getRange(baris, K["Terakhir Masuk"]).setValue(sekarang).setNumberFormat("dd/MM/yyyy HH:mm");
  sheet.getRange(baris, K["Jumlah Masuk"]).setValue(jumlah + 1);
  // masuk pakai kode siswa guru lain (pindah kelas) -> ikut guru itu
  if (guruNama) sheet.getRange(baris, K["Guru"]).setValue(amankan(guruNama));

  return {
    ok: true,
    status: pinLama ? "masuk" : "pin_baru",
    nama: namaAsli,
    sekolah,
    nilai: nilaiTerakhir(sheet, K, baris, namaAsli, sekolah),
    game: gameTerakhir(sheet, K, baris),
  };
}

/** dipakai Dashboard buat nyamain nilai dengan sheet (kuis di perangkat lain) */
function status(namaMentah, pinMentah, sekolahMentah) {
  const p = cariPemilik(namaMentah, pinMentah, sekolahMentah);
  if (!p.ok) return p;
  return { ok: true, nilai: nilaiTerakhir(p.siswa, p.K, p.barisSiswa, p.namaAsli, p.sekolah), game: gameTerakhir(p.siswa, p.K, p.barisSiswa) };
}

/* ==========================================================================
   2) NILAI KUIS — 1 tab per tanggal + update "Daftar Siswa"
   ========================================================================== */
function catatNilai(data) {
  // pastikan yang ngirim memang pemilik nama (PIN cocok)
  const p = cekPemilik(data.nama, data.pin, data.sekolah);
  if (!p.ok) return p;
  const { siswa, K, barisSiswa, namaAsli, sekolah } = p;

  const sekarang = new Date();
  const tanggal = Utilities.formatDate(sekarang, ZONA_WAKTU, "dd-MM-yyyy");
  const jam = Utilities.formatDate(sekarang, ZONA_WAKTU, "HH:mm");
  const nilai = Number(data.nilai) || 0;
  const jawaban = amankan(data.jawaban);

  // a) tab tanggal hari ini (tab baru ditaruh di posisi ke-2, habis "Daftar Siswa")
  const sheet = ambilSheet("Kuis " + tanggal, KOLOM_NILAI, 1);
  const KN = petaKolom(sheet, KOLOM_NILAI);
  const kolSekolah = KN["Sekolah"];
  const guruSiswa = String(siswa.getRange(barisSiswa, K["Guru"]).getValue() || "").replace(/^'/, "");
  const baris = cariBarisSekolah(sheet, 2, namaAsli, kolSekolah, sekolah);
  if (baris) {
    // sudah pernah kuis hari ini -> update (Nilai Pertama gak diubah)
    const lama = sheet.getRange(baris, 4, 1, 3).getValues()[0]; // terbaik, terakhir, mencoba
    sheet.getRange(baris, 4, 1, 5).setValues([[
      Math.max(Number(lama[0]) || 0, nilai),
      nilai,
      (Number(lama[2]) || 0) + 1,
      jawaban,
      jam,
    ]]);
    sheet.getRange(baris, KN["Guru"]).setValue(amankan(guruSiswa));
  } else {
    const no = sheet.getLastRow(); // baris 1 = judul, jadi siswa pertama = No 1
    const isi = [no, amankan(namaAsli), nilai, nilai, nilai, 1, jawaban, jam, amankan(sekolah)];
    isi[KN["Guru"] - 1] = amankan(guruSiswa);
    sheet.appendRow(isi);
  }

  // b) catat juga di "Daftar Siswa" biar gampang dibaca dari perangkat lain
  siswa.getRange(barisSiswa, K["Nilai Kuis Terakhir"]).setValue(nilai);
  siswa.getRange(barisSiswa, K["Kuis Terakhir"]).setNumberFormat("@").setValue(tanggal + " " + jam);

  return { ok: true };
}

/* ==========================================================================
   3) SKOR GAME — 1 tab per tanggal + update "Daftar Siswa"
   ========================================================================== */
function catatGame(data) {
  const p = cekPemilik(data.nama, data.pin, data.sekolah);
  if (!p.ok) return p;
  const { siswa, K, barisSiswa, namaAsli, sekolah } = p;

  const sekarang = new Date();
  const tanggal = Utilities.formatDate(sekarang, ZONA_WAKTU, "dd-MM-yyyy");
  const jam = Utilities.formatDate(sekarang, ZONA_WAKTU, "HH:mm");
  const skor = Math.max(0, Math.min(100, Number(data.skor) || 0));
  const game = amankan(data.game || ("Game " + data.gameId));
  const benar = amankan(data.benar);

  // a) tab tanggal hari ini: 1 baris per siswa + game
  const sheet = ambilSheet("Game " + tanggal, KOLOM_GAME, 1);
  const KG = petaKolom(sheet, KOLOM_GAME);
  const kolSekolah = KG["Sekolah"];
  const guruSiswa = String(siswa.getRange(barisSiswa, K["Guru"]).getValue() || "").replace(/^'/, "");
  const baris = cariBarisGame(sheet, namaAsli, game, kolSekolah, sekolah);
  if (baris) {
    // sudah pernah main game ini hari ini -> update (Skor Pertama gak diubah)
    const lama = sheet.getRange(baris, 5, 1, 3).getValues()[0]; // terbaik, terakhir, jumlah main
    sheet.getRange(baris, 5, 1, 5).setValues([[
      Math.max(Number(lama[0]) || 0, skor),
      skor,
      (Number(lama[2]) || 0) + 1,
      benar,
      jam,
    ]]);
    sheet.getRange(baris, KG["Guru"]).setValue(amankan(guruSiswa));
  } else {
    const no = sheet.getLastRow(); // baris 1 = judul, jadi siswa pertama = No 1
    const isi = [no, amankan(namaAsli), game, skor, skor, skor, 1, benar, jam, amankan(sekolah)];
    isi[KG["Guru"] - 1] = amankan(guruSiswa);
    sheet.appendRow(isi);
  }

  // b) "Daftar Siswa": game terakhir yang dimainkan (dibaca Dashboard)
  siswa.getRange(barisSiswa, K["Game Terakhir"]).setValue(game);
  siswa.getRange(barisSiswa, K["Skor Game Terakhir"]).setValue(skor);
  siswa.getRange(barisSiswa, K["Waktu Game Terakhir"]).setNumberFormat("@").setValue(tanggal + " " + jam);

  return { ok: true };
}

/** game terakhir siswa (dari "Daftar Siswa"), null kalau belum pernah main */
function gameTerakhir(sheet, K, baris) {
  const game = String(sheet.getRange(baris, K["Game Terakhir"]).getValue() || "");
  if (!game) return null;
  return {
    game,
    skor: Number(sheet.getRange(baris, K["Skor Game Terakhir"]).getValue()) || 0,
    tanggal: keISO(String(sheet.getRange(baris, K["Waktu Game Terakhir"]).getValue())),
  };
}

/** nilai kuis terakhir siswa: dari "Daftar Siswa", kalau kosong cari di tab "Kuis ..." */
function nilaiTerakhir(sheet, K, baris, nama, sekolah) {
  const nilai = sheet.getRange(baris, K["Nilai Kuis Terakhir"]).getValue();
  const waktu = String(sheet.getRange(baris, K["Kuis Terakhir"]).getValue());
  if (nilai !== "" && nilai !== null) {
    return { nilai: Number(nilai) || 0, tanggal: keISO(waktu) };
  }

  // data lama (sebelum ada kolom ini): cari di tab kuis, mulai tanggal terbaru
  const tabKuis = SpreadsheetApp.getActiveSpreadsheet().getSheets()
    .map((s) => ({ s, iso: keISO(s.getName().replace(/^Kuis /, "")) }))
    .filter((x) => /^Kuis \d{2}-\d{2}-\d{4}$/.test(x.s.getName()))
    .sort((a, b) => (a.iso < b.iso ? 1 : -1));
  for (const { s, iso } of tabKuis) {
    const b = cariBarisSekolah(s, 2, nama, kolomJudul(s, "Sekolah"), sekolah);
    if (b) {
      const n = Number(s.getRange(b, 5).getValue()) || 0; // kolom "Nilai Terakhir"
      const jam = String(s.getRange(b, 8).getDisplayValue() || "");
      sheet.getRange(baris, K["Nilai Kuis Terakhir"]).setValue(n);
      sheet.getRange(baris, K["Kuis Terakhir"]).setNumberFormat("@").setValue(s.getName().replace(/^Kuis /, "") + " " + jam);
      return { nilai: n, tanggal: iso };
    }
  }
  return null; // belum pernah kuis
}

/* ==========================================================================
   4) GURU: DAFTAR / MASUK / LIHAT NILAI (tidak bisa mengubah apa pun)
   ========================================================================== */
function guruDaftar(data) {
  const nama = rapikanNama(data.nama);
  const pin = pinGuruKetik(data.pin);
  if (!nama) return { ok: false, kode: "nama_kosong" };
  if (!pin) return { ok: false, kode: "pin_salah_format" };

  let sekolah, kodeSekolah, kodeGuru;
  if (data.mode === "baru") {
    // a) bikin sekolah baru -> dapat kode sekolah acak
    const sekolahKetik = rapikanSekolah(data.sekolah);
    if (!sekolahKetik) return { ok: false, kode: "perlu_sekolah" };
    if (KODE_DAFTAR_GURU && kunciNama(data.kode) !== kunciNama(KODE_DAFTAR_GURU)) return { ok: false, kode: "kode_daftar_salah" };
    if (cariSekolah(sekolahKetik)) return { ok: false, kode: "sekolah_sudah_ada" };
    const ss = ambilSheet(SHEET_SEKOLAH, KOLOM_SEKOLAH, 0);
    const KS = petaKolom(ss, KOLOM_SEKOLAH);
    const dipakai = semuaKode();
    kodeSekolah = buatKodeBaru(dipakai);
    kodeGuru = buatKodeBaru(dipakai.concat([kodeSekolah]));
    const r = ss.getLastRow() + 1;
    ss.getRange(r, KS["Nama Sekolah"]).setValue(amankan(sekolahKetik));
    ss.getRange(r, KS["Kode Siswa"]).setNumberFormat("@").setValue(kodeSekolah);
    ss.getRange(r, KS["Kode Guru"]).setNumberFormat("@").setValue(kodeGuru);
    ss.getRange(r, KS["Dibuat"]).setValue(new Date()).setNumberFormat("dd/MM/yyyy HH:mm");
    ss.getRange(r, KS["Dibuat Oleh"]).setValue(amankan(nama));
    sekolah = sekolahKetik;
  } else {
    // b) gabung sekolah yang sudah ada -> wajib KODE GURU (bukan kode siswa)
    const s = sekolahDariKode(data.kodeSekolah, "guru");
    if (!s) return { ok: false, kode: sekolahDariKode(data.kodeSekolah, "siswa") ? "kode_siswa" : "kode_salah" };
    sekolah = s.nama;
    kodeSekolah = s.kode;
    kodeGuru = s.kodeGuru;
  }

  const sheet = sheetGuru();
  const K = petaKolom(sheet, KOLOM_GURU);
  const baris = cariBarisSekolah(sheet, K["Nama"], nama, K["Sekolah"], sekolah);
  if (baris) return { ok: false, kode: "sudah_ada", nama: String(sheet.getRange(baris, K["Nama"]).getValue()).replace(/^'/, "") };

  const sekarang = new Date();
  const r = sheet.getLastRow() + 1;
  sheet.getRange(r, K["Nama"]).setValue(amankan(nama));
  sheet.getRange(r, K["Sekolah"]).setValue(amankan(sekolah));
  sheet.getRange(r, K["PIN"]).setNumberFormat("@").setValue(pin);
  sheet.getRange(r, K["Pertama Masuk"]).setValue(sekarang).setNumberFormat("dd/MM/yyyy HH:mm");
  sheet.getRange(r, K["Terakhir Masuk"]).setValue(sekarang).setNumberFormat("dd/MM/yyyy HH:mm");
  sheet.getRange(r, K["Jumlah Masuk"]).setValue(1);
  sheet.getRange(r, K["Status"]).setValue("Aktif");
  // kode siswa guru ini: guru pembuat sekolah = kode siswa sekolah, guru lain = kode baru
  const kodeKelas = data.mode === "baru" ? kodeSekolah : buatKodeBaru();
  sheet.getRange(r, K["Kode Siswa"]).setNumberFormat("@").setValue(kodeKelas);
  return { ok: true, nama, sekolah, kodeSekolah: kodeKelas, kodeGuru };
}

function guruMasuk(data) {
  const g = cekGuru(data);
  if (!g.ok) return g;
  const { sheet, K, baris } = g;
  const jumlah = Number(sheet.getRange(baris, K["Jumlah Masuk"]).getValue()) || 0;
  sheet.getRange(baris, K["Terakhir Masuk"]).setValue(new Date()).setNumberFormat("dd/MM/yyyy HH:mm");
  sheet.getRange(baris, K["Jumlah Masuk"]).setValue(jumlah + 1);
  return { ok: true, nama: g.nama, sekolah: g.sekolah, kodeSekolah: g.kodeKelas, kodeGuru: g.kodeGuru, status: g.pinBaru ? "pin_baru" : "masuk" };
}

/** cek kode sekolah + nama + PIN guru. PIN dikosongkan di sheet -> PIN yang diketik jadi PIN baru */
function cekGuru(data) {
  const nama = rapikanNama(data.nama);
  const pin = pinGuruKetik(data.pin);
  if (!nama || !pin) return { ok: false, kode: "pin_salah" };
  // kode sekolah lama / kode guru sekolah / kode siswa milik guru mana pun di sekolah itu
  let s = sekolahDariKode(data.kodeSekolah, "semua");
  if (!s) {
    const k = kelasDariKode(data.kodeSekolah);
    if (k) s = daftarSekolah().find((x) => kunciNama(x.nama) === kunciNama(k.sekolah)) || null;
  }
  if (!s) return { ok: false, kode: "kode_salah" };
  const sekolah = s.nama;
  const sheet = sheetGuru();
  const K = petaKolom(sheet, KOLOM_GURU);
  const baris = cariBarisSekolah(sheet, K["Nama"], nama, K["Sekolah"], sekolah);
  if (!baris) return { ok: false, kode: "guru_tidak_ada" };
  if (kunciNama(sheet.getRange(baris, K["Status"]).getValue()) === "nonaktif") return { ok: false, kode: "nonaktif" };
  const pinLama = rapikanPinGuru(sheet.getRange(baris, K["PIN"]).getValue());
  if (pinLama && pinLama !== pin) return { ok: false, kode: "pin_salah" };
  if (!pinLama) sheet.getRange(baris, K["PIN"]).setNumberFormat("@").setValue(pin);
  const namaAsli = String(sheet.getRange(baris, K["Nama"]).getValue()).replace(/^'/, "");
  const kelas = daftarKelas().find((x) => x.baris === baris);
  const kodeKelas = kelas ? kelas.kode : s.kode;
  return { ok: true, sheet, K, baris, nama: namaAsli, sekolah, kodeKelas, kodeSekolahLama: s.kode, kodeGuru: s.kodeGuru, pinBaru: !pinLama };
}

/**
 * Rekap nilai siswa MILIK GURU INI saja (hanya dibaca). Siswa milik guru =
 * kolom "Guru" = nama guru ini. Siswa lama yang kolom Guru-nya kosong ikut
 * guru yang memegang kode siswa sekolah yang lama (guru pertama).
 *  siswa  : [{ nama, pin, pertamaMasuk, terakhirMasuk, jumlahMasuk }]
 *  kuis   : [{ tanggal, nama, pertama, terbaik, terakhir, mencoba, jam }]
 *  game   : [{ tanggal, nama, game, pertama, terbaik, terakhir, main, benar, jam }]
 */
function guruRekap(data) {
  const g = cekGuru(data);
  if (!g.ok) return g;
  const sekolah = g.sekolah;
  const kunciSekolah = kunciNama(sekolah);
  const kunciGuru = kunciNama(g.nama);
  const pemegangKodeLama = g.kodeKelas === g.kodeSekolahLama; // guru pertama
  const milikGuruIni = (guru) => {
    const kg = kunciNama(String(guru || "").replace(/^'/, ""));
    return kg ? kg === kunciGuru : pemegangKodeLama;
  };
  const namaSiswa = {}; // kunci nama -> true (buat nyaring tab Kuis/Game)
  const tz = ZONA_WAKTU;
  const teksWaktu = (v) => (v instanceof Date ? Utilities.formatDate(v, tz, "dd-MM-yyyy HH:mm") : String(v || ""));

  // daftar siswa sekolah ini
  const sh = sheetSiswa();
  const K = petaKolom(sh, KOLOM_SISWA);
  const siswa = [];
  const jml = sh.getLastRow() - 1;
  if (jml > 0) {
    sh.getRange(2, 1, jml, sh.getLastColumn()).getValues().forEach((r) => {
      if (kunciNama(r[K["Sekolah"] - 1]) !== kunciSekolah) return;
      if (!milikGuruIni(r[K["Guru"] - 1])) return;
      namaSiswa[kunciNama(String(r[K["Nama"] - 1]).replace(/^'/, ""))] = true;
      siswa.push({
        nama: String(r[K["Nama"] - 1]).replace(/^'/, ""),
        pin: rapikanPin(r[K["PIN"] - 1]),
        pertamaMasuk: teksWaktu(r[K["Pertama Masuk"] - 1]),
        terakhirMasuk: teksWaktu(r[K["Terakhir Masuk"] - 1]),
        jumlahMasuk: Number(r[K["Jumlah Masuk"] - 1]) || 0,
      });
    });
  }

  // semua tab Kuis/Game per tanggal, ambil baris sekolah ini
  const kuis = [], game = [];
  SpreadsheetApp.getActiveSpreadsheet().getSheets().forEach((s) => {
    const m = s.getName().match(/^(Kuis|Game) (\d{2}-\d{2}-\d{4})$/);
    if (!m || s.getLastRow() < 2) return;
    const kolS = kolomJudul(s, "Sekolah");
    if (!kolS) return; // tab lama tanpa kolom Sekolah: belum ada siswa yang dipindahkan ke sekolah
    const isi = s.getRange(2, 1, s.getLastRow() - 1, kolS).getValues();
    const jam = s.getRange(2, m[1] === "Kuis" ? 8 : 9, s.getLastRow() - 1, 1).getDisplayValues();
    isi.forEach((r, i) => {
      if (kunciNama(r[kolS - 1]) !== kunciSekolah) return;
      const nama = String(r[1]).replace(/^'/, "");
      if (!namaSiswa[kunciNama(nama)]) return; // siswa guru lain
      if (m[1] === "Kuis") {
        kuis.push({ tanggal: m[2], nama, pertama: Number(r[2]) || 0, terbaik: Number(r[3]) || 0, terakhir: Number(r[4]) || 0, mencoba: Number(r[5]) || 0, jam: jam[i][0] });
      } else {
        game.push({ tanggal: m[2], nama, game: String(r[2]), pertama: Number(r[3]) || 0, terbaik: Number(r[4]) || 0, terakhir: Number(r[5]) || 0, main: Number(r[6]) || 0, benar: String(r[7]), jam: jam[i][0] });
      }
    });
  });

  return { ok: true, sekolah, kodeSekolah: g.kodeKelas, kodeGuru: g.kodeGuru, guru: g.nama, siswa, kuis, game, diambil: Utilities.formatDate(new Date(), tz, "dd-MM-yyyy HH:mm") };
}

/* ==========================================================================
   ALAT BANTU
   ========================================================================== */

function sheetSiswa() {
  return ambilSheet(SHEET_SISWA, KOLOM_SISWA, 0);
}
function sheetGuru() {
  return ambilSheet(SHEET_GURU, KOLOM_GURU, 1);
}

/**
 * semua sekolah: [{ nama, kode (kode siswa), kodeGuru }]. Sekolah yang
 * belum punya kode (mis. kodenya dihapus) otomatis dibuatkan.
 */
function daftarSekolah() {
  const ss = ambilSheet(SHEET_SEKOLAH, KOLOM_SEKOLAH, 0);
  const KS = petaKolom(ss, KOLOM_SEKOLAH);
  const jml = ss.getLastRow() - 1;
  if (jml < 1) return [];
  const isi = ss.getRange(2, 1, jml, ss.getLastColumn()).getValues();
  const dipakai = [];
  isi.forEach((y) => dipakai.push(rapikanKode(y[KS["Kode Siswa"] - 1]), rapikanKode(y[KS["Kode Guru"] - 1])));
  const hasil = [];
  isi.forEach((r, i) => {
    const nama = String(r[KS["Nama Sekolah"] - 1]).replace(/^'/, "").trim();
    if (!nama) return;
    const kode = {};
    ["Kode Siswa", "Kode Guru"].forEach((kol) => {
      let k = rapikanKode(r[KS[kol] - 1]);
      if (!k) {
        k = buatKodeBaru(dipakai);
        dipakai.push(k);
        ss.getRange(i + 2, KS[kol]).setNumberFormat("@").setValue(k);
      }
      kode[kol] = k;
    });
    hasil.push({ nama, kode: kode["Kode Siswa"], kodeGuru: kode["Kode Guru"] });
  });
  return hasil;
}

function semuaKode() {
  const kode = [];
  daftarSekolah().forEach((x) => kode.push(x.kode, x.kodeGuru));
  // kode siswa milik guru (dibaca langsung, biar gak muter ke daftarKelas)
  const sh = sheetGuru();
  const kol = kolomJudul(sh, "Kode Siswa");
  if (kol && sh.getLastRow() > 1) sh.getRange(2, kol, sh.getLastRow() - 1, 1).getValues().forEach((r) => { if (rapikanKode(r[0])) kode.push(rapikanKode(r[0])); });
  return kode;
}

/**
 * Semua "kelas" = guru + kode siswanya: [{ guru, sekolah, kode, baris }].
 * Guru yang belum punya kode siswa (guru dari versi 5) otomatis dibuatkan:
 * guru pembuat sekolah ("Dibuat Oleh") dapat kode siswa sekolah yang lama
 * (biar link/QR lama tetap ke dia), guru lain dapat kode baru.
 */
function daftarKelas() {
  const sh = sheetGuru();
  const K = petaKolom(sh, KOLOM_GURU);
  const jml = sh.getLastRow() - 1;
  if (jml < 1) return [];
  const isi = sh.getRange(2, 1, jml, sh.getLastColumn()).getValues();
  const sekolahList = daftarSekolah();
  // sekolah -> nama pembuatnya
  const ss = ambilSheet(SHEET_SEKOLAH, KOLOM_SEKOLAH, 0);
  const KS = petaKolom(ss, KOLOM_SEKOLAH);
  const pembuat = {};
  if (ss.getLastRow() > 1) {
    ss.getRange(2, 1, ss.getLastRow() - 1, ss.getLastColumn()).getValues().forEach((r) => {
      pembuat[kunciNama(r[KS["Nama Sekolah"] - 1])] = kunciNama(String(r[KS["Dibuat Oleh"] - 1]).replace(/^'/, ""));
    });
  }
  const dipakai = semuaKode();
  const hasil = [];
  isi.forEach((r, i) => {
    const guru = String(r[K["Nama"] - 1]).replace(/^'/, "").trim();
    const sekolah = String(r[K["Sekolah"] - 1]).replace(/^'/, "").trim();
    if (!guru || !sekolah) return;
    let kode = rapikanKode(r[K["Kode Siswa"] - 1]);
    if (!kode) {
      const s = sekolahList.find((x) => kunciNama(x.nama) === kunciNama(sekolah));
      const kodeLamaSudahDipegang = s && hasil.some((h) => h.kode === s.kode) ||
        isi.some((y) => rapikanKode(y[K["Kode Siswa"] - 1]) === (s && s.kode));
      if (s && pembuat[kunciNama(sekolah)] === kunciNama(guru) && !kodeLamaSudahDipegang) kode = s.kode;
      else { kode = buatKodeBaru(dipakai); dipakai.push(kode); }
      sh.getRange(i + 2, K["Kode Siswa"]).setNumberFormat("@").setValue(kode);
    }
    hasil.push({ guru, sekolah, kode, baris: i + 2 });
  });
  return hasil;
}

/**
 * kode siswa -> { sekolah, guru, kode } atau null.
 * Kode siswa sekolah yang lama (tab "Daftar Sekolah") yang belum dipegang
 * guru mana pun tetap diterima (guru = "": siswanya ikut guru pertama).
 */
function kelasDariKode(teks) {
  const k = rapikanKode(teks);
  if (!k) return null;
  const kelas = daftarKelas().find((x) => x.kode === k);
  if (kelas) return { sekolah: kelas.sekolah, guru: kelas.guru, kode: k };
  const s = sekolahDariKode(k, "siswa");
  return s ? { sekolah: s.nama, guru: "", kode: k } : null;
}

/** cari sekolah dari NAMA (huruf besar/kecil & spasi dianggap sama) -> ejaan aslinya, atau "" */
function cariSekolah(teks) {
  const k = kunciNama(rapikanSekolah(teks));
  if (!k) return "";
  const s = daftarSekolah().find((x) => kunciNama(x.nama) === k);
  return s ? s.nama : "";
}

/** cari sekolah dari KODE -> { nama, kode, kodeGuru } atau null. jenis: "siswa" | "guru" | "semua" */
function sekolahDariKode(teks, jenis) {
  const k = rapikanKode(teks);
  if (!k) return null;
  return daftarSekolah().find((x) =>
    ((jenis === "siswa" || jenis === "semua") && x.kode === k) ||
    ((jenis === "guru" || jenis === "semua") && x.kodeGuru === k)) || null;
}

/** "k7q-2mx " -> "K7Q2MX" (huruf yang mirip dibetulkan: O->0 dst gak perlu, karena gak dipakai) */
function rapikanKode(teks) {
  const k = String(teks || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return k.length === 6 ? k : "";
}

/** kode sekolah acak 6 karakter yang belum dipakai */
function buatKodeBaru(sudahDipakai) {
  const pakai = sudahDipakai || semuaKode();
  for (;;) {
    let k = "";
    for (let i = 0; i < 6; i++) k += HURUF_KODE.charAt(Math.floor(Math.random() * HURUF_KODE.length));
    if (pakai.indexOf(k) < 0) return k;
  }
}

/**
 * Cari data siswa yang mengirim (nama + PIN + sekolah).
 * sekolah kosong (aplikasi versi lama / antrean lama) -> cari nama di semua
 * sekolah yang PIN-nya cocok.
 */
function cariPemilik(namaMentah, pinMentah, sekolahMentah) {
  const nama = rapikanNama(namaMentah);
  const pin = rapikanPin(pinMentah);
  if (!nama) return { ok: false, kode: "nama_kosong" };
  const siswa = sheetSiswa();
  const K = petaKolom(siswa, KOLOM_SISWA);

  let barisSiswa = 0;
  if (rapikanSekolah(sekolahMentah)) {
    const sekolah = cariSekolah(sekolahMentah);
    if (!sekolah) return { ok: false, kode: "sekolah_tidak_ada" };
    barisSiswa = cariBarisSekolah(siswa, K["Nama"], nama, K["Sekolah"], sekolah);
    if (!barisSiswa) return { ok: false, kode: "tidak_ada" };
    const pinLama = rapikanPin(siswa.getRange(barisSiswa, K["PIN"]).getValue());
    if (pinLama && pinLama !== pin) return { ok: false, kode: "pin_salah" };
  } else {
    const jml = siswa.getLastRow() - 1;
    const isi = jml > 0 ? siswa.getRange(2, 1, jml, siswa.getLastColumn()).getValues() : [];
    let adaNama = false;
    for (let i = 0; i < isi.length; i++) {
      if (kunciNama(String(isi[i][K["Nama"] - 1]).replace(/^'/, "")) !== kunciNama(nama)) continue;
      adaNama = true;
      const pinLama = rapikanPin(isi[i][K["PIN"] - 1]);
      if (!pinLama || pinLama === pin) { barisSiswa = i + 2; break; }
    }
    if (!barisSiswa) return { ok: false, kode: adaNama ? "pin_salah" : "tidak_ada" };
  }
  const namaAsli = String(siswa.getRange(barisSiswa, K["Nama"]).getValue()).replace(/^'/, "");
  const sekolah = String(siswa.getRange(barisSiswa, K["Sekolah"]).getValue()).replace(/^'/, "");
  return { ok: true, siswa, K, barisSiswa, namaAsli, sekolah };
}

/**
 * Pastikan yang ngirim nilai/skor memang pemilik nama (PIN cocok).
 * Kalau namanya belum terdaftar (catatan "masuk"-nya gak sampai), didaftarin.
 */
function cekPemilik(namaMentah, pinMentah, sekolahMentah) {
  let p = cariPemilik(namaMentah, pinMentah, sekolahMentah);
  if (!p.ok && p.kode === "tidak_ada" && rapikanSekolah(sekolahMentah)) {
    const m = masuk(namaMentah, pinMentah, sekolahMentah);
    if (!m.ok) return m;
    p = cariPemilik(namaMentah, pinMentah, sekolahMentah);
  }
  return p;
}

/**
 * Siswa lama baru memilih sekolah -> isi kolom "Sekolah" di baris nilai/skor
 * lamanya (tab Kuis/Game) yang masih kosong, biar ikut kelihatan oleh guru.
 */
function pindahkanNilaiLama(nama, sekolah) {
  SpreadsheetApp.getActiveSpreadsheet().getSheets().forEach((s) => {
    const m = s.getName().match(/^(Kuis|Game) \d{2}-\d{2}-\d{4}$/);
    if (!m || s.getLastRow() < 2) return;
    const kolS = petaKolom(s, m[1] === "Kuis" ? KOLOM_NILAI : KOLOM_GAME)["Sekolah"];
    const isi = s.getRange(2, 1, s.getLastRow() - 1, kolS).getValues();
    isi.forEach((r, i) => {
      if (kunciNama(String(r[1]).replace(/^'/, "")) === kunciNama(nama) && !String(r[kolS - 1]).trim()) {
        s.getRange(i + 2, kolS).setValue(amankan(sekolah));
      }
    });
  });
}

/** cari baris siswa + game tertentu (+ sekolah) di tab "Game ..." */
function cariBarisGame(sheet, nama, game, kolSekolah, sekolah) {
  const jumlah = sheet.getLastRow() - 1;
  if (jumlah < 1) return 0;
  const isi = sheet.getRange(2, 1, jumlah, Math.max(kolSekolah, 3)).getValues();
  const n = kunciNama(nama);
  const g = kunciNama(game);
  const s = kunciNama(sekolah);
  for (let i = 0; i < isi.length; i++) {
    if (kunciNama(String(isi[i][1]).replace(/^'/, "")) === n && kunciNama(isi[i][2]) === g &&
        kunciNama(String(isi[i][kolSekolah - 1]).replace(/^'/, "")) === s) return i + 2;
  }
  return 0;
}

/** buka tab (kalau belum ada: bikin + judul kolom tebal kuning) */
function ambilSheet(namaTab, kolom, posisi) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(namaTab);
  if (!sheet) {
    sheet = ss.insertSheet(namaTab, Math.min(posisi, ss.getSheets().length));
    sheet.appendRow(kolom);
    sheet.getRange(1, 1, 1, kolom.length).setFontWeight("bold").setBackground("#FFC93C");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Peta "judul kolom -> nomor kolom". Kalau ada judul yang belum ada di sheet
 * (mis. sheet lama sebelum ada kolom Sekolah), kolomnya ditambah di ujung kanan.
 */
function petaKolom(sheet, daftarJudul) {
  const lebar = Math.max(sheet.getLastColumn(), 1);
  const judul = sheet.getRange(1, 1, 1, lebar).getValues()[0].map(String);
  const peta = {};
  daftarJudul.forEach((j) => {
    let i = judul.indexOf(j);
    if (i < 0) {
      i = judul.length;
      judul.push(j);
      sheet.getRange(1, i + 1).setValue(j).setFontWeight("bold").setBackground("#FFC93C");
    }
    peta[j] = i + 1;
  });
  return peta;
}

/** nomor kolom yang judulnya `judul` (0 kalau gak ada) — gak nambah kolom */
function kolomJudul(sheet, judul) {
  const lebar = Math.max(sheet.getLastColumn(), 1);
  return sheet.getRange(1, 1, 1, lebar).getValues()[0].map(String).indexOf(judul) + 1;
}

/**
 * Cari baris yang kolom nama-nya = nama DAN kolom sekolah-nya = sekolah
 * (huruf besar/kecil & spasi dianggap sama). sekolah "" = kolom sekolah kosong.
 * kolSekolah 0 (tab lama tanpa kolom Sekolah) = dianggap kosong semua.
 */
function cariBarisSekolah(sheet, kolNama, nama, kolSekolah, sekolah) {
  const jumlah = sheet.getLastRow() - 1;
  if (jumlah < 1) return 0;
  const lebar = Math.max(kolNama, kolSekolah);
  const isi = sheet.getRange(2, 1, jumlah, lebar).getValues();
  const n = kunciNama(nama);
  const s = kunciNama(sekolah);
  for (let i = 0; i < isi.length; i++) {
    const sk = kolSekolah ? kunciNama(String(isi[i][kolSekolah - 1]).replace(/^'/, "")) : "";
    if (kunciNama(String(isi[i][kolNama - 1]).replace(/^'/, "")) === n && sk === s) return i + 2;
  }
  return 0;
}

function kunciNama(nama) {
  return String(nama || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function rapikanNama(nama) {
  return String(nama || "").trim().replace(/\s+/g, " ").slice(0, 40);
}

function rapikanSekolah(nama) {
  return String(nama || "").trim().replace(/\s+/g, " ").slice(0, 60);
}

/** PIN siswa = tepat 4 angka (angka dari sheet yang kebaca 123 -> "0123"), selain itu "" */
function rapikanPin(pin) {
  let p = String(pin === null || pin === undefined ? "" : pin).trim().replace(/^'/, "");
  if (/^\d{1,4}$/.test(p)) p = p.padStart(4, "0");
  return /^\d{4}$/.test(p) ? p : "";
}

/** PIN guru yang DIKETIK harus tepat 6 angka */
function pinGuruKetik(pin) {
  const p = String(pin === null || pin === undefined ? "" : pin).trim();
  return /^\d{6}$/.test(p) ? p : "";
}

/** PIN guru dari sheet (angka 012345 kebaca 12345 -> "012345") */
function rapikanPinGuru(pin) {
  let p = String(pin === null || pin === undefined ? "" : pin).trim().replace(/^'/, "");
  if (/^\d{1,6}$/.test(p)) p = p.padStart(6, "0");
  return /^\d{6}$/.test(p) ? p : "";
}

/** "07-10-2026 09:30" / "07-10-2026" -> "2026-10-07T09:30:00+07:00" (buat JavaScript) */
function keISO(teks) {
  const m = String(teks || "").match(/(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (!m) return "";
  return `${m[3]}-${m[2]}-${m[1]}T${m[4] || "00"}:${m[5] || "00"}:00+07:00`;
}

/** teks dari siswa/guru: dipotong & jangan sampai kebaca sebagai rumus (=, +, -, @) */
function amankan(teks) {
  teks = String(teks || "").trim().slice(0, 60);
  return /^[=+\-@]/.test(teks) ? "'" + teks : teks;
}

function balas(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
