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
