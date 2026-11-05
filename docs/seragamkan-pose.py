"""
METAPIA — seragamkan-pose.py
Menyeragamkan gambar POSE tokoh (dipakai halaman Materi, Kuis, Game &
Video), supaya waktu pose
gonta-ganti tokohnya gak "getar"/lompat: semua pose 1 tokoh dibikin
  - kanvasnya sama besar,
  - tinggi badannya sama (ngikut gambar acuan yang sekarang dipakai),
  - posisi kakinya sama persis (tengah-bawah kanvas).

Cara pakai (dari folder proyek):   python docs/seragamkan-pose.py
Butuh: Python + Pillow  (pip install pillow)

Hasil -> assets/karakter/materi/*.webp (dipakai Materi, Kuis, Game, Video
& Panduan). Ukuran acuannya = gambar asli di assets-sumber/karakter/.

Mau nambah pose? Taruh PNG transparannya di assets-sumber/karakter-pose/
(atau pakai yang di assets-sumber/karakter/), daftarkan di TOKOH di bawah,
lalu jalankan skrip ini + python docs/perbarui-sw.py.
"""
import os, sys
from PIL import Image

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TUJUAN = os.path.join(AKAR, "assets", "karakter", "materi")
LAMA = "assets-sumber/karakter/"       # gambar pose lama (asli)
BARU = "assets-sumber/karakter-pose/"  # gambar pose baru

# nama tokoh: (gambar ACUAN ukuran = yang sekarang tampil, tinggi kanvas,
#              lebar kanvas atau None = otomatis secukupnya, {nama pose: sumber})
# Sumber berupa tuple (buka, tutup) = pasangan mulut buka/tutup: posisinya
# dihitung dari gambar "buka" lalu dipakai sama persis ke "tutup".
TOKOH = {
    "guru": (LAMA + "guru/guru-senyum.png", 520, None, {
        "senyum": LAMA + "guru/guru-senyum.png",
        "bicara": (LAMA + "guru/guru-bicara.png", LAMA + "guru/guru-bicara-tutup.png"),
        "nunjuk": (LAMA + "guru/guru-nunjuk.png", LAMA + "guru/guru-nunjuk-tutup.png"),
        "tertawa": BARU + "guru/guru-tertawa.png",
        "bangga": BARU + "guru/guru-bangga.png",
        "kaget": BARU + "guru/guru-kaget.png",
    }),
    "dito": (LAMA + "murid/dito-diam.png", 560, None, {
        "diam": LAMA + "murid/dito-diam.png",
        "senang": LAMA + "murid/dito-senang.png",
        "bicara": (LAMA + "murid/dito-bicara.png", LAMA + "murid/dito-bicara-tutup.png"),
        "ide": (LAMA + "murid/dito-ide.png", LAMA + "murid/dito-ide-tutup.png"),
    }),
    "sari": (LAMA + "murid/sari.png", 560, None, {
        "diam": LAMA + "murid/sari.png",
        "bicara": (BARU + "murid/sari-bicara.png", BARU + "murid/sari-bicara-tutup.png"),
        "malu": BARU + "murid/sari-malu.png",
        "bangga": BARU + "murid/sari-bangga.png",
        "tepuk": BARU + "murid/sari-tepuk.png",
    }),
    "bima": (LAMA + "murid/bima.png", 560, None, {
        "diam": LAMA + "murid/bima.png",
        "bicara": (BARU + "murid/bima-bicara.png", BARU + "murid/bima-bicara-tutup.png"),
        "bingung": BARU + "murid/bima-bingung.png",
        "tertawa": BARU + "murid/bima-tertawa.png",
        "tepuk": BARU + "murid/bima-tepuk.png",
    }),
    "keke": (LAMA + "murid/keke.png", 560, None, {
        "diam": LAMA + "murid/keke.png",
        "bicara": (BARU + "murid/keke-bicara.png", BARU + "murid/keke-bicara-tutup.png"),
        "angkat": BARU + "murid/keke-angkat.png",
        "tepuk": BARU + "murid/keke-tepuk.png",
    }),
}
AMBANG = 40  # piksel dengan alpha di bawah ini dianggap kosong (sisa hapus-latar)


def buka(rel):
    im = Image.open(os.path.join(AKAR, rel)).convert("RGBA")
    return im


def ukur(im):
    """kotak badan (tanpa sisa piksel tipis) + titik tengah kaki"""
    a = im.getchannel("A").point(lambda v: 255 if v >= AMBANG else 0)
    kiri, atas, kanan, bawah = a.getbbox()
    tinggi = bawah - atas
    # tengah kaki = rata-rata x piksel di 4% baris paling bawah
    pita = a.crop((kiri, bawah - max(2, int(tinggi * 0.04)), kanan, bawah))
    w, h = pita.size
    data = pita.load()
    xs = [x for y in range(h) for x in range(w) if data[x, y]]
    kaki = kiri + sum(xs) / len(xs)
    return (kiri, atas, kanan, bawah), kaki


def main():
    os.makedirs(TUJUAN, exist_ok=True)
    for nama, (acuan, H, W, pose) in TOKOH.items():
        ref = buka(acuan)
        (_, ra, _, rb), rkaki = ukur(ref)
        tinggi_ref = rb - ra
        bawah_ref = rb + (H - ref.height)       # jarak kaki dari bawah kanvas tetap
        # 1) skala & posisi tiap pose
        rencana = []
        for p, src in pose.items():
            utama, tutup = src if isinstance(src, tuple) else (src, None)
            im = buka(utama)
            (k, a, kn, b), kaki = ukur(im)
            s = tinggi_ref / (b - a)
            rencana.append((p, im, tutup, s, kaki, b, k, kn))
        # 2) lebar kanvas: cukup buat pose paling lebar (kaki di tengah)
        if W is None:
            setengah = max(max(kaki - k, kn - kaki) * s for _, _, _, s, kaki, _, k, kn in rencana)
            W = int(setengah * 2) + 8
        tengah = W / 2
        for p, im, tutup, s, kaki, b, k, kn in rencana:
            for versi, gbr in ((p, im), (p + "-tutup", buka(tutup) if tutup else None)):
                if gbr is None:
                    continue
                besar = gbr.resize((round(gbr.width * s), round(gbr.height * s)), Image.LANCZOS)
                x = round(tengah - kaki * s)
                y = round(bawah_ref - b * s)
                kanvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
                kanvas.alpha_composite(besar, (x, y)) if x >= 0 and y >= 0 else kanvas.paste(besar, (x, y), besar)
                kpt = kanvas.getchannel("A").point(lambda v: 255 if v >= AMBANG else 0).getbbox()
                # atas boleh nempel (gambar acuan juga nempel atas); kiri/kanan jangan
                terpotong = kpt and (kpt[0] <= 0 or kpt[2] >= W)
                out = os.path.join(TUJUAN, f"{nama}-{versi}.webp")
                kanvas.save(out, "WEBP", quality=80, method=6, alpha_quality=90)
                print(f"{nama}-{versi:15s} {W}x{H}  skala {s:.2f}  {os.path.getsize(out)/1024:5.0f} KB"
                      + ("  !! TERPOTONG" if terpotong else ""))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
