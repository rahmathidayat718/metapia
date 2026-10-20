"""
METAPIA — perbarui-sw.py
Memperbarui DAFTAR_FILE dan CACHE_VERSI di sw.js (service worker).

JALANKAN SETIAP KALI selesai mengubah file web, sebelum git push:
    python docs/perbarui-sw.py

- DAFTAR_FILE : semua file yang dipakai web (HTML, CSS, JS, gambar, font,
                ikon), kecuali three.js (disimpan saat halaman Game dibuka).
- CACHE_VERSI : dibuat dari "sidik" isi semua file. Kalau ada 1 file saja
                yang berubah, versinya ikut berubah -> HP siswa otomatis
                membuang cache lama & menyimpan versi baru.
"""
import os, re, sys, hashlib

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POLA = [
    ("", (".html",)),
    ("", ("manifest.json",)),
    ("css", (".css",)),
    ("js", (".js",)),
    ("assets", (".webp", ".png", ".woff2")),
]
KECUALI = ("js/vendor/",)  # disimpan saat dipakai (lihat sw.js)


def kumpulkan():
    hasil = []
    for folder, akhiran in POLA:
        dasar = os.path.join(AKAR, folder)
        if folder == "":
            for f in os.listdir(dasar):
                if f.endswith(akhiran) and os.path.isfile(os.path.join(dasar, f)):
                    hasil.append(f)
            continue
        for d, _, files in os.walk(dasar):
            for f in files:
                rel = os.path.relpath(os.path.join(d, f), AKAR).replace("\\", "/")
                if f.endswith(akhiran) and not rel.startswith(KECUALI):
                    hasil.append(rel)
    return sorted(set(hasil))


def main():
    files = kumpulkan()
    h = hashlib.sha256()
    for f in files + ["js/vendor/three.module.min.js"]:
        p = os.path.join(AKAR, f)
        if os.path.isfile(p):
            h.update(f.encode()); h.update(open(p, "rb").read())
    versi = "metapia-" + h.hexdigest()[:10]

    p = os.path.join(AKAR, "sw.js")
    s = open(p, encoding="utf-8").read()
    s = re.sub(r'const CACHE_VERSI = "[^"]*";', f'const CACHE_VERSI = "{versi}";', s)
    daftar = "\n".join(f'  "{f}",' for f in files)
    s = re.sub(r"const DAFTAR_FILE = \[.*?\];", f"const DAFTAR_FILE = [\n  // diatur docs/perbarui-sw.py\n{daftar}\n];", s, flags=re.S)
    open(p, "w", encoding="utf-8").write(s)
    total = sum(os.path.getsize(os.path.join(AKAR, f)) for f in files)
    print(f"sw.js diperbarui: {versi}, {len(files)} file ({total/1024:,.0f} KB disimpan saat pertama dibuka)")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
