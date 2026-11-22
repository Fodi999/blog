# Monge — сайт (dima-fomin.pl)

Сайт программы Monge, пока она в разработке: что это и для чего, собственное закрытое ядро и протокол его
испытаний, ход работ, разработчик, запись в закрытую бету; библиотека моделей с 3D-просмотром в браузере.
Три языка: `/pl` (по умолчанию), `/ru`, `/en`.

**Состояние Monge — в одном месте: `lib/status.ts`** (версия, даты, тесты, случаи ядра, бенчмарки). После
проверки программы (`./tools/check_kernel.sh` в репозитории Monge) поправьте числа там — все страницы обновятся.
Числа случаев ядра — из `python3 tools/cases.py` (входящие по видам: скругления и фаски, булевы, остальное → `cases.openRounding / openBoolean / openOther`).
Снимки и кадры роликов — `public/media` + `lib/media.ts` (галерея главной — `gallery` в `app/[locale]/page.tsx`).
Тексты — `lib/dict/{pl,ru,en}.ts` (форма задаётся `ru.ts`), в них `{version}`, `{passed}` и т. п. подставляет `fill()`.

## Технологии

- Next.js 16 (App Router, React 19, React Compiler), Tailwind CSS 4
- Cloudflare Workers через OpenNext; **D1** — каталог и заявки, **R2** — файлы моделей
- three.js r177 — локально в `public/vendor/three` (import map в `app/[locale]/layout.tsx`), загружается только там, где есть 3D
- Шрифты свои, без сервиса шрифтов: `public/fonts` (Sofia Sans, Sofia Sans Condensed, JetBrains Mono — SIL OFL, лицензии рядом); снимки программы — `public/media`

## Страницы

| Путь | Что |
|---|---|
| `/[locale]` | главная: живая 3D-модель и основная надпись (стадия, версия, начало, разработчик, проверка), снимки программы, направления, ядро, протокол испытаний, ход работ, разработчик, запись в бету, вопросы |
| `/[locale]/kernel` | ядро: что умеет, протокол испытаний, память ошибок, чего пока не умеет, как проверяем |
| `/[locale]/about` | разработчик (старый адрес `/o-mnie` ведёт сюда) |
| `/[locale]/download` | скачивание откроется с бетой; платформы, требования, запись в бету |
| `/[locale]/library`, `/library/[slug]` | библиотека (генераторы по стандартам и изделия) и карточка модели с 3D-просмотром, параметрами и стандартами |
| `/[locale]/library/standards`, `/library/standards/[std]` | все таблицы стандартов Monge (ISO, DIN, EN) и полная таблица с источниками |
| `/[locale]/contact`, `/privacy` | заявка, конфиденциальность |
| `/[locale]/pricing` | временно ведёт на `/download` (цены объявим к выпуску) |
| `/api/lead` | POST заявки → D1 `leads` (виды: `beta` — запись в бету, `pilot`, `custom`, `other`) |
| `/api/library` | каталог JSON (для программы Monge) |
| `/api/files/<key>` | файлы из R2 (бесплатные — всем, Pro — 402 до подключения лицензий) |

Старые адреса блога/магазина перенаправляются на главную (`next.config.ts`).

## Первый запуск в облаке

```bash
npx wrangler d1 create monge              # скопировать database_id в wrangler.jsonc
npx wrangler r2 bucket create monge-files
npm run db:migrate                        # таблицы items + leads (и каталог)
npm run db:seed                           # каталог из data/library.json → D1
npm run files:upload                      # r2/models/** → R2 (STEP для Pro)
npm run deploy
```

## Таблицы стандартов

`data/standards.json` — те же числа, по которым Monge строит библиотеку (`geometry_engine::standards`). Обновить:
в окне Monge выполнить скрипт, который собирает `fastener_table(id)` всех таблиц в JSON-массив, сохранить его как
`<папка>/standards.json`, затем `python3 scripts/standards-json.py <папка> data/standards.json`. Ссылки на копии
текстов стандартов на сайт не попадают — только название документа или имя справочного сайта. Названия таблиц на трёх
языках и единицы — `lib/standards.ts`.

## Обложки моделей

`scripts/poster.html` рисует GLB тем же светом, что 3D-просмотр сайта, на прозрачном фоне 1200×900: положить рядом
`vendor/three` и `<slug>.glb`, открыть через локальный сервер `index.html?m=<slug>.glb&yaw=-30&pitch=22&rot=0,0,0`
и снять headless Chrome (`--screenshot --default-background-color=00000000`), затем `cwebp -q 86 -alpha_q 90`.

## Скачивание моделей библиотеки

Каждое готовое исполнение генераторов Monge — файлы STEP, STL, 3MF (ось Z вверх, мм) и GLB в R2 под
`downloads/<slug>/<id>/`. Карточка детали показывает их конфигуратором (`components/PartConfigurator.tsx`,
данные — `data/downloads.json`). Обновить после новой версии библиотеки: запустить тестовое окно Monge (порт 9899),
затем `scripts/monge/export_library.py` → `scripts/monge/check_files.py` → `scripts/downloads-json.py` → загрузка
`scripts/monge/put_r2.sh` (порядок и аргументы — в начале `export_library.py`). Публикуется только то, что прошло
все проверки. Скачивания считаются в D1 `downloads` (`migrations/0003_downloads.sql`).

## Monge Catalog API и машиночитаемый каталог

- `lib/catalog.ts` — записи моделей (одна на геометрию: часть--размер--исполнение) из `data/library.json`,
  `data/downloads.json` и таблиц стандартов; поиск с разбором обозначений (M12x60, 6204-2RS, Ø16) на трёх языках.
- `/api/v1`, `/api/v1/models?q=…`, `/api/v1/models/{id}`, `/api/v1/catalog` — только чтение, CORS открыт, кэш 5 мин.
- `/api/files/…`: GET и HEAD, Content-Length, Range (206/416), CORS для `downloads/`, `Repr-Digest` (SHA-256 из
  каталога); `?download=1` — скачивание и счётчик; просмотр GLB и HEAD не считаются.
- Изображение каждого размера — рендер его геометрии: `downloads/<slug>/<size>/<slug>-<size>.webp`.
- Документация — `/[locale]/developers`, карта для языковых моделей — `public/llms.txt`.
- Роботы — `app/robots.ts`: страницы, `/api/v1/` и файлы открыты всем; роботы для обучения моделей закрыты
  (`ALLOW_TRAINING`).
- Проверка на запросах: `python3 scripts/test/catalog_queries.py https://dima-fomin.pl`.

## Как добавить модель

1. В Monge: экспорт STEP (и превью GLB/рендер).
2. Положить `public/library/<slug>/model.glb` и `render.webp`, STEP — в `r2/models/<slug>/`.
3. Добавить запись в `data/library.json`, затем `npm run db:seed && npm run files:upload`.
   Что есть в библиотеке, решает `data/library.json` (только детали библиотеки Monge): строка D1 может поменять
   текст или скрыть запись (`published = 0`), но запись, которой нет в каталоге, на сайте не показывается.
   У генератора библиотеки Monge есть `standards`, `params`, `configs`, `shown`.

Заявки: `npx wrangler d1 execute monge --remote --command "SELECT created_at, kind, name, email, company FROM leads ORDER BY id DESC LIMIT 20"`.
