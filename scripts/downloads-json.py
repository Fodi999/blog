"""Writes data/downloads.json from the export of the Monge library (results.json of the export run: every ready
configuration placed by the program, its body checked by the kernel, STEP read back, STL checked closed) and
prints the upload list. Only configurations that passed every check are published.
Usage: python3 scripts/downloads-json.py <export dir with results.json> data/downloads.json <version> <checked>"""
import json, sys
src, out, version, checked = sys.argv[1:5]
r = json.load(open(f'{src}/results.json'))

# names of the configurations in three languages (the program's are English)
WHOLE = {
 'exact thread': None,  # → «<size> · exact thread», see below
 'Drive shaft Ø24 × 111 (bearings k6, hub m6, keyways, ring groove)': ('Приводной вал Ø24 × 111 (подшипники k6, ступица m6, шпонки, канавка под кольцо)', 'Wał napędowy Ø24 × 111 (łożyska k6, piasta m6, wpusty, rowek pod pierścień)'),
 'Bearing shaft Ø42 × 90 (undercuts F, key 10 × 8)': ('Вал под подшипники Ø42 × 90 (канавки F, шпонка 10 × 8)', 'Wał łożyskowy Ø42 × 90 (podcięcia F, wpust 10 × 8)'),
 'Hinge axle Ø12 f7 × 60 (two ring grooves)': ('Ось шарнира Ø12 f7 × 60 (две канавки под кольца)', 'Oś zawiasu Ø12 f7 × 60 (dwa rowki pod pierścienie)'),
 'Stepped axle Ø20 h9 (undercut E)': ('Ступенчатая ось Ø20 h9 (канавка E)', 'Oś stopniowa Ø20 h9 (podcięcie E)'),
 'Stainless shaft Ø14 (js6 seats, key 5 × 5)': ('Вал из нержавейки Ø14 (посадки js6, шпонка 5 × 5)', 'Wał nierdzewny Ø14 (pasowania js6, wpust 5 × 5)'),
 'Shaft Ø50 for fatigue strength (undercut F R1.2 × 0.2)': ('Вал Ø50 на усталостную прочность (канавка F R1.2 × 0.2)', 'Wał Ø50 na wytrzymałość zmęczeniową (podcięcie F R1.2 × 0.2)'),
 'Shaft with a threaded end M16 (exact thread)': ('Вал с резьбовым концом M16 (настоящая резьба)', 'Wał z gwintowanym końcem M16 (gwint rzeczywisty)'),
 'Bearing shaft with a lock-nut thread M20 × 1 (KM4)': ('Вал под подшипник с резьбой под гайку M20 × 1 (KM4)', 'Wał łożyskowy z gwintem pod nakrętkę M20 × 1 (KM4)'),
}
WORDS = [  # (en, ru, pl), applied in order
 (', ribbed', ', с рёбрами', ', żebrowany'), ('straight', 'прямой', 'prosty'), ('link', 'хомут', 'strzemię'),
 ('washer under the head only', 'шайба только под головкой', 'podkładka tylko pod łbem'), ('fine hole', 'точное отверстие', 'otwór dokładny'),
 ('class', 'класс', 'klasa'), ('(thread over b)', '(резьба длиннее b)', '(gwint dłuższy niż b)'),
 ('with balls', 'с шариками', 'z kulkami'), ('open', 'открытый', 'otwarte'), ('(smallest)', '(наименьший)', '(najmniejsze)'),
 ('(largest)', '(наибольший)', '(największe)'), ('exact thread', 'настоящая резьба', 'gwint rzeczywisty'),
]
def names(rec):
    en = rec['name']; p = rec['params']
    if en == 'exact thread':
        size = p.get('size', '')
        if 'length' in p: size += f" × {p['length']:g}"
        if 'grip' in p: size += f" × {p['grip']:g}"
        en = f'{size} · exact thread'
    if en in WHOLE and WHOLE[en]:
        ru, pl = WHOLE[en]
    else:
        ru, pl = en, en
        for e, rr, pp in WORDS:
            ru = ru.replace(e, rr); pl = pl.replace(e, pp)
    return {'en': en, 'ru': ru, 'pl': pl}

data, upload, skipped = {}, [], []
for key, rec in r.items():
    fc = rec.get('file_checks', {})
    stl = fc.get('stl', {})
    # an assembly's bodies may touch (a nut's thread on the bolt's): its STL is closed (no open edges) but shares
    # edges between bodies — allowed for several bodies only
    stl_fine = stl.get('ok') or (rec.get('bodies', 0) > 1 and stl.get('open_edges') == 0)
    if not (rec.get('ok') and stl_fine and fc.get('3mf', {}).get('ok') and fc.get('glb', {}).get('ok')):
        skipped.append(key); continue
    files = {}
    for ext in ['step', 'stl', '3mf', 'glb']:
        k = f"downloads/{rec['slug']}/{rec['id']}/{rec['slug']}-{rec['id']}.{ext}"
        files[ext] = {'key': k, 'bytes': rec['files'][ext]}
        upload.append((f"{src}/{rec['slug']}/{rec['id']}/{rec['slug']}-{rec['id']}.{ext}", k))
    one_body = rec['bodies'] == 1
    data.setdefault(rec['slug'], {'checked': checked, 'version': version, 'configs': []})['configs'].append({
        'id': rec['id'], 'name': names(rec),
        'sizeMm': sorted((round(x, 1) for x in stl['size']), reverse=True),
        'massKg': round(stl['volume'] * 7850e-9, 4), 'bodies': rec['bodies'], 'files': files,
        # several bodies of an assembly touch (thread in thread): the closed-mesh test is per body, so it is shown for one
        'checks': {'kernel': rec['kernel_ok'], 'step': rec['roundtrip_ok'], 'stl': bool(stl['ok']) and one_body},
    })
json.dump(data, open(out, 'w'), ensure_ascii=False, indent=1)
open(f'{src}/upload.tsv', 'w').write(''.join(f'{a}\t{b}\n' for a, b in upload))
print(sum(len(v['configs']) for v in data.values()), 'configurations,', len(upload), 'files,', round(sum(rec_b for rec_b in (v2['bytes'] for v in data.values() for c in v['configs'] for v2 in c['files'].values())) / 1e6, 1), 'MB; skipped', skipped)
