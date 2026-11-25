# Memasang Video Majas (bisa ditonton offline)

Video YouTube atau Google Drive **tidak bisa** ditonton tanpa internet. Itu aturan YouTube dan Google, bukan batasan METAPIA. Supaya video bisa ditonton offline, file videonya disimpan langsung di website METAPIA.

## 1. Kecilkan ukuran video dulu

Target: ukuran **di bawah 30 MB** (maksimal 50 MB; GitHub menolak file di atas 100 MB). Semakin kecil, semakin cepat siswa menyimpannya dan semakin hemat kuota.

- Video sampai ±5 menit: **720p** (contoh: video majas 3 menit 47 detik = 18 MB).
- Video lebih panjang: **480p**.

Format harus **MP4 (H.264)**. File **.MOV dari iPhone** (codec HEVC) tidak bisa diputar di banyak HP Android dan laptop, jadi wajib dikonversi.

Pakai **HandBrake** (gratis, https://handbrake.fr):

1. Buka HandBrake, lalu seret file video ke jendelanya.
2. Di **Preset**, pilih **General → Fast 720p30** (atau **Fast 480p30** untuk video panjang).
3. Di tab **Summary**, centang **Web Optimized**.
4. Format: **MP4**.
5. Klik **Start Encode**.

Kalau ffmpeg sudah terpasang, perintah ini menghasilkan file yang sama:

```
ffmpeg -i video-asli.mov -vf scale=-2:720 -c:v libx264 -crf 27 -preset slow -c:a aac -b:a 96k -movflags +faststart video-majas.mp4
```

## 2. Taruh di folder proyek

Simpan hasilnya di `assets/video/video-majas.mp4`. Folder `video` perlu dibuat dulu di dalam `assets`.

## 3. Isi nama filenya di js/video.js

```js
const VIDEO = {
  ...
  file: "assets/video/video-majas.mp4",
  link: "",
};
```

## 4. Simpan perubahan dan unggah

```
python docs/perbarui-sw.py
git add .
git commit -m "Tambah video majas"
git push
```

## Cara kerja untuk siswa

- **Saat ada internet**, video diputar langsung dari website.
- Siswa menekan **Simpan untuk offline** di pojok layar video. Video diunduh sekali (ada persentasenya) lalu disimpan di HP. Tulisan tombolnya berubah menjadi **Tersimpan offline**.
- **Saat offline**, video yang sudah disimpan tetap bisa diputar, termasuk digeser maju dan mundur.
- Video yang belum disimpan memunculkan pesan ramah dari Ibu Rara beserta tombol ke Materi.
- Simpanan video **tidak ikut terhapus** saat METAPIA diperbarui. Siswa bisa menghapusnya dengan menekan tombol **Tersimpan offline** lagi.
- Video tidak ikut diunduh otomatis saat METAPIA pertama dibuka, supaya kuota siswa tidak langsung habis.

Saran untuk sekolah dengan internet terbatas: minta siswa menekan **Simpan untuk offline** saat ada wifi sekolah.
