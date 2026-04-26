#!/usr/bin/env python3
"""Inject reason/tag/allergen/hero/etc i18n keys into messages/{locale}/app.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "messages"

DATA = {
    "en": {
        "hero": {
            "servings": "Servings",
            "totalTime": "Total time",
            "min": "min",
            "kcal": "Kcal",
            "perServing": "per serving",
            "foodCost": "Food cost",
        },
        "noIngredients": "No ingredients available for this dish.",
        "ghostsHidden": "{count, plural, one {# unmatched ingredient hidden} other {# unmatched ingredients hidden}}",
        "badges_missing": "missing",
        "reason": {
            "uses_expiring_ingredients": "Uses ingredients expiring soon",
            "high_protein": "High in protein",
            "all_ingredients_available": "All ingredients in stock",
            "budget_friendly": "Budget-friendly",
            "low_carb": "Low-carb",
            "quick_to_make": "Quick to make",
            "matches_diet": "Matches your diet",
            "uses_inventory": "Uses your inventory",
        },
        "tag": {
            "vegan": "Vegan",
            "vegetarian": "Vegetarian",
            "gluten_free": "Gluten-free",
            "dairy_free": "Dairy-free",
            "low_carb": "Low-carb",
            "keto": "Keto",
            "paleo": "Paleo",
            "high_protein": "High-protein",
            "low_fat": "Low-fat",
            "halal": "Halal",
            "kosher": "Kosher",
            "spicy": "Spicy",
            "quick": "Quick",
            "comfort": "Comfort",
            "healthy": "Healthy",
        },
        "allergen": {
            "nuts": "Nuts",
            "peanuts": "Peanuts",
            "tree_nuts": "Tree nuts",
            "dairy": "Dairy",
            "milk": "Milk",
            "gluten": "Gluten",
            "wheat": "Wheat",
            "eggs": "Eggs",
            "fish": "Fish",
            "shellfish": "Shellfish",
            "soy": "Soy",
            "sesame": "Sesame",
            "mustard": "Mustard",
            "celery": "Celery",
            "sulphites": "Sulphites",
        },
    },
    "ru": {
        "hero": {
            "servings": "Порции",
            "totalTime": "Общее время",
            "min": "мин",
            "kcal": "Ккал",
            "perServing": "на порцию",
            "foodCost": "Себестоимость",
        },
        "noIngredients": "Нет доступных ингредиентов для этого блюда.",
        "ghostsHidden": "{count, plural, one {# несопоставленный ингредиент скрыт} few {# несопоставленных ингредиента скрыто} other {# несопоставленных ингредиентов скрыто}}",
        "badges_missing": "нет в наличии",
        "reason": {
            "uses_expiring_ingredients": "Использует продукты с истекающим сроком",
            "high_protein": "Высокобелковое",
            "all_ingredients_available": "Все ингредиенты в наличии",
            "budget_friendly": "Эконом-вариант",
            "low_carb": "Низкоуглеводное",
            "quick_to_make": "Быстро готовится",
            "matches_diet": "Подходит под вашу диету",
            "uses_inventory": "Использует ваш запас",
        },
        "tag": {
            "vegan": "Веганское",
            "vegetarian": "Вегетарианское",
            "gluten_free": "Без глютена",
            "dairy_free": "Без молочного",
            "low_carb": "Низкоуглеводное",
            "keto": "Кето",
            "paleo": "Палео",
            "high_protein": "Высокобелковое",
            "low_fat": "Низкожировое",
            "halal": "Халяль",
            "kosher": "Кошер",
            "spicy": "Острое",
            "quick": "Быстрое",
            "comfort": "Сытное",
            "healthy": "Полезное",
        },
        "allergen": {
            "nuts": "Орехи",
            "peanuts": "Арахис",
            "tree_nuts": "Древесные орехи",
            "dairy": "Молочное",
            "milk": "Молоко",
            "gluten": "Глютен",
            "wheat": "Пшеница",
            "eggs": "Яйца",
            "fish": "Рыба",
            "shellfish": "Моллюски",
            "soy": "Соя",
            "sesame": "Кунжут",
            "mustard": "Горчица",
            "celery": "Сельдерей",
            "sulphites": "Сульфиты",
        },
    },
    "pl": {
        "hero": {
            "servings": "Porcje",
            "totalTime": "Łączny czas",
            "min": "min",
            "kcal": "Kcal",
            "perServing": "na porcję",
            "foodCost": "Koszt produktów",
        },
        "noIngredients": "Brak dostępnych składników dla tego dania.",
        "ghostsHidden": "{count, plural, one {Ukryto # niedopasowany składnik} few {Ukryto # niedopasowane składniki} other {Ukryto # niedopasowanych składników}}",
        "badges_missing": "brak",
        "reason": {
            "uses_expiring_ingredients": "Wykorzystuje produkty z krótką datą",
            "high_protein": "Wysokobiałkowe",
            "all_ingredients_available": "Wszystkie składniki dostępne",
            "budget_friendly": "Budżetowe",
            "low_carb": "Niskowęglowodanowe",
            "quick_to_make": "Szybkie w przygotowaniu",
            "matches_diet": "Pasuje do Twojej diety",
            "uses_inventory": "Wykorzystuje Twój zapas",
        },
        "tag": {
            "vegan": "Wegańskie",
            "vegetarian": "Wegetariańskie",
            "gluten_free": "Bez glutenu",
            "dairy_free": "Bez nabiału",
            "low_carb": "Niskowęglowodanowe",
            "keto": "Keto",
            "paleo": "Paleo",
            "high_protein": "Wysokobiałkowe",
            "low_fat": "Niskotłuszczowe",
            "halal": "Halal",
            "kosher": "Koszerne",
            "spicy": "Pikantne",
            "quick": "Szybkie",
            "comfort": "Sycące",
            "healthy": "Zdrowe",
        },
        "allergen": {
            "nuts": "Orzechy",
            "peanuts": "Orzeszki ziemne",
            "tree_nuts": "Orzechy drzew",
            "dairy": "Nabiał",
            "milk": "Mleko",
            "gluten": "Gluten",
            "wheat": "Pszenica",
            "eggs": "Jajka",
            "fish": "Ryby",
            "shellfish": "Skorupiaki",
            "soy": "Soja",
            "sesame": "Sezam",
            "mustard": "Gorczyca",
            "celery": "Seler",
            "sulphites": "Siarczyny",
        },
    },
    "uk": {
        "hero": {
            "servings": "Порції",
            "totalTime": "Загальний час",
            "min": "хв",
            "kcal": "Ккал",
            "perServing": "на порцію",
            "foodCost": "Собівартість",
        },
        "noIngredients": "Немає доступних інгредієнтів для цієї страви.",
        "ghostsHidden": "{count, plural, one {# незіставлений інгредієнт сховано} few {# незіставлених інгредієнти сховано} other {# незіставлених інгредієнтів сховано}}",
        "badges_missing": "немає",
        "reason": {
            "uses_expiring_ingredients": "Використовує продукти з коротким терміном",
            "high_protein": "Високобілкове",
            "all_ingredients_available": "Усі інгредієнти в наявності",
            "budget_friendly": "Економний варіант",
            "low_carb": "Низьковуглеводне",
            "quick_to_make": "Швидке у приготуванні",
            "matches_diet": "Підходить під вашу дієту",
            "uses_inventory": "Використовує ваш запас",
        },
        "tag": {
            "vegan": "Веганське",
            "vegetarian": "Вегетаріанське",
            "gluten_free": "Без глютену",
            "dairy_free": "Без молочного",
            "low_carb": "Низьковуглеводне",
            "keto": "Кето",
            "paleo": "Палео",
            "high_protein": "Високобілкове",
            "low_fat": "Низькожирове",
            "halal": "Халяль",
            "kosher": "Кошер",
            "spicy": "Гостре",
            "quick": "Швидке",
            "comfort": "Ситне",
            "healthy": "Корисне",
        },
        "allergen": {
            "nuts": "Горіхи",
            "peanuts": "Арахіс",
            "tree_nuts": "Деревні горіхи",
            "dairy": "Молочне",
            "milk": "Молоко",
            "gluten": "Глютен",
            "wheat": "Пшениця",
            "eggs": "Яйця",
            "fish": "Риба",
            "shellfish": "Молюски",
            "soy": "Соя",
            "sesame": "Кунжут",
            "mustard": "Гірчиця",
            "celery": "Селера",
            "sulphites": "Сульфіти",
        },
    },
}


def main():
    for locale, payload in DATA.items():
        path = ROOT / locale / "app.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        cn = data.setdefault("app", {}).setdefault("cookNow", {})

        cn["hero"] = payload["hero"]
        cn["noIngredients"] = payload["noIngredients"]
        cn["ghostsHidden"] = payload["ghostsHidden"]
        cn.setdefault("badges", {})["missing"] = payload["badges_missing"]
        cn["reason"] = payload["reason"]
        cn["tag"] = payload["tag"]
        cn["allergen"] = payload["allergen"]

        path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"✓ updated {path.relative_to(ROOT.parent)}")


if __name__ == "__main__":
    main()
