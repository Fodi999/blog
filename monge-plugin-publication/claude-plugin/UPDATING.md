# Как обновлять Monge CAD (сервер MCP и плагин для Claude)

Инструменты живут **на сервере** `https://dima-fomin.pl/mcp` (`lib/mcp.ts`), а не в плагине. Плагин — это адрес сервера
(`.mcp.json`), навык с инструкциями для Claude (`skills/monge-cad/SKILL.md`) и описание (`.claude-plugin/plugin.json`).

## Что менять и нужно ли перезагружать плагин

| Что меняется | Где | Перезагрузить плагин? |
|---|---|---|
| Новый или исправленный инструмент | `lib/mcp.ts` (+ тест в `scripts/test/mcp_check.py`) | **нет** — после выкладки обновить коннектор в Claude и открыть новый чат |
| Окно 3D (HTML/JS) | `mcp-app/`, затем `npm run build:mcp-viewer`; **новый** `VIEWER_URI` (`ui://monge/model-viewer-vN.html`) в `lib/mcp-viewer.ts`, прежний — в `VIEWER_URIS_OLD` | нет |
| Когда и как Claude зовёт инструменты | `skills/monge-cad/SKILL.md` | **да** |
| Адрес сервера, название, описание, логотип | `.mcp.json`, `.claude-plugin/plugin.json`, `logo.png` | **да** |

## Порядок выпуска нового инструмента

1. **Разработка** — в ветке (не `main`), локально `next dev`; тест в `scripts/test/mcp_check.py`.
2. **Тестовая версия** — только предпросмотр, рабочий сайт не меняется:
   ```bash
   npx opennextjs-cloudflare build
   npx opennextjs-cloudflare upload --preview-alias monge-mcp-test
   python3 scripts/test/mcp_check.py https://monge-mcp-test-blog.fodi85999.workers.dev
   ```
3. **Проверка в Claude** — второй коннектор «monge-cad-test» с адресом `https://monge-mcp-test-blog.fodi85999.workers.dev/mcp`
   («Без входа»). После каждой загрузки: коннектор → обновить (или отключить и подключить) → **новый** чат.
   Диагностика окон: инструмент `monge_ui_test` (есть только на тестовом адресе).
4. **Одобрение** — «да» от Димы.
5. **Выпуск** — слияние в `main` → выкладка на dima-fomin.pl → проверки на рабочем сайте:
   ```bash
   python3 scripts/test/mcp_check.py https://dima-fomin.pl
   python3 scripts/test/catalog_queries.py https://dima-fomin.pl
   python3 monge-plugin-publication/tests/run_scenarios.py
   ```
6. **В Claude** — основной коннектор `monge-cad` → обновить → новый чат. Новый инструмент появится без перезагрузки плагина.
7. **Если изменился навык или описание** — поднять `version` в `plugin.json` и собрать архив:
   ```bash
   npm run plugin:claude            # проверка + monge-cad.zip, копия на Рабочем столе
   ```
   В Claude: плагин Monge CAD → «Файлы» → «Изменить» → новый `monge-cad.zip`.
   Тестовый архив с адресом тестового сервера: `npm run plugin:claude -- test`.

## Номера версий

- **Плагин** (`plugin.json` → `version`) — только при изменении архива: 0.2.0 → 0.2.1 (правки навыка), 0.3.0 (новые возможности).
- **Сервер** — `MCP_SERVER.version` в `lib/mcp.ts` и `version` в `mcp/server.json` (реестр MCP), одинаково, при каждом выпуске инструментов.
- **Окно** — новый `ui://monge/model-viewer-vN.html` при каждом изменении страницы.

## Совместимость с уже установленными плагинами

- Инструменты не переименовывать и не удалять — только добавлять; новые аргументы — необязательные.
- Старые адреса окон (`VIEWER_URIS_OLD`) продолжают отвечать.
- Навык только расширять.

Тогда установленная версия плагина продолжает работать, а новые инструменты появляются после обновления коннектора.

## Безопасность публикации

- На dima-fomin.pl попадает только `main` (Cloudflare Workers Builds: production branch `main`; для других веток —
  `npx opennextjs-cloudflare upload` или сборки выключены). Пока это не подтверждено — любая отправленная ветка = выкладка.
- Ничего не выкладывать и не отправлять без «да».
