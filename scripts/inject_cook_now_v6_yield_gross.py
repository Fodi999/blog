#!/usr/bin/env python3
"""Add `app.cookNow.hero.fromGross` translation key across all 4 locales."""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[1] / "messages"

PATCHES = {
    "en": {"fromGross": "from {gross} gross"},
    "ru": {"fromGross": "из {gross} брутто"},
    "pl": {"fromGross": "z {gross} brutto"},
    "uk": {"fromGross": "з {gross} брутто"},
}

for lang, kv in PATCHES.items():
    p = ROOT / lang / "app.json"
    data = json.loads(p.read_text(encoding="utf-8"))
    hero = data.setdefault("app", {}).setdefault("cookNow", {}).setdefault("hero", {})
    for k, v in kv.items():
        hero[k] = v
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"✓ {lang}: hero.fromGross")
