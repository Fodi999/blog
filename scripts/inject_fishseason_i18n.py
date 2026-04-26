#!/usr/bin/env python3
"""Inject new fishSeason i18n keys into all locale files."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MESSAGES = ROOT / "messages"

ADDITIONS = {
    "en": {
        "legendSub": {
            "peak": "Optimal Catch",
            "good": "Stable Harvest",
            "limited": "Scarce Stock",
            "off": "Closed Season",
        },
        "insight": {
            "peakSushi": "Perfect for sushi",
            "peakRegular": "Best quality now",
            "good": "Good choice",
            "limited": "Higher price expected",
            "off": "Not in season — avoid",
        },
        "bestChoiceNow": "Best Choice Now",
        "sushiGrade": "Sushi Grade",
        "peakQuality": "Peak Quality",
        "strongAlternatives": "Strong Alternatives",
        "seasonRiskAvoid": "Season Risk: Avoid",
        "lowQuality": "Low Quality",
        "smartPairing": "Smart Pairing hint",
        "pairingTitle": "Peak {fish} is best with…",
        "pairingFallback": "Cooking Seasonal Best",
        "pairingBody": "AI detected high umami levels in current catches. Use acid-rich pairings to lift the flavor profile.",
        "analyzeInLab": "Analyze in Culinary Lab",
        "regionLabel": "Region",
        "globalMarket": "Global Market",
        "aiCurator": "AI Chef Curator",
        "seasonInsight": {
            "spring": "Spring Insight: sea fish at peak — prioritize wild catches and cold-smoke techniques.",
            "summer": "Summer Insight: freshwater varieties shine — go for grilling and citrus pairings.",
            "autumn": "Autumn Insight: fatty fish reach peak umami — perfect for curing and confit.",
            "winter": "Winter Insight: cold-water species at maximum quality — sushi and sashimi season.",
        },
        "tooltip": {
            "peak": "Peak availability",
            "good": "Stable harvest",
            "limited": "Scarce stocks",
            "off": "Season closed",
        },
        "harvestDynamics": "Harvest Dynamics",
        "peakFocus": "Peak Focus",
        "noResults": "No oceanic results match the current filters",
        "seaStock": "sea stock",
        "freshStock": "fresh stock",
        "sushiBadge": "sushi",
        "regionalDynamics": "Regional Dynamics",
    },
    "ru": {
        "legendSub": {
            "peak": "Оптимальный улов",
            "good": "Стабильный промысел",
            "limited": "Дефицит запасов",
            "off": "Сезон закрыт",
        },
        "insight": {
            "peakSushi": "Идеально для суши",
            "peakRegular": "Лучшее качество сейчас",
            "good": "Хороший выбор",
            "limited": "Ожидается рост цен",
            "off": "Не в сезоне — избегайте",
        },
        "bestChoiceNow": "Лучший выбор сейчас",
        "sushiGrade": "Суши-качество",
        "peakQuality": "Пиковое качество",
        "strongAlternatives": "Хорошие альтернативы",
        "seasonRiskAvoid": "Риск сезона: избегать",
        "lowQuality": "Низкое качество",
        "smartPairing": "Умное сочетание",
        "pairingTitle": "Пиковая {fish} лучше всего с…",
        "pairingFallback": "Готовка сезонных лучших",
        "pairingBody": "ИИ обнаружил высокий уровень умами в текущих уловах. Используйте кислотные сочетания, чтобы раскрыть вкус.",
        "analyzeInLab": "Анализ в Кулинарной Лаборатории",
        "regionLabel": "Регион",
        "globalMarket": "Глобальный рынок",
        "aiCurator": "AI Шеф-Куратор",
        "seasonInsight": {
            "spring": "Весенний инсайт: морская рыба на пике — выбирайте дикий улов и холодное копчение.",
            "summer": "Летний инсайт: пресноводные виды на высоте — гриль и цитрусовые сочетания.",
            "autumn": "Осенний инсайт: жирная рыба достигает пика умами — идеально для засолки и конфи.",
            "winter": "Зимний инсайт: холодноводные виды максимального качества — сезон суши и сашими.",
        },
        "tooltip": {
            "peak": "Пиковая доступность",
            "good": "Стабильный улов",
            "limited": "Дефицит запасов",
            "off": "Сезон закрыт",
        },
        "harvestDynamics": "Динамика улова",
        "peakFocus": "Пик-фокус",
        "noResults": "Нет рыбы по текущим фильтрам",
        "seaStock": "морская",
        "freshStock": "пресная",
        "sushiBadge": "суши",
        "regionalDynamics": "Региональная динамика",
    },
    "pl": {
        "legendSub": {
            "peak": "Optymalny połów",
            "good": "Stabilny połów",
            "limited": "Niskie zapasy",
            "off": "Sezon zamknięty",
        },
        "insight": {
            "peakSushi": "Idealne do sushi",
            "peakRegular": "Najlepsza jakość teraz",
            "good": "Dobry wybór",
            "limited": "Spodziewany wzrost cen",
            "off": "Poza sezonem — unikaj",
        },
        "bestChoiceNow": "Najlepszy wybór teraz",
        "sushiGrade": "Klasa sushi",
        "peakQuality": "Szczytowa jakość",
        "strongAlternatives": "Mocne alternatywy",
        "seasonRiskAvoid": "Ryzyko sezonu: unikaj",
        "lowQuality": "Niska jakość",
        "smartPairing": "Inteligentne łączenie",
        "pairingTitle": "Szczyt {fish} pasuje najlepiej z…",
        "pairingFallback": "Gotowanie sezonowych hitów",
        "pairingBody": "AI wykryło wysoki poziom umami w obecnych połowach. Użyj kwaśnych dodatków, aby podkreślić smak.",
        "analyzeInLab": "Analiza w Laboratorium Kulinarnym",
        "regionLabel": "Region",
        "globalMarket": "Rynek globalny",
        "aiCurator": "Kurator AI Chef",
        "seasonInsight": {
            "spring": "Wiosenna analiza: ryby morskie u szczytu — postaw na dziki połów i wędzenie na zimno.",
            "summer": "Letnia analiza: ryby słodkowodne w pełni — grill i cytrusowe połączenia.",
            "autumn": "Jesienna analiza: tłuste ryby osiągają szczyt umami — idealne do peklowania i confit.",
            "winter": "Zimowa analiza: gatunki zimnowodne najwyższej jakości — sezon sushi i sashimi.",
        },
        "tooltip": {
            "peak": "Szczytowa dostępność",
            "good": "Stabilny połów",
            "limited": "Niskie zapasy",
            "off": "Sezon zamknięty",
        },
        "harvestDynamics": "Dynamika połowu",
        "peakFocus": "Skupienie na szczycie",
        "noResults": "Brak ryb pasujących do filtrów",
        "seaStock": "morska",
        "freshStock": "słodkowodna",
        "sushiBadge": "sushi",
        "regionalDynamics": "Dynamika regionalna",
    },
    "uk": {
        "legendSub": {
            "peak": "Оптимальний вилов",
            "good": "Стабільний промисел",
            "limited": "Дефіцит запасів",
            "off": "Сезон закрито",
        },
        "insight": {
            "peakSushi": "Ідеально для суші",
            "peakRegular": "Найкраща якість зараз",
            "good": "Хороший вибір",
            "limited": "Очікується зростання цін",
            "off": "Не в сезон — уникайте",
        },
        "bestChoiceNow": "Найкращий вибір зараз",
        "sushiGrade": "Суші-якість",
        "peakQuality": "Пікова якість",
        "strongAlternatives": "Сильні альтернативи",
        "seasonRiskAvoid": "Ризик сезону: уникати",
        "lowQuality": "Низька якість",
        "smartPairing": "Розумне поєднання",
        "pairingTitle": "Пікова {fish} найкраще з…",
        "pairingFallback": "Готування сезонних кращих",
        "pairingBody": "ШІ виявив високий рівень умамі в поточних виловах. Використовуйте кислотні поєднання для підсилення смаку.",
        "analyzeInLab": "Аналіз у Кулінарній Лабораторії",
        "regionLabel": "Регіон",
        "globalMarket": "Глобальний ринок",
        "aiCurator": "AI Шеф-Куратор",
        "seasonInsight": {
            "spring": "Весняний інсайт: морська риба на піку — обирайте дикий вилов і холодне копчення.",
            "summer": "Літній інсайт: прісноводні види у розквіті — гриль і цитрусові поєднання.",
            "autumn": "Осінній інсайт: жирна риба досягає піку умамі — ідеально для засолу і конфі.",
            "winter": "Зимовий інсайт: холодноводні види максимальної якості — сезон суші та сашимі.",
        },
        "tooltip": {
            "peak": "Пікова доступність",
            "good": "Стабільний вилов",
            "limited": "Дефіцит запасів",
            "off": "Сезон закрито",
        },
        "harvestDynamics": "Динаміка вилову",
        "peakFocus": "Пік-фокус",
        "noResults": "Немає риби за поточними фільтрами",
        "seaStock": "морська",
        "freshStock": "прісноводна",
        "sushiBadge": "суші",
        "regionalDynamics": "Регіональна динаміка",
    },
}


def deep_merge(dst, src):
    for k, v in src.items():
        if isinstance(v, dict) and isinstance(dst.get(k), dict):
            deep_merge(dst[k], v)
        else:
            dst[k] = v


for locale, additions in ADDITIONS.items():
    fp = MESSAGES / f"{locale}.json"
    with fp.open("r", encoding="utf-8") as f:
        data = json.load(f)
    data.setdefault("chefTools", {}).setdefault("fishSeason", {})
    deep_merge(data["chefTools"]["fishSeason"], additions)
    with fp.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"✓ {locale}.json updated")

print("Done.")
