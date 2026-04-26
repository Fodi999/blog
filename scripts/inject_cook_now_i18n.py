#!/usr/bin/env python3
"""Inject i18n keys for the Cook Now (/app/cook-now) page into messages/{locale}/app.json."""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]

# nav label per locale
NAV = {
    "en": "Cook now",
    "ru": "Что приготовить",
    "pl": "Co ugotować",
    "uk": "Що приготувати",
}

# full app.cookNow namespace per locale
COOK = {
    "en": {
        "title": "Cook now",
        "subtitle": "AI-generated dish ideas built from your current inventory. Anti-waste first, real prices, no fabricated numbers.",
        "idleTitle": "Ready when you are",
        "idleBody": "Tap Generate and ChefOS will analyze your stock, your preferences and your expiring items to suggest dishes you can cook right now.",
        "generate": "Generate suggestions",
        "regenerate": "Regenerate",
        "costHint": "Uses 1 AI action when your free daily quota is spent.",
        "loadingTitle": "Cooking up ideas…",
        "loadingBody": "Reading inventory, asking the model, resolving recipes and pricing each dish from your real stock.",
        "errorTitle": "Couldn't load suggestions",
        "errorBody": "Please try again in a moment.",
        "errorQuotaTitle": "Out of AI actions",
        "errorQuotaBody": "Your daily free quota and wallet are empty. Top up to continue or wait for tomorrow's reset.",
        "retry": "Try again",
        "topUp": "Top up wallet",
        "emptyResultsTitle": "No matching dishes",
        "emptyResultsBody": "We couldn't find suitable recipes from your current stock. Try adding a few staple ingredients.",
        "canCookTitle": "Cook right now",
        "canCookSubtitle": "{count, plural, one {# dish} other {# dishes}} fully covered by your stock",
        "almostTitle": "Almost ready",
        "almostSubtitle": "{count, plural, one {# dish} other {# dishes}} missing 1–2 ingredients",
        "strategicTitle": "Strategic picks",
        "strategicSubtitle": "{count, plural, one {# dish} other {# dishes}} worth a small shop run",
        "missing": "{count, plural, one {Missing # ingredient} other {Missing # ingredients}}",
        "showRecipe": "Show recipe",
        "hideRecipe": "Hide recipe",
        "ingredients": "Ingredients",
        "steps": "Steps",
        "insight": {
            "totalIngredients": "In stock",
            "daysLeft": "Days left",
            "atRisk": "Expiring",
            "atRiskList": "Expiring within 3 days",
            "wasteRisk": "Waste risk"
        },
        "personalization": {
            "title": "Personalized for you",
            "goal": "Goal: {goal}",
            "diet": "Diet: {diet}",
            "kcal": "{kcal} kcal/day",
            "allergens": "No: {list}"
        },
        "unlock": {
            "title": "Unlock more recipes"
        },
        "badges": {
            "usesExpiring": "Anti-waste",
            "highProtein": "High protein",
            "budget": "Budget",
            "confidenceStrong": "Strong fit"
        },
        "stats": {
            "kcal": "kcal",
            "servings": "servings",
            "time": "time"
        },
        "econ": {
            "cost": "Food cost",
            "suggested": "Suggested price",
            "margin": "Margin",
            "wasteSaved": "Waste saved"
        },
        "nutrition": {
            "kcal": "kcal",
            "protein": "protein",
            "fat": "fat",
            "carbs": "carbs"
        }
    },
    "ru": {
        "title": "Что приготовить",
        "subtitle": "Идеи блюд из ваших остатков, рассчитанные ИИ. Сначала борьба со списанием, реальные цены, никаких выдуманных цифр.",
        "idleTitle": "Готовы начать?",
        "idleBody": "Нажмите «Сгенерировать» — ChefOS посмотрит склад, ваши предпочтения и сроки годности, и подскажет, что приготовить прямо сейчас.",
        "generate": "Сгенерировать идеи",
        "regenerate": "Обновить",
        "costHint": "Списывает 1 действие ИИ, когда дневной бесплатный лимит исчерпан.",
        "loadingTitle": "Готовим идеи…",
        "loadingBody": "Читаем склад, спрашиваем модель, собираем рецепты и считаем себестоимость по вашим ценам.",
        "errorTitle": "Не удалось загрузить",
        "errorBody": "Попробуйте ещё раз через минуту.",
        "errorQuotaTitle": "Кончились действия ИИ",
        "errorQuotaBody": "Дневной бесплатный лимит и кошелёк пусты. Пополните, чтобы продолжить, или дождитесь сброса завтра.",
        "retry": "Повторить",
        "topUp": "Пополнить кошелёк",
        "emptyResultsTitle": "Нет подходящих блюд",
        "emptyResultsBody": "Не удалось подобрать рецепты под ваш текущий склад. Попробуйте добавить базовые продукты.",
        "canCookTitle": "Можно готовить сейчас",
        "canCookSubtitle": "{count, plural, one {# блюдо} few {# блюда} many {# блюд} other {# блюд}} полностью покрыты складом",
        "almostTitle": "Почти готово",
        "almostSubtitle": "{count, plural, one {# блюдо} few {# блюда} many {# блюд} other {# блюд}} — не хватает 1–2 ингредиентов",
        "strategicTitle": "Стратегический выбор",
        "strategicSubtitle": "{count, plural, one {# блюдо} few {# блюда} many {# блюд} other {# блюд}} ради короткого похода в магазин",
        "missing": "{count, plural, one {Не хватает # ингредиента} few {Не хватает # ингредиентов} many {Не хватает # ингредиентов} other {Не хватает # ингредиентов}}",
        "showRecipe": "Показать рецепт",
        "hideRecipe": "Скрыть рецепт",
        "ingredients": "Ингредиенты",
        "steps": "Шаги",
        "insight": {
            "totalIngredients": "На складе",
            "daysLeft": "Дней хватит",
            "atRisk": "Истекают",
            "atRiskList": "Истекают в ближайшие 3 дня",
            "wasteRisk": "Риск списания"
        },
        "personalization": {
            "title": "Подобрано для вас",
            "goal": "Цель: {goal}",
            "diet": "Диета: {diet}",
            "kcal": "{kcal} ккал/день",
            "allergens": "Без: {list}"
        },
        "unlock": {
            "title": "Откройте больше рецептов"
        },
        "badges": {
            "usesExpiring": "Анти-списание",
            "highProtein": "Высокий белок",
            "budget": "Эконом",
            "confidenceStrong": "Сильный матч"
        },
        "stats": {
            "kcal": "ккал",
            "servings": "порций",
            "time": "время"
        },
        "econ": {
            "cost": "Себестоимость",
            "suggested": "Цена в меню",
            "margin": "Маржа",
            "wasteSaved": "Спасено от списания"
        },
        "nutrition": {
            "kcal": "ккал",
            "protein": "белок",
            "fat": "жиры",
            "carbs": "углеводы"
        }
    },
    "pl": {
        "title": "Co ugotować",
        "subtitle": "Pomysły na dania z Twojego stanu magazynu wygenerowane przez AI. Najpierw walka z marnotrawstwem, realne ceny, bez zmyślonych liczb.",
        "idleTitle": "Gotowi do startu?",
        "idleBody": "Kliknij Generuj — ChefOS przeanalizuje Twój magazyn, preferencje i terminy ważności i zaproponuje, co ugotować teraz.",
        "generate": "Generuj propozycje",
        "regenerate": "Odśwież",
        "costHint": "Zużywa 1 akcję AI po wyczerpaniu darmowego dziennego limitu.",
        "loadingTitle": "Tworzymy pomysły…",
        "loadingBody": "Czytamy magazyn, pytamy model, składamy receptury i wyliczamy koszt z Twoich cen.",
        "errorTitle": "Nie udało się załadować",
        "errorBody": "Spróbuj ponownie za chwilę.",
        "errorQuotaTitle": "Koniec akcji AI",
        "errorQuotaBody": "Twój darmowy dzienny limit i portfel są puste. Doładuj, aby kontynuować, lub poczekaj do jutra.",
        "retry": "Spróbuj ponownie",
        "topUp": "Doładuj portfel",
        "emptyResultsTitle": "Brak pasujących dań",
        "emptyResultsBody": "Nie znaleźliśmy odpowiednich receptur z aktualnego magazynu. Dodaj kilka podstawowych produktów.",
        "canCookTitle": "Możesz gotować teraz",
        "canCookSubtitle": "{count, plural, one {# danie} few {# dania} many {# dań} other {# dań}} w pełni pokryte magazynem",
        "almostTitle": "Prawie gotowe",
        "almostSubtitle": "{count, plural, one {# danie} few {# dania} many {# dań} other {# dań}} — brakuje 1–2 składników",
        "strategicTitle": "Wybór strategiczny",
        "strategicSubtitle": "{count, plural, one {# danie} few {# dania} many {# dań} other {# dań}} warte krótkich zakupów",
        "missing": "{count, plural, one {Brakuje # składnika} few {Brakuje # składników} many {Brakuje # składników} other {Brakuje # składników}}",
        "showRecipe": "Pokaż przepis",
        "hideRecipe": "Ukryj przepis",
        "ingredients": "Składniki",
        "steps": "Kroki",
        "insight": {
            "totalIngredients": "W magazynie",
            "daysLeft": "Wystarczy dni",
            "atRisk": "Kończą się",
            "atRiskList": "Wygasają w ciągu 3 dni",
            "wasteRisk": "Ryzyko marnotrawstwa"
        },
        "personalization": {
            "title": "Dobrane dla Ciebie",
            "goal": "Cel: {goal}",
            "diet": "Dieta: {diet}",
            "kcal": "{kcal} kcal/dzień",
            "allergens": "Bez: {list}"
        },
        "unlock": {
            "title": "Odblokuj więcej receptur"
        },
        "badges": {
            "usesExpiring": "Anty-marnotrawstwo",
            "highProtein": "Dużo białka",
            "budget": "Ekonomicznie",
            "confidenceStrong": "Mocne dopasowanie"
        },
        "stats": {
            "kcal": "kcal",
            "servings": "porcji",
            "time": "czas"
        },
        "econ": {
            "cost": "Koszt produktów",
            "suggested": "Cena w menu",
            "margin": "Marża",
            "wasteSaved": "Uratowane od strat"
        },
        "nutrition": {
            "kcal": "kcal",
            "protein": "białko",
            "fat": "tłuszcz",
            "carbs": "węgle"
        }
    },
    "uk": {
        "title": "Що приготувати",
        "subtitle": "Ідеї страв із ваших залишків, згенеровані ШІ. Насамперед боротьба зі списанням, реальні ціни, без вигаданих чисел.",
        "idleTitle": "Готові почати?",
        "idleBody": "Натисніть «Згенерувати» — ChefOS подивиться склад, ваші вподобання й терміни придатності та підкаже, що приготувати зараз.",
        "generate": "Згенерувати ідеї",
        "regenerate": "Оновити",
        "costHint": "Витрачає 1 дію ШІ, коли денний безкоштовний ліміт вичерпано.",
        "loadingTitle": "Готуємо ідеї…",
        "loadingBody": "Читаємо склад, питаємо модель, збираємо рецепти й рахуємо собівартість за вашими цінами.",
        "errorTitle": "Не вдалося завантажити",
        "errorBody": "Спробуйте ще раз за хвилину.",
        "errorQuotaTitle": "Закінчилися дії ШІ",
        "errorQuotaBody": "Денний безкоштовний ліміт і гаманець порожні. Поповніть, щоб продовжити, або дочекайтеся завтрашнього скидання.",
        "retry": "Повторити",
        "topUp": "Поповнити гаманець",
        "emptyResultsTitle": "Немає відповідних страв",
        "emptyResultsBody": "Не вдалося підібрати рецепти під ваш поточний склад. Спробуйте додати базові продукти.",
        "canCookTitle": "Можна готувати зараз",
        "canCookSubtitle": "{count, plural, one {# страва} few {# страви} many {# страв} other {# страв}} повністю покриті складом",
        "almostTitle": "Майже готово",
        "almostSubtitle": "{count, plural, one {# страва} few {# страви} many {# страв} other {# страв}} — бракує 1–2 інгредієнтів",
        "strategicTitle": "Стратегічний вибір",
        "strategicSubtitle": "{count, plural, one {# страва} few {# страви} many {# страв} other {# страв}} заради короткого походу в магазин",
        "missing": "{count, plural, one {Бракує # інгредієнта} few {Бракує # інгредієнтів} many {Бракує # інгредієнтів} other {Бракує # інгредієнтів}}",
        "showRecipe": "Показати рецепт",
        "hideRecipe": "Сховати рецепт",
        "ingredients": "Інгредієнти",
        "steps": "Кроки",
        "insight": {
            "totalIngredients": "На складі",
            "daysLeft": "Днів вистачить",
            "atRisk": "Спливає термін",
            "atRiskList": "Спливає протягом 3 днів",
            "wasteRisk": "Ризик списання"
        },
        "personalization": {
            "title": "Підібрано для вас",
            "goal": "Ціль: {goal}",
            "diet": "Дієта: {diet}",
            "kcal": "{kcal} ккал/день",
            "allergens": "Без: {list}"
        },
        "unlock": {
            "title": "Відкрийте більше рецептів"
        },
        "badges": {
            "usesExpiring": "Анти-списання",
            "highProtein": "Багато білка",
            "budget": "Економно",
            "confidenceStrong": "Сильний матч"
        },
        "stats": {
            "kcal": "ккал",
            "servings": "порцій",
            "time": "час"
        },
        "econ": {
            "cost": "Собівартість",
            "suggested": "Ціна в меню",
            "margin": "Маржа",
            "wasteSaved": "Врятовано від списання"
        },
        "nutrition": {
            "kcal": "ккал",
            "protein": "білок",
            "fat": "жири",
            "carbs": "вуглеводи"
        }
    },
}

for locale, nav_label in NAV.items():
    p = ROOT / "messages" / locale / "app.json"
    data = json.loads(p.read_text(encoding="utf-8"))
    app = data.setdefault("app", {})
    nav = app.setdefault("nav", {})
    nav["cookNow"] = nav_label
    app["cookNow"] = COOK[locale]
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"✅ {p.relative_to(ROOT)}")
