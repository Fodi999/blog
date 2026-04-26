#!/usr/bin/env python3
"""
Add hero.totalYield + hero.allIngredients + edit.{fieldDishName,
fieldSteps, stepText, stepTime, stepTemp, stepTip, addStep, removeStep}
keys to all 4 locales.
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1] / "messages"

PATCHES = {
    "ru": {
        "hero": {
            "totalYield": "Общий выход",
            "allIngredients": "все ингредиенты",
        },
        "edit": {
            "fieldDishName": "Название блюда",
            "fieldDishNamePlaceholder": "Например, «Боул с курицей»",
            "stepsTitle": "Шаги приготовления",
            "stepText": "Что делаем",
            "stepTextPlaceholder": "Опишите шаг…",
            "stepTime": "Время (мин)",
            "stepTemp": "Темп. (°C)",
            "stepTip": "Подсказка",
            "stepTipPlaceholder": "Совет шефа (необязательно)",
            "addStep": "Добавить шаг",
            "removeStep": "Удалить шаг",
            "noSteps": "Шаги не заданы. Добавьте первый.",
        },
    },
    "en": {
        "hero": {
            "totalYield": "Total yield",
            "allIngredients": "all ingredients",
        },
        "edit": {
            "fieldDishName": "Dish name",
            "fieldDishNamePlaceholder": "e.g. \"Chicken bowl\"",
            "stepsTitle": "Cooking steps",
            "stepText": "Instruction",
            "stepTextPlaceholder": "Describe the step…",
            "stepTime": "Time (min)",
            "stepTemp": "Temp. (°C)",
            "stepTip": "Tip",
            "stepTipPlaceholder": "Chef's tip (optional)",
            "addStep": "Add step",
            "removeStep": "Remove step",
            "noSteps": "No steps yet. Add the first one.",
        },
    },
    "pl": {
        "hero": {
            "totalYield": "Łączna waga",
            "allIngredients": "wszystkie składniki",
        },
        "edit": {
            "fieldDishName": "Nazwa dania",
            "fieldDishNamePlaceholder": "np. „Miska z kurczakiem\"",
            "stepsTitle": "Kroki przygotowania",
            "stepText": "Instrukcja",
            "stepTextPlaceholder": "Opisz krok…",
            "stepTime": "Czas (min)",
            "stepTemp": "Temp. (°C)",
            "stepTip": "Wskazówka",
            "stepTipPlaceholder": "Wskazówka szefa (opcjonalnie)",
            "addStep": "Dodaj krok",
            "removeStep": "Usuń krok",
            "noSteps": "Brak kroków. Dodaj pierwszy.",
        },
    },
    "uk": {
        "hero": {
            "totalYield": "Загальний вихід",
            "allIngredients": "усі інгредієнти",
        },
        "edit": {
            "fieldDishName": "Назва страви",
            "fieldDishNamePlaceholder": "Напр., «Боул з куркою»",
            "stepsTitle": "Кроки приготування",
            "stepText": "Що робимо",
            "stepTextPlaceholder": "Опишіть крок…",
            "stepTime": "Час (хв)",
            "stepTemp": "Темп. (°C)",
            "stepTip": "Підказка",
            "stepTipPlaceholder": "Порада шефа (необов'язково)",
            "addStep": "Додати крок",
            "removeStep": "Видалити крок",
            "noSteps": "Кроків немає. Додайте перший.",
        },
    },
}


def deep_merge(dst: dict, src: dict) -> None:
    for k, v in src.items():
        if isinstance(v, dict) and isinstance(dst.get(k), dict):
            deep_merge(dst[k], v)
        else:
            dst[k] = v


for lang, patch in PATCHES.items():
    path = ROOT / lang / "app.json"
    data = json.loads(path.read_text())
    cn = data["app"]["cookNow"]
    deep_merge(cn, patch)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print(f"✓ {lang}")
