#!/usr/bin/env python3
"""Update wallet i18n: rename labels & add walletHistory namespace."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MESSAGES = ROOT / "messages"

# Updated wallet card labels (no more 'purchasedTotal'/'bonusCredits'/'noBonus' usage).
WALLET = {
    "en": {
        "title": "AI Wallet",
        "availableBadge": "Available · {count}",
        "actionsAvailable": "actions available",
        "realPurchased": "Real purchases",
        "bonus": "Bonuses",
        "grantedTotal": "Total credited",
        "used": "Spent",
        "topUp": "Top up",
        "history": "History",
    },
    "ru": {
        "title": "AI-Кошелёк",
        "availableBadge": "Доступно · {count}",
        "actionsAvailable": "действий доступно",
        "realPurchased": "Реально куплено",
        "bonus": "Бонусы",
        "grantedTotal": "Всего начислено",
        "used": "Потрачено",
        "topUp": "Пополнить",
        "history": "История",
    },
    "pl": {
        "title": "Portfel AI",
        "availableBadge": "Dostępne · {count}",
        "actionsAvailable": "dostępnych akcji",
        "realPurchased": "Realne zakupy",
        "bonus": "Bonusy",
        "grantedTotal": "Łącznie przyznane",
        "used": "Wydane",
        "topUp": "Doładuj",
        "history": "Historia",
    },
    "uk": {
        "title": "AI-Гаманець",
        "availableBadge": "Доступно · {count}",
        "actionsAvailable": "дій доступно",
        "realPurchased": "Реально куплено",
        "bonus": "Бонуси",
        "grantedTotal": "Всього нараховано",
        "used": "Витрачено",
        "topUp": "Поповнити",
        "history": "Історія",
    },
}

WALLET_HISTORY = {
    "en": {
        "title": "Wallet history",
        "subtitle": "All credits and debits on your AI Wallet, newest first.",
        "back": "Back to dashboard",
        "refresh": "Refresh",
        "retry": "Retry",
        "errorTitle": "Couldn't load history",
        "errorBody": "Please try again in a moment.",
        "emptyTitle": "No transactions yet",
        "emptyBody": "Your wallet activity will appear here once you receive a bonus or make a purchase.",
        "freeBadge": "free",
        "sources": {
            "iap": "Stripe purchase",
            "welcome_bonus": "Welcome bonus",
            "weekly_bonus": "Weekly bonus",
            "promo": "Promo credit",
            "generate_plan": "Meal plan generated",
            "create_recipe": "Recipe created",
            "scan_receipt": "Receipt scanned",
            "optimize_day": "Day optimized",
            "ai_chat": "AI chat message",
        },
    },
    "ru": {
        "title": "История кошелька",
        "subtitle": "Все начисления и списания на AI-кошельке, новые сверху.",
        "back": "Назад к дашборду",
        "refresh": "Обновить",
        "retry": "Повторить",
        "errorTitle": "Не удалось загрузить историю",
        "errorBody": "Попробуйте ещё раз через мгновение.",
        "emptyTitle": "Транзакций пока нет",
        "emptyBody": "Активность кошелька появится здесь после первого бонуса или покупки.",
        "freeBadge": "бесплатно",
        "sources": {
            "iap": "Покупка через Stripe",
            "welcome_bonus": "Приветственный бонус",
            "weekly_bonus": "Еженедельный бонус",
            "promo": "Промо-начисление",
            "generate_plan": "Сгенерирован план питания",
            "create_recipe": "Создан рецепт",
            "scan_receipt": "Сканирован чек",
            "optimize_day": "Оптимизирован день",
            "ai_chat": "Сообщение AI-чата",
        },
    },
    "pl": {
        "title": "Historia portfela",
        "subtitle": "Wszystkie wpłaty i wypłaty z Portfela AI, od najnowszych.",
        "back": "Powrót do panelu",
        "refresh": "Odśwież",
        "retry": "Spróbuj ponownie",
        "errorTitle": "Nie udało się załadować historii",
        "errorBody": "Spróbuj ponownie za chwilę.",
        "emptyTitle": "Brak transakcji",
        "emptyBody": "Aktywność portfela pojawi się tu po pierwszym bonusie lub zakupie.",
        "freeBadge": "bezpłatne",
        "sources": {
            "iap": "Zakup Stripe",
            "welcome_bonus": "Bonus powitalny",
            "weekly_bonus": "Bonus tygodniowy",
            "promo": "Bonus promocyjny",
            "generate_plan": "Wygenerowano plan posiłków",
            "create_recipe": "Utworzono przepis",
            "scan_receipt": "Zeskanowano paragon",
            "optimize_day": "Zoptymalizowano dzień",
            "ai_chat": "Wiadomość czatu AI",
        },
    },
    "uk": {
        "title": "Історія гаманця",
        "subtitle": "Усі нарахування та списання на AI-гаманці, від найновіших.",
        "back": "Назад до дашборду",
        "refresh": "Оновити",
        "retry": "Повторити",
        "errorTitle": "Не вдалося завантажити історію",
        "errorBody": "Спробуйте ще раз за мить.",
        "emptyTitle": "Транзакцій поки немає",
        "emptyBody": "Активність гаманця з'явиться тут після першого бонусу або покупки.",
        "freeBadge": "безкоштовно",
        "sources": {
            "iap": "Покупка через Stripe",
            "welcome_bonus": "Вітальний бонус",
            "weekly_bonus": "Щотижневий бонус",
            "promo": "Промо-нарахування",
            "generate_plan": "Згенеровано план харчування",
            "create_recipe": "Створено рецепт",
            "scan_receipt": "Сканований чек",
            "optimize_day": "Оптимізовано день",
            "ai_chat": "Повідомлення AI-чату",
        },
    },
}


for locale in ["en", "ru", "pl", "uk"]:
    fp = MESSAGES / locale / "app.json"
    with fp.open("r", encoding="utf-8") as f:
        data = json.load(f)
    app = data.setdefault("app", {})
    app["wallet"] = WALLET[locale]
    app["walletHistory"] = WALLET_HISTORY[locale]
    with fp.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"✓ {locale}/app.json — wallet + walletHistory updated")

print("Done.")
