"""Writes data/downloads.json from the full export (plan.json + results.json of scripts/monge/export_full.py, file
checks by scripts/monge/check_files.py) and <dir>/upload.tsv. One PAGE per size, its OPTIONS (thread, seals …) each
with its four files. Only options that passed every check are published; a page with none is left out.
Usage: python3 scripts/downloads-json.py <export dir> data/downloads.json <version> <checked> [<standards dump>]"""
import hashlib, json, os, sys
src, out, version, checked = sys.argv[1:5]
# the standards' rows as Monge has them (the dump of fastener_table: every column, lengths and pitches included)
STD = {t['id']: t for t in json.load(open(sys.argv[5]))} if len(sys.argv) > 5 else {}
def row(std, key):
    t = STD.get(std)
    if not t or key is None: return None
    for r in t['rows']:
        if r.get('size') == key or r.get('name') == key or (isinstance(r.get('d'), (int, float)) and f"{r['d']:g}" == str(key)):
            return r
    return None
def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''): h.update(b)
    return h.hexdigest()
def facts(slug, pg, op):
    """What the geometry is, from the parameters Monge built it with and the standards' rows — nothing guessed:
    a value the data has not is left out."""
    p = op['params']; f = {}
    std = pg.get('std')
    if slug in ('bolt-iso-4017', 'screw-iso-4762', 'nut-iso-4032', 'washer-iso-7089', 'bolt-joint-iso-4017'):
        r = row('ISO 261', p.get('size'))
        if r: f['d'] = r['d']; f['pitch'] = r['pitch']
        if 'length' in p: f['l'] = p['length']
        if 'grip' in p: f['grip'] = p['grip']
    elif slug == 'lock-nut-din-981':
        r = row('DIN 981', p.get('size'))
        if r: f['d'] = r['d']; f['pitch'] = r['pitch']; f['thread_size'] = r.get('metric')
    elif slug == 'bearing-iso-15':
        r = row('ISO 15', p.get('name'))
        if r: f['d'] = r['d']; f['D'] = r['D']; f['B'] = r['B']
        f['seals'] = p.get('seals', '2Z'); f['balls'] = p.get('detail') == 'balls'
    elif slug == 'rebar-en-10080':
        f['d'] = float(p['d']); f['shape'] = p.get('shape')
        if p.get('shape') == 'straight': f['l'] = p.get('l')
        for k in ('a', 'b', 'c'):
            if k in p: f[k] = p[k]
        f['ribs'] = p.get('ribs', 'plain')
    if 'threads' in p or slug in ('bolt-iso-4017', 'screw-iso-4762', 'nut-iso-4032', 'lock-nut-din-981', 'bolt-joint-iso-4017'):
        f['thread'] = p.get('threads', 'cosmetic')
        if f['thread'] == 'print': f['allowance'] = p.get('clearance', 0.15)
    return {k: v for k, v in f.items() if v is not None}
plan = json.load(open(f'{src}/plan.json'))
res = json.load(open(f'{src}/results.json'))
data, upload, left_out = {}, [], []
for slug, pages in plan.items():
    pages_out = []
    for pg in pages:
        opts = []
        for op in pg['options']:
            key = f"{slug}/{pg['id']}/{op['id']}"
            rec = res.get(key)
            fc = (rec or {}).get('file_checks', {})
            stl = fc.get('stl', {})
            # an assembly's bodies may touch (a nut's thread on the bolt's): closed, but edges shared between bodies
            stl_fine = stl.get('ok') or ((rec or {}).get('bodies', 0) > 1 and stl.get('open_edges') == 0)
            if not (rec and rec.get('ok') and stl_fine and fc.get('3mf', {}).get('ok') and fc.get('glb', {}).get('ok')):
                left_out.append(key); continue
            base = f"{slug}-{pg['id']}-{op['id']}"
            exts = [e for e in ['step', 'stl', '3mf', 'glb'] if e in rec['files']]
            for ext in exts:
                upload.append((f"{src}/{key}/{base}.{ext}", f"downloads/{key}/{base}.{ext}"))
            o = {'id': op['id'], 'label': op['label'], 'params': op['params'], 'facts': facts(slug, pg, op),
                 'sha': [sha(f"{src}/{key}/{base}.{e}") if e in rec['files'] else None for e in ['step', 'stl', '3mf', 'glb']],
                 # sizes in the order step, stl, 3mf, glb; null — no such file (the print option has no STEP)
                 'bytes': [rec['files'].get(e) for e in ['step', 'stl', '3mf', 'glb']],
                 'sizeMm': sorted((round(x, 1) for x in stl['size']), reverse=True),
                 'massKg': round(stl['volume'] * 7850e-9, 5), 'bodies': rec['bodies'],
                 'checks': [rec['kernel_ok'], bool(rec.get('roundtrip_ok')), bool(stl.get('ok')) and rec['bodies'] == 1]}
            if 'print' in rec:
                pr = rec['print']
                # the plastic's mass (PLA 1.24 g/cm³) and how it lies: head down / as it stands
                o['print'] = {'ok': pr['ok'], 'up': rec['up'], 'wall': pr['wall_min'], 'reach': pr['reach_max'], 'overMm2': round(pr['over_mm2'], 1),
                              'pla': round(stl['volume'] * 1.24e-3, 2)}
            opts.append(o)
        if opts:
            img = f"{src}/{slug}/{pg['id']}/{slug}-{pg['id']}.webp"
            page = {'id': pg['id'], 'group': pg['group'], 'label': pg['label'], 'std': pg.get('std'), 'row': pg.get('row'), 'options': opts}
            if os.path.exists(img):
                # a render of this size's own geometry (its default option), not of the family
                page['image'] = os.path.getsize(img)
                upload.append((img, f"downloads/{slug}/{pg['id']}/{slug}-{pg['id']}.webp"))
            pages_out.append(page)
    if pages_out:
        data[slug] = {'checked': checked, 'version': version, 'pages': pages_out}
json.dump(data, open(out, 'w'), ensure_ascii=False, separators=(',', ':'))
open(f'{src}/upload.tsv', 'w').write(''.join(f'{a}\t{b}\n' for a, b in upload))
open(f'{src}/upload_images.tsv', 'w').write(''.join(f'{a}\t{b}\n' for a, b in upload if b.endswith('.webp')))
open(f'{src}/upload_print.tsv', 'w').write(''.join(f'{a}\t{b}\n' for a, b in upload if '/print/' in b))
n_p = sum(len(v['pages']) for v in data.values()); n_o = sum(len(p['options']) for v in data.values() for p in v['pages'])
mb = sum(b or 0 for v in data.values() for p in v['pages'] for o in p['options'] for b in o['bytes']) / 1e6
print(f'{n_p} pages, {n_o} geometries, {len(upload)} files, {mb:.0f} MB; left out {len(left_out)}: {left_out[:12]}')
