/* ==========================================================================
   METAPIA — game3d/index.js
   Pintu masuk game 3D: daftarin versi 3D tiap game ke mesin game (js/game.js).
   Dimuat dari game.html pakai import() — kalau gagal (internet/CDN/browser
   lama), game.html otomatis pakai versi 2D.
   ========================================================================== */
import lariGerbang from "./lari-gerbang.js";
import pabrikSortir from "./pabrik-sortir.js";
import pesawatKalimat from "./pesawat-kalimat.js";

Game.daftar3d(1, lariGerbang);  // Tebak Gambar    -> Lari Gerbang Majas
Game.daftar3d(2, pabrikSortir); // Keranjang Majas -> Pabrik Sortir Majas
Game.daftar3d(3, pesawatKalimat); // Ubah Kalimatku -> Pesawat Perakit Kalimat
