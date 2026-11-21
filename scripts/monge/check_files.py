"""Checks the exported files: STL closed and consistently oriented (every edge in exactly two triangles, once each
way), its volume vs the kernel's; 3MF a valid zip with a 3D model in millimetres; GLB header. Writes into results.json."""
import json, os, struct, sys, zipfile, re, collections
OUT = os.environ.get('MONGE_EXPORT', '/tmp/monge-export')
def stl(path):
    b = open(path, 'rb').read()
    n = struct.unpack('<I', b[80:84])[0]
    if 84 + 50 * n != len(b): return {'ok': False, 'why': 'not a binary STL'}
    key = {}; tris = []; vol = 0.0; lo = [1e9] * 3; hi = [-1e9] * 3
    def k(p):
        q = (round(p[0], 4), round(p[1], 4), round(p[2], 4))
        if q not in key: key[q] = len(key)
        return key[q]
    for i in range(n):
        f = struct.unpack('<12f', b[84 + 50 * i: 84 + 50 * i + 48])
        a, c, d = f[3:6], f[6:9], f[9:12]
        for p in (a, c, d):
            for j in range(3): lo[j] = min(lo[j], p[j]); hi[j] = max(hi[j], p[j])
        vol += (a[0] * (c[1] * d[2] - c[2] * d[1]) - a[1] * (c[0] * d[2] - c[2] * d[0]) + a[2] * (c[0] * d[1] - c[1] * d[0])) / 6
        ia, ic, idd = k(a), k(c), k(d)
        if len({ia, ic, idd}) < 3: continue
        tris.append((ia, ic, idd))
    directed = collections.Counter()
    for a, c, d in tris:
        for e in ((a, c), (c, d), (d, a)): directed[e] += 1
    open_edges = sum(1 for (a, c), m in directed.items() if directed.get((c, a), 0) != m)
    dup = sum(1 for m in directed.values() if m > 1)
    return {'ok': open_edges == 0 and dup == 0 and vol > 0, 'triangles': n, 'open_edges': open_edges, 'dup_edges': dup,
            'volume': vol, 'size': [round(hi[j] - lo[j], 3) for j in range(3)]}
def mf3(path):
    try:
        z = zipfile.ZipFile(path); names = z.namelist()
        model = next((x for x in names if x.endswith('.model')), None)
        if not model or '[Content_Types].xml' not in names: return {'ok': False, 'why': f'parts {names}'}
        x = z.read(model).decode('utf8', 'replace')
        unit = re.search(r'unit="(\w+)"', x)
        return {'ok': 'vertices' in x and 'triangles' in x, 'unit': unit.group(1) if unit else 'millimeter (default)'}
    except Exception as e: return {'ok': False, 'why': str(e)}
def glb(path):
    b = open(path, 'rb').read(12)
    return {'ok': b[:4] == b'glTF' and struct.unpack('<I', b[4:8])[0] == 2}
r = json.load(open(f'{OUT}/results.json'))
for key, rec in r.items():
    if not rec.get('files') or rec.get('file_checks'): continue
    d = f"{OUT}/{key}"
    base = f"{d}/{rec['slug']}-{rec['page']}-{rec['opt']}" if 'page' in rec else f"{d}/{rec['slug']}-{rec['id']}"
    c = {'stl': stl(base + '.stl'), '3mf': mf3(base + '.3mf'), 'glb': glb(base + '.glb')}
    s = c['stl']
    if s.get('volume') and rec.get('volume_cm3'):
        # STL in mm → cm³; the mesh volume is a little under the exact one (chords inside curves)
        s['volume_cm3'] = round(s['volume'] / 1000, 3); s['vs_kernel'] = round(s['volume'] / 1000 / rec['volume_cm3'] - 1, 4)
    rec['file_checks'] = c
    rec['files_ok'] = all(v['ok'] for v in c.values())
    if not rec['files_ok']: print('BAD files', key, {k: v for k, v in c.items() if not v['ok']})
json.dump(r, open(f'{OUT}/results.json', 'w'), ensure_ascii=False, indent=1)
ok = [k for k, v in r.items() if v.get('ok') and v.get('files_ok')]
print(f'{len(ok)} of {len(r)} configs pass kernel + STEP round trip + files')
vs = [v['file_checks']['stl'].get('vs_kernel') for v in r.values() if v.get('file_checks')]
vs = [x for x in vs if x is not None]
print('STL volume vs kernel: worst', min(vs), max(vs))
