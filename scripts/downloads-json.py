"""Writes data/downloads.json from the full export (plan.json + results.json of scripts/monge/export_full.py, file
checks by scripts/monge/check_files.py) and <dir>/upload.tsv. One PAGE per size, its OPTIONS (thread, seals …) each
with its four files. Only options that passed every check are published; a page with none is left out.
Usage: python3 scripts/downloads-json.py <export dir> data/downloads.json <version> <checked>"""
import json, sys
src, out, version, checked = sys.argv[1:5]
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
            for ext in ['step', 'stl', '3mf', 'glb']:
                upload.append((f"{src}/{key}/{base}.{ext}", f"downloads/{key}/{base}.{ext}"))
            opts.append({'id': op['id'], 'label': op['label'],
                         'bytes': [rec['files'][e] for e in ['step', 'stl', '3mf', 'glb']],
                         'sizeMm': sorted((round(x, 1) for x in stl['size']), reverse=True),
                         'massKg': round(stl['volume'] * 7850e-9, 5), 'bodies': rec['bodies'],
                         'checks': [rec['kernel_ok'], rec['roundtrip_ok'], bool(stl.get('ok')) and rec['bodies'] == 1]})
        if opts:
            pages_out.append({'id': pg['id'], 'group': pg['group'], 'label': pg['label'], 'std': pg.get('std'), 'row': pg.get('row'), 'options': opts})
    if pages_out:
        data[slug] = {'checked': checked, 'version': version, 'pages': pages_out}
json.dump(data, open(out, 'w'), ensure_ascii=False, separators=(',', ':'))
open(f'{src}/upload.tsv', 'w').write(''.join(f'{a}\t{b}\n' for a, b in upload))
n_p = sum(len(v['pages']) for v in data.values()); n_o = sum(len(p['options']) for v in data.values() for p in v['pages'])
mb = sum(b for v in data.values() for p in v['pages'] for o in p['options'] for b in o['bytes']) / 1e6
print(f'{n_p} pages, {n_o} geometries, {len(upload)} files, {mb:.0f} MB; left out {len(left_out)}: {left_out[:12]}')
