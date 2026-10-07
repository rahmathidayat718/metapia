/* ==========================================================================
   METAPIA — Google Apps Script penerima & pemberi data untuk website
   --------------------------------------------------------------------------
   File ini BUKAN bagian website. Isinya di-copy ke Google Apps Script.

   YANG DICATAT DI GOOGLE SHEET:
   1) Tab "Daftar Siswa"  -> 1 siswa = 1 baris
        Nama | Pertama Masuk | Terakhir Masuk | Jumlah Masuk | PIN |
        Nilai Kuis Terakhir | Kuis Terakhir
      - Nama gak boleh dobel (huruf besar/kecil dianggap sama: "acel" = "Acel")
      - PIN 4 angka dipakai biar siswa bisa masuk dari perangkat mana pun.
        Kalau siswa lupa PIN: guru lihat kolom PIN, atau KOSONGKAN sel PIN-nya
        -> siswa itu bisa bikin PIN baru waktu masuk berikutnya.

   2) Tab "Kuis DD-MM-YYYY" -> nilai kuis, DIPISAH PER TANGGAL
        No | Nama | Nilai Pertama | Nilai Terbaik | Nilai Terakhir |
        Jumlah Mencoba | Jawaban Terakhir | Jam Terakhir
      Tiap hari ada yang kuis -> otomatis bikin tab baru. Kalau 1 anak
      ngulang kuis di hari yang sama, barisnya di-update (gak dobel).

   3) Tab "Game DD-MM-YYYY" -> skor game, DIPISAH PER TANGGAL
        No | Nama | Game | Skor Pertama | Skor Terbaik | Skor Terakhir |
        Jumlah Main | Benar Terakhir | Jam Terakhir
      1 baris = 1 siswa + 1 game per hari (main lagi -> barisnya di-update).
      "Daftar Siswa" juga nyatet game terakhir yang dimainkan (buat Dashboard).

   CARA PASANG PERTAMA KALI:
   1. Buat Google Sheet baru -> menu Ekstensi -> Apps Script.
   2. Hapus semua isi Code.gs di sana, paste SELURUH isi file ini, Simpan (💾).
   3. "Terapkan" (Deploy) -> "Deployment baru" -> jenis "Aplikasi web":
      - Jalankan sebagai: "Saya"   - Yang memiliki akses: "Siapa saja"
      - Terapkan, izinkan akses (Advanced -> Go to ... (unsafe) -> Allow).
   4. Copy "URL aplikasi web" (berakhiran /exec) ke js/sheet.js.
   5. Cek: buka URL itu di browser -> muncul "METAPIA siap menerima data ✓".

   CARA UPDATE (kalau isi file ini berubah, mis. versi PIN ini):
   1. Paste ulang SELURUH isi file ini ke Code.gs di Apps Script, Simpan.
   2. "Terapkan" -> "Kelola deployment" -> klik ✏️ (edit) ->
      Versi: "Versi baru" -> "Terapkan".  (URL /exec-nya TETAP SAMA)
   ========================================================================== */

const ZONA_WAKTU = "Asia/Jakarta"; // WIB. Ganti "Asia/Makassar" (WITA) / "Asia/Jayapura" (WIT) kalau perlu
const SHEET_SISWA = "Daftar Siswa";
const KOLOM_SISWA = ["Nama", "Pertama Masuk", "Terakhir Masuk", "Jumlah Masuk", "PIN", "Nilai Kuis Terakhir", "Kuis Terakhir",
                     "Game Terakhir", "Skor Game Terakhir", "Waktu Game Terakhir"];
const KOLOM_NILAI = ["No", "Nama", "Nilai Pertama", "Nilai Terbaik", "Nilai Terakhir", "Jumlah Mencoba", "Jawaban Terakhir", "Jam Terakhir"];
const KOLOM_GAME = ["No", "Nama", "Game", "Skor Pertama", "Skor Terbaik", "Skor Terakhir", "Jumlah Main", "Benar Terakhir", "Jam Terakhir"];

/* ==========================================================================
   PINTU MASUK
   - POST {aksi:"masuk", nama, pin}  -> daftar / masuk, balas nilai terakhir
   - POST {aksi:"nilai", nama, pin, nilai, benar, salah, jawaban} -> simpan nilai
   - POST {aksi:"game", nama, pin, gameId, game, skor, benar}     -> simpan skor game
   - GET  ?aksi=status&nama=..&pin=.. -> balas nilai & game terakhir (Dashboard)
   - GET  (tanpa aksi)               -> cek script hidup
   ========================================================================== */
function doPost(e) {
  // kunci biar kalau banyak siswa kirim barengan, datanya gak tabrakan
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.aksi === "masuk") return balas(masuk(data.nama, data.pin));
    if (data.aksi === "nilai") return balas(catatNilai(data));
    if (data.aksi === "game") return balas(catatGame(data));
    return balas({ ok: false, kode: "aksi_salah" });
  } catch (err) {
    return balas({ ok: false, kode: "error", pesan: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.aksi === "status") {
    try {
      return balas(status(p.nama, p.pin));
    } catch (err) {
      return balas({ ok: false, kode: "error", pesan: String(err) });
    }
  }
  return ContentService.createTextOutput("METAPIA siap menerima data ✓");
}

/* ==========================================================================
   1) MASUK / DAFTAR
   ========================================================================== */
function masuk(namaMentah, pinMentah) {
  const nama = rapikanNama(namaMentah);
  const pin = rapikanPin(pinMentah);
  if (!nama) return { ok: false, kode: "nama_kosong" };
  if (!pin) return { ok: false, kode: "pin_salah_format" };

  const sheet = sheetSiswa();
  const K = petaKolom(sheet, KOLOM_SISWA);
  const sekarang = new Date();
  const baris = cariBaris(sheet, K["Nama"], nama);

  // a) nama baru -> daftar
  if (!baris) {
    const r = sheet.getLastRow() + 1;
    sheet.getRange(r, K["Nama"]).setValue(amankan(nama));
    sheet.getRange(r, K["Pertama Masuk"]).setValue(sekarang).setNumberFormat("dd/MM/yyyy HH:mm");
    sheet.getRange(r, K["Terakhir Masuk"]).setValue(sekarang).setNumberFormat("dd/MM/yyyy HH:mm");
    sheet.getRange(r, K["Jumlah Masuk"]).setValue(1);
    sheet.getRange(r, K["PIN"]).setNumberFormat("@").setValue(pin); // "@" = teks, biar 0123 gak jadi 123
    return { ok: true, status: "baru", nama, nilai: null };
  }

  // b) nama sudah ada -> cek PIN
  const namaAsli = String(sheet.getRange(baris, K["Nama"]).getValue()).replace(/^'/, "");
  const pinLama = rapikanPin(sheet.getRange(baris, K["PIN"]).getValue());
  if (pinLama && pinLama !== pin) {
    return { ok: false, kode: "pin_salah", nama: namaAsli };
  }
  if (!pinLama) sheet.getRange(baris, K["PIN"]).setNumberFormat("@").setValue(pin); // siswa lama / PIN dikosongin guru

  const jumlah = Number(sheet.getRange(baris, K["Jumlah Masuk"]).getValue()) || 0;
  sheet.getRange(baris, K["Terakhir Masuk"]).setValue(sekarang).setNumberFormat("dd/MM/yyyy HH:mm");
  sheet.getRange(baris, K["Jumlah Masuk"]).setValue(jumlah + 1);

  return {
    ok: true,
    status: pinLama ? "masuk" : "pin_baru",
    nama: namaAsli,
    nilai: nilaiTerakhir(sheet, K, baris, namaAsli),
    game: gameTerakhir(sheet, K, baris),
  };
}

/** dipakai Dashboard buat nyamain nilai dengan sheet (kuis di perangkat lain) */
function status(namaMentah, pinMentah) {
  const nama = rapikanNama(namaMentah);
  const pin = rapikanPin(pinMentah);
  const sheet = sheetSiswa();
  const K = petaKolom(sheet, KOLOM_SISWA);
  const baris = cariBaris(sheet, K["Nama"], nama);
  if (!baris) return { ok: false, kode: "tidak_ada" };
  const pinLama = rapikanPin(sheet.getRange(baris, K["PIN"]).getValue());
  if (pinLama && pinLama !== pin) return { ok: false, kode: "pin_salah" };
  return { ok: true, nilai: nilaiTerakhir(sheet, K, baris, nama), game: gameTerakhir(sheet, K, baris) };
}

/* ==========================================================================
   2) NILAI KUIS — 1 tab per tanggal + update "Daftar Siswa"
   ========================================================================== */
function catatNilai(data) {
  // pastikan yang ngirim memang pemilik nama (PIN cocok)
  const p = cekPemilik(data.nama, data.pin);
  if (!p.ok) return p;
  const { siswa, K, barisSiswa, namaAsli } = p;

  const sekarang = new Date();
  const tanggal = Utilities.formatDate(sekarang, ZONA_WAKTU, "dd-MM-yyyy");
  const jam = Utilities.formatDate(sekarang, ZONA_WAKTU, "HH:mm");
  const nilai = Number(data.nilai) || 0;
  const jawaban = amankan(data.jawaban);

  // a) tab tanggal hari ini (tab baru ditaruh di posisi ke-2, habis "Daftar Siswa")
  const sheet = ambilSheet("Kuis " + tanggal, KOLOM_NILAI, 1);
  const baris = cariBaris(sheet, 2, namaAsli);
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
  } else {
    const no = sheet.getLastRow(); // baris 1 = judul, jadi siswa pertama = No 1
    sheet.appendRow([no, amankan(namaAsli), nilai, nilai, nilai, 1, jawaban, jam]);
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
  const p = cekPemilik(data.nama, data.pin);
  if (!p.ok) return p;
  const { siswa, K, barisSiswa, namaAsli } = p;

  const sekarang = new Date();
  const tanggal = Utilities.formatDate(sekarang, ZONA_WAKTU, "dd-MM-yyyy");
  const jam = Utilities.formatDate(sekarang, ZONA_WAKTU, "HH:mm");
  const skor = Math.max(0, Math.min(100, Number(data.skor) || 0));
  const game = amankan(data.game || ("Game " + data.gameId));
  const benar = amankan(data.benar);

  // a) tab tanggal hari ini: 1 baris per siswa + game
  const sheet = ambilSheet("Game " + tanggal, KOLOM_GAME, 1);
  const baris = cariBarisGame(sheet, namaAsli, game);
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
  } else {
    const no = sheet.getLastRow(); // baris 1 = judul, jadi siswa pertama = No 1
    sheet.appendRow([no, amankan(namaAsli), game, skor, skor, skor, 1, benar, jam]);
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
function nilaiTerakhir(sheet, K, baris, nama) {
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
    const b = cariBaris(s, 2, nama);
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
   ALAT BANTU
   ========================================================================== */

function sheetSiswa() {
  return ambilSheet(SHEET_SISWA, KOLOM_SISWA, 0);
}

/**
 * Pastikan yang ngirim nilai/skor memang pemilik nama (PIN cocok).
 * Kalau namanya belum terdaftar (catatan "masuk"-nya gak sampai), didaftarin.
 */
function cekPemilik(namaMentah, pinMentah) {
  const nama = rapikanNama(namaMentah);
  const pin = rapikanPin(pinMentah);
  if (!nama) return { ok: false, kode: "nama_kosong" };

  const siswa = sheetSiswa();
  const K = petaKolom(siswa, KOLOM_SISWA);
  let barisSiswa = cariBaris(siswa, K["Nama"], nama);
  if (barisSiswa) {
    const pinLama = rapikanPin(siswa.getRange(barisSiswa, K["PIN"]).getValue());
    if (pinLama && pinLama !== pin) return { ok: false, kode: "pin_salah" };
  } else {
    masuk(nama, pin);
    barisSiswa = cariBaris(siswa, K["Nama"], nama);
  }
  const namaAsli = String(siswa.getRange(barisSiswa, K["Nama"]).getValue()).replace(/^'/, "");
  return { ok: true, siswa, K, barisSiswa, namaAsli };
}

/** cari baris siswa + game tertentu di tab "Game ..." */
function cariBarisGame(sheet, nama, game) {
  const jumlah = sheet.getLastRow() - 1;
  if (jumlah < 1) return 0;
  const isi = sheet.getRange(2, 2, jumlah, 2).getValues(); // kolom Nama & Game
  const n = kunciNama(nama);
  const g = kunciNama(game);
  for (let i = 0; i < isi.length; i++) {
    if (kunciNama(String(isi[i][0]).replace(/^'/, "")) === n && kunciNama(isi[i][1]) === g) return i + 2;
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
 * (mis. sheet lama sebelum ada kolom PIN), kolomnya ditambah di ujung kanan.
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

/** cari nomor baris yang kolom-nya berisi nama (huruf besar/kecil & spasi dianggap sama) */
function cariBaris(sheet, kolom, nama) {
  const jumlah = sheet.getLastRow() - 1;
  if (jumlah < 1) return 0;
  const isi = sheet.getRange(2, kolom, jumlah, 1).getValues();
  const dicari = kunciNama(nama);
  for (let i = 0; i < isi.length; i++) {
    if (kunciNama(String(isi[i][0]).replace(/^'/, "")) === dicari) return i + 2;
  }
  return 0;
}

function kunciNama(nama) {
  return String(nama || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function rapikanNama(nama) {
  return String(nama || "").trim().replace(/\s+/g, " ").slice(0, 40);
}

/** PIN = tepat 4 angka (angka dari sheet yang kebaca 123 -> "0123"), selain itu "" */
function rapikanPin(pin) {
  let p = String(pin === null || pin === undefined ? "" : pin).trim().replace(/^'/, "");
  if (/^\d{1,4}$/.test(p)) p = p.padStart(4, "0");
  return /^\d{4}$/.test(p) ? p : "";
}

/** "07-10-2026 09:30" / "07-10-2026" -> "2026-10-07T09:30:00+07:00" (buat JavaScript) */
function keISO(teks) {
  const m = String(teks || "").match(/(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (!m) return "";
  return `${m[3]}-${m[2]}-${m[1]}T${m[4] || "00"}:${m[5] || "00"}:00+07:00`;
}

/** teks dari siswa: dipotong & jangan sampai kebaca sebagai rumus (=, +, -, @) */
function amankan(teks) {
  teks = String(teks || "").trim().slice(0, 60);
  return /^[=+\-@]/.test(teks) ? "'" + teks : teks;
}

function balas(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
