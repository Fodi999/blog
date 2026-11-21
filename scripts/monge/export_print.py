"""The 3D-printing option of the threaded parts (bolts ISO 4017, screws ISO 4762, nuts ISO 4032): the real thread with
the print allowance (threads: "print", 0.15 mm), laid on the bed the way it prints best — Monge's print check
(FDM: nozzle 0.4 → wall 0.8 mm, layer 0.2 mm, overhangs steeper than 45° or reaching past 3 mm need support) is run
for each way up the part can lie and the best is taken: no support needed, else the least overhang. Written as STL,
3MF (Z up) and GLB, with the print report. Adds the option «print» to plan.json; results into results.json.
Usage: MONGE_EXPORT=<dir> python3 scripts/monge/export_print.py [slug ...]"""
import json, os, re, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mt
OUT = os.environ.get('MONGE_EXPORT', '/tmp/monge-export')
UPS = {'bolt-iso-4017': ['-y', 'y'], 'screw-iso-4762': ['-y', 'y'], 'nut-iso-4032': ['y']}
LABEL = {'ru': 'для 3D-печати', 'pl': 'do druku 3D', 'en': 'for 3D printing'}
RHAI = r'''
let fdm = |up| #{ up: up, angle: 45.0, reach: 3.0, layer: 0.2, wall: 0.8, show: false };
let res = #{};
let r = doc.place("__SLUG__", parse_json(`__PARAMS__`), #{ at: [0.0, 0.0, 0.0] });
let b = r.bodies[0];
res.name = r.name;
let best = (); let best_up = ""; let best_score = 1e12;
for up in __UPS__ {
  let c = doc.print_check(b, fdm.call(up));
  let score = if c.ok { 0.0 } else { 1.0 + c.overhang.outside.over_mm2 + c.overhang.inside.over_mm2 + c.wall.thin_mm2 * 0.001 };
  if score < best_score { best_score = score; best = c; best_up = up; }
}
res.up = best_up; res.check = best;
if best_up == "-y" { doc.rotate_body(b, "x", 180.0); }
let line = "";
for l in doc.summary().split("\n") { if l.starts_with(`#${b} `) { line = l; } }
res.line = line;
res.files = doc.export_models([], ["stl", "3mf", "glb"], false, "__DIR__");
for x in r.bodies { doc.delete_body(x); }
res
'''
plan = json.load(open(f'{OUT}/plan.json'))
rp = f'{OUT}/results.json'
results = json.load(open(rp))
done = 0; t0 = time.time()
for slug in (sys.argv[1:] or list(UPS)):
    for pg in plan[slug]:
        if not any(o['id'] == 'print' for o in pg['options']):
            pg['options'].append({'id': 'print', 'label': LABEL, 'params': {**pg['params'], 'threads': 'print'}})
        op = next(o for o in pg['options'] if o['id'] == 'print')
        key = f"{slug}/{pg['id']}/print"
        if results.get(key, {}).get('ok'):
            continue
        d = f'{OUT}/{key}'; os.makedirs(d, exist_ok=True)
        code = RHAI.replace('__SLUG__', slug).replace('__PARAMS__', json.dumps(op['params'])).replace('__DIR__', d).replace('__UPS__', json.dumps(UPS[slug]))
        try:
            r = mt.call('execute_code', {'code': code}, timeout=1800)
        except Exception as e:
            r = {'ok': False, 'error': f'client: {e}'}
        rec = {'slug': slug, 'page': pg['id'], 'opt': 'print', 'params': op['params'], 'ok': False}
        if not r.get('ok'):
            rec['error'] = r.get('error'); print('FAIL', key, str(rec['error'])[:200], flush=True); results[key] = rec; continue
        x = r['result']
        base = f"{d}/{slug}-{pg['id']}-print"; files = {}
        for ext in ['stl', '3mf', 'glb']:
            src = f'{d}/Monge.{ext}'
            if os.path.exists(src): os.replace(src, f'{base}.{ext}')
            if os.path.exists(f'{base}.{ext}'): files[ext] = os.path.getsize(f'{base}.{ext}')
        c = x['check']
        rec.update(name_monge=x['name'], bodies=1, files=files, kernel_ok='· OK ·' in x['line'], roundtrip_ok=None,
                   up=x['up'], print={'ok': c['ok'], 'problems': c['problems'], 'wall_min': c['wall']['min_mm'],
                                      'reach_max': c['overhang']['outside']['reach_max_mm'], 'over_mm2': c['overhang']['outside']['over_mm2'] + c['overhang']['inside']['over_mm2']})
        rec['ok'] = rec['kernel_ok'] and len(files) == 3
        if not rec['ok']: print('BAD', key, x['line'][:160], flush=True)
        results[key] = rec; done += 1
        if done % 25 == 0:
            json.dump(results, open(rp, 'w'), ensure_ascii=False); json.dump(plan, open(f'{OUT}/plan.json', 'w'), ensure_ascii=False, indent=1)
            print(f'{done} done, {round(time.time() - t0)} s', flush=True)
json.dump(results, open(rp, 'w'), ensure_ascii=False); json.dump(plan, open(f'{OUT}/plan.json', 'w'), ensure_ascii=False, indent=1)
print('finished', sum(1 for k, v in results.items() if k.endswith('/print') and v.get('ok')), 'print options fine', flush=True)
