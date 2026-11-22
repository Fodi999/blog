# Monge CAD — итоговый отчёт для отправки на проверку OpenAI

Состояние на 2026-11-22. Всё ниже проверено на рабочем сайте после последнего деплоя.
Тексты для полей формы — на английском (их можно копировать как есть); пояснения — по-русски.

## 1. Поля формы

| Поле | Значение |
|---|---|
| App name | Monge CAD |
| Short description | Kernel-checked CAD models of ISO, DIN and EN parts: STEP, STL, 3MF, GLB. |
| Full description | `listing.md` → English (есть ru / pl) |
| MCP server URL | https://dima-fomin.pl/mcp |
| Transport / auth | Streamable HTTP · no authentication · read-only |
| Website | https://dima-fomin.pl |
| Documentation | https://dima-fomin.pl/en/mcp |
| Privacy policy | https://dima-fomin.pl/en/privacy |
| Terms of use | https://dima-fomin.pl/en/terms |
| File licence | https://dima-fomin.pl/en/license |
| Support contact | почта автора со страницы https://dima-fomin.pl/en/contact |
| Logo | `logo/monge-cad-1024.png` (1024×1024), `logo/monge-cad-128.png` (128×128); светлые варианты — `*-light.png` |
| Test prompts | `tests/scenarios.md` — P1–P5, N1–N3 |

## 2. Сервер и инструменты

- Один MCP-сервер, версия 1.0.0; протокол 2024-11-05 … 2025-11-25 (initialize) и 2026-07-28 (без состояния).
- `search_models`, `get_model`, `get_download_links` — все `readOnlyHint: true`, `destructiveHint: false`, со схемами входа и выхода.
- Ничего не подменяется: нет размера — `not_found`, пустые `results`, ближайшие отдельно в `nearest` с отличиями.
- Ссылки только на бесплатные файлы библиотеки; Pro-файлы недоступны.
- Инструкция сервера называет реальное покрытие библиотеки (болты M1.6–M64, винты ISO 4762 M1.6–M36, подшипники серий 60/62/63 …).

## 3. Данные и конфиденциальность (для вопросов рецензента)

Data handling (English, for the form):

> Monge CAD is read-only and needs no account. The server receives only what the AI client passes to a tool — usually search words, sizes and model ids — plus technical data (IP address, user agent); it does not receive the user's conversation. Requests are used only to answer. For rate limiting the server keys counts by a daily-rotated SHA-256 hash of the IP address, never the address itself, and deletes counts once their one-minute window is over. Cloudflare Workers Logs keep request metadata (time, URL, status; may include IP and headers) for 7 days for operation and security; MCP tool arguments travel in the request body and are not logged. No profiling, no sale of data, no use of requests for model training.

Как это обеспечено и проверено:

| Утверждение | Где / чем подтверждено |
|---|---|
| Сервер не получает переписку, только аргументы инструмента | протокол MCP: клиент сам формирует `tools/call`; `lib/mcp.ts` |
| Персональные данные в запросах не исключаются | политика прямо говорит: всё, что ассистент положил в запрос, доходит до нас |
| Ключ лимита — SHA-256(адрес + дата UTC), не адрес | `lib/mcp.ts` (`limitKey`); тест «key holds no address», «next day → another key» |
| Записи лимита старше минуты удаляются | `sweep()` раз в ≤ 10 с при обслуживании запросов; тест `scripts/test/mcp_limiter.test.mts` — 9/9 |
| Workers Logs — 7 дней | документация Cloudflare: Workers Logs, Workers Paid — 7 Days; с 2026-12-01 Observability — 7 дней по умолчанию |
| Аргументы MCP не пишутся в журнал | они в теле POST; сервер логирует только имя метода при внутренней ошибке |

## 4. Проверки на рабочем сайте

| Проверка | Результат |
|---|---|
| Протокол и инструменты (`scripts/test/mcp_check.py`) | 60 / 60 |
| Каталог (`scripts/test/catalog_queries.py`) | 33 / 33 |
| Сценарии рецензента (`tests/run_scenarios.py`) | 8 / 8 |
| Ограничитель (`scripts/test/mcp_limiter.test.mts`) | 9 / 9 |
| MCP Inspector 2.16.0 | список инструментов, поиск, карточка, ссылки — верно |
| Независимый клиент (Python MCP SDK, без доступа к коду) | 7 / 7 шагов; найденная ошибка фильтра исправлена |
| SHA-256 STEP болта ISO 4017 M12×60 | `3103e5c0be8ccdf1554b6524d4dcb2633394fff899d203a18e9b3c46a83324de` — совпадает (shasum, openssl, Repr-Digest) |
| Нагрузка (Workers Paid, CPU 30 с) | 2 403 страницы — 0 ошибок; 50 параллельных вызовов — 0 ошибок, нет 1102 |
| Политика ru / pl / en, условия, лицензия, контакты, документация | 200; новые формулировки на месте; ссылки работают |

## 5. Известные ограничения (честно сказать, если спросят)

- `standard.edition` содержит дату проверки таблицы, а не год редакции ISO.
- Картинка размера показывает его исполнение по умолчанию (`image.of` это указывает).
- Заголовок STEP называет программу «RustCAD» и класс «8.8» — особенность экспорта Monge; ядро не менялось.
- Лимит около 60 запросов в минуту считается Cloudflare приблизительно.
- Публикация в каталоге не означает, что ChatGPT сам подключит приложение каждому пользователю.
