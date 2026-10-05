# Monge — сайт (dima-fomin.pl)

Сайт программы Monge: продажа подписки, библиотека моделей для производства, 3D-просмотр в браузере.
Три языка: `/pl` (по умолчанию), `/ru`, `/en`.

## Технологии

- Next.js 16 (App Router, React 19, React Compiler), Tailwind CSS 4
- Cloudflare Workers через OpenNext; **D1** — каталог и заявки, **R2** — файлы моделей
- three.js r177 — локально в `public/vendor/three` (import map в `app/[locale]/layout.tsx`), загружается только там, где есть 3D

## Страницы

| Путь | Что |
|---|---|
| `/[locale]` | главная: живая 3D-модель, процесс, возможности, витрина, цены, FAQ, заявка |
| `/[locale]/library`, `/library/[slug]` | библиотека и карточка модели с 3D-просмотром |
| `/[locale]/pricing`, `/download`, `/contact`, `/privacy` | цены, скачать, заявка, конфиденциальность |
| `/api/lead` | POST заявки → D1 `leads` |
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
