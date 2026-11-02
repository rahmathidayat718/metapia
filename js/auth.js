/* ==========================================================================
   METAPIA — auth.js
   Halaman masuk SISWA: KODE SEKOLAH + NAMA + PIN 4 angka (tanpa email).
   (Masuk/daftar GURU ada di js/auth-guru.js)

   - Kode sekolah (6 huruf/angka) dibagikan guru lewat LINK/QR
     (index.html?sekolah=KODE -> kodenya langsung terisi) atau diketik.
     Begitu kode lengkap, nama sekolahnya muncul sebagai konfirmasi.
   - Nama baru            -> didaftarkan ke Google Sheet (tab "Daftar Siswa")
                             bareng PIN & sekolahnya, lalu PIN ditampilkan
   - Nama sudah ada + PIN cocok -> masuk; nilai kuis terakhirnya diambil
                             dari sheet (jadi bisa masuk dari perangkat mana pun)
   - Nama sudah ada + PIN beda  -> ditolak: "nama sudah dipakai temanmu"
     ("acel" & "Acel" dianggap nama yang sama; "Andi" di SD A & SD B beda)
   - Siswa lama (belum punya sekolah) diminta memasukkan kode sekolah sekali.

   Data login disimpan di localStorage ("metapia_user"):
     { nama, pin, sekolah, kodeSekolah, ... }
   ========================================================================== */

/**
 * Rapikan nama: hapus spasi berlebih & huruf depan tiap kata jadi kapital.
 * "  andi   saputra " -> "Andi Saputra"
 */
function rapikanNama(teks) {
  return teks
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (huruf) => huruf.toUpperCase());
}

function showLoginError(msg, id = "loginError") {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg;
    el.style.display = msg ? "block" : "none";
  }
}

function simpanLogin(nama, pin, sekolah, kodeSekolah = "") {
  localStorage.setItem("metapia_user", JSON.stringify({
    nama,
    pin,
    sekolah,
    kodeSekolah,
    foto: "",
    masukPakai: "nama",
    loginPada: new Date().toISOString(),
  }));
}

/**
 * Kotak isian kode sekolah: huruf otomatis kapital, dan begitu 6 karakter
 * langsung dicek -> nama sekolahnya ditampilkan di bawah kotak.
 * jenis() -> "siswa" | "guru" | "semua" (kode mana yang dicek)
 * Hasil: { hasil() -> { ok, sekolah, kode } | {ok:false} | null, cek() -> Promise }
 */
function pasangKotakKode(input, info, jenis = () => "siswa") {
  let hasil = null;
  let urutan = 0;
  function tulis(teks, kelas) {
    info.hidden = !teks;
    info.className = "info-sekolah " + (kelas || "");
    info.textContent = teks;
  }
  async function cek() {
    const kode = rapikanKodeSekolah(input.value);
    const ke = ++urutan;
    if (!kode) {
      hasil = null;
      tulis(input.value.trim() ? "Kode sekolah terdiri dari 6 huruf/angka." : "", "");
      return hasil;
    }
    tulis("Mengecek kode...", "");
    const h = await cekKodeSekolah(kode, jenis());
    if (ke !== urutan) return hasil; // sudah diketik ulang
    hasil = h;
    if (!h) tulis("Kode belum bisa dicek (sedang offline).", "is-salah");
    else if (h.ok) tulis(`🏫 ${h.sekolah}`, "is-ok");
    else tulis(jenis() === "guru" ? "Kode guru tidak ditemukan. Pastikan ini KODE GURU, bukan kode siswa." : "Kode sekolah tidak ditemukan. Cek lagi, ya.", "is-salah");
    return hasil;
  }
  let timer = null;
  input.addEventListener("input", () => {
    // tampilkan rapi: huruf kapital, cuma huruf & angka
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    hasil = null;
    clearTimeout(timer);
    timer = setTimeout(cek, 250);
  });
  return { hasil: () => hasil, cek };
}

// fungsi login offline (ingatAkun, cekAkunOffline) ada di js/pwa.js

document.addEventListener("DOMContentLoaded", () => {
  // guru yang sudah masuk -> langsung ke halaman guru
  try {
    const guru = JSON.parse(localStorage.getItem("metapia_guru"));
    if (guru && guru.nama && guru.sekolah) {
      window.location.replace("guru.html");
      return;
    }
  } catch (e) {}

  // siswa yang sudah login sebelumnya (nama + PIN + sekolah) -> langsung ke dashboard
  let lama = null;
  try {
    lama = JSON.parse(localStorage.getItem("metapia_user"));
    if (lama && lama.masukPakai === "nama" && /^\d{4}$/.test(lama.pin || "")) {
      if (lama.sekolah) {
        window.location.replace("dashboard.html");
        return;
      }
    } else {
      lama = null;
    }
  } catch (e) { lama = null; }

  const form = document.getElementById("formLogin");
  const inputKode = document.getElementById("kodeSekolahSiswa");
  const inputNama = document.getElementById("namaSiswa");
  const inputPin = document.getElementById("pinSiswa");
  const btnMasuk = document.getElementById("btnMasuk");
  const isiTombol = btnMasuk.innerHTML;
  const pakaiSekolah = !!GOOGLE_SHEET_URL; // tanpa Google Sheet (uji coba lokal) gak perlu kode sekolah

  /* ---------- tab Siswa / Guru ---------- */
  const tabSiswa = document.getElementById("tabSiswa");
  const tabGuru = document.getElementById("tabGuru");
  function pilihPeran(guru) {
    tabSiswa.classList.toggle("is-aktif", !guru);
    tabGuru.classList.toggle("is-aktif", guru);
    tabSiswa.setAttribute("aria-selected", String(!guru));
    tabGuru.setAttribute("aria-selected", String(guru));
    form.hidden = guru;
    document.getElementById("formGuru").hidden = !guru;
  }
  tabSiswa.addEventListener("click", () => pilihPeran(false));
  tabGuru.addEventListener("click", () => pilihPeran(true));
  if (location.hash === "#guru") pilihPeran(true);
  window.addEventListener("hashchange", () => pilihPeran(location.hash === "#guru"));

  /* ---------- kode sekolah: dari link/QR guru, atau yang terakhir dipakai ---------- */
  const kotakKode = pasangKotakKode(inputKode, document.getElementById("infoSekolahSiswa"));
  if (!pakaiSekolah) {
    document.getElementById("barisSekolahSiswa").hidden = true;
  } else {
    const dariLink = rapikanKodeSekolah(new URLSearchParams(location.search).get("sekolah"));
    const kode = dariLink || (lama && lama.kodeSekolah) || localStorage.getItem("metapia_kode_terakhir") || "";
    if (kode) {
      inputKode.value = kode;
      kotakKode.cek();
    }
  }
  inputKode.addEventListener("input", () => showLoginError(""));

  // akun lama tanpa sekolah: nama sudah terisi, tinggal isi kode sekolah + PIN
  if (lama && !lama.sekolah) {
    inputNama.value = lama.nama;
    document.querySelector(".login-hint-siswa").innerHTML =
      "Sekarang METAPIA dipakai beberapa sekolah. Isi <b>kode sekolah</b> dari gurumu, lalu masukkan PIN-mu seperti biasa, ya!";
  }

  inputNama.addEventListener("input", () => showLoginError(""));
  inputPin.addEventListener("input", () => {
    inputPin.value = inputPin.value.replace(/\D/g, "").slice(0, 4); // cuma angka
    showLoginError("");
  });

  // tombol mata: lihat / sembunyikan PIN
  document.getElementById("lihatPin").addEventListener("click", (e) => {
    const lihat = inputPin.type === "password";
    inputPin.type = lihat ? "text" : "password";
    e.currentTarget.innerHTML = `<i class="fa-solid ${lihat ? "fa-eye-slash" : "fa-eye"}"></i>`;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const kode = rapikanKodeSekolah(inputKode.value);
    const nama = rapikanNama(inputNama.value);
    const pin = inputPin.value;

    if (pakaiSekolah && !kode) {
      showLoginError("Isi kode sekolah (6 huruf/angka) dari gurumu dulu, ya 🏫");
      inputKode.focus();
      return;
    }
    if (nama.length < 2) {
      showLoginError("Tulis namamu dulu ya, minimal 2 huruf 😊");
      inputNama.focus();
      return;
    }
    if (!/^[\p{L} .'-]+$/u.test(nama)) {
      showLoginError("Nama cukup pakai huruf saja ya, tanpa angka atau simbol.");
      inputNama.focus();
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      showLoginError("PIN harus 4 angka, misalnya 1234.");
      inputPin.focus();
      return;
    }

    // belum nyambung ke Google Sheet -> login biasa di perangkat ini aja
    if (!GOOGLE_SHEET_URL) {
      simpanLogin(nama, pin, "Lokal");
      window.location.href = "dashboard.html";
      return;
    }
    localStorage.setItem("metapia_kode_terakhir", kode);

    btnMasuk.disabled = true;
    btnMasuk.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengecek nama...';

    let hasil = null;
    if (navigator.onLine !== false) {
      try {
        hasil = await tanyaSheet({ aksi: "masuk", nama, pin, kodeSekolah: kode });
      } catch (err) {
        hasil = null;
      }
    }
    btnMasuk.disabled = false;
    btnMasuk.innerHTML = isiTombol;

    if (!hasil) {
      // gak bisa nyambung ke server -> coba login offline (akun yang pernah masuk di HP ini)
      const k = kotakKode.hasil() || (await kotakKode.cek());
      if (!k || !k.ok) {
        showLoginError("Sedang offline. Kode sekolah ini belum pernah dipakai di HP/komputer ini, jadi butuh internet dulu, ya.");
        return;
      }
      const off = await cekAkunOffline(nama, pin, k.sekolah);
      if (off.status === "cocok") {
        simpanLogin(off.nama, pin, off.sekolah || k.sekolah, kode);
        window.location.href = "dashboard.html";
      } else if (off.status === "pin_salah") {
        showLoginError("PIN-nya belum cocok. Coba cek lagi, ya.");
        inputPin.value = "";
        inputPin.focus();
      } else {
        showLoginError("Sedang offline. Untuk masuk pertama kali di HP/komputer ini, butuh internet dulu, ya.");
      }
      return;
    }
    if (!hasil.ok) {
      if (hasil.kode === "pin_salah") {
        showLoginError(
          `Nama "${hasil.nama || nama}" sudah dipakai temanmu di sekolah ini. ` +
          "Kalau itu kamu, cek lagi PIN-nya. Kalau bukan, pakai nama lain ya."
        );
        inputPin.value = "";
        inputPin.focus();
      } else if (hasil.kode === "kode_salah" || hasil.kode === "perlu_sekolah") {
        showLoginError("Kode sekolah tidak ditemukan. Cek lagi ke gurumu, ya.");
        inputKode.focus();
      } else if (hasil.kode === "aksi_salah") {
        showLoginError("Server Google Sheet belum diperbarui. Beri tahu gurumu, ya.");
      } else {
        showLoginError("Ada yang salah, coba lagi ya.");
      }
      return;
    }

    // berhasil: pakai ejaan nama & sekolah dari sheet (mis. ngetik "acel" -> "Acel")
    const sekolah = hasil.sekolah || "";
    const kodeAsli = hasil.kodeSekolah || kode;
    simpanLogin(hasil.nama, pin, sekolah, kodeAsli);
    await ingatAkun(hasil.nama, pin, sekolah); // biar nanti bisa login offline di perangkat ini
    try {
      const simpan = JSON.parse(localStorage.getItem("metapia_kode")) || {};
      simpan[kodeAsli] = sekolah;
      localStorage.setItem("metapia_kode", JSON.stringify(simpan));
    } catch (x) {}
    if (hasil.nilai) simpanNilaiLokal(hasil.nama, hasil.nilai.nilai, hasil.nilai.tanggal);
    if (hasil.game) simpanGameTerakhirLokal(hasil.nama, hasil.game.game, hasil.game.skor, hasil.game.tanggal);

    if (hasil.status === "masuk") {
      window.location.href = "dashboard.html";
    } else {
      // siswa baru (atau siswa lama yang baru bikin PIN): tunjukin PIN-nya dulu
      form.hidden = true;
      document.querySelector(".peran-tab").hidden = true;
      document.getElementById("suksesNama").textContent = hasil.nama.split(" ")[0];
      document.getElementById("suksesPin").textContent = pin;
      document.getElementById("loginSukses").hidden = false;
    }
  });
});
