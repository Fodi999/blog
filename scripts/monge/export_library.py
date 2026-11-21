"""Export every ready configuration of the Monge library from the TEST window (port 9899, never the user's 9887) and
check it: the kernel's report of each body, STEP / STL / 3MF / GLB written, the STEP read back and compared.
Usage: MONGE_EXPORT=<dir> python3 scripts/monge/export_library.py [slug ...]
       → <dir>/<slug>/<id>/<slug>-<id>.{step,stl,3mf,glb} + <dir>/results.json
Then: check_files.py (STL closed, 3MF, GLB) → scripts/downloads-json.py <dir> data/downloads.json <version> <date>
→ upload: tr '\t' '\n' < <dir>/upload.tsv | xargs -n 2 -P 8 scripts/monge/put_r2.sh"""
import json, os, re, sys, time, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mt
OUT = os.environ.get('MONGE_EXPORT', '/tmp/monge-export')
SLUGS = ['rebar-en-10080', 'bolt-joint-iso-4017', 'bolt-iso-4017', 'nut-iso-4032', 'washer-iso-7089', 'screw-iso-4762', 'bearing-iso-15', 'lock-nut-din-981', 'shaft']
def cid(name):
    s = name.lower().replace('ø', 'd').replace('×', 'x').replace('(', '').replace(')', '')
    return '-'.join(re.sub(r'[^a-z0-9.]+', '-', s).strip('-').replace('.', '_').split('-')[:6])
RHAI = r'''
let res = #{};
let t = timestamp();
let r = doc.place("__SLUG__", parse_json(`__PARAMS__`), #{ at: [0.0, 0.0, 0.0] });
res.secs = t.elapsed; res.name = r.name; res.bodies = r.bodies;
let lines = [];
for l in doc.summary().split("\n") { for b in r.bodies { if l.starts_with(`#${b} `) { lines.push(l); } } }
res.lines = lines;
let ms = []; for b in r.bodies { ms.push(doc.measure(b)); } res.measure = ms;
res.files = doc.export_models([], ["step", "stl", "3mf", "glb"], false, "__DIR__");
for b in r.bodies { doc.delete_body(b); }
res.reimport = import_step(doc, "__DIR__/Monge.step");
for l in res.reimport.split("\n") { if l.starts_with("#") { let n = l.sub_string(1, l.index_of(" ") - 1); doc.delete_body(parse_int(n)); } }
res.left = doc.summary().split("\n").len();
res
'''
def fev(line):
    m = re.search(r'· (F\d+ E\d+ V\d+) ·', line); v = re.search(r'· ([\d.]+) см³', line)
    return (m.group(1) if m else None, float(v.group(1)) if v else None, '· OK ·' in line)
results = json.load(open(f'{OUT}/results.json')) if os.path.exists(f'{OUT}/results.json') else {}
for slug in (sys.argv[1:] or SLUGS):
    meta = json.load(open(f'/Users/dmitrijfomin/Desktop/3d/templates/{slug}/meta.json'))
    for c in meta['configs']:
        i = cid(c['name']); d = f'{OUT}/{slug}/{i}'; os.makedirs(d, exist_ok=True)
        code = RHAI.replace('__SLUG__', slug).replace('__PARAMS__', json.dumps(c['params'])).replace('__DIR__', d)
        t0 = time.time(); r = mt.call('execute_code', {'code': code}, timeout=1800); wall = time.time() - t0
        rec = {'slug': slug, 'id': i, 'name': c['name'], 'params': c['params'], 'ok': False, 'wall': round(wall, 2)}
        if not r.get('ok'):
            rec['error'] = r.get('error'); print('FAIL', slug, i, r.get('error')); results[f'{slug}/{i}'] = rec; continue
        x = r['result']
        before = [fev(l) for l in x['lines']]
        after = [fev(l) for l in x['reimport'].split('\n') if l.startswith('#')]
        files = {}
        for ext in ['step', 'stl', '3mf', 'glb']:
            src = f'{d}/Monge.{ext}'; dst = f'{d}/{slug}-{i}.{ext}'
            if os.path.exists(src): os.replace(src, dst)
            if os.path.exists(dst): files[ext] = os.path.getsize(dst)
        vol = sum(v for _, v, _ in before if v)
        rt_vol = sum(v for _, v, _ in after if v)
        rec.update(left=x['left'], name_monge=x['name'], secs=round(x['secs'], 3), bodies=len(x['bodies']), files=files, measure=x['measure'],
                   kernel_ok=all(o for _, _, o in before) and len(before) == len(x['bodies']),
                   fev=[f for f, _, _ in before], volume_cm3=round(vol, 3),
                   roundtrip_ok=len(after) == len(before) and all(o for _, _, o in after) and sorted(f for f, _, _ in after) == sorted(f for f, _, _ in before) and abs(rt_vol - vol) <= max(0.1, 1e-3 * vol),
                   roundtrip_volume_cm3=round(rt_vol, 3))
        rec['ok'] = rec['kernel_ok'] and rec['roundtrip_ok'] and len(files) == 4
        results[f'{slug}/{i}'] = rec
        print('ok ' if rec['ok'] else 'BAD', slug, i, f"{rec['secs']}s", rec['fev'], vol, rt_vol, {k: v // 1024 for k, v in files.items()})
        json.dump(results, open(f'{OUT}/results.json', 'w'), ensure_ascii=False, indent=1)
