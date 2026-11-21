"""Export every geometry of plan.json (plan_library.py) from the Monge TEST window (port 9899) and check it: the
kernel's report of each body, STEP / STL / 3MF / GLB written, the STEP read back and compared. Resumable: what is
already exported and fine is skipped. Usage: MONGE_EXPORT=<dir> python3 scripts/monge/export_full.py [slug ...]
→ <dir>/<slug>/<page>/<option>/<slug>-<page>-<option>.{step,stl,3mf,glb} + <dir>/results.json"""
import json, os, re, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mt
OUT = os.environ.get('MONGE_EXPORT', '/tmp/monge-export')
RHAI = r'''
let res = #{};
let t = timestamp();
let r = doc.place("__SLUG__", parse_json(`__PARAMS__`), #{ at: [0.0, 0.0, 0.0] });
res.secs = t.elapsed; res.name = r.name; res.bodies = r.bodies;
let lines = [];
for l in doc.summary().split("\n") { for b in r.bodies { if l.starts_with(`#${b} `) { lines.push(l); } } }
res.lines = lines;
res.files = doc.export_models([], ["step", "stl", "3mf", "glb"], false, "__DIR__");
for b in r.bodies { doc.delete_body(b); }
res.reimport = import_step(doc, "__DIR__/Monge.step");
for l in res.reimport.split("\n") { if l.starts_with("#") { let n = l.sub_string(1, l.index_of(" ") - 1); doc.delete_body(parse_int(n)); } }
res
'''
def fev(line):
    m = re.search(r'· (F\d+ E\d+ V\d+) ·', line); v = re.search(r'· ([\d.]+) см³', line)
    return (m.group(1) if m else None, float(v.group(1)) if v else None, '· OK ·' in line)
plan = json.load(open(f'{OUT}/plan.json'))
rp = f'{OUT}/results.json'
results = json.load(open(rp)) if os.path.exists(rp) else {}
done = 0; t_start = time.time()
for slug in (sys.argv[1:] or list(plan)):
    for pg in plan[slug]:
        for op in pg['options']:
            key = f"{slug}/{pg['id']}/{op['id']}"
            if results.get(key, {}).get('ok'):
                continue
            d = f'{OUT}/{key}'; os.makedirs(d, exist_ok=True)
            code = RHAI.replace('__SLUG__', slug).replace('__PARAMS__', json.dumps(op['params'])).replace('__DIR__', d)
            t0 = time.time()
            try:
                r = mt.call('execute_code', {'code': code}, timeout=1800)
            except Exception as e:
                r = {'ok': False, 'error': f'client: {e}'}
            rec = {'slug': slug, 'page': pg['id'], 'opt': op['id'], 'params': op['params'], 'ok': False, 'wall': round(time.time() - t0, 2)}
            if not r.get('ok'):
                rec['error'] = r.get('error'); print('FAIL', key, rec['error'], flush=True); results[key] = rec; continue
            x = r['result']
            before = [fev(l) for l in x['lines']]
            after = [fev(l) for l in x['reimport'].split('\n') if l.startswith('#')]
            base = f"{d}/{slug}-{pg['id']}-{op['id']}"
            files = {}
            for ext in ['step', 'stl', '3mf', 'glb']:
                src = f'{d}/Monge.{ext}'
                if os.path.exists(src): os.replace(src, f'{base}.{ext}')
                if os.path.exists(f'{base}.{ext}'): files[ext] = os.path.getsize(f'{base}.{ext}')
            vol = sum(v for _, v, _ in before if v); rt = sum(v for _, v, _ in after if v)
            rec.update(name_monge=x['name'], secs=round(x['secs'], 3), bodies=len(x['bodies']), files=files,
                       kernel_ok=all(o for _, _, o in before) and len(before) == len(x['bodies']), fev=[f for f, _, _ in before],
                       volume_cm3=round(vol, 3), roundtrip_volume_cm3=round(rt, 3),
                       roundtrip_ok=len(after) == len(before) and all(o for _, _, o in after) and sorted(f for f, _, _ in after) == sorted(f for f, _, _ in before) and abs(rt - vol) <= max(0.1, 1e-3 * vol))
            rec['ok'] = rec['kernel_ok'] and rec['roundtrip_ok'] and len(files) == 4
            if not rec['ok']: print('BAD', key, rec['fev'], vol, rt, flush=True)
            results[key] = rec; done += 1
            if done % 25 == 0:
                json.dump(results, open(rp, 'w'), ensure_ascii=False)
                print(f'{done} done, {round(time.time() - t_start)} s', flush=True)
json.dump(results, open(rp, 'w'), ensure_ascii=False)
ok = sum(1 for v in results.values() if v.get('ok')); print(f'finished: {ok} of {len(results)} fine', flush=True)
