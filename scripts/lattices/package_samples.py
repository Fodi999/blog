#!/usr/bin/env python3
"""Pack the lattice SAMPLES made by Monge for the site (real geometry, not demo).

  python3 scripts/lattices/package_samples.py SAMPLES_DIR VERSION

SAMPLES_DIR/<kind>/ holds what the Monge test window wrote for one sample cube: Monge.stl, Monge.3mf, Monge.glb,
render.png and report.json (the answer of doc.lattice + export_models). Writes
  r2/lattices/<kind>/<VERSION>/<kind>-sample.{stl,3mf,glb}, render.webp
and data/lattice-samples.json (sizes, SHA-256, the numbers Monge reported). The 3MF is re-packed with Deflate: the same
entries byte for byte, only compressed (Monge's writer stores them uncompressed). Nothing is uploaded here.
"""
import hashlib, json, os, re, shutil, subprocess, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
src, ver = sys.argv[1], sys.argv[2]

# how each sample was cut: a cube of `cube` mm, cell exactly `cell` mm (fit false) or fitted — chosen so the open cut
# leaves no loose piece (Monge reports pieces not joined to the part; checked again on the STL)
CUT = {k: (22.0, False) for k in ['gyroid', 'diamond', 'schwarz_p', 'iwp', 'neovius', 'gyroid_net', 'cubic', 'bcc', 'fcc', 'octet', 'kelvin']}
CUT['diamond_net'] = (20.0, True)
ORDER = ['gyroid', 'diamond', 'schwarz_p', 'iwp', 'neovius', 'gyroid_net', 'diamond_net', 'cubic', 'bcc', 'fcc', 'octet', 'kelvin']


def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def deflate_3mf(a, b):
    """The same 3MF entries in the same order, compressed; fixed times so the file is byte-reproducible."""
    with zipfile.ZipFile(a) as zi, zipfile.ZipFile(b, 'w') as zo:
        for info in zi.infolist():
            data = zi.read(info.filename)
            o = zipfile.ZipInfo(info.filename, date_time=(2026, 1, 1, 0, 0, 0))
            o.compress_type, o.external_attr = zipfile.ZIP_DEFLATED, 0o644 << 16
            zo.writestr(o, data, compresslevel=9)
    with zipfile.ZipFile(a) as x, zipfile.ZipFile(b) as y:
        assert [i.filename for i in x.infolist()] == [i.filename for i in y.infolist()]
        assert all(x.read(n) == y.read(n) for n in x.namelist()), 'repacked 3MF differs'


def stl_parts(p):
    """Connected pieces of a binary STL (vertices welded at 1e-4 mm)."""
    import struct
    with open(p, 'rb') as f:
        f.read(80)
        n = struct.unpack('<I', f.read(4))[0]
        key, tris = {}, []
        for _ in range(n):
            d = struct.unpack('<12fH', f.read(50))
            t = []
            for k in range(3):
                q = tuple(round(x, 4) for x in d[3 + 3 * k:6 + 3 * k])
                t.append(key.setdefault(q, len(key)))
            tris.append(t)
    parent = list(range(len(key)))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for a, b, c in tris:
        for u, v in ((a, b), (b, c)):
            ru, rv = find(u), find(v)
            if ru != rv:
                parent[ru] = rv
    return len({find(t[0]) for t in tris}), n


items = []
for kind in ORDER:
    d = os.path.join(src, kind)
    rep = json.load(open(os.path.join(d, 'report.json')))
    text = rep.get('result') or ''
    if rep.get('error') or not text:
        sys.exit(f'{kind}: no result in report.json')
    num = lambda pat: float(re.search(pat, text).group(1).replace(',', '.'))
    wall = num(r'(?:стенка|стержень|шейка) ([\d.]+) мм')
    cell = num(r'ячейка ([\d.]+) мм')
    volume = num(r'материала ([\d.]+) см³')
    box = num(r'см³ из ([\d.]+)')
    share = num(r'\((\d+) %\)') / 100
    tris = int(num(r'треугольников (\d+)'))
    islands = re.search(r'не связанных с деталью, — (\d+)', text)
    if islands:
        sys.exit(f'{kind}: Monge reports {islands.group(1)} loose piece(s) — not a publishable sample')
    parts, n = stl_parts(os.path.join(d, 'Monge.stl'))
    if parts != 1:
        sys.exit(f'{kind}: the STL has {parts} pieces')
    out = os.path.join(ROOT, 'r2', 'lattices', kind, ver)
    shutil.rmtree(out, ignore_errors=True)
    os.makedirs(out)
    files = []
    for fmt in ['stl', '3mf', 'glb']:
        dst = os.path.join(out, f'{kind}-sample.{fmt}')
        if fmt == '3mf':
            deflate_3mf(os.path.join(d, 'Monge.3mf'), dst)
        else:
            shutil.copy(os.path.join(d, f'Monge.{fmt}'), dst)
        files.append({'format': fmt, 'key': f'lattices/{kind}/{ver}/{kind}-sample.{fmt}', 'bytes': os.path.getsize(dst), 'sha256': sha(dst)})
    subprocess.run(['magick', os.path.join(d, 'render.png'), '-resize', '1080x1080', '-quality', '86', os.path.join(out, 'render.webp')], check=True)
    cube, fit = CUT[kind]
    items.append({
        'kind': kind, 'cube_mm': cube, 'cell_mm': cell, 'fit': fit, 'wall_mm': wall, 'shell_mm': 0,
        'share': share, 'volume_cm3': volume, 'box_cm3': box, 'triangles': tris, 'pieces': parts,
        'render': f'lattices/{kind}/{ver}/render.webp', 'files': files,
    })
    print(kind, f'wall {wall} cell {cell} share {share:.2f} tris {tris} pieces {parts}', [(f['format'], round(f['bytes'] / 1e6, 1)) for f in files])

data = {
    'demo': False,
    'made_by': 'Monge 0.15.198 (development build), doc.lattice + export_models, test window',
    'made': '2026-11-23',
    'note': 'Real geometry: open sample cubes (no skin). The cut is chosen so no piece is loose. Nominal geometry, not as built.',
    'version': ver,
    'samples': items,
}
json.dump(data, open(os.path.join(ROOT, 'data', 'lattice-samples.json'), 'w'), ensure_ascii=False, indent=1)
print('written data/lattice-samples.json:', len(items), 'samples')
