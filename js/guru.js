/* ==========================================================================
   METAPIA — guru.js
   Halaman Guru: rekap nilai kuis & skor game SEMUA siswa di sekolah guru.
   HANYA MELIHAT — tidak ada tombol untuk mengubah/menghapus nilai.

   Data diambil dari Google Sheet (aksi "guruRekap" di Code.gs), lalu
   disimpan di perangkat ("metapia_rekap") biar tetap bisa dilihat offline.
   ========================================================================== */
const guru = JSON.parse(localStorage.getItem("metapia_guru") || "{}");
const URUTAN_GAME = ["Tebak Gambar", "Keranjang Majas", "Ubah Kalimatku"]; // nama game di sheet
const LABEL_GAME = { "Tebak Gambar": "Game 1", "Keranjang Majas": "Game 2", "Ubah Kalimatku": "Game 3" };

let rekap = null;
let tab = "siswa";

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
/** "07-10-2026" -> "2026-10-07" (biar bisa diurutkan) */
const urutTgl = (t) => t.split("-").reverse().join("-");

function pesan(teks, jenis = "") {
  const el = $("pesan");
  el.hidden = !teks;
  el.className = "guru-pesan " + jenis;
  el.innerHTML = teks;
}

/* ==========================================================================
   1) AMBIL DATA
   ========================================================================== */
async function muat() {
  const btn = $("btnMuat");
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memuat...';
  let hasil = null;
  if (navigator.onLine !== false) {
    try {
      hasil = await tanyaSheet({ aksi: "guruRekap", nama: guru.nama, pin: guru.pin, kodeSekolah: guru.kodeSekolah });
    } catch (e) {
      hasil = null;
    }
  }
  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Muat ulang';

  if (hasil && hasil.ok) {
    rekap = hasil;
    // kode bisa diganti pengelola di sheet -> pakai yang terbaru
    if (hasil.kodeSekolah && (hasil.kodeSekolah !== guru.kodeSekolah || hasil.kodeGuru !== guru.kodeGuru)) {
      guru.kodeSekolah = hasil.kodeSekolah;
      guru.kodeGuru = hasil.kodeGuru;
      localStorage.setItem("metapia_guru", JSON.stringify(guru));
    }
    localStorage.setItem("metapia_rekap", JSON.stringify(hasil));
    pesan("");
  } else if (hasil && ["pin_salah", "guru_tidak_ada", "kode_salah", "nonaktif"].includes(hasil.kode)) {
    // PIN/kode diganti, akun dihapus/dinonaktifkan di sheet -> masuk ulang
    localStorage.removeItem("metapia_guru");
    localStorage.removeItem("metapia_rekap");
    alert(hasil.kode === "nonaktif" ? "Akun guru ini dinonaktifkan oleh pengelola METAPIA." :
      hasil.kode === "kode_salah" ? "Kode sekolah sudah diganti. Silakan masuk lagi dengan kode yang baru." : "Akun guru perlu masuk ulang.");
    location.replace("index.html#guru");
    return;
  } else {
    try { rekap = JSON.parse(localStorage.getItem("metapia_rekap")); } catch (e) { rekap = null; }
    const alasan = !hasil ? "Tidak tersambung ke internet." : hasil.kode === "aksi_salah"
      ? "Server Google Sheet belum diperbarui ke versi terbaru (lihat google-sheet/Code.gs)." : "Server sedang bermasalah.";
    pesan(rekap
      ? `<i class="fa-solid fa-triangle-exclamation"></i> ${alasan} Yang tampil adalah data terakhir yang tersimpan (${esc(rekap.diambil)}).`
      : `<i class="fa-solid fa-triangle-exclamation"></i> ${alasan} Coba lagi nanti.`, "is-peringatan");
  }
  tampilkan();
}

/* ==========================================================================
   2) OLAH DATA: gabungkan baris per tanggal jadi ringkasan per siswa
   ========================================================================== */
function ringkasPerSiswa() {
  const per = {};
  const ambil = (nama) => {
    const k = nama.toLowerCase();
    if (!per[k]) per[k] = { nama, kuis: null, game: {}, terakhirMasuk: "", jumlahMasuk: 0, pin: "" };
    return per[k];
  };
  rekap.siswa.forEach((s) => Object.assign(ambil(s.nama), { terakhirMasuk: s.terakhirMasuk, jumlahMasuk: s.jumlahMasuk, pin: s.pin }));

  // kuis: pertama = tanggal paling awal, terakhir = tanggal paling baru
  [...rekap.kuis].sort((a, b) => (urutTgl(a.tanggal) < urutTgl(b.tanggal) ? -1 : 1)).forEach((k) => {
    const s = ambil(k.nama);
    if (!s.kuis) s.kuis = { pertama: k.pertama, terbaik: 0, terakhir: 0, mencoba: 0 };
    s.kuis.terbaik = Math.max(s.kuis.terbaik, k.terbaik);
    s.kuis.terakhir = k.terakhir;
    s.kuis.mencoba += k.mencoba;
  });
  rekap.game.forEach((g) => {
    const s = ambil(g.nama);
    const lama = s.game[g.game] || { terbaik: 0, main: 0 };
    s.game[g.game] = { terbaik: Math.max(lama.terbaik, g.terbaik), main: lama.main + g.main };
  });
  return Object.values(per).sort((a, b) => a.nama.localeCompare(b.nama));
}

function daftarGame() {
  const lain = [...new Set(rekap.game.map((g) => g.game))].filter((g) => !URUTAN_GAME.includes(g));
  return URUTAN_GAME.concat(lain);
}

/* ==========================================================================
   3) TAMPILKAN
   ========================================================================== */
/* ---------- kode sekolah + link + QR ---------- */
function linkSiswa() {
  return new URL(`index.html?sekolah=${guru.kodeSekolah}`, location.href).href;
}
function gambarQR(ukuranSel) {
  if (typeof qrcode !== "function" || !guru.kodeSekolah) return "";
  const qr = qrcode(0, "M");
  qr.addData(linkSiswa());
  qr.make();
  return qr.createSvgTag({ cellSize: ukuranSel, margin: ukuranSel * 2, scalable: true, alt: "Kode QR masuk siswa" });
}
function tampilkanKode() {
  $("kodeSiswa").textContent = guru.kodeSekolah || "––––––";
  $("kodeGuru").textContent = guru.kodeGuru || "––––––";
  $("qrKecil").innerHTML = gambarQR(4);
}

function tampilkan() {
  $("namaSekolah").textContent = guru.sekolah;
  $("namaGuru").textContent = guru.nama;
  tampilkanKode();
  $("waktuAmbil").textContent = rekap ? `· data per ${rekap.diambil}` : "";
  if (!rekap) {
    $("ringkas").innerHTML = "";
    $("isiTab").innerHTML = "";
    return;
  }
  const siswa = ringkasPerSiswa();
  const sudahKuis = siswa.filter((s) => s.kuis);
  const rata = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : "–");
  const kartu = (ikon, angka, label) => `<div class="kartu-angka"><span class="kartu-ikon">${ikon}</span><b>${angka}</b><span>${label}</span></div>`;
  $("ringkas").innerHTML =
    kartu("🎒", siswa.length, "Siswa terdaftar") +
    kartu("📝", sudahKuis.length, "Sudah mengerjakan kuis") +
    kartu("⭐", rata(sudahKuis.map((s) => s.kuis.terbaik)), "Rata-rata nilai kuis terbaik") +
    kartu("🎮", siswa.filter((s) => Object.keys(s.game).length).length, "Sudah mencoba permainan");

  $("pilihTanggal").hidden = tab !== "tanggal";
  if (tab === "siswa") tabelSiswa(siswa);
  else tabelTanggal();
}

function tabelSiswa(siswa) {
  const cari = $("cari").value.trim().toLowerCase();
  const daftar = siswa.filter((s) => s.nama.toLowerCase().includes(cari));
  const games = daftarGame();
  if (!siswa.length) {
    $("isiTab").innerHTML = `<p class="kosong">Belum ada siswa yang masuk dengan sekolah <b>${esc(guru.sekolah)}</b>.</p>`;
    return;
  }
  const n = (v) => (v === undefined || v === null ? '<span class="redup">–</span>' : v);
  const baris = daftar.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td class="kol-nama">${esc(s.nama)}</td>
      <td>${n(s.kuis && s.kuis.pertama)}</td>
      <td class="kol-utama">${n(s.kuis && s.kuis.terbaik)}</td>
      <td>${n(s.kuis && s.kuis.terakhir)}</td>
      <td>${n(s.kuis && s.kuis.mencoba)}</td>
      ${games.map((g) => `<td>${n(s.game[g] && s.game[g].terbaik)}</td>`).join("")}
      <td class="kol-waktu">${esc(s.terakhirMasuk) || '<span class="redup">–</span>'}</td>
      <td><button class="pin-tutup" data-pin="${esc(s.pin)}" title="Lihat PIN (kalau siswa lupa)">••••</button></td>
    </tr>`).join("");
  $("isiTab").innerHTML = `
    <div class="tabel-wrap"><table class="tabel">
      <thead>
        <tr><th rowspan="2">No</th><th rowspan="2">Nama</th><th colspan="4">Kuis</th><th colspan="${games.length}">Game (skor terbaik)</th><th rowspan="2">Terakhir masuk</th><th rowspan="2">PIN</th></tr>
        <tr><th>Pertama</th><th>Terbaik</th><th>Terakhir</th><th>Dicoba</th>${games.map((g) => `<th title="${esc(g)}">${esc(LABEL_GAME[g] || g)}<small>${esc(g)}</small></th>`).join("")}</tr>
      </thead>
      <tbody>${baris || `<tr><td colspan="${8 + games.length}" class="kosong">Tidak ada nama yang cocok.</td></tr>`}</tbody>
    </table></div>
    <p class="catatan">Nilai pertama = nilai kuis pertama kali; terbaik = nilai tertinggi; terakhir = nilai paling baru. Klik •••• untuk melihat PIN siswa yang lupa.</p>`;
}

function tabelTanggal() {
  const sel = $("pilihTanggal");
  const tanggal = [...new Set(rekap.kuis.map((k) => k.tanggal).concat(rekap.game.map((g) => g.tanggal)))]
    .sort((a, b) => (urutTgl(a) < urutTgl(b) ? 1 : -1));
  if (!tanggal.length) {
    $("isiTab").innerHTML = '<p class="kosong">Belum ada nilai kuis atau skor game.</p>';
    sel.hidden = true;
    return;
  }
  const dipilih = tanggal.includes(sel.value) ? sel.value : tanggal[0];
  sel.innerHTML = tanggal.map((t) => `<option value="${t}">${t.replace(/-/g, "/")}</option>`).join("");
  sel.value = dipilih;

  const cari = $("cari").value.trim().toLowerCase();
  const cocok = (r) => r.tanggal === dipilih && r.nama.toLowerCase().includes(cari);
  const kuis = rekap.kuis.filter(cocok).sort((a, b) => a.nama.localeCompare(b.nama));
  const game = rekap.game.filter(cocok).sort((a, b) => a.nama.localeCompare(b.nama) || a.game.localeCompare(b.game));
  $("isiTab").innerHTML = `
    <h2 class="sub-judul">📝 Kuis (${kuis.length} siswa)</h2>
    ${kuis.length ? `<div class="tabel-wrap"><table class="tabel">
      <thead><tr><th>No</th><th>Nama</th><th>Nilai pertama</th><th>Terbaik</th><th>Terakhir</th><th>Dicoba</th><th>Jam terakhir</th></tr></thead>
      <tbody>${kuis.map((k, i) => `<tr><td>${i + 1}</td><td class="kol-nama">${esc(k.nama)}</td><td>${k.pertama}</td><td class="kol-utama">${k.terbaik}</td><td>${k.terakhir}</td><td>${k.mencoba}x</td><td>${esc(k.jam)}</td></tr>`).join("")}</tbody>
    </table></div>` : '<p class="kosong">Tidak ada kuis pada tanggal ini.</p>'}
    <h2 class="sub-judul">🎮 Game (${game.length} catatan)</h2>
    ${game.length ? `<div class="tabel-wrap"><table class="tabel">
      <thead><tr><th>No</th><th>Nama</th><th>Game</th><th>Skor pertama</th><th>Terbaik</th><th>Terakhir</th><th>Dimainkan</th><th>Benar</th><th>Jam terakhir</th></tr></thead>
      <tbody>${game.map((g, i) => `<tr><td>${i + 1}</td><td class="kol-nama">${esc(g.nama)}</td><td>${esc(g.game)}</td><td>${g.pertama}</td><td class="kol-utama">${g.terbaik}</td><td>${g.terakhir}</td><td>${g.main}x</td><td>${esc(g.benar)}</td><td>${esc(g.jam)}</td></tr>`).join("")}</tbody>
    </table></div>` : '<p class="kosong">Tidak ada permainan pada tanggal ini.</p>'}`;
}

/* ==========================================================================
   4) UNDUH CSV (dibuka di Excel / Google Sheets). Pemisah ";" + BOM biar
      Excel versi Indonesia langsung rapi per kolom.
   ========================================================================== */
function unduh() {
  if (!rekap) return;
  const games = daftarGame();
  const sel = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const baris = [["No", "Nama", "Sekolah", "Kuis Pertama", "Kuis Terbaik", "Kuis Terakhir", "Kuis Dicoba", ...games.map((g) => g + " (terbaik)"), "Terakhir Masuk"]];
  ringkasPerSiswa().forEach((s, i) => baris.push([
    i + 1, s.nama, guru.sekolah,
    s.kuis ? s.kuis.pertama : "", s.kuis ? s.kuis.terbaik : "", s.kuis ? s.kuis.terakhir : "", s.kuis ? s.kuis.mencoba : "",
    ...games.map((g) => (s.game[g] ? s.game[g].terbaik : "")),
    s.terakhirMasuk,
  ]));
  const csv = "﻿" + baris.map((r) => r.map(sel).join(";")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `Nilai METAPIA - ${guru.sekolah}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ==========================================================================
   5) TOMBOL-TOMBOL
   ========================================================================== */
document.querySelectorAll(".guru-tab-btn").forEach((b) => b.addEventListener("click", () => {
  tab = b.dataset.tab;
  document.querySelectorAll(".guru-tab-btn").forEach((x) => x.classList.toggle("is-aktif", x === b));
  tampilkan();
}));
$("cari").addEventListener("input", tampilkan);
$("pilihTanggal").addEventListener("change", tampilkan);
$("btnMuat").addEventListener("click", muat);
$("btnUnduh").addEventListener("click", unduh);
$("isiTab").addEventListener("click", (e) => {
  const b = e.target.closest(".pin-tutup");
  if (!b) return;
  b.textContent = b.textContent === "••••" ? (b.dataset.pin || "–") : "••••";
});
$("btnSalin").addEventListener("click", async () => {
  const link = linkSiswa();
  try {
    await navigator.clipboard.writeText(link);
    $("btnSalin").innerHTML = '<i class="fa-solid fa-circle-check"></i> Tautan tersalin!';
  } catch (e) {
    prompt("Salin tautan ini, lalu bagikan kepada siswa:", link);
  }
  setTimeout(() => { $("btnSalin").innerHTML = '<i class="fa-solid fa-link"></i> Salin tautan siswa'; }, 2500);
});
$("btnQrBesar").addEventListener("click", () => {
  $("qrPenuhSekolah").textContent = guru.sekolah;
  $("qrPenuhGambar").innerHTML = gambarQR(10);
  $("qrPenuhKode").textContent = guru.kodeSekolah;
  $("qrPenuh").hidden = false;
});
$("qrPenuh").addEventListener("click", () => { $("qrPenuh").hidden = true; });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("qrPenuh").hidden = true; });

$("btnKeluar").addEventListener("click", () => {
  if (!confirm(`Keluar dari akun guru ${guru.nama}?`)) return;
  localStorage.removeItem("metapia_guru");
  localStorage.removeItem("metapia_rekap");
  location.href = "index.html#guru";
});

if (guru.nama) {
  try { rekap = JSON.parse(localStorage.getItem("metapia_rekap")); } catch (e) {}
  // guru baru daftar -> buka bagian "undang guru lain" biar kode gurunya kelihatan
  if (localStorage.getItem("metapia_guru_baru")) {
    localStorage.removeItem("metapia_guru_baru");
    document.querySelector(".kode-guru").open = true;
  }
  tampilkan();
  muat();
}
