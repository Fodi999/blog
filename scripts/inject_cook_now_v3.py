#!/usr/bin/env python3
"""Add ingredient-card visual constructor i18n: groups.* and status.*."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "messages"

DATA = {
    "en": {
        "groups": {
            "inStock": "In stock",
            "toBuy": "Need to buy",
            "optional": "Optional / for taste",
        },
        "status": {
            "inStock": "In stock",
            "missing": "Not in inventory",
            "expiring": "Expiring soon",
        },
    },
    "ru": {
        "groups": {
            "inStock": "В наличии",
            "toBuy": "Нужно докупить",
            "optional": "Опционально / для вкуса",
        },
        "status": {
            "inStock": "В наличии",
            "missing": "Нет на складе",
            "expiring": "Скоро истечёт срок",
        },
    },
    "pl": {
        "groups": {
            "inStock": "W magazynie",
            "toBuy": "Trzeba dokupić",
            "optional": "Opcjonalne / dla smaku",
        },
        "status": {
            "inStock": "W magazynie",
            "missing": "Brak w magazynie",
            "expiring": "Wkrótce się zepsuje",
        },
    },
    "uk": {
        "groups": {
            "inStock": "У наявності",
            "toBuy": "Треба докупити",
            "optional": "Опціонально / для смаку",
        },
        "status": {
            "inStock": "У наявності",
            "missing": "Немає на складі",
            "expiring": "Скоро вийде термін",
        },
    },
}


def main():
    for locale, payload in DATA.items():
        path = ROOT / locale / "app.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        cn = data.setdefault("app", {}).setdefault("cookNow", {})
        cn["groups"] = payload["groups"]
        cn["status"] = payload["status"]
        path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"✓ updated {path.relative_to(ROOT.parent)}")


if __name__ == "__main__":
    main()
