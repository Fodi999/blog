"""The full range of the library to export: one PAGE per size (its own address on the site), OPTIONS on it that
change the geometry (thread cosmetic / real, a bearing's seals and balls). Material and property class do not change
the geometry — they get no files of their own. Writes <MONGE_EXPORT>/plan.json.
Usage: MONGE_EXPORT=<dir> python3 scripts/monge/plan_library.py <standards.json of the site> <templates dir>"""
import json, os, re, sys
OUT = os.environ.get('MONGE_EXPORT', '/tmp/monge-export')
std = {t['id']: t for t in json.load(open(sys.argv[1]))}
TPL = sys.argv[2]
def L(ru, pl, en): return {'ru': ru, 'pl': pl, 'en': en}
def sid(s): return re.sub(r'[^a-z0-9]+', '-', s.lower().replace('.', '_').replace('×', 'x').replace('ø', 'd')).strip('-')
def num(x): return f'{x:g}'
THREAD = [('cosmetic', L('условная резьба', 'gwint umowny', 'cosmetic thread'), {'threads': 'cosmetic'}),
          ('exact', L('настоящая резьба', 'gwint rzeczywisty', 'real thread'), {'threads': 'exact'})]
plan = {}
def page(slug, pid, group, label, params, options, row=None, std_id=None):
    plan.setdefault(slug, []).append({'id': pid, 'group': group, 'label': label, 'params': params, 'options': [
        {'id': o[0], 'label': o[1], 'params': {**params, **o[2]}} for o in options], 'row': row, 'std': std_id})
ONE = [('std', L('', '', ''), {})]

for slug, sid_ in [('bolt-iso-4017', 'ISO 4017'), ('screw-iso-4762', 'ISO 4762')]:
    for r in std[sid_]['rows']:
        for l in r.get('lengths') or []:
            size = r['size'].replace('(', '').replace(')', '')
            page(slug, f"{sid(size)}-x-{num(l).replace('.', '_')}", r['size'], f"{r['size']} × {num(l)}", {'size': r['size'], 'length': float(l)}, THREAD, r['size'], sid_)
for r in std['ISO 4032']['rows']:
    page('nut-iso-4032', sid(r['size'].replace('(', '').replace(')', '')), r['size'], r['size'], {'size': r['size']}, THREAD, r['size'], 'ISO 4032')
for r in std['ISO 7089']['rows']:
    page('washer-iso-7089', sid(r['size'].replace('(', '').replace(')', '')), r['size'], r['size'], {'size': r['size']}, ONE, r['size'], 'ISO 7089')
for r in std['DIN 981']['rows']:
    page('lock-nut-din-981', sid(r['name']), r['name'], f"{r['name']} ({r['metric'].replace('x', ' × ')})", {'size': r['name']}, THREAD, r['name'], 'DIN 981')
BEAR = [('2z', L('2Z, защитные шайбы', '2Z, blaszki ochronne', '2Z, shields'), {'seals': '2Z'}),
        ('2rs', L('2RS, уплотнения', '2RS, uszczelnienia', '2RS, seals'), {'seals': '2RS'}),
        ('open', L('открытый', 'otwarte', 'open'), {'seals': 'open'}),
        ('open-balls', L('открытый, кольца и шарики', 'otwarte, pierścienie i kulki', 'open, rings and balls'), {'seals': 'open', 'detail': 'balls'})]
for r in std['ISO 15']['rows']:
    page('bearing-iso-15', r['name'], L(f"серия {r['name'][:2]}", f"seria {r['name'][:2]}", f"series {r['name'][:2]}"), r['name'], {'name': r['name']}, BEAR, r['name'], 'ISO 15')
for r in std['EN 10080']['rows']:
    d = num(r['d']); g = f'Ø{d}'
    if r.get('fabric_only'):
        continue
    page('rebar-en-10080', f'd{d}-straight-6000', g, L(f'{g} · прямой 6000', f'{g} · prosty 6000', f'{g} · straight 6000'), {'d': d, 'shape': 'straight', 'l': 6000.0}, ONE, d, 'EN 10080')
    page('rebar-en-10080', f'd{d}-straight-12000', g, L(f'{g} · прямой 12000', f'{g} · prosty 12000', f'{g} · straight 12000'), {'d': d, 'shape': 'straight', 'l': 12000.0}, ONE, d, 'EN 10080')
    page('rebar-en-10080', f'd{d}-ribbed-300', g, L(f'{g} · с рёбрами, 300', f'{g} · żebrowany, 300', f'{g} · ribbed, 300'), {'d': d, 'shape': 'straight', 'l': 300.0, 'ribs': 'exact'}, ONE, d, 'EN 10080')
# shapes of the ready configurations (L, U, links) stay as they are
for c in json.load(open(f'{TPL}/rebar-en-10080/meta.json'))['configs']:
    p = c['params']
    if p.get('shape') in ('L', 'U', 'link'):
        d = p['d']; g = f'Ø{d}'
        dims = ' × '.join(num(p[k]) for k in ('a', 'b', 'c') if k in p)
        shape = {'L': ('Г', 'L', 'L'), 'U': ('П', 'U', 'U'), 'link': ('хомут', 'strzemię', 'link')}[p['shape']]
        page('rebar-en-10080', sid(f"d{d}-{p['shape']}-{dims}"), g, L(f'{g} · {shape[0]} {dims}', f'{g} · {shape[1]} {dims}', f'{g} · {shape[2]} {dims}'), p, ONE, d, 'EN 10080')
for c in json.load(open(f'{TPL}/bolt-joint-iso-4017/meta.json'))['configs']:
    p = c['params']
    if any(k in p for k in ('class', 'material', 'threads')):
        continue  # same geometry as its size / the real thread is an option of every size
    extra = {'washers': L('шайба только под головкой', 'podkładka tylko pod łbem', 'washer under the head only'), 'fit': L('точное отверстие', 'otwór dokładny', 'fine hole')}
    key = next((k for k in extra if k in p), None)
    name = f"{p['size']} × {num(p['grip'])}"
    label = L(*(f'{name} · {extra[key][x]}' if key else name for x in ('ru', 'pl', 'en')))
    page('bolt-joint-iso-4017', sid(name + (f' {key}' if key else '')), p['size'], label, p, THREAD if not key else [THREAD[0]], p['size'], 'ISO 4017')
for c in json.load(open(f'{TPL}/shaft/meta.json'))['configs']:
    page('shaft', '-'.join(sid(c['name']).split('-')[:6]), '', c['name'], c['params'], ONE)
os.makedirs(OUT, exist_ok=True)
json.dump(plan, open(f'{OUT}/plan.json', 'w'), ensure_ascii=False, indent=1)
n_pages = sum(len(v) for v in plan.values()); n_opts = sum(len(p['options']) for v in plan.values() for p in v)
print(n_pages, 'pages,', n_opts, 'geometries'); [print(' ', k, len(v), sum(len(p['options']) for p in v)) for k, v in plan.items()]
for k, v in plan.items():
    ids = [p['id'] for p in v]; assert len(ids) == len(set(ids)), k
