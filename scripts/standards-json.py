# Writes data/standards.json from a dump of the Monge standards registry (every table of geometry_engine::standards).
# Dump: in a Monge window run  `let all = parse_json(`{"a":${fastener_table("")}}`).a; ...`  (see README, «Таблицы стандартов»)
# and save the JSON array of fastener_table(id) for every id as <dir>/standards.json.
# Usage: python3 scripts/standards-json.py <dir with standards.json> data/standards.json
# Source links are cut to site names: links to copies of standard texts are never published.
import json, re, sys
W, OUT = sys.argv[1], sys.argv[2]
d = json.load(open(f'{W}/standards.json'))
fam = {
 'fasteners': ['ISO 261', 'ISO 261 fine', 'ISO 2306', 'ISO 273', 'ISO 7089', 'ISO 4017', 'ISO 4032', 'ISO 4762'],
 'bearings': ['ISO 15', 'DIN 5418', 'ISO 492', 'DIN 981', 'DIN 5406'],
 'shafts': ['ISO 286', 'DIN 471', 'DIN 509', 'DIN 6885'],
 'reinforcement': ['EN 10080', 'EN 10080 ribs', 'EN 1992-1-1 C.1', 'EN 1992-1-1 8.1N', 'EN 1992-1-1 8.5'],
}
used = {
 'washer-iso-7089': ['ISO 7089'], 'nut-iso-4032': ['ISO 4032', 'ISO 261'], 'bolt-iso-4017': ['ISO 4017', 'ISO 261'],
 'screw-iso-4762': ['ISO 4762', 'ISO 261'], 'bolt-joint-iso-4017': ['ISO 4017', 'ISO 7089', 'ISO 4032', 'ISO 273', 'ISO 261'],
 'bearing-iso-15': ['ISO 15', 'DIN 5418', 'ISO 492'], 'lock-nut-din-981': ['DIN 981', 'DIN 5406', 'ISO 261 fine'],
 'shaft': ['ISO 286', 'DIN 471', 'DIN 509', 'DIN 6885', 'ISO 261', 'ISO 261 fine'],
 'rebar-en-10080': ['EN 10080', 'EN 10080 ribs', 'EN 1992-1-1 C.1', 'EN 1992-1-1 8.1N', 'EN 1992-1-1 8.5'],
}
def slug(i): return re.sub(r'[^a-z0-9]+', '-', i.lower()).strip('-')
BAD = ('phd.eng.br', 'regbar.com', 'fpg-co.com', 'energiazero.org', 'law.resource.org', 'eclass.upatras.gr', 'cloudfront.net', 'mercateo.com', 'exvalos.cz', 'baa.vn', 'bdsbearing.com', 'nbk1560.com')
def clean(s):
    urls = re.findall(r'https?://[^\s)]+', s)
    t = re.sub(r'https?://[^\s)]+', '', s)
    t = re.sub(r'\(?[a-z0-9.-]+\.(com|pl|de|net|org|br) copy\)?', '', t)
    t = t.replace('a copy of ', '').replace('distributor copies, e.g. ', '').replace('(same PDF as DIN 981)', '(the same catalogue as DIN 981)')
    t = re.sub(r'\(\s*\)', '', t).replace('(and ISO_286_2*.html)', '').replace('(and _hole.pdf)', '')
    t = re.sub(r'\s*(·\s*)+$', '', t); t = re.sub(r'\s*·\s*·\s*', ' · ', t)
    t = re.sub(r'\s*[:,]\s*$', '', t.strip()).strip(); t = re.sub(r'\s{2,}', ' ', t)
    t = re.sub(r',?\s*as computed by$', '', t)
    doms = []
    for u in urls:
        x = re.sub(r'^www\.', '', u.split('/')[2])
        if not any(x.endswith(b) for b in BAD) and x not in doms: doms.append(x)
    dom = ', '.join(doms)
    if not t: return dom
    if not dom: return t
    if t.startswith('('): return f'{dom} {t}'
    if t.endswith(':'): return f'{t} {dom}'
    return f'{t} — {dom}'
out = []
for f, ids in fam.items():
    for i in ids:
        t = next(x for x in d if x['id'] == i)
        cols = list(t['columns'])
        if all('size' in r for r in t['rows']) and 'size' not in cols and 'name' not in cols:
            cols = ['size'] + [c for c in cols if c != 'd'] if i not in ('DIN 471',) else ['size'] + [c for c in cols if c != 'd1']
        if i == 'DIN 981' and 'metric' not in cols: cols.insert(1, 'metric'); cols = [c for c in cols if c not in ('d', 'pitch')]
        cols = [c for c in cols if c != 'l_from']
        rows = [{c: r.get(c) for c in cols} for r in t['rows']]
        out.append({'id': i, 'slug': slug(i), 'family': f, 'title': t['title'], 'edition': t['edition'], 'checked': t['checked'],
                    'columns': cols, 'rows': rows, 'sources': [clean(s) for s in t['sources']],
                    'usedBy': [k for k, v in used.items() if i in v]})
json.dump(out, open(OUT, 'w'), ensure_ascii=False, indent=1)
for s in out:
    print(s['id'], s['columns']); [print('    ', x) for x in s['sources']]
FIX = {
 '(Maryland Metrics)': 'Maryland Metrics',
 'classes: (steel); ISO 4032:2012 and IS 1364-3 tables (stainless) — amesweb.info': 'classes: amesweb.info (steel); ISO 4032:2012 and IS 1364-3 tables (stainless)',
 "the profile (15° to the axis, 8° to the face for F): · Heidenhain CNC PILOT 640, p. 617 — it gives the table's g within 0.05 — cad-markt.de": "the profile (15° to the axis, 8° to the face for F): cad-markt.de · Heidenhain CNC PILOT 640, p. 617 — it gives the table's g within 0.05",
}
for s in out: s['sources'] = [FIX.get(x, x) for x in s['sources']]
json.dump(out, open(OUT, 'w'), ensure_ascii=False, indent=1)
