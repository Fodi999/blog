#!/usr/bin/env python3
"""Inject app.wallet i18n keys for the AI Wallet dashboard card."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MESSAGES = ROOT / "messages"

# next-intl ICU plurals: {count, plural, one {…} other {…}}
TRANSLATIONS = {
    "en": {
        "title": "AI Wallet",
        "availableBadge": "Available · {count}",
        "actionsAvailable": "actions available",
        "purchasedTotal": "Purchased",
        "used": "Used",
        "bonusCredits": "+{count} bonus {count, plural, one {credit} other {credits}}",
        "noBonus": "No bonus credits yet",
        "topUp": "Top up",
        "history": "History",
    },
    "ru": {
        "title": "AI-Кошелёк",
        "availableBadge": "Доступно · {count}",
        "actionsAvailable": "действий доступно",
        "purchasedTotal": "Куплено",
        "used": "Потрачено",
        "bonusCredits": "+{count} {count, plural, one {бонус} few {бонуса} other {бонусов}}",
        "noBonus": "Бонусов пока нет",
        "topUp": "Пополнить",
        "history": "История",
    },
    "pl": {
        "title": "Portfel AI",
        "availableBadge": "Dostępne · {count}",
        "actionsAvailable": "dostępnych akcji",
        "purchasedTotal": "Kupione",
        "used": "Zużyte",
        "bonusCredits": "+{count} {count, plural, one {bonus} few {bonusy} other {bonusów}}",
        "noBonus": "Brak bonusów",
        "topUp": "Doładuj",
        "history": "Historia",
    },
    "uk": {
        "title": "AI-Гаманець",
        "availableBadge": "Доступно · {count}",
        "actionsAvailable": "дій доступно",
        "purchasedTotal": "Куплено",
        "used": "Витрачено",
        "bonusCredits": "+{count} {count, plural, one {бонус} few {бонуси} other {бонусів}}",
        "noBonus": "Бонусів поки немає",
        "topUp": "Поповнити",
        "history": "Історія",
    },
}

for locale, wallet in TRANSLATIONS.items():
    fp = MESSAGES / locale / "app.json"
    with fp.open("r", encoding="utf-8") as f:
        data = json.load(f)
    data.setdefault("app", {})["wallet"] = wallet
    with fp.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"✓ {locale}/app.json — added app.wallet ({len(wallet)} keys)")

print("Done.")
