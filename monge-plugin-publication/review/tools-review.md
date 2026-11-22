# Monge CAD — review of the three MCP tools (2026-11-22)

Checked against the live server `https://dima-fomin.pl/mcp` (version 1.0.0, catalogue 2026-11-22.9505be60).

## Protocol and safety

| Check | Result |
|---|---|
| Tools | `search_models`, `get_model`, `get_download_links` — one server, no second MCP |
| Annotations | all three: `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false` |
| Input schemas | `additionalProperties: false`, enums for thread / format / locale / family, bounds on lengths and limits; bad arguments → a tool error (`isError: true`) the model can read |
| Output schemas | declared for all three; `structuredContent` plus the same data as text |
| Authentication | none; read-only; no personal data asked for or returned |
| Files linked | only the free library (`/api/files/downloads/…`); Pro files are never linked |
| Protocol versions | 2024-11-05, 2025-03-26, 2025-06-18, 2025-11-25 (initialize) and 2026-07-28 (stateless) |
| Tests | 60/60 protocol checks (`scripts/test/mcp_check.py`), 33/33 catalogue checks, MCP Inspector 2.16.0, an independent client on the Python MCP SDK, 8/8 review scenarios |
| Load | Workers Paid, CPU limit 30 s; 2 403 pages under load — 0 errors; 50 parallel tool calls — 0 errors, no 1102 |

## Are the descriptions true?

| Claim in a description | Checked | Result |
|---|---|---|
| Examples «ISO 4017 M12x60 real thread STEP», «śruba M10x40», «болт М12х60», «6204-2RS», «rebar Ø16» find parts | each run on the live server | all `exact` |
| "match exact — every result has everything asked" | ISO 4017 M12×25 by filters | fixed today: the bolted joint (an assembly, 25 = grip) no longer leaks in; regression test added |
| "not_found — results empty, nearest apart with what differs; nothing substituted" | M12×61, M48×100, a made-up id | yes, see `tests/scenarios.md` N1–N3 |
| Thread types exact / cosmetic / print | options of M12×60 | three options exist; print has the FDM allowance in `thread.print_allowance_mm_per_side` |
| Files STEP, STL, 3MF, GLB with size and SHA-256 | downloads of STEP, GLB, 3MF | sizes and SHA-256 match; `Repr-Digest` header matches |
| Library coverage in the server instructions | the catalogue | **corrected today**: it said "every size the standards list" — not true (bearings: 60/62/63 series only; ISO 4762 ends at M36). Now names the real ranges and says that search tells what exists |
| "Mass" | record | estimated: mesh volume × 7850 kg/m³, marked `estimated: true` |
| "Checked by the Monge kernel" | record | `verification.geometry`: kernel body report, STEP read back, STL closed; `physical_tests.done: false` stated |

## Dimensions against the standards (spot check)

| Model | Catalogue | Standard |
|---|---|---|
| ISO 4017 M12×60 | d 12, P 1.75, L 60, head 7.5, across flats 18, across corners 20.8 | ISO 4017: k 7.5, s 18; e = s / cos 30° = 20.78; ISO 261: P 1.75 |
| ISO 4032 M8 | P 1.25, across flats 13, height 6.8, across corners 15.0 | ISO 4032: s 13, m 6.8 |
| 6204-2RS | d 20, D 47, B 14 | ISO 15: 20 × 47 × 14 |
| ISO 4762 M10×40 | d 10, L 40, P 1.5 | ISO 261: P 1.5 |

## Known limits (not errors, worth knowing before review)

- `standard.edition` holds the date the table was checked, not the ISO edition year (catalogue data, unchanged).
- The size image shows the size's default option, not necessarily the real-thread one (`image.of` says so).
- The STEP header names the writing program «RustCAD» and its file name carries «8.8»; the catalogue has no property class — a Monge export detail, the kernel was not changed.
- Rate limit: about 60 requests a minute per address, counted approximately by Cloudflare.
