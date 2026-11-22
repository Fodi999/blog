# Monge CAD — review test scenarios

Run against the live server `https://dima-fomin.pl/mcp` on 2026-11-22: **8 of 8 passed**.
Re-run: `python3 tests/run_scenarios.py` (writes `tests/results.json` with every call and answer).

## Positive

### P1 — exact bolt, STEP, checksum
**Prompt:** Find an ISO 4017 M12×60 hex bolt with a real thread and give me the STEP file.
**Expected calls:** `search_models {standard:"ISO 4017", size:"M12", length:60, thread:"exact", format:"step"}` → `get_download_links {id:"bolt-iso-4017--m12-x-60--exact", formats:["step"]}`
**Expected answer:** one exact match; the STEP link with its size and SHA-256.
**Observed:** `match: exact`, `bolt-iso-4017--m12-x-60--exact`; STEP 1 952 632 bytes, SHA-256 `3103e5c0be8ccdf1554b6524d4dcb2633394fff899d203a18e9b3c46a83324de` — the downloaded file's checksum equals the server's.

### P2 — part for 3D printing
**Prompt:** I need an M8 nut to 3D print. Give me the 3MF and its checksum.
**Expected calls:** `search_models {query:"M8 nut", thread:"print", format:"3mf"}` → `get_download_links {id:"nut-iso-4032--m8--print", formats:["3mf"]}`
**Expected answer:** the print version of the ISO 4032 M8 nut (thread with an FDM allowance), its 3MF link and SHA-256.
**Observed:** `nut-iso-4032--m8--print`; 3MF 421 874 bytes, checksum matches the download.

### P3 — variants of one size
**Prompt:** Which versions of the 6204 ball bearing are there?
**Expected call:** `search_models {size:"6204", category:"bearing-iso-15"}`
**Expected answer:** the 6204 options only (open, 2Z, 2RS …), d 20 × D 47 × B 14 mm.
**Observed:** `exact`: `6204--open`, `6204--open-balls`, `6204--2z`, `6204--2rs`.

### P4 — Polish, model data
**Prompt:** Znajdź śrubę z łbem walcowym ISO 4762 M10×40 z prawdziwym gwintem i pokaż jej wymiary.
**Expected calls:** `search_models {query:"śruba z łbem walcowym ISO 4762 M10x40", thread:"exact", locale:"pl"}` → `get_model {id:"screw-iso-4762--m10-x-40--exact", locale:"pl"}`
**Expected answer:** the M10×40 socket head cap screw in Polish, d 10, L 40, pitch 1.5, a link to the Polish page.
**Observed:** „Śruba ISO 4762 M10 × 40 — gwint rzeczywisty”, d 10, L 40, P 1.5, URL under `/pl/`.

### P5 — Russian, a family
**Prompt:** Какие варианты арматуры Ø16 по EN 10080 есть в библиотеке?
**Expected call:** `search_models {query:"арматура Ø16 EN 10080", locale:"ru"}`
**Expected answer:** only Ø16 bars.
**Observed:** `exact`, 4: straight 6000, straight 12000, ribbed 300, U 300×500×300.

## Negative

### N1 — a length the standard does not have
**Prompt:** Give me an ISO 4017 M12×61 bolt with a real thread.
**Expected call:** `search_models {standard:"ISO 4017", size:"M12", length:61, thread:"exact"}`
**Expected answer:** not found; no file is offered as if it were M12×61; the nearest lengths are named with the difference, and the user is asked to choose.
**Observed:** `match: not_found`, `results: []`, `nearest`: M12×60 ("length 60 instead of 61"), M12×65, M12×55.

### N2 — a size outside the library
**Prompt:** I need an ISO 4762 socket head cap screw M48×100.
**Expected call:** `search_models {standard:"ISO 4762", size:"M48", length:100}`
**Expected answer:** not found (the library's ISO 4762 screws end at M36); the nearest is shown as a different diameter, not offered as M48.
**Observed:** `not_found`, `results: []`, nearest `screw-iso-4762--m36-x-100--exact` ("diameter 36 instead of 48").

### N3 — a made-up model id
**Prompt:** Download links for model bolt-iso-4017--m12-x-61--exact.
**Expected call:** `get_download_links {id:"bolt-iso-4017--m12-x-61--exact"}`
**Expected answer:** an error, no links.
**Observed:** `isError: true` — `{"error":"No model «bolt-iso-4017--m12-x-61--exact».","code":"not_found"}`; no files.
