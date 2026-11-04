/* ==========================================================================
   METAPIA — auth-guru.js
   Tab "Guru" di halaman masuk (index.html). 3 pilihan:
   - Masuk          : kode sekolah (kode siswa / kode guru) + nama + PIN 6 angka
   - Gabung sekolah : sekolahnya SUDAH didaftarkan guru lain -> wajib
                      KODE GURU (minta ke guru itu; kode siswa ditolak, biar
                      siswa/orang tua gak bisa ngaku guru) + nama + PIN baru
   - Sekolah baru   : nama sekolah + nama + PIN baru (+ kode pembuat
                      sekolah kalau pengelola mengisinya di Code.gs)
                      -> dapat KODE SISWA (buat siswa) & KODE GURU (buat guru lain)
   Setelah masuk -> guru.html (rekap nilai siswa sekolahnya, LIHAT saja).

   Data guru disimpan di localStorage ("metapia_guru"):
     { nama, pin, sekolah, kodeSekolah, kodeGuru } — terpisah dari akun siswa.
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formGuru");
  if (!form) return;
  const inputKodeSekolah = document.getElementById("kodeSekolahGuru");
  const barisKodeSekolah = document.getElementById("barisKodeSekolahGuru");
  const barisBaru = document.getElementById("barisSekolahBaru");
  const inputBaru = document.getElementById("sekolahBaru");
  const inputNama = document.getElementById("namaGuru");
  const inputPin = document.getElementById("pinGuru");
  const barisKode = document.getElementById("barisKodeGuru");
  const inputKode = document.getElementById("kodeGuru");
  const btn = document.getElementById("btnGuru");
  const hint = document.getElementById("hintMode");
  const err = (m) => showLoginError(m, "guruError");
  let mode = "masuk";    // masuk | gabung | baru
  const kotakKode = pasangKotakKode(inputKodeSekolah, document.getElementById("infoSekolahGuru"),
    () => (mode === "gabung" ? "guru" : "semua"));
  const labelKode = barisKodeSekolah.querySelector("label");
  let butuhKode = false; // perlu kode pembuat sekolah?

  const TEKS = {
    masuk: { tombol: 'Masuk sebagai Guru <i class="fa-solid fa-arrow-right"></i>', hint: "Sudah punya akun guru? Isi kode sekolah, nama, dan PIN Anda." },
    gabung: { tombol: 'Gabung ke Sekolah <i class="fa-solid fa-user-plus"></i>', hint: "Sekolah Anda sudah terdaftar? Minta <b>kode guru</b> (bukan kode siswa) kepada guru yang mendaftarkannya." },
    baru: { tombol: 'Daftarkan Sekolah <i class="fa-solid fa-school"></i>', hint: "Sekolah Anda belum terdaftar? Anda akan mendapat <b>kode siswa</b> (untuk siswa) dan <b>kode guru</b> (untuk guru lain)." },
  };
  function aturMode(m) {
    mode = m;
    form.querySelectorAll(".mode-btn").forEach((b) => b.classList.toggle("is-aktif", b.dataset.mode === m));
    barisKodeSekolah.hidden = m === "baru";
    barisBaru.hidden = m !== "baru";
    barisKode.hidden = !(m === "baru" && butuhKode);
    btn.innerHTML = TEKS[m].tombol;
    hint.innerHTML = TEKS[m].hint;
    labelKode.textContent = m === "gabung" ? "Kode guru" : "Kode sekolah";
    if (rapikanKodeSekolah(inputKodeSekolah.value)) kotakKode.cek(); // cek ulang sesuai jenis kode
    err("");
  }
  form.querySelectorAll(".mode-btn").forEach((b) => b.addEventListener("click", () => aturMode(b.dataset.mode)));
  aturMode("masuk");

  if (!GOOGLE_SHEET_URL) {
    err("Halaman guru butuh Google Sheet (GOOGLE_SHEET_URL di js/sheet.js).");
    btn.disabled = true;
  } else {
    infoServer().then((info) => {
      butuhKode = !!(info && info.butuhKode);
      aturMode(mode);
    });
  }

  [inputBaru, inputNama, inputKode, inputKodeSekolah].forEach((el) => el.addEventListener("input", () => err("")));
  inputPin.addEventListener("input", () => {
    inputPin.value = inputPin.value.replace(/\D/g, "").slice(0, 6);
    err("");
  });
  document.getElementById("lihatPinGuru").addEventListener("click", (e) => {
    const lihat = inputPin.type === "password";
    inputPin.type = lihat ? "text" : "password";
    e.currentTarget.innerHTML = `<i class="fa-solid ${lihat ? "fa-eye-slash" : "fa-eye"}"></i>`;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const kodeSekolah = rapikanKodeSekolah(inputKodeSekolah.value);
    const sekolahBaru = inputBaru.value.trim().replace(/\s+/g, " ");
    const nama = inputNama.value.trim().replace(/\s+/g, " ");
    const pin = inputPin.value;

    if (mode !== "baru" && !kodeSekolah) { err(mode === "gabung" ? "Isi kode guru (6 huruf/angka)." : "Isi kode sekolah (6 huruf/angka)."); inputKodeSekolah.focus(); return; }
    if (mode === "baru" && sekolahBaru.length < 6) { err("Tulis nama sekolah lengkap, mis. SD Negeri 1 Ceria Makassar."); inputBaru.focus(); return; }
    if (nama.length < 3) { err("Tulis nama guru, minimal 3 huruf."); inputNama.focus(); return; }
    if (!/^\d{6}$/.test(pin)) { err("PIN guru harus 6 angka."); inputPin.focus(); return; }
    if (mode === "baru" && butuhKode && !inputKode.value.trim()) { err("Isi kode pembuat sekolah, ya."); inputKode.focus(); return; }
    if (mode === "baru" && !confirm(`Daftarkan sekolah baru "${sekolahBaru}"?\nPastikan ejaannya sudah benar.`)) return;
    if (mode === "gabung") {
      const k = kotakKode.hasil() || (await kotakKode.cek());
      if (k && k.ok && !confirm(`Gabung ke sekolah "${k.sekolah}"?`)) return;
    }

    if (navigator.onLine === false) { err("Tidak ada internet. Masuk sebagai guru memerlukan internet."); return; }
    const isiTombol = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengecek...';
    let hasil = null;
    try {
      hasil = mode === "masuk"
        ? await tanyaSheet({ aksi: "guruMasuk", nama, pin, kodeSekolah })
        : await tanyaSheet({ aksi: "guruDaftar", mode, nama, pin, kodeSekolah, sekolah: sekolahBaru, kode: inputKode.value.trim() });
    } catch (x) {
      hasil = null;
    }
    btn.disabled = false;
    btn.innerHTML = isiTombol;

    if (!hasil) { err("Gagal tersambung ke server. Periksa internet, lalu coba lagi."); return; }
    if (!hasil.ok) {
      const pesan = {
        pin_salah: "Nama atau PIN guru belum cocok.",
        guru_tidak_ada: "Nama ini belum terdaftar sebagai guru di sekolah tersebut. Pilih \"Gabung sekolah\" dulu, ya.",
        sudah_ada: `Guru "${hasil.nama || nama}" sudah terdaftar di sekolah ini. Pilih "Masuk" saja.`,
        kode_salah: mode === "gabung" ? "Kode guru tidak ditemukan. Minta kode guru kepada guru yang mendaftarkan sekolah." : "Kode sekolah tidak ditemukan.",
        kode_siswa: "Itu KODE SISWA. Untuk bergabung sebagai guru, minta KODE GURU kepada guru yang mendaftarkan sekolah.",
        kode_daftar_salah: "Kode pembuat sekolah salah.",
        sekolah_sudah_ada: "Sekolah dengan nama ini sudah terdaftar. Minta kode guru kepada guru yang mendaftarkannya, lalu pilih \"Gabung sekolah\". Kalau ini sekolah lain dengan nama yang sama, tambahkan nama kota/kecamatan.",
        nonaktif: "Akun guru ini dinonaktifkan oleh pengelola METAPIA.",
        aksi_salah: "Server Google Sheet belum diperbarui ke versi 5 (lihat google-sheet/Code.gs).",
      }[hasil.kode] || "Ada yang salah, coba lagi.";
      err(pesan);
      if (hasil.kode === "pin_salah") { inputPin.value = ""; inputPin.focus(); }
      return;
    }

    localStorage.setItem("metapia_guru", JSON.stringify({ nama: hasil.nama, pin, sekolah: hasil.sekolah, kodeSekolah: hasil.kodeSekolah, kodeGuru: hasil.kodeGuru }));
    localStorage.removeItem("metapia_rekap"); // rekap guru lain (kalau ada) dibuang
    if (mode !== "masuk") localStorage.setItem("metapia_guru_baru", "1"); // guru.html: tampilkan kode sekolah besar-besar
    if (mode !== "masuk") alert(`Pendaftaran berhasil! 🎉\n\nSekolah: ${hasil.sekolah}\nKode siswa: ${hasil.kodeSekolah}\nKode guru: ${hasil.kodeGuru}\nNama: ${hasil.nama}\nPIN: ${pin}\n\nCatat kode dan PIN ini. Kode siswa dan kode guru juga tampil di halaman Rekap.`);
    window.location.href = "guru.html";
  });
});
