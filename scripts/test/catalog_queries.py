"""Real queries against the Monge Catalog API (local or production): each has what must come first, or not_found.
Usage: python3 scripts/test/catalog_queries.py https://dima-fomin.pl"""
import json, sys, urllib.parse, urllib.request
BASE = sys.argv[1].rstrip('/')
UA = {'User-Agent': 'monge-catalog-test/1.0'}
def get(path):
    with urllib.request.urlopen(urllib.request.Request(BASE + path, headers=UA), timeout=60) as r:
        return r.status, json.loads(r.read())
# (query or path, expected match, the first result's id — or a predicate on it)
CASES = [
    ('ISO 4017 M12x60 STEP', 'exact', 'bolt-iso-4017--m12-x-60--exact'),
    ('болт ISO 4017 M12 × 60 настоящая резьба', 'exact', 'bolt-iso-4017--m12-x-60--exact'),
    ('hex bolt M12-60 cosmetic thread', 'exact', 'bolt-iso-4017--m12-x-60--cosmetic'),
    ('śruba ISO4017 M12x60 gwint rzeczywisty', 'exact', 'bolt-iso-4017--m12-x-60--exact'),
    ('ISO 4017 M12x60 print STL', 'exact', 'bolt-iso-4017--m12-x-60--print'),
    ('печатный болт M10 STL', 'exact', lambda r: r['id'].startswith('bolt-iso-4017--m10-x-') and r['id'].endswith('--print')),
    ('гайка ISO 4032 M10', 'exact', 'nut-iso-4032--m10--exact'),
    ('nakrętka M10', 'exact', 'nut-iso-4032--m10--exact'),
    ('nut M24 3MF', 'exact', 'nut-iso-4032--m24--exact'),
    ('подшипник 6204 2RS', 'exact', 'bearing-iso-15--6204--2rs'),
    ('bearing 6204-2RS GLB', 'exact', 'bearing-iso-15--6204--2rs'),
    ('łożysko 6205 z kulkami', 'exact', 'bearing-iso-15--6205--open-balls'),
    ('6204', 'exact', 'bearing-iso-15--6204--2z'),
    ('винт ISO 4762 M8x30', 'exact', 'screw-iso-4762--m8-x-30--exact'),
    ('socket head cap screw M8 × 30', 'exact', 'screw-iso-4762--m8-x-30--exact'),
    ('śruba z łbem walcowym M8-30', 'exact', 'screw-iso-4762--m8-x-30--exact'),
    ('арматура 16', 'exact', lambda r: r['id'].startswith('rebar-en-10080--d16-')),
    ('rebar Ø16 300', 'exact', 'rebar-en-10080--d16-ribbed-300--std'),
    ('pręt zbrojeniowy 12 6000', 'exact', 'rebar-en-10080--d12-straight-6000--std'),
    ('шайба M12', 'exact', 'washer-iso-7089--m12--std'),
    ('washer ISO 7089 M16', 'exact', 'washer-iso-7089--m16--std'),
    ('KM4', 'exact', 'lock-nut-din-981--km4--exact'),
    ('lock nut KM6 real thread', 'not_found', lambda r: r['id'] == 'lock-nut-din-981--km6--cosmetic' and r.get('differs')),
    ('ISO 4017 M12x61', 'not_found', lambda r: r['id'].startswith('bolt-iso-4017--m12-') and r.get('differs')),
    ('ISO 4017 M13x60', 'not_found', None),
    ('bolt M2x10 print', 'not_found', lambda r: '--m2-x-10--' in r['id'] and 'print' not in r['id'] and r.get('differs')),
    ('подшипник 6999', 'not_found', None),
    ('bolted joint M12 x 25', 'exact', 'bolt-joint-iso-4017--m12-x-25--exact'),
    ('shaft', 'exact', lambda r: r['id'].startswith('shaft--')),
    ('/api/v1/models?standard=ISO%204017&size=M12&length=60&thread=exact&format=step', 'exact', 'bolt-iso-4017--m12-x-60--exact'),
    ('/api/v1/models?size=6204&category=bearing-iso-15', 'exact', 'bearing-iso-15--6204--2z'),
    ('/api/v1/models?q=M12x60&thread=print&format=step', 'not_found', lambda r: r.get('differs')),
]
ok = 0
for q, want, first in CASES:
    path = q if q.startswith('/') else '/api/v1/models?q=' + urllib.parse.quote(q) + '&limit=5'
    try:
        st, a = get(path)
    except Exception as e:
        print('ERR ', q, e); continue
    r0 = a['results'][0] if a['results'] else None
    good = a['match'] == want and (first is None or (r0 and (first(r0) if callable(first) else r0['id'] == first)))
    ok += bool(good)
    print('ok  ' if good else 'FAIL', f"{q[:60]:60} → {a['match']:9} {r0['id'] if r0 else '-':42} {('≠ ' + '; '.join(r0.get('differs', []))) if r0 and r0.get('differs') else ''}")
# one model in full, the files real, the HEAD of the STEP
st, m = get('/api/v1/models/bolt-iso-4017--m12-x-60--exact')
step = next(f for f in m['files'] if f['format'] == 'step')
req = urllib.request.Request(step['url'].replace('https://dima-fomin.pl', BASE), method='HEAD', headers=UA)
with urllib.request.urlopen(req, timeout=60) as r:
    head = dict(r.headers)
size_ok = int(head.get('Content-Length', head.get('content-length', -1))) == step['bytes']
print('ok  ' if size_ok else 'FAIL', 'HEAD STEP', step['url'].split('/')[-1], head.get('Content-Type') or head.get('content-type'), head.get('Content-Length') or head.get('content-length'), 'digest' if (head.get('Repr-Digest') or head.get('repr-digest')) else 'no digest')
ok += size_ok
print(f'\n{ok} of {len(CASES) + 1} passed')
