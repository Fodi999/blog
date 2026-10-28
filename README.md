# Monge — сайт (dima-fomin.pl)

Сайт программы Monge, пока она в разработке: что это и для чего, собственное закрытое ядро и протокол его
испытаний, ход работ, разработчик, запись в закрытую бету; библиотека моделей с 3D-просмотром в браузере.
Три языка: `/pl` (по умолчанию), `/ru`, `/en`.

**Состояние Monge — в одном месте: `lib/status.ts`** (версия, даты, тесты, случаи ядра, бенчмарки). После
проверки программы (`./tools/check_kernel.sh` в репозитории Monge) поправьте числа там — все страницы обновятся.
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
| `/[locale]/library`, `/library/[slug]` | библиотека и карточка модели с 3D-просмотром |
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

## Как добавить модель

1. В Monge: экспорт STEP (и превью GLB/рендер).
2. Положить `public/library/<slug>/model.glb` и `render.webp`, STEP — в `r2/models/<slug>/`.
3. Добавить запись в `data/library.json`, затем `npm run db:seed && npm run files:upload`.

Заявки: `npx wrangler d1 execute monge --remote --command "SELECT created_at, kind, name, email, company FROM leads ORDER BY id DESC LIMIT 20"`.
