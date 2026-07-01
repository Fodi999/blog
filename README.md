# Dima Fomin

Minimalny publiczny serwis zbudowany od zera w Next.js.

## Strony

- `/` — strona główna
- `/blog` — artykuły publikowane z panelu administracyjnego
- `/blog/[slug]` — treść artykułu
- `/sklep` — aktywne produkty z panelu administracyjnego
- `/sklep/[slug]` — karta produktu
- `/o-mnie`
- `/kontakt`

## Technologie

- Next.js App Router
- TypeScript
- zwykły CSS w `app/globals.css`
- publiczne API backendu

Projekt nie używa Tailwind CSS, next-intl ani biblioteki komponentów UI.

```bash
npm install
npm run dev
npm run build
```

## Konfiguracja CRM

`blog` jest publicznym frontendem dla site `kitchen` w Admin CRM.

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_API_URL` — adres Rust API.
- `NEXT_PUBLIC_SITE_KEY=kitchen` — jawna izolacja danych CMS/sklepu dla bloga.
- `REVALIDATE_SECRET` — sekret dla `POST /api/revalidate` po publikacji treści z panelu.
