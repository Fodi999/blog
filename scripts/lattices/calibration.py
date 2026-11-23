#!/usr/bin/env python3
"""The published samples the lattice rules are checked against (the user's rule 5) → data/lattice-calibration.json.

  python3 scripts/lattices/calibration.py VERIFIED.json FINDER_JOURNAL.jsonl

VERIFIED.json — the calibration workflow's result: 18 cases, each re-read at its source by a second agent
("confirmed" or "corrected" with the corrected case). FINDER_JOURNAL.jsonl — the finders' cases (a "confirmed" case
keeps the finder's fields). Each row below is ONE printed configuration of one case: the numbers are the source's
(Table/Figure in `where`); the kind, the profile and the direction are the mapping onto the library, said in the note
where it is not obvious. Nothing here is a verdict: the page computes Monge's verdict for each row with the same code
as the explorer.
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
verified = json.load(open(sys.argv[1]))
finder = {}
for line in open(sys.argv[2]):
    e = json.loads(line)
    r = e.get('result')
    if isinstance(r, dict) and 'cases' in r:
        for c in r['cases']:
            finder[c['id']] = c
cases = {}
for k in verified['kept']:
    cases[k['id']] = k.get('case') or finder[k['id']]
assert len(cases) == 18 and not verified['rejected'], (len(cases), len(verified['rejected']))

def src(cid):
    c = cases[cid]
    return {'source_title': c['source_title'], 'authors_year': c['authors_year'], 'source_url': c['source_url'], 'process': c['process']}

N = lambda en, ru, pl: {'en': en, 'ru': ru, 'pl': pl}
ROWS = []
def row(cid, n, *, material, machine, layer_um, kind, cell, wall=None, share=None, profile, outcome, words, where, note=None, named=None):
    ROWS.append({'id': f'{cid}#{n}', **src(cid), 'material': material, 'machine': machine, 'layer_um': layer_um,
                 'lattice_as_named': named or cases[cid]['lattice_as_named'], 'kind': kind, 'cell_mm': cell, 'wall_mm': wall,
                 'share': share, 'build': '[001]', 'profile': profile, 'outcome': outcome, 'outcome_words': words, 'where': where,
                 **({'note': note} if note else {})})

# ── PBF-LB/M, 316L: Acikgöz et al. 2026 — sheet gyroid, eight configurations (Table 1 target sheet thickness) ──
A = 'acikgoz2026-316l-gyroid-sheet-5-10mm-built'
AF = 'acikgoz2026-316l-gyroid-sheet-20mm-failed'
AT = 'acikgoz2026-316l-gyroid-sheet-90pct-thin-failed'
akw = dict(material='316L (SLM Solutions powder, 10–45 µm)', machine='TRUMPF TruPrint1000', layer_um=None, kind='gyroid', profile='lpbf_316l')
a_dir = N('The paper does not state the build direction of the cell axes: read as [001], the cube standing on the plate.',
          'Направление осей ячейки в работе не названо: взято [001] — кубик стоит на плите.',
          'Praca nie podaje kierunku osi komórki: przyjęto [001] — kostka stoi na płycie.')
row(A, 1, **akw, cell=5, wall=0.49, outcome='built', words='Successful prints at εt = 70% and ucs = 5 mm', where='Fig. 10, Table 1', note=a_dir)
row(A, 2, **akw, cell=5, wall=0.33, outcome='built', words='Successful prints at … εt = 80% and ucs = 5 mm', where='Fig. 10, Table 1')
row(A, 3, **akw, cell=10, wall=0.98, outcome='built', words='Successful prints at … εt = 70% and ucs = 10 mm', where='Fig. 10, Table 1')
row(A, 4, **akw, cell=10, wall=0.66, outcome='built', words='Successful prints at … εt = 80% and ucs = 10 mm', where='Fig. 10, Table 1')
a_reg = N('The failure is regional — breakage and local deformation, not a missing part.',
          'Неудача местная — поломки и коробление, а не отсутствие детали.',
          'Niepowodzenie miejscowe — pęknięcia i odkształcenia, a nie brak części.')
row(AF, 1, **akw, cell=20, wall=1.32, outcome='failed', words='at a unit cell size of 20 mm, the structures are no longer self-supporting, leading to breakage or the presence of damaged regions', where='Sect. 4.3; Figs. 9–10; Table 1', note=a_reg)
row(AF, 2, **akw, cell=20, wall=0.64, outcome='failed', words='Failed prints at εt = 80% and ucs = 20 mm and εt = 90% and ucs = 20 mm', where='Fig. 10; Fig. 9 marks it Incomplete/fragile; Table 1', note=a_reg)
row(AT, 1, **akw, cell=2, wall=0.064, outcome='failed', words='incomplete or fragile structures that fail during manufacturing, even if adapted parameters are used', where='Sect. 4.4; Figs. 2, 3, 9; Table 1')
row(AT, 2, **akw, cell=5, wall=0.16, outcome='failed', words='structures with εt = 90% fail at this scale', where='Sect. 4.4; Figs. 2, 3, 9; Table 1')

# ── PBF-LB/M, Ti-6Al-4V: Jahn et al. 2023 — sheet gyroid with thin walls, parameters developed for them ──
J = 'jahn2023-ti64-gyroid-sheet-0p1mm-built'
jkw = dict(material='Ti-6Al-4V Grade 23 (ECKART TLS, 20–53 µm)', machine='DMG MORI Lasertec 12 SLM', layer_um=30, kind='gyroid', profile='lpbf_ti64')
j_note = N('Process parameters developed for these thin walls — the paper’s aim; the cubes stood upright on supports.',
           'Режимы подобраны под эти тонкие стенки — это цель работы; кубики стояли вертикально на поддержках.',
           'Parametry dobrane do tych cienkich ścianek — to cel pracy; kostki stały pionowo na podporach.')
for i, (cell, wall) in enumerate([(1.0, 0.1), (1.8, 0.1), (1.4, 0.3), (2.2, 0.3)]):
    row(J, i + 1, **jkw, cell=cell, wall=wall, outcome='built', words='Small structures with unit cell size as small as 1.0 mm are fabricated on a laser powder bed fusion industrial machine.', where='Abstract; Table 1; Fig. 3', note=j_note if i == 0 else None)

# ── PBF-LB/M, 316L: Yang et al. 2020 — gyroid network, 4 mm cells, design relative density 15 % ──
Y = 'yang2020-316l-gyroid-net-4mm-dross'
row(Y, 1, material='316L (Praxair, D50 31 µm)', machine='Concept Laser M-lab cusing', layer_um=30, kind='gyroid_net', cell=4, share=0.15, profile='lpbf_316l',
    outcome='built_with_defects', words='The deviation maps do not indicate obvious defects or broken cells in the as-built GCS; bonded powder particles … at the upper inner wall of sphere-like pores with low inclination angles', where='Sect. 3; Tables 1–2',
    note=N('Built, with powder stuck to the flat ceilings of the pores — the downward-facing surface the page shows but does not judge.',
           'Напечатан; к пологим сводам пор прилип порошок — та нижняя поверхность, которую страница показывает, но не оценивает.',
           'Wydrukowana; do płaskich sklepień porów przywarł proszek — spodnia powierzchnia, którą strona pokazuje, ale nie ocenia.'))

# ── PBF-LB/M, 316L: Wits et al. 2025 — octet truss: thin struts failed, 0.7 mm built ──
WF = 'wits2025-316l-octet-thin-struts-failed'
WB = 'wits2025-316l-octet-built'
wkw = dict(material='316L', machine='Nikon SLM Solutions 280HL', layer_um=None, kind='octet', profile='lpbf_316l')
row(WF, 1, **wkw, cell=4, wall=0.3, outcome='failed', words='a strut diameter of 0.3 mm was too thin in all cases', where='Sect. 3')
row(WF, 2, **wkw, cell=8, wall=0.3, outcome='failed', words='a strut diameter of 0.3 mm was too thin in all cases', where='Sect. 3')
row(WF, 3, **wkw, cell=8, wall=0.5, outcome='failed', words='for a strut diameter of 0.5 mm only the smallest 4 mm unit cell size gives successful results', where='Sect. 3',
    note=N('The paper lists no cell sizes between 4 and 8 mm for this run: the 8 mm end is shown.',
           'Размеры ячеек между 4 и 8 мм для этого опыта в работе не перечислены: показан край 8 мм.',
           'Praca nie wymienia rozmiarów komórek między 4 a 8 mm dla tej próby: pokazano skraj 8 mm.'))
w_note = N('Built on support pillars; the octet cell has horizontal struts.',
           'Напечатан на опорных столбиках; в ячейке октета есть горизонтальные стержни.',
           'Wydrukowany na słupkach podporowych; komórka oktetu ma poziome pręty.')
for i, (cell, wall) in enumerate([(8, 0.7), (6, 0.7), (4, 0.7), (4, 0.5)]):
    words = 'for a strut diameter of 0.5mm only the smallest 4 mm unit cell size gives successful results' if wall == 0.5 else 'All fabricated samples are heavier compared to the nominal mass'
    row(WB, i + 1, **wkw, cell=cell, wall=wall, outcome='built', words=words, where=f'Sect. 3; Fig. 4 (Octet truss - {cell} – Ø{wall}); Tables 1–2', note=w_note if i == 0 else None)

# ── VPP (mSLA): Luthuli et al. 2026 (preprint) — sheet-network gyroid, resin trapped in the denser lattices ──
L20 = 'luthuli2026-msla-gyroid-5mm-20pct-resin-trapped'
L5 = 'luthuli2026-msla-gyroid-5mm-5pct-wall-peel-fail'
lkw = dict(material='eSun eResin-PLA Pro (PLA-PUA)', machine='Uniformation GK III Ultra (mSLA)', layer_um=25, kind='gyroid', profile='sla_resin')
l_note = N('Preprint, not peer-reviewed. The resin did not drain: the lattice set solid inside.',
           'Препринт, не рецензирован. Смола не вытекла: решётка внутри застыла сплошной.',
           'Preprint, bez recenzji. Żywica nie spłynęła: krata zastygła w środku w litą bryłę.')
row(L20, 1, **lkw, cell=5, share=0.20, outcome='powder_trapped', words='5-20 lattices did not produce open lattice structures. Although solid objects printed, the internal regions became homogeneous solids.', where='Sect. 3.1; Fig. 1a', note=l_note)
row(L20, 2, **lkw, cell=2, share=0.20, outcome='powder_trapped', words='produced solid blocks owing to resin entrapment', where='Sect. 3.1 — pilot prints of 2 mm cells, 20–30 % nominal')
row(L5, 1, **lkw, cell=5, wall=0.13, outcome='failed', words='5-5 lattices failed to print because the thin walls (nominally below ~130 µm) could not withstand the separation forces during layer lifting', where='Sect. 3.1 and Fig. 1',
    note=N('Walls under 0.13 mm — under the profile’s 0.2 mm; the passport starts at τ 0.03, so the page does not compare it.',
           'Стенки тоньше 0,13 мм — тоньше предела профиля 0,2 мм; паспорт начинается с τ 0,03, поэтому страница его не сравнивает.',
           'Ścianki cieńsze niż 0,13 mm — cieńsze niż limit profilu 0,2 mm; paszport zaczyna się od τ 0,03, więc strona go nie porównuje.'))

# ── PBF-LB/P (SLS): Kummert et al. 2021 — cubic struts in 2.5 mm cells, powder sealed in ──
K = 'kummert2021-sls-tpe-2p5mm-cells-sealed'
kkw = dict(material='EOS PrimePart ST (TPE-A, PEBA)', machine='EOSINT P395', layer_um=150, kind='cubic', profile='sls_polymer', named='cube (simple cubic struts), 2 × 2 × 2 cells')
k_note = N('The profile is for PA 12 class powders; this sample is a TPE (PEBA).',
           'Профиль — для порошков класса PA 12; этот образец — эластомер TPE (PEBA).',
           'Profil dotyczy proszków klasy PA 12; ta próbka to elastomer TPE (PEBA).')
row(K, 1, **kkw, cell=2.5, wall=1.0, outcome='powder_trapped', words='Powder not completly removable', where='Table 1 (Cube, 2.5 mm)', note=k_note)
row(K, 2, **kkw, cell=2.5, wall=1.5, outcome='powder_trapped', words='enclosed volumes', where='Table 1 (Cube, 2.5 mm)')
row(K, 3, **kkw, cell=2.5, wall=2.0, outcome='powder_trapped', words='regardless of the strut diameter a cell size of 2.5 mm cannot be produced, since actually free volumes remain sealed', where='Sect. 3; Table 1',
    note=N('τ = 0.8 is beyond the thickest cubic row (0.7): not compared.', 'τ = 0,8 — толще последней строки кубической (0,7): не сравнивается.', 'τ = 0,8 — grubiej niż ostatni wiersz sześciennej (0,7): nie porównano.'))

# ── not lattices of the library, or no profile: shown, not compared ──
def other(cid, *, material, machine, layer_um, cell, wall, outcome, words, where, note, kind=None):
    row(cid, 1, material=material, machine=machine, layer_um=layer_um, kind=kind, cell=cell, wall=wall, profile=None, outcome=outcome, words=words, where=where, note=note)
other('evsevleev2021-ti64-ebm-gyroid-sheet-powder', material='Ti-6Al-4V (Arcam powder)', machine='Arcam A2 (electron beam)', layer_um=50, cell=None, wall=0.4, kind='gyroid',
      outcome='powder_trapped', words='the efficiency of the powder removal process is only satisfactory for pore sizes up to 1.6 mm', where='Sect. 3',
      note=N('Electron beam melting — no profile for it here; the paper gives no cell size in mm.', 'Электронный луч — профиля для него здесь нет; размера ячейки в мм в работе нет.', 'Wiązka elektronów — brak tu dla niej profilu; praca nie podaje rozmiaru komórki w mm.'))
other('jing2021-ti64-horizontal-rod-10mm-span', material='Ti-6Al-4V (EOS powder)', machine='EOSINT M 280', layer_um=30, cell=None, wall=0.5,
      outcome='failed', words='the rod element in the horizontal direction could not be formed when the rod was thin (0.50–1.00 mm)', where='Sect. 3; Fig. 1a',
      note=N('A horizontal rod between rods 10 mm apart, not a lattice of the library: the profile’s bridge limit (2 mm) would put it outside — as the print did.', 'Горизонтальный стержень между стойками в 10 мм, не решётка библиотеки: по пределу моста профиля (2 мм) он вне — как и вышло.', 'Poziomy pręt między słupkami odległymi o 10 mm, nie krata biblioteki: według limitu mostu profilu (2 mm) jest poza — jak w wydruku.'))
other('wits2025-316l-singletrack-bridge-8mm', material='316L', machine='SLM Solutions 280HL', layer_um=50, cell=None, wall=None,
      outcome='failed', words='For an overhang distance of 8 mm, none of the laser power-scan speed combinations led to the formation of a completely solidified overhang', where='Sect. 3; Fig. 3',
      note=N('Single-track bridges between pillars, not a lattice of the library: 8 mm is beyond the profile’s 2 mm bridge — outside, as the print.', 'Мостики в одну дорожку между столбиками, не решётка библиотеки: 8 мм больше моста профиля 2 мм — вне, как и вышло.', 'Mostki z jednej ścieżki między słupkami, nie krata biblioteki: 8 mm to więcej niż most profilu 2 mm — poza, jak w wydruku.'))
other('arputharaj2024-ti64-strut-10deg-cw', material='Ti-6Al-4V (TLS Technik powder)', machine='3D Systems ProX 200 DMP', layer_um=30, cell=None, wall=0.3,
      outcome='built_with_defects', words='CW L-PBF failed to reproduce the designed angles especially at lower inclinations, even for thicker struts', where='Sect. 3.1; Figs. 7–8',
      note=N('Single struts at 10°, not a lattice of the library: far below the profile’s 45° strut angle — they built, but not at the designed angle.', 'Одиночные стержни под 10°, не решётка библиотеки: намного положе угла стержня профиля 45° — вышли, но не под заданным углом.', 'Pojedyncze pręty pod 10°, nie krata biblioteki: znacznie poniżej kąta pręta profilu 45° — wyszły, ale nie pod zadanym kątem.'))
other('santorinaios2006-316l-braced-cubic-5mm', material='316L (Sandvik Osprey powder)', machine='', layer_um=50, cell=5, wall=None,
      outcome='built_with_defects', words="A 5mm cell size was also considered, but this proved to be problematic to make. The struts tended to 'sag' during build", where='Sect. 2; Table 1',
      note=N('Vertical struts with diagonal bracing and no horizontal members — not a lattice of the library.', 'Вертикальные стержни с диагональными связями, без горизонтальных — не решётка библиотеки.', 'Pionowe pręty z ukośnymi stężeniami, bez poziomych — nie krata biblioteki.'))
other('raz2025-mjf-pa12-bcc-5mm-depowder-depth', material='PA12', machine='HP MJF 4200', layer_um=None, cell=5, wall=2.66,
      outcome='powder_trapped', words='high-density structures (ρ = 0.39–0.47) were limited to only 1.5–1.7 layers', where='Sect. 3; Figs. 10–11',
      note=N('BCC with cube-edge bars inside solid walls with vents — not a lattice of the library; powder came out only 1.5–1.7 cell layers deep.', 'ОЦК с рёбрами куба внутри сплошных стенок с отверстиями — не решётка библиотеки; порошок вышел лишь на 1,5–1,7 слоя ячеек.', 'BCC z krawędziami sześcianu w litych ściankach z otworami — nie krata biblioteki; proszek wyszedł tylko na głębokość 1,5–1,7 warstwy komórek.'))
other('guerrasilva2021-fff-pla-cvc-0p7mm-failed', material='PLA', machine='Creality Ender 3', layer_um=160, cell=5, wall=0.7,
      outcome='failed', words='the structure became too unstable after the second row of cells to support new layers … and the printing failed', where='Sects. 3.2, 4.1; Table 5',
      note=N('A cube-vertex-centroid lattice — not a lattice of the library.', 'Решётка «вершины куба — центр» — не решётка библиотеки.', 'Krata „wierzchołki sześcianu — środek” — nie krata biblioteki.'))
other('parodo2025-fdm-abs-bcc-5mm-struts-broke', material='ABS', machine='Stratasys F190 CR', layer_um=127, cell=5, wall=0.4,
      outcome='failed', words='The small size of these cells led to fragile struts that frequently fractured during or immediately after the printing process', where='Sect. 3.1; Fig. 3',
      note=N('BCC with cube-edge struts, single cells — not a lattice of the library.', 'ОЦК с рёбрами куба, одиночные ячейки — не решётка библиотеки.', 'BCC z krawędziami sześcianu, pojedyncze komórki — nie krata biblioteki.'))

used = {r['id'].split('#')[0] for r in ROWS}
assert used == set(cases), set(cases) ^ used
from collections import Counter
_v = Counter(k['verdict'] for k in verified['kept'])
corrected, confirmed = _v['corrected'], _v['confirmed']
json.dump({
    'made': '2026-11-23',
    'method': f'18 published cases found by three searches (metal TPMS, metal struts, polymer) and each re-read at its source by a second, adversarial reader ({corrected} corrected, {confirmed} confirmed, 0 rejected); one row per printed configuration; numbers as the sources give them.',
    'cases': ROWS,
}, open(os.path.join(ROOT, 'data', 'lattice-calibration.json'), 'w'), ensure_ascii=False, indent=1)
print(len(ROWS), 'rows from', len(used), 'cases')
