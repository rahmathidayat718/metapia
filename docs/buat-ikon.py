"""
METAPIA — buat-ikon.py
Memangkas Font Awesome 6.5.1 supaya hanya berisi ikon yang DIPAKAI METAPIA,
lalu menyimpannya sendiri (tidak lagi dari CDN, jadi ikut tersimpan offline).

Hasil:
  assets/font/fa-solid.woff2, assets/font/fa-regular.woff2   (font ikon kecil)
  css/ikon.css                                               (pengganti all.min.css)

Cara pakai (dari folder proyek, butuh internet sekali + fonttools):
  pip install fonttools brotli
  python docs/buat-ikon.py

Kalau nanti menambah ikon baru (mis. <i class="fa-solid fa-bell">), cukup
jalankan ulang skrip ini: ikon dicari otomatis dari semua file HTML/JS.
Ikon yang namanya disusun dari kode (mis. "fa-gauge-simple" + "-high") ditulis
manual di IKON_TAMBAHAN.
"""
import os, re, sys, io, glob, urllib.request, ssl
from fontTools import subset
from fontTools.ttLib import TTFont

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CDN = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1"
IKON_TAMBAHAN = {"fa-gauge-simple-high", "fa-gauge-simple", "fa-heart", "fa-volume-high", "fa-volume-xmark", "fa-play", "fa-pause"}
BUKAN_IKON = {"fa-solid", "fa-regular", "fa-brands", "fa-spin", "fa-fw"}


def unduh(url):
    ctx = ssl.create_default_context()
    ctx.check_revocation = False if hasattr(ctx, "check_revocation") else None
    with urllib.request.urlopen(url, context=ssl._create_unverified_context()) as r:
        return r.read()


def main():
    # 1) kumpulkan nama ikon yang dipakai
    dipakai = set(IKON_TAMBAHAN)
    for f in glob.glob(os.path.join(AKAR, "**", "*.*"), recursive=True):
        if f.endswith((".html", ".js")) and "vendor" not in f and "docs" not in f:
            dipakai |= set(re.findall(r"\bfa-[a-z0-9]+(?:-[a-z0-9]+)*", open(f, encoding="utf-8", errors="ignore").read()))
    dipakai -= BUKAN_IKON

    # 2) cari kode unicode tiap ikon di CSS Font Awesome
    css = unduh(f"{CDN}/css/all.min.css").decode("utf-8")
    kode = {}
    for nama in sorted(dipakai):
        # bentuk di CSS FA: .fa-heart:before{content:"\f004"} (kadang digabung: .a:before,.b:before{...})
        m = re.search(r"\." + re.escape(nama) + r":before[,{][^}]*?content:\"\\([0-9a-f]+)\"", css)
        if m:
            kode[nama] = m.group(1)
        else:
            print("  (dilewati, bukan ikon FA):", nama)
    print(f"Ikon dipakai: {len(kode)}")

    # 3) pangkas font solid & regular
    teks = "".join(chr(int(c, 16)) for c in kode.values())
    for gaya, file in (("solid", "fa-solid-900"), ("regular", "fa-regular-400")):
        asli = io.BytesIO(unduh(f"{CDN}/webfonts/{file}.woff2"))
        hasil = os.path.join(AKAR, "assets", "font", f"fa-{gaya}.woff2")
        opsi = subset.Options(); opsi.flavor = "woff2"; opsi.layout_features = ["*"]
        font = subset.load_font(asli, opsi)
        s = subset.Subsetter(opsi); s.populate(text=teks); s.subset(font)
        subset.save_font(font, hasil, opsi)
        print(f"  {hasil[len(AKAR)+1:]}: {os.path.getsize(hasil)/1024:.1f} KB")

    # 4) tulis css/ikon.css (aturan dasar Font Awesome + daftar ikon)
    baris = [
        "/* METAPIA — ikon.css (DIBUAT OTOMATIS oleh docs/buat-ikon.py, jangan diedit manual)",
        "   Font Awesome Free 6.5.1 (https://fontawesome.com, lisensi ikon CC BY 4.0, font SIL OFL 1.1)",
        "   dipangkas: hanya ikon yang dipakai METAPIA. */",
        "@font-face{font-family:'FA Solid';font-style:normal;font-weight:900;font-display:block;src:url('../assets/font/fa-solid.woff2') format('woff2');}",
        "@font-face{font-family:'FA Regular';font-style:normal;font-weight:400;font-display:block;src:url('../assets/font/fa-regular.woff2') format('woff2');}",
        ".fa-solid,.fa-regular{display:inline-block;font-style:normal;font-variant:normal;line-height:1;text-rendering:auto;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}",
        ".fa-solid{font-family:'FA Solid';font-weight:900;}",
        ".fa-regular{font-family:'FA Regular';font-weight:400;}",
        ".fa-solid::before,.fa-regular::before{content:var(--fa);}",
        ".fa-spin{animation:fa-spin 1.2s linear infinite;}",
        "@keyframes fa-spin{to{transform:rotate(360deg);}}",
    ]
    baris += [f'.{n}{{--fa:"\\{c}";}}' for n, c in sorted(kode.items())]
    open(os.path.join(AKAR, "css", "ikon.css"), "w", encoding="utf-8").write("\n".join(baris) + "\n")
    print("  css/ikon.css ditulis")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
