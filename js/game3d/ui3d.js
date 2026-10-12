/* ==========================================================================
   METAPIA — game3d/ui3d.js
   Bagian HTML yang nempel di atas canvas 3D (dipakai bareng 3 game 3D):
   papan teks soal, munculan "COMBO x3", angka "+10", nyawa, jeda & keluar.
   Teks sengaja HTML (bukan 3D) biar tajam & gampang dibaca anak-anak.
   ========================================================================== */
import { buatDunia, Musik } from "./mesin3d.js";

/**
 * Siapin game 3D: wadah canvas + lapisan HTML + dunia + musik + jeda/keluar.
 * Hasil: { dunia, wadah, lapis, musik, papan(html), combo(n), poin(n, x, y),
 *          nyawa, kurangiNyawa(), selesai() }
 */
export function siapkanGame(api, opsiDunia = {}, opsiMusik = {}) {
  api.body.innerHTML = `
    <div class="g3d">
      <div class="g3d-lapis">
        <div class="g3d-papan" hidden></div>
        <div class="g3d-combo" hidden></div>
      </div>
    </div>`;
  const wadah = api.body.querySelector(".g3d");
  const lapis = wadah.querySelector(".g3d-lapis");
  const elPapan = wadah.querySelector(".g3d-papan");
  const elCombo = wadah.querySelector(".g3d-combo");

  const dunia = buatDunia(wadah, opsiDunia);
  const musik = new Musik(api.suaraNyala, opsiMusik);
  const pembersih = [];

  const g = {
    api, dunia, wadah, lapis, musik,
    nyawa: 3,
    combo: 0,
    nyawaHabisDiumumkan: false,

    /** isi papan teks di atas canvas (null = sembunyiin) */
    papan(html) {
      elPapan.hidden = !html;
      if (html) {
        elPapan.innerHTML = html;
        elPapan.classList.remove("is-muncul"); void elPapan.offsetWidth; elPapan.classList.add("is-muncul");
      }
    },
    /** tulisan besar sebentar di tengah layar ("COMBO x3!", "Waktu habis!") */
    sorak(teks, jenis = "combo") {
      elCombo.hidden = false;
      elCombo.className = `g3d-combo is-${jenis}`;
      elCombo.textContent = teks;
      void elCombo.offsetWidth;
      elCombo.classList.add("is-muncul");
      clearTimeout(g._timerSorak);
      g._timerSorak = setTimeout(() => (elCombo.hidden = true), 1300);
    },
    /** tambah skor resmi (dikirim ke sheet) + angka melayang di titik layar x,y */
    poin(n, x, y) {
      const titik = document.createElement("span");
      titik.className = "g3d-titik";
      titik.style.left = `${x}px`; titik.style.top = `${y}px`;
      lapis.appendChild(titik);
      api.tambahSkor(n, titik);
      setTimeout(() => titik.remove(), 50);
    },
    /** jawaban benar: combo naik + Poin Bonus (berhenti kalau nyawa habis) */
    benar() {
      g.combo++;
      if (g.nyawa > 0) {
        api.tambahBonus(5 * g.combo);
        if (g.combo >= 2) g.sorak(`COMBO x${g.combo}! 🔥`);
      }
    },
    /** jawaban salah: combo putus, nyawa berkurang, kamera goyang */
    salah() {
      g.combo = 0;
      dunia.getar(1);
      if (navigator.vibrate) try { navigator.vibrate(120); } catch (e) {}
      if (g.nyawa > 0) {
        g.nyawa--;
        api.nyawa(g.nyawa);
        if (g.nyawa === 0 && !g.nyawaHabisDiumumkan) {
          g.nyawaHabisDiumumkan = true;
          setTimeout(() => {
            g.sorak("Nyawa habis! 💔", "salah");
            api.guru("Nyawamu habis, tapi gak apa-apa! Ayo selesaikan petualangannya. Bonus combo berhenti dulu, ya. 💪");
          }, 1400);
        }
      }
    },
    /** daftarin event listener yang otomatis dilepas waktu game selesai */
    dengar(target, jenis, fn, opsi) {
      target.addEventListener(jenis, fn, opsi);
      pembersih.push(() => target.removeEventListener(jenis, fn, opsi));
    },
    /** beresin semua (dipanggil pas selesai / keluar) */
    bersihkan() {
      musik.berhenti();
      pembersih.forEach((f) => f());
      dunia.hapus();
    },
  };

  // jeda: dunia berhenti, musik berhenti
  api.saatJeda((jeda) => {
    dunia.jeda = jeda;
    if (jeda) musik.berhenti(); else musik.mulai();
    if (typeof g.saatJeda === "function") g.saatJeda(jeda);
  });
  dunia.saatSembunyi = () => api.jeda(true);
  // keluar ke menu di tengah game
  Game.saatKeluar = () => g.bersihkan(); // Game = objek global dari js/game.js

  api.nyawa(3);
  musik.mulai();
  return g;
}

/**
 * Kontrol geser (swipe jari / seret mouse) di wadah.
 * kiri()/kanan() dipanggil sekali tiap geseran ~35px.
 */
export function kontrolGeser(g, { kiri, kanan }) {
  let x0 = null, id = null;
  g.dengar(g.wadah, "pointerdown", (e) => {
    if (e.target.closest("button, .kuis-umpan, .petunjuk, .lapis-jeda")) return;
    x0 = e.clientX; id = e.pointerId;
  });
  g.dengar(window, "pointermove", (e) => {
    if (x0 === null || e.pointerId !== id) return;
    const dx = e.clientX - x0;
    if (dx < -35) { kiri(); x0 = e.clientX; }
    else if (dx > 35) { kanan(); x0 = e.clientX; }
  });
  const lepas = () => { x0 = null; };
  g.dengar(window, "pointerup", lepas);
  g.dengar(window, "pointercancel", lepas);
  g.dengar(document, "keydown", (e) => {
    if (e.target.closest && e.target.closest("input, textarea")) return;
    const k = e.key.toLowerCase();
    if (k === "arrowleft" || k === "a") { e.preventDefault(); kiri(); }
    if (k === "arrowright" || k === "d") { e.preventDefault(); kanan(); }
  });
}

/** escape teks buat dimasukin ke HTML */
export function esc(teks) {
  const d = document.createElement("div");
  d.textContent = teks;
  return d.innerHTML;
}
