# Optimasi METAPIA "Ringan Diakses"

Dokumen ini mencatat kondisi METAPIA **sebelum** dan **sesudah** dioptimasi supaya
ringan diakses di sekolah dengan internet lambat/putus-putus dan HP spesifikasi
rendah. Semua angka dapat diukur ulang dengan:

```bash
python docs/ukur-ukuran.py
```

## Cara mengukur

- **File lokal** (HTML, CSS, JS, gambar) dihitung dari file yang dimuat tiap
  halaman: `<link>`, `<script>`, `<img>`, `url()` di CSS, dan path `assets/...`
  di JavaScript.
- Kolom **gzip** = perkiraan ukuran yang benar-benar dikirim lewat internet.
  GitHub Pages mengompres file teks (HTML/CSS/JS); gambar & font tidak dikompres
  lagi karena sudah terkompres.
- **CDN** = file dari server luar (Google Fonts, Font Awesome, three.js), diukur
  sekali tanggal 18-10-2026.
- Angka adalah unduhan **kunjungan pertama** (cache browser masih kosong).

---

## 1. Kondisi SEBELUM optimasi (18-10-2026, commit `6b06ad2`)

| Halaman | File lokal | Lokal (mentah) | Lokal (gzip) | CDN (gzip) | **Total diunduh** | + gambar soal saat main |
|---|---|---|---|---|---|---|
| index.html (login) | 9 | 242 KB | 218 KB | 247 KB | **465 KB** | - |
| dashboard.html | 11 | 1.630 KB | 1.601 KB | 247 KB | **1.848 KB** | - |
| materi.html | 25 | 2.367 KB | 2.327 KB | 247 KB | **2.574 KB** | - |
| video.html | 13 | 598 KB | 568 KB | 247 KB | **815 KB** | - |
| kuis.html | 17 | 933 KB | 883 KB | 247 KB | **1.130 KB** | - |
| game.html | 29 | 1.100 KB | 934 KB | 526 KB | **1.460 KB** | 2.618 KB |

Total folder `assets/` yang dipakai web: **6.305 KB** (23 file).

### File terbesar

| File | Ukuran | Ukuran gambar (px) | Ukuran tampil di layar (perkiraan) |
|---|---|---|---|
| assets/bocah.png | 1.380 KB | 1699 × 926 | ± 500 px lebar |
| assets/game/g1-soal3.jpg | 620 KB | 1200 × 896 | ± 200–440 px lebar |
| assets/game/g1-soal4.jpg | 558 KB | 1200 × 896 | ± 200–440 px lebar |
| assets/game/g1-soal5.jpg | 545 KB | 1200 × 896 | ± 200–440 px lebar |
| assets/game/g1-soal1.jpg | 504 KB | 1200 × 896 | ± 200–440 px lebar |
| assets/game/g1-soal2.jpg | 392 KB | 1200 × 896 | ± 200–440 px lebar |
| assets/karakter/murid/sari.png | 193 KB | 246 × 560 | ± 220 px tinggi |
| assets/bgMateri.jpg | 184 KB | 1376 × 768 | layar penuh |
| assets/karakter/murid/*.png (9 file lain) | 150–164 KB per file | 208–284 × 560 | ± 220 px tinggi |
| assets/karakter/guru/*.png (5 file) | 121–141 KB per file | 546 × 520 | ± 400 px tinggi |

### File dari CDN

| File | Ukuran dikirim | Keterangan |
|---|---|---|
| three.module.js (three.js 0.165) | 254 KB (gzip) | hanya halaman Game (3D) |
| fa-solid-900.woff2 (ikon) | 153 KB | semua halaman, padahal hanya ± 37 ikon yang dipakai |
| font-awesome all.min.css | 22 KB (gzip) | semua halaman |
| Nunito + Baloo 2 (woff2) | 71 KB | semua halaman |
| fa-regular-400.woff2 | 25 KB | halaman Game |

### Temuan utama

1. **Gambar = ± 90% unduhan.** `bocah.png` saja 1,4 MB untuk gambar yang tampil
   ± 500 px. Gambar soal game 0,4–0,6 MB per gambar padahal tampil ± 200–440 px.
2. Gambar karakter disimpan sebagai **PNG** (150 KB-an per pose); halaman Materi
   memuat 15 gambar karakter sekaligus (± 2,1 MB).
3. **Font ikon** Font Awesome 153 KB + CSS 22 KB untuk ± 37 ikon saja.
4. Belum ada cache offline: setiap kunjungan pertama di perangkat baru harus
   mengunduh semuanya, dan web **tidak bisa dibuka sama sekali tanpa internet**.
5. Belum ada penyesuaian untuk jaringan lambat / mode hemat data.

---

## 2. Rencana optimasi

### Tahap 1 — Optimasi gambar
- Semua gambar di `assets/` dikonversi ke **WebP** (kualitas 75–80) dan dimensinya
  disesuaikan dengan ukuran tampil (maks ± 2× ukuran tampil):

  | Gambar | Sekarang | Rencana dimensi | Target |
  |---|---|---|---|
  | bocah.png | 1699 × 926 | 1000 px lebar | < 200 KB |
  | g1-soal1–5.jpg | 1200 × 896 | 880 px lebar | < 150 KB |
  | bgMateri.jpg | 1376 × 768 | tetap (layar penuh) | < 150 KB |
  | karakter guru & murid | tetap | tetap (sudah pas) | < 60 KB |

- **Hanya WebP, tanpa `<picture>` + fallback.** Alasan: WebP didukung Chrome
  Android sejak 2014, Safari/iPhone sejak iOS 14 (2020), dan semua browser
  laptop modern. Banyak gambar METAPIA dimuat dari CSS/JavaScript (bukan
  `<img>`), sehingga `<picture>` tidak bisa dipakai di sana. Satu format
  membuat kode lebih sederhana.
- File asli dipindah ke `assets-sumber/` (tidak dimuat web, tidak menambah
  unduhan siswa; tetap ada untuk diedit/diproses ulang).
- `<img>` diberi `width`/`height`, `loading="lazy"` (yang di bawah layar) dan
  `decoding="async"`.
- Game Tebak Gambar / Pecah Balon: gambar soal berikutnya dimuat diam-diam
  (preload) selama siswa mengerjakan soal sekarang.

### Tahap 2 — PWA + bisa offline
- `manifest.json` (nama METAPIA, ikon 192/512 px, warna tema ungu `#5B3FD9`) dan
  `sw.js` (service worker) dengan path relatif, aman untuk subfolder `/metapia/`.
- **Font dan ikon di-host sendiri**: Nunito + Baloo 2 disimpan di `assets/font/`;
  Font Awesome dipangkas hanya ± 37 ikon yang dipakai (perkiraan 175 KB → ± 10 KB).
  three.js juga disimpan sendiri di `js/vendor/`.
- Strategi cache (`CACHE_VERSI`, dinaikkan tiap update supaya cache lama diganti):
  - **Precache** saat pertama dibuka: semua HTML, CSS, JS, font, ikon, dan gambar.
  - **three.js** (± 170 KB gzip) baru disimpan saat halaman Game dibuka pertama
    kali, supaya kunjungan pertama ke halaman lain tidak ikut berat. Setelah itu
    game 3D tetap jalan offline.
  - Request ke **Google Apps Script tidak pernah di-cache**; antrean nilai di
    `sheet.js` tetap dipakai.
- Halaman Video saat offline: Kak Rara tampil dengan pesan ramah ("Video butuh
  internet. Sambil menunggu, yuk baca Materi dulu!").
- Penanda kecil "Sedang offline – nilaimu disimpan dulu dan dikirim nanti"
  muncul otomatis di semua halaman saat koneksi putus.
- Login offline: siswa yang pernah login di perangkat itu (nama + PIN cocok)
  tetap bisa masuk tanpa internet.

### Tahap 3 — Menyesuaikan kondisi jaringan / perangkat
- Jika `navigator.connection.saveData` aktif atau jaringan terdeteksi `2g`/`3g`,
  game otomatis memakai **Versi 2D** dan **grafis Ringan** (siswa tetap bisa
  mengganti).
- Fallback 3D → 2D saat three.js gagal dimuat tetap dipertahankan.

### Tahap 4 — Literasi digital
- Halaman `panduan.html` (gaya sama): cara login, memakai Materi, Video, Kuis,
  Game, melihat nilai, dan memasang METAPIA ke layar utama HP. Bagian terpisah
  untuk guru (membaca Google Sheet, PIN lupa, dll).
- Tautan **Panduan** di navbar/menu bawah dan halaman login.

### Tahap 5 — Ukur lagi
- Tabel **SEBELUM vs SESUDAH** di dokumen ini + panduan Lighthouse (Mobile) dan
  cara menguji mode offline.

> Isi soal, materi, dan tampilan **tidak diubah**.

---

## 3. Catatan pelaksanaan

### Tahap 1 — Optimasi gambar (selesai)

- 23 gambar dikonversi ke WebP dengan `python docs/buat-webp.py`
  (aturan ukuran & kualitas ada di skrip itu). File asli dipindah ke
  `assets-sumber/` (tidak dimuat web).
- Total gambar: **6.305 KB → 648 KB (turun ± 90%)**.

  | Gambar | Sebelum | Sesudah | Target | Dimensi baru |
  |---|---|---|---|---|
  | bocah | 1.380 KB | 98 KB | < 200 KB ✅ | 1000 × 545 |
  | g1-soal1–5 | 392–620 KB | 16–50 KB | < 150 KB ✅ | 880 × 657 |
  | bgMateri | 184 KB | 48 KB | < 150 KB ✅ | 1376 × 768 |
  | karakter guru (5) | 121–141 KB | 17–20 KB | < 60 KB ✅ | 546 × 520 |
  | karakter murid (9) | 147–193 KB | 22–30 KB | < 60 KB ✅ | tetap |
  | kupu-kupu (2) | 9–12 KB | 2 KB | - | tetap |

- Semua rujukan `.png`/`.jpg` di HTML, CSS, dan JS diganti `.webp`.
- `<img>` diberi `width`/`height` (mencegah tata letak "lompat") dan
  `decoding="async"`; gambar karakter yang dibuat lewat JavaScript juga diberi
  `decoding="async"`.
- `loading="lazy"` **tidak dipakai** untuk gambar yang ada sekarang, karena
  semuanya langsung tampil di layar pertama (gambar Beranda di laptop justru
  diberi `fetchpriority="high"` karena gambar terbesar di layar pertama).
- Game Pecah Balon (3D) dan Tebak Gambar (2D) memuat gambar soal **berikutnya**
  di latar belakang selagi siswa mengerjakan soal sekarang.

Ukuran per halaman setelah Tahap 1 (masih memakai CDN, belum offline):

| Halaman | Sebelum | Setelah Tahap 1 |
|---|---|---|
| index.html | 465 KB | 313 KB |
| dashboard.html | 1.848 KB | 413 KB |
| materi.html | 2.574 KB | 639 KB |
| video.html | 815 KB | 371 KB |
| kuis.html | 1.130 KB | 421 KB |
| game.html | 1.460 KB (+2.618 KB saat main) | 751 KB (+178 KB saat main) |

### Tahap 2 — PWA + bisa offline (selesai)

- **Font & ikon disimpan sendiri** (tidak lagi dari CDN):
  - Nunito & Baloo 2 → `assets/font/` (dipasang lewat `@font-face` di `css/common.css`).
  - Font Awesome dipangkas hanya **39 ikon** yang dipakai → `assets/font/fa-solid.woff2` +
    `fa-regular.woff2` + `css/ikon.css` (dibuat `python docs/buat-ikon.py`).
    **175 KB → 9 KB.**
  - three.js 0.165 (versi *minified*) → `js/vendor/three.module.min.js`
    (importmap di `game.html` menunjuk ke file lokal).
- `manifest.json` + ikon aplikasi (`assets/ikon/`, 192/512 px + *maskable*), warna tema `#5B3FD9`.
- `sw.js` (service worker), path relatif → aman di subfolder GitHub Pages `/metapia/`:
  - **Precache** 71 file (semua HTML, CSS, JS, font, ikon, gambar) saat pertama kali dibuka.
  - HTML/CSS/JS: diambil dari cache, lalu dicek versi baru di belakang layar
    (*stale-while-revalidate*). Gambar/font/three.js: dari cache (*cache-first*).
  - three.js baru disimpan saat halaman Game dibuka pertama kali.
  - Request ke **Google Apps Script, YouTube, Drive tidak pernah di-cache**.
  - `CACHE_VERSI` dihitung otomatis dari isi semua file oleh `python docs/perbarui-sw.py`.
- `js/pwa.js` (dimuat di semua halaman): mendaftarkan service worker, penanda
  **"Sedang offline – nilaimu disimpan dulu dan dikirim nanti"** (mengecil jadi
  "📴 Offline" setelah 5 detik), dan mengirim ulang antrean nilai begitu online.
- **Login offline**: tiap berhasil login online, akun disimpan di perangkat
  (nama + sidik SHA-256 dari PIN, bukan PIN asli). Saat offline, akun yang cocok
  bisa masuk; siswa baru diminta online untuk masuk pertama kali.
- **Video offline**: layar video diganti Kak Rara + pesan "Video butuh internet.
  Sambil menunggu, yuk baca Materi dulu!" + tombol Buka Materi.

### Tahap 3 — Menyesuaikan jaringan/perangkat (selesai)

- `jaringanLambat()` di `js/pwa.js`: true jika `navigator.connection.saveData`
  aktif atau `effectiveType` = `slow-2g`/`2g`/`3g`.
- Jika true dan siswa belum pernah memilih: Game otomatis **Versi 2D** + grafis
  **Ringan**, dengan keterangan di layar pembuka. Siswa tetap bisa mengganti.
- Fallback 3D → 2D jika three.js gagal dimuat tetap ada.

### Tahap 4 — Literasi digital (selesai)

- `panduan.html` (bisa dibuka tanpa login): tab **Untuk Siswa** (masuk, Materi,
  Video, Kuis, Game, melihat nilai, memasang ke layar utama HP, kalau internet
  putus) dan **Untuk Guru** (alur belajar, membaca Google Sheets, PIN lupa,
  sekolah dengan internet terbatas, tips).
- Tombol **Pasang METAPIA** (muncul otomatis di Chrome Android/laptop).
- Tautan Panduan: tombol **?** di navbar semua halaman, halaman login, dan footer Beranda.

---

## 4. Hasil SEBELUM vs SESUDAH

Ukuran yang diunduh saat **kunjungan pertama** (cache kosong), dihitung dengan
`python docs/ukur-ukuran.py`:

| Halaman | SEBELUM | SESUDAH | Penghematan |
|---|---|---|---|
| index.html (login) | 465 KB | 157 KB | −66% |
| dashboard.html | 1.848 KB | 257 KB | −86% |
| materi.html | 2.574 KB | 483 KB | −81% |
| video.html | 815 KB | 233 KB | −71% |
| kuis.html | 1.130 KB | 265 KB | −77% |
| game.html | 1.460 KB | 481 KB | −67% |
| + gambar soal saat main game | 2.618 KB | 178 KB | −93% |
| panduan.html (baru) | - | 173 KB | - |

| Ukuran lain | SEBELUM | SESUDAH |
|---|---|---|
| Total folder `assets/` | 6.305 KB | 809 KB (termasuk font & ikon yang dulu dari CDN) |
| Font ikon Font Awesome | 175 KB (CDN) | 9 KB (lokal) |
| File dari server luar (CDN) per halaman | 247–526 KB | **0 KB** |
| Bisa dibuka tanpa internet | Tidak | **Ya** (setelah dibuka sekali) |

Catatan:
- Setelah halaman pertama terbuka, service worker mengunduh sisa file di latar
  belakang **sekali per perangkat** (71 file, ± 929 KB terkompres). Kunjungan
  berikutnya diambil dari cache: hampir **0 KB** lewat internet.
- three.js (± 164 KB terkompres) hanya diunduh sekali saat Game 3D dibuka.

### Hasil uji otomatis mode offline (20-10-2026)

Diuji dengan Chrome (DevTools Protocol, sama seperti mode *Offline* di DevTools)
dan server Google Sheet tiruan: **25 dari 25 pemeriksaan lulus** — semua halaman
terbuka offline (termasuk yang belum pernah dibuka), file gambar/font/three.js
diambil dari cache, game 3D tetap jalan, video menampilkan pesan Kak Rara,
penanda offline muncul, kuis selesai offline → nilai masuk antrean, login
offline (akun lama bisa, PIN salah ditolak, siswa baru diminta online), dan
setelah online lagi antrean otomatis terkirim.

---

## 5. Cara mengambil skor Lighthouse (untuk skripsi)

1. Buka METAPIA yang sudah online (GitHub Pages) di **Google Chrome laptop**,
   pakai jendela **Incognito** (supaya ekstensi tidak memengaruhi hasil).
2. Login dulu, lalu buka halaman yang ingin diukur (mis. Beranda).
3. Tekan **F12** → tab **Lighthouse** (kalau tidak ada, klik `»`).
4. Pilih **Mode: Navigation**, **Device: Mobile**, centang **Performance**,
   **Accessibility**, **Best Practices**, **SEO**.
5. Klik **Analyze page load**, tunggu ± 1 menit, lalu catat skornya
   (screenshot untuk lampiran). Ulangi 3× dan ambil rata-rata/nilai tengah,
   karena skor bisa naik-turun sedikit.
6. Untuk pembanding SEBELUM: di laptop jalankan versi lama (commit `6b06ad2`,
   sebelum optimasi) dengan `git checkout 6b06ad2`, buka lewat Live Server, lalu
   ukur dengan cara yang sama (Lighthouse juga bisa dipakai di `127.0.0.1`).
   Kembali ke versi terbaru dengan `git checkout main`. Agar adil, ukur versi
   SESUDAH juga lewat Live Server, atau keduanya lewat internet.

Yang bisa dicatat juga dari tab **Network** (F12 → Network, centang *Disable
cache*, refresh): jumlah *requests* dan **transferred** di baris bawah.

## 6. Cara menguji mode offline

1. Buka METAPIA (online), login, lalu buka Beranda, Materi, Kuis, dan **Game**
   (supaya three.js ikut tersimpan). Tunggu beberapa detik.
2. F12 → tab **Application** → **Service workers**: status harus *activated and
   running*. Di **Cache storage** terlihat cache `metapia-...`.
3. F12 → tab **Network** → ubah **No throttling** menjadi **Offline**.
4. Refresh dan pindah-pindah halaman: semua tetap terbuka, muncul penanda
   "Sedang offline". Halaman Video menampilkan pesan Kak Rara.
5. Kerjakan kuis sampai selesai → muncul "Akan dikirim otomatis nanti".
6. Ubah **Offline** kembali ke **No throttling** → nilai terkirim otomatis
   (cek tab **Kuis tanggal-hari-ini** di Google Sheet).
7. Uji di HP: buka METAPIA sekali saat ada internet, pasang ke layar utama,
   lalu nyalakan **Mode Pesawat** dan buka METAPIA dari ikonnya.

Menguji jaringan lambat: F12 → Network → **Slow 3G** → buka Game → layar
pembuka otomatis memilih Versi 2D.

## 7. Perawatan (setiap kali mengubah web)

```bash
python docs/buat-webp.py     # kalau ada gambar baru/ganti di assets-sumber/
python docs/buat-ikon.py     # kalau menambah ikon Font Awesome baru
python docs/perbarui-sw.py   # WAJIB sebelum push: perbarui daftar cache & versi
python docs/ukur-ukuran.py   # kalau ingin mengukur ulang
git add . && git commit -m "..." && git push
```
