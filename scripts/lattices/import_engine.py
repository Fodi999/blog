#!/usr/bin/env python3
"""Bring the lattice library's data from Monge's kernel to the site (real data, not demo).

  python3 scripts/lattices/import_engine.py PASSPORTS.json PROFILES.json

PASSPORTS.json — `cargo run --release -p geometry_engine --example lattice_passports -- PASSPORTS.json` (the cell passports
of the twelve kinds at a ladder of walls); PROFILES.json — `cargo run -p geometry_engine --example print_profiles_json`
(the table of print processes, every limit with its source, material and conditions). Writes data/lattices.json and
data/print-profiles.json in the contract of lib/lattices.ts. The names of the kinds and the profiles' titles and notes in
Russian and Polish live here; every number comes from the kernel's files unchanged.
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
passports, profiles = json.load(open(sys.argv[1])), json.load(open(sys.argv[2]))

NAMES = {
    'gyroid': ('Gyroid', 'Gyroid', 'Гироид'),
    'diamond': ('Diamond (Schwarz D)', 'Diament (Schwarz D)', 'Алмаз (Шварц D)'),
    'schwarz_p': ('Schwarz P', 'Schwarz P', 'Шварц P'),
    'iwp': ('Schoen I-WP', 'Schoen I-WP', 'I-WP (Шён)'),
    'neovius': ('Neovius', 'Neovius', 'Неовиус'),
    'gyroid_net': ('Gyroid network', 'Gyroid szkieletowy', 'Гироид сетчатый'),
    'diamond_net': ('Diamond network', 'Diament szkieletowy', 'Алмаз сетчатый'),
    'cubic': ('Cubic', 'Sześcienna', 'Кубическая'),
    'bcc': ('BCC (body-centred)', 'BCC (przestrzennie centrowana)', 'ОЦК (BCC)'),
    'fcc': ('FCC (face-centred)', 'FCC (ściennie centrowana)', 'ГЦК (FCC)'),
    'octet': ('Octet truss', 'Oktet', 'Октет'),
    'kelvin': ('Kelvin cell', 'Komórka Kelvina', 'Ячейка Кельвина'),
}

kinds = []
for k in passports['kinds']:
    en, pl, ru = NAMES[k['kind']]
    rows = []
    for r in k['rows']:
        rows.append({
            'tau': r['tau'], 'share': r['share'], 'voids': r['voids'], 'pieces': r['pieces'], 'channels': r['channels'],
            'channel': r['channel'], 'ligament': r['ligament'], 'area': r['area'],
            'builds': [{'name': b['name'], 'min_slope': b['min_slope'], 'below': b['below'], 'reach': b['reach'], 'starts': b['starts']} for b in r['builds']],
        })
    assert all(len(r['builds']) == 3 and all(len(b['reach']) == len(passports['layers']) for b in r['builds']) for r in rows), k['kind']
    kinds.append({'kind': k['kind'], 'family': k['family'], 'names': {'en': en, 'pl': pl, 'ru': ru}, 'wall_meaning': k['wall_meaning'],
                  'tau_min': k['tau_min'], 'tau_max': k['tau_max'], 'rows': rows})
assert len(kinds) == 12 or os.environ.get('PARTIAL'), f'{len(kinds)} kinds (PARTIAL=1 to import what there is)'
json.dump({
    'demo': False,
    'generated': '2026-11-23',
    'monge': '0.15.198 (development build)',
    'made_by': passports['made_by'],
    'nodes_per_cell': passports['nodes_per_cell'],
    'layers': passports['layers'], 'slice': passports['slice'], 'pixels': passports['pixels'],
    'note': 'Computed by the Monge kernel, geometry_engine::sdf::passport: one periodic cell of each kind at each wall; '
            'lengths in cells. The reach is per layer (layer / cell) — the farthest the material a layer adds over nothing '
            'lies from the material of the layer under it, read on the field in slices (not on a mesh). Nominal geometry.',
    'kinds': kinds,
}, open(os.path.join(ROOT, 'data', 'lattices.json'), 'w'), ensure_ascii=False, indent=1)

UNIT = {'°': 'deg', 'mm': 'mm', 'per cavity': 'count'}
MATERIAL = {'lpbf_metal': None, 'lpbf_316l': '316L', 'lpbf_ti64': 'Ti-6Al-4V', 'lpbf_alsi10mg': 'AlSi10Mg', 'sla_resin': None, 'sls_polymer': 'PA 12', 'fdm': None}
TITLE = {
    'lpbf_metal': ('Metal, laser powder bed fusion — any alloy', 'Metal, laserowe stapianie w złożu proszku — dowolny stop', 'Металл, лазерное сплавление в слое порошка — любой сплав'),
    'lpbf_316l': ('Metal, laser powder bed fusion — stainless steel 316L', 'Metal, laserowe stapianie w złożu proszku — stal nierdzewna 316L', 'Металл, лазерное сплавление в слое порошка — нержавеющая сталь 316L'),
    'lpbf_ti64': ('Metal, laser powder bed fusion — titanium Ti-6Al-4V', 'Metal, laserowe stapianie w złożu proszku — tytan Ti-6Al-4V', 'Металл, лазерное сплавление в слое порошка — титан Ti-6Al-4V'),
    'lpbf_alsi10mg': ('Metal, laser powder bed fusion — aluminium AlSi10Mg', 'Metal, laserowe stapianie w złożu proszku — aluminium AlSi10Mg', 'Металл, лазерное сплавление в слое порошка — алюминий AlSi10Mg'),
    'sla_resin': ('Resin — SLA, MSLA and DLP', 'Żywica — SLA, MSLA i DLP', 'Фотополимер — SLA, MSLA и DLP'),
    'sls_polymer': ('Polymer powder — SLS and Multi Jet Fusion', 'Proszek polimerowy — SLS i Multi Jet Fusion', 'Полимерный порошок — SLS и Multi Jet Fusion'),
    'fdm': ('Filament — FDM, 0.4 mm nozzle', 'Filament — FDM, dysza 0,4 mm', 'Пруток — FDM, сопло 0,4 мм'),
}
NOTE = {  # (pl, ru); en is the kernel's own note
    'lpbf_metal': ('Laserowe stapianie dowolnego metalu (SLM, DMLS, DMP), warstwa 30 µm, gdy stop nie ma własnego profilu. Proszek pozostawiony w środku spieka się podczas wyżarzania odprężającego (Protolabs): usuwa się go przed obróbką cieplną (3D Systems).',
                   'Лазерное сплавление любого металла (SLM, DMLS, DMP), слой 30 мкм, если у сплава нет своего профиля. Порошок, оставшийся внутри, спекается при отжиге для снятия напряжений (Protolabs): его удаляют до термообработки (3D Systems).'),
    'lpbf_316l': ('Stal nierdzewna 316L. Własne granice: kąt powierzchni i kąt pręta (Protolabs, oba 55°) oraz ścianka (Lammers 2018, pomiar); pozostałe — jak dla „dowolnego stopu”.',
                  'Нержавеющая сталь 316L. Свои пределы: угол поверхности и угол стержня (Protolabs, оба 55°) и стенка (Lammers 2018, измерено); остальные — как у «любого сплава».'),
    'lpbf_ti64': ('Tytan Ti-6Al-4V. Własne granice: kąt (Materialise, tytan) i ścianka (karta procesu EOS); pozostałe — jak dla „dowolnego stopu”.',
                  'Титан Ti-6Al-4V. Свои пределы: угол (Materialise, титан) и стенка (паспорт процесса EOS); остальные — как у «любого сплава».'),
    'lpbf_alsi10mg': ('Aluminium AlSi10Mg. Własne granice: ścianka i warstwa (karta procesu EOS) oraz pręt (najmniejszy element Protolabs dla aluminium); pozostałe — jak dla „dowolnego stopu”. 3D Systems łączy aluminium ze stalą (50–55°) na stronie o orientacji, a z tytanem w tabeli podpór — zob. inne źródła kąta. Ścianka szczelna dla cieczy wymaga co najmniej 1,0 mm (Fraunhofer).',
                      'Алюминий AlSi10Mg. Свои пределы: стенка и слой (паспорт процесса EOS) и стержень (наименьший элемент Protolabs для алюминия); остальные — как у «любого сплава». 3D Systems ставит алюминий рядом со сталью (50–55°) на странице об ориентации и рядом с титаном в таблице поддержек — см. другие источники угла. Стенке, непроницаемой для жидкости, нужно не меньше 1,0 мм (Fraunhofer).'),
    'sla_resin': ('Fotopolimeryzacja w kadzi: laserowa SLA (Formlabs), MSLA (Prusa), DLP i DLS (Carbon); każda granica ma własne źródło. Otwory odpływowe — jak najbliżej platformy, przeciw przysysaniu (Formlabs, Carbon). Wydrążona powłoka — co najmniej 2 mm (Hubs); PrusaSlicer nie drąży cieniej niż 1 mm.',
                  'Фотополимеризация в ванне: лазерная SLA (Formlabs), MSLA (Prusa), DLP и DLS (Carbon); у каждого предела свой источник. Отверстия для слива — как можно ближе к платформе, против присасывания (Formlabs, Carbon). Полая оболочка — не тоньше 2 мм (Hubs); PrusaSlicer не делает стенку полости тоньше 1 мм.'),
    'sls_polymer': ('Proszek polimerowy: spiekanie laserowe i HP Multi Jet Fusion, klasa PA 12. Proszek podtrzymuje część: bez podpór i bez granic nawisów (Protolabs: most i kąt dla krat SLS i MJF — „n/a”; 20° w HP dla dużych powierzchni skierowanych w górę — tylko przeciw widocznym schodkom). HP dopuszcza pozostawienie proszku w pustej części; ścianki części pustej — co najmniej 2 mm (HP).',
                    'Полимерный порошок: лазерное спекание и HP Multi Jet Fusion, класс PA 12. Порошок держит деталь: поддержек нет, пределов нависания нет (Protolabs: мост и угол для решёток SLS и MJF — «n/a»; 20° у HP для больших поверхностей, смотрящих вверх, — только против видимых ступенек). HP допускает оставить порошок внутри полой детали; стенки полой детали — не меньше 2 мм (HP).'),
    'fdm': ('Wytłaczanie filamentu (FDM, FFF) dyszą 0,4 mm; granica związana z dyszą — dla 0,4 mm. W zamkniętej pustce jest tylko powietrze: brak granic dla kanałów i otworów. Nie znaleziono źródła dla kąta pręta, poziomej półki i średnicy pręta w FDM — tych granic nie ma.',
            'Экструзия прутка (FDM, FFF) соплом 0,4 мм; предел, привязанный к соплу, — для 0,4 мм. В закрытой пустоте только воздух: пределов для каналов и отверстий нет. Источника для угла стержня, горизонтальной полки и диаметра стержня в FDM не нашлось — этих пределов нет.'),
}
SUPPORTS_SOURCE = {
    'sls_polymer': {
        'title': 'Protolabs — Using lattice structures in 3D printing (design tip)',
        'url': 'https://www.protolabs.com/resources/design-tips/using-lattice-structures-in-3d-printing-for-strength-and-lightweighting/',
        'basis': 'Service-bureau recommendation, self-supporting features table: SLS and MJF lattices — “Max Bridge” and “Min Angle” n/a.',
    },
}
out = []
for p in profiles['profiles']:
    en, pl, ru = TITLE[p['id']]
    npl, nru = NOTE[p['id']]
    item = {
        'id': p['id'], 'title': {'en': en, 'pl': pl, 'ru': ru}, 'process': p['process'], 'material': MATERIAL[p['id']],
        'supports': p['supports'], 'trapped': p['trapped'], 'checked': p['checked'],
        'limits': [{'key': l['key'], 'value': l['value'], 'unit': UNIT[l['unit']], 'source_title': l['title'], 'source_url': l['source'],
                    'material': l['material'], 'conditions': l['conditions'], 'basis': l['basis'], 'range': l['range']} for l in p['limits']],
        'note': {'en': p['note'], 'pl': npl, 'ru': nru},
    }
    if p['id'] in SUPPORTS_SOURCE:
        item['supports_source'] = SUPPORTS_SOURCE[p['id']]
    out.append(item)
json.dump({
    'demo': False,
    'verified': all(p['checked'] for p in profiles['profiles']),
    'checked': sorted({p['checked'] for p in profiles['profiles'] if p['checked']}),
    'made_by': profiles['made_by'],
    'note': "The print-process table of the Monge kernel (geometry_engine::print_profiles): every limit is one named source's number, quoted, with the material and the conditions it holds for; each row's number was found in its source on the day its basis names.",
    'profiles': out,
}, open(os.path.join(ROOT, 'data', 'print-profiles.json'), 'w'), ensure_ascii=False, indent=1)
print('kinds', len(kinds), 'rows', sum(len(k['rows']) for k in kinds), '· profiles', len(out), 'limits', sum(len(p['limits']) for p in out))
