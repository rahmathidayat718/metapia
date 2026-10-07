/* ==========================================================================
   METAPIA — auth.js
   Login pakai NAMA + PIN 4 angka (tanpa email/password).

   - Nama baru            -> didaftarkan ke Google Sheet (tab "Daftar Siswa")
                             bareng PIN-nya, lalu PIN ditampilkan biar diingat
   - Nama sudah ada + PIN cocok -> masuk; nilai kuis terakhirnya diambil
                             dari sheet (jadi bisa masuk dari perangkat mana pun)
   - Nama sudah ada + PIN beda  -> ditolak: "nama sudah dipakai temanmu"
     ("acel" & "Acel" dianggap nama yang sama)

   Data login disimpan di localStorage ("metapia_user"): { nama, pin, ... }
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

function showLoginError(msg) {
  const el = document.getElementById("loginError");
  if (el) {
    el.textContent = msg;
    el.style.display = msg ? "block" : "none";
  }
}

function simpanLogin(nama, pin) {
  localStorage.setItem("metapia_user", JSON.stringify({
    nama,
    pin,
    foto: "",
    masukPakai: "nama",
    loginPada: new Date().toISOString(),
  }));
}

document.addEventListener("DOMContentLoaded", () => {
  // kalau sudah login sebelumnya (nama + PIN), langsung ke dashboard
  try {
    const lama = JSON.parse(localStorage.getItem("metapia_user"));
    if (lama && lama.masukPakai === "nama" && /^\d{4}$/.test(lama.pin || "")) {
      window.location.replace("dashboard.html");
      return;
    }
  } catch (e) {}

  const form = document.getElementById("formLogin");
  const inputNama = document.getElementById("namaSiswa");
  const inputPin = document.getElementById("pinSiswa");
  const btnMasuk = document.getElementById("btnMasuk");
  const isiTombol = btnMasuk.innerHTML;

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
    const nama = rapikanNama(inputNama.value);
    const pin = inputPin.value;

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
      simpanLogin(nama, pin);
      window.location.href = "dashboard.html";
      return;
    }

    btnMasuk.disabled = true;
    btnMasuk.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengecek nama...';

    let hasil;
    try {
      hasil = await tanyaSheet({ aksi: "masuk", nama, pin });
    } catch (err) {
      hasil = null;
    }
    btnMasuk.disabled = false;
    btnMasuk.innerHTML = isiTombol;

    if (!hasil) {
      showLoginError("Gagal terhubung ke server. Cek internet, lalu coba lagi ya.");
      return;
    }
    if (!hasil.ok) {
      if (hasil.kode === "pin_salah") {
        showLoginError(
          `Nama "${hasil.nama || nama}" sudah dipakai temanmu. ` +
          "Kalau itu kamu, cek lagi PIN-nya. Kalau bukan, pakai nama lain ya."
        );
        inputPin.value = "";
        inputPin.focus();
      } else {
        showLoginError("Ada yang salah, coba lagi ya.");
      }
      return;
    }

    // berhasil: pakai ejaan nama dari sheet (mis. ngetik "acel" -> "Acel")
    simpanLogin(hasil.nama, pin);
    if (hasil.nilai) simpanNilaiLokal(hasil.nama, hasil.nilai.nilai, hasil.nilai.tanggal);
    if (hasil.game) simpanGameTerakhirLokal(hasil.nama, hasil.game.game, hasil.game.skor, hasil.game.tanggal);

    if (hasil.status === "masuk") {
      window.location.href = "dashboard.html";
    } else {
      // siswa baru (atau siswa lama yang baru bikin PIN): tunjukin PIN-nya dulu
      form.hidden = true;
      document.querySelector(".login-foot").hidden = true;
      document.getElementById("suksesNama").textContent = hasil.nama.split(" ")[0];
      document.getElementById("suksesPin").textContent = pin;
      document.getElementById("loginSukses").hidden = false;
    }
  });
});
