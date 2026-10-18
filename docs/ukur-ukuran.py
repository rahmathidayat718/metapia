"""
METAPIA — ukur-ukuran.py
Menghitung ukuran file yang diunduh tiap halaman (untuk docs/optimasi-ringan.md).

Cara pakai (dari folder proyek):   python docs/ukur-ukuran.py
Hasil: tabel Markdown ukuran per halaman + daftar file terbesar.

Cara hitung:
- File LOKAL: dibaca dari HTML (<link>, <script>, <img>), dari CSS (url(), @import)
  dan dari JS (teks "assets/...", import modul). Ukuran = ukuran file asli
  ("mentah") dan perkiraan setelah dikompres gzip (GitHub Pages mengompres
  file teks: HTML/CSS/JS/SVG/JSON; gambar & font tidak).
- File EKSTERNAL (CDN): ukurannya diukur sekali dan dicatat di EKSTERNAL di bawah.
- Gambar soal game (g1-soal*) dihitung terpisah karena baru diunduh saat main.
"""
import os, re, gzip, sys

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HALAMAN = ["index.html", "dashboard.html", "materi.html", "video.html", "kuis.html", "game.html"]
TEKS = (".html", ".css", ".js", ".json", ".svg", ".webmanifest")

# ukuran file CDN (bytes mentah, bytes setelah gzip) — diukur 18-10-2026
EKSTERNAL = {
    "fonts.googleapis.com (CSS)": (12000, 1500),
    "Baloo 2 (woff2)": (33188, 33188),
    "Nunito (woff2)": (39128, 39128),
    "font-awesome all.min.css": (102641, 22403),
    "fa-solid-900.woff2": (156496, 156496),
    "fa-regular-400.woff2": (25452, 25452),
    "three.module.js (three.js 0.165)": (1284652, 260074),
}


def baca(p):
    try:
        return open(os.path.join(AKAR, p), encoding="utf-8", errors="ignore").read()
    except OSError:
        return ""


def ukuran(p):
    f = os.path.join(AKAR, p)
    if not os.path.isfile(f):
        return None
    mentah = os.path.getsize(f)
    if p.endswith(TEKS):
        return mentah, len(gzip.compress(open(f, "rb").read(), 9))
    return mentah, mentah


def rapikan(dasar, rel):
    rel = rel.split("?")[0].split("#")[0]
    if not rel or rel.startswith(("http:", "https:", "data:", "//", "mailto:")):
        return None
    return os.path.normpath(os.path.join(os.path.dirname(dasar), rel)).replace("\\", "/")


def kumpulkan(halaman):
    lokal, eksternal, saat_main = set(), set(), set()
    antre = [halaman]
    while antre:
        p = antre.pop()
        if p in lokal:
            continue
        lokal.add(p)
        isi = baca(p)
        if p.endswith(".html"):
            refs = re.findall(r'(?:href|src)="([^"]+)"', isi)
            refs += re.findall(r'import\(\s*"([^"]+)"', isi)
        elif p.endswith(".css"):
            refs = re.findall(r"url\(['\"]?([^'\")]+)['\"]?\)", isi)
        elif p.endswith(".js"):
            refs = re.findall(r'["\'`]((?:\./|\.\./)?(?:assets|js|css)/[^"\'`$]+?\.(?:png|jpe?g|webp|js|css|json|svg))["\'`]', isi)
            refs += re.findall(r'from\s+"(\./[^"]+)"', isi)
            refs += re.findall(r'import\(\s*"(\./[^"]+)"', isi)
        else:
            refs = []
        for r in refs:
            if "fonts.googleapis" in r:
                eksternal.update(["fonts.googleapis.com (CSS)", "Baloo 2 (woff2)", "Nunito (woff2)"])
            if "font-awesome" in r:
                eksternal.update(["font-awesome all.min.css", "fa-solid-900.woff2"])
        if p.endswith(".js") and "fa-regular" in isi:
            eksternal.add("fa-regular-400.woff2")
        if p.endswith(".html") and "importmap" in isi and "three" in isi:
            eksternal.add("three.module.js (three.js 0.165)")
        for r in refs:
            # path di JS ditulis relatif ke halaman HTML (bukan ke file JS-nya)
            dasar = halaman if p.endswith(".js") and not r.startswith("./") else p
            q = rapikan(dasar, r)
            if not q or not os.path.isfile(os.path.join(AKAR, q)):
                continue
            if q.endswith(".html"):  # link menu ke halaman lain -> bukan unduhan halaman ini
                continue
            if "/game/g1-soal" in q:
                saat_main.add(q)
            elif q not in lokal:
                antre.append(q)
    return sorted(lokal), sorted(eksternal), sorted(saat_main)


def kb(b):
    return f"{b / 1024:,.0f} KB".replace(",", ".")


def main():
    semua = {}
    print("| Halaman | File lokal | Lokal (mentah) | Lokal (gzip) | CDN (gzip) | **Total diunduh** | + gambar soal saat main |")
    print("|---|---|---|---|---|---|---|")
    for h in HALAMAN:
        lokal, eks, main_ = kumpulkan(h)
        m = sum(ukuran(f)[0] for f in lokal)
        z = sum(ukuran(f)[1] for f in lokal)
        e = sum(EKSTERNAL[x][1] for x in eks)
        s = sum(ukuran(f)[1] for f in main_)
        for f in lokal + main_:
            semua[f] = ukuran(f)
        print(f"| {h} | {len(lokal)} | {kb(m)} | {kb(z)} | {kb(e)} | **{kb(z + e)}** | {kb(s) if s else '-'} |")

    aset = [f for f in os.popen(f'cd "{AKAR}" && git ls-files assets').read().split() if f]
    total_aset = sum(os.path.getsize(os.path.join(AKAR, f)) for f in aset if os.path.isfile(os.path.join(AKAR, f)))
    print(f"\nTotal folder assets/ yang dipakai web: {kb(total_aset)} ({len(aset)} file)\n")
    print("| File terbesar | Ukuran |")
    print("|---|---|")
    for f, (m, _) in sorted(semua.items(), key=lambda x: -x[1][0])[:15]:
        print(f"| {f} | {kb(m)} |")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
