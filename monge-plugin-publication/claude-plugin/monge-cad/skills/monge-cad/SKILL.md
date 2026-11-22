---
name: monge-cad
description: Find standard mechanical parts in the Monge CAD library (ISO 4017 hex bolts, ISO 4762 socket head cap screws, ISO 4032 nuts, ISO 7089 washers, ISO 15 ball bearings, DIN 981 lock nuts, EN 10080 rebar, bolted joints, shafts), show them in an interactive 3D view in the chat, and give their STEP, STL, 3MF and GLB files with SHA-256. Use when the user asks for a standard part by standard or size (e.g. "M12×60 bolt", "6204 bearing", "śruba M10x40", "болт М12х60"), its dimensions or thread, CAD files of it, or wants to see or compare parts in 3D.
---

# Monge CAD

Tools of the `monge-cad` MCP server:

| Tool | Use it to |
|---|---|
| `search_models` | find the exact model: standard, size, length, thread (`exact` real helical, `cosmetic` plain cylinder, `print` real thread with an FDM allowance), format, or words in English, Polish or Russian |
| `render_model_viewer` | show models in the interactive 3D view in the chat (rotate, zoom, pan, reset, full screen) with standard, size, thread pitch, thread type and file links |
| `get_model` | everything about one model: dimensions, thread, mass, kernel checks, image, GLB, other options of the size |
| `get_download_links` | direct STEP, STL, 3MF, GLB links with size and SHA-256 |

## How to work

1. Search first with `search_models`, passing what the user asked as filters (`standard`, `size`, `length`, `thread`) and/or `query`.
2. `match: "exact"` — every result has everything asked. Take the result's `id`.
3. `match: "not_found"` — the size or option is not in the library. Say so plainly, list the `nearest` models with what `differs`, and let the user choose. **Never present a nearest model as the one asked for.**
4. When the user wants to see a part — or it helps (a part, its variants, a bolt with its nut) — call `render_model_viewer` with the id. A size id without option (`bolt-iso-4017--m12-x-60`) shows the real-thread option. Add `compare_with` (up to three more ids) and `layout: "side_by_side"` to compare, e.g. a bolt with its matching nut and washer.
5. Give download links from `get_download_links` (or the viewer's file buttons). Mention the SHA-256 when the user cares about integrity.
6. Answer in the user's language and pass `locale` (`en`, `pl`, `ru`).

## Facts to keep straight

- Library coverage: ISO 4017 bolts M1.6–M64, ISO 4762 screws M1.6–M36 (lengths of their tables), ISO 4032 nuts and ISO 7089 washers M1.6–M64, ISO 15 bearings of the 60, 62 and 63 series, DIN 981 KM0–KM20, EN 10080 rebar, bolted joints, example shafts. Not every size of every standard exists — the search says what does.
- Dimensions come from the standards' tables checked against two sources: reference data, not a certificate of conformity. No physical parts were tested. Mass is estimated (steel).
- The 3D view shows the model's own GLB. The size's picture (WebP) is of its default option; the viewer and the tool say so when it differs.
- Files are free to use, commercial use included; they may not be resold or redistributed as files (https://dima-fomin.pl/en/license).
- If the 3D view does not appear (client without MCP Apps), give the model page link from the result — it has a 3D view on the Monge site.
