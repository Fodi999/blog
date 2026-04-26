#!/usr/bin/env python3
"""Inject app.cookNow.edit.* i18n keys for the EditRecipeSheet."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "messages"

DATA = {
    "en": {
        "title": "Edit recipe",
        "ingredientsTitle": "Ingredients",
        "noIngredients": "No ingredients yet.",
        "summaryInStock": "in stock",
        "summaryToBuy": "to buy",
        "addBtn": "Add ingredient",
        "searchTitle": "Search catalog",
        "manualTitle": "Add manually",
        "searchPlaceholder": "Search ingredients…",
        "notFound": "Ingredient not found? Add manually",
        "fieldName": "Name",
        "fieldNamePlaceholder": "e.g. Soy sauce",
        "fieldQty": "Amount",
        "fieldUnit": "Unit",
        "fieldRole": "Role",
        "fieldStatus": "Status",
        "statusInStock": "In stock",
        "statusToBuy": "Need to buy",
        "statusOptional": "Optional",
        "addConfirm": "Add to recipe",
        "cancel": "Cancel",
        "save": "Save draft",
    },
    "ru": {
        "title": "Редактировать рецепт",
        "ingredientsTitle": "Ингредиенты",
        "noIngredients": "Ингредиентов пока нет.",
        "summaryInStock": "в наличии",
        "summaryToBuy": "докупить",
        "addBtn": "+ Добавить ингредиент",
        "searchTitle": "Поиск по каталогу",
        "manualTitle": "Добавить вручную",
        "searchPlaceholder": "Поиск ингредиентов…",
        "notFound": "Не нашли ингредиент? Добавить вручную",
        "fieldName": "Название",
        "fieldNamePlaceholder": "например, Соевый соус",
        "fieldQty": "Количество",
        "fieldUnit": "Единица",
        "fieldRole": "Роль",
        "fieldStatus": "Статус",
        "statusInStock": "В наличии",
        "statusToBuy": "Нужно докупить",
        "statusOptional": "Опционально",
        "addConfirm": "Добавить в рецепт",
        "cancel": "Отмена",
        "save": "Сохранить черновик",
    },
    "pl": {
        "title": "Edytuj przepis",
        "ingredientsTitle": "Składniki",
        "noIngredients": "Brak składników.",
        "summaryInStock": "w magazynie",
        "summaryToBuy": "do kupienia",
        "addBtn": "+ Dodaj składnik",
        "searchTitle": "Szukaj w katalogu",
        "manualTitle": "Dodaj ręcznie",
        "searchPlaceholder": "Szukaj składników…",
        "notFound": "Nie znaleziono? Dodaj ręcznie",
        "fieldName": "Nazwa",
        "fieldNamePlaceholder": "np. Sos sojowy",
        "fieldQty": "Ilość",
        "fieldUnit": "Jednostka",
        "fieldRole": "Rola",
        "fieldStatus": "Status",
        "statusInStock": "W magazynie",
        "statusToBuy": "Trzeba kupić",
        "statusOptional": "Opcjonalnie",
        "addConfirm": "Dodaj do przepisu",
        "cancel": "Anuluj",
        "save": "Zapisz szkic",
    },
    "uk": {
        "title": "Редагувати рецепт",
        "ingredientsTitle": "Інгредієнти",
        "noIngredients": "Інгредієнтів ще немає.",
        "summaryInStock": "є в наявності",
        "summaryToBuy": "докупити",
        "addBtn": "+ Додати інгредієнт",
        "searchTitle": "Пошук у каталозі",
        "manualTitle": "Додати вручну",
        "searchPlaceholder": "Пошук інгредієнтів…",
        "notFound": "Не знайшли? Додати вручну",
        "fieldName": "Назва",
        "fieldNamePlaceholder": "напр. Соєвий соус",
        "fieldQty": "Кількість",
        "fieldUnit": "Одиниця",
        "fieldRole": "Роль",
        "fieldStatus": "Статус",
        "statusInStock": "У наявності",
        "statusToBuy": "Треба докупити",
        "statusOptional": "Опціонально",
        "addConfirm": "Додати до рецепту",
        "cancel": "Скасувати",
        "save": "Зберегти чернетку",
    },
}


def main():
    for locale, payload in DATA.items():
        path = ROOT / locale / "app.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        cn = data.setdefault("app", {}).setdefault("cookNow", {})
        cn["edit"] = payload
        path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"✓ updated {path.relative_to(ROOT.parent)}")


if __name__ == "__main__":
    main()
