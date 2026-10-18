"""
METAPIA — buat-webp.py
Mengubah gambar asli di assets-sumber/ menjadi WebP yang ringan di assets/.

Cara pakai (dari folder proyek):   python docs/buat-webp.py
Butuh: Python + Pillow  (pip install pillow)

Kalau ada gambar baru/ganti gambar: taruh file aslinya (PNG/JPG) di
assets-sumber/ dengan struktur folder yang sama, lalu jalankan skrip ini.
Atur ukuran/kualitas di ATURAN di bawah kalau perlu.
"""
import os, sys
from PIL import Image

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUMBER = os.path.join(AKAR, "assets-sumber")
TUJUAN = os.path.join(AKAR, "assets")

# (awalan path, lebar maksimal px atau None = tetap, kualitas WebP)
# lebar maksimal ± 2x ukuran tampil di layar
ATURAN = [
    ("bocah", 1000, 78),          # tampil ± 500 px di Beranda
    ("game/g1-soal", 880, 76),    # tampil ± 200-440 px di game
    ("bgMateri", None, 72),       # background layar penuh
    ("karakter/", None, 80),      # sudah seukuran tampil
    ("kupu", None, 85),           # kecil sekali
]


def aturan(rel):
    for awal, lebar, q in ATURAN:
        if rel.startswith(awal):
            return lebar, q
    return None, 80


def main():
    total_lama = total_baru = 0
    for folder, _, files in os.walk(SUMBER):
        for nama in files:
            if not nama.lower().endswith((".png", ".jpg", ".jpeg")):
                continue
            src = os.path.join(folder, nama)
            rel = os.path.relpath(src, SUMBER).replace("\\", "/")
            dst = os.path.join(TUJUAN, os.path.splitext(rel)[0] + ".webp")
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            lebar, q = aturan(rel)
            im = Image.open(src)
            transparan = im.mode in ("RGBA", "LA", "P")
            im = im.convert("RGBA" if transparan else "RGB")
            if lebar and im.width > lebar:
                im = im.resize((lebar, round(im.height * lebar / im.width)), Image.LANCZOS)
            # alpha_quality tinggi biar pinggiran karakter tetap halus
            im.save(dst, "WEBP", quality=q, method=6, alpha_quality=90)
            lama, baru = os.path.getsize(src), os.path.getsize(dst)
            total_lama += lama; total_baru += baru
            print(f"{rel:42s} {lama/1024:7.0f} KB -> {baru/1024:6.0f} KB  {im.width}x{im.height}")
    print(f"\nTOTAL {total_lama/1024:,.0f} KB -> {total_baru/1024:,.0f} KB")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
