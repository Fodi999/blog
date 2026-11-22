# ЧЕРНОВИК — раздел политики конфиденциальности о MCP-сервере и API

Добавить в `/privacy` после раздела «Hosting and files». Проверь перед публикацией; это не юридическая консультация.
Факты в тексте соответствуют коду на 2026-11-22: `lib/mcp.ts`, `app/api/files`, `wrangler.jsonc` (observability включена).

---

## English

### Monge MCP and the catalogue API

The MCP server (dima-fomin.pl/mcp) and the catalogue API (dima-fomin.pl/api/v1) answer AI assistants (such as ChatGPT) and programs. They need no account and do not ask for personal data.

What they receive: the request itself — the search words, sizes and model ids the assistant sends — and technical data (IP address, user agent). We do not receive your name, your account with the assistant or your conversation; the assistant decides what it sends.

How it is used: to answer the request. The IP address counts requests for the rate limit (about 60 a minute) — in Cloudflare's rate limiter and in the server's memory, for at most one minute. Cloudflare keeps technical request logs for operation and security for a few days. We do not build profiles, do not sell data and do not use requests to train models. A file downloaded with `?download=1` adds one to that file's download count — nothing else is recorded.

---

## Русский

### Monge MCP и API каталога

MCP-сервер (dima-fomin.pl/mcp) и API каталога (dima-fomin.pl/api/v1) отвечают ИИ-ассистентам (например, ChatGPT) и программам. Они не требуют аккаунта и не запрашивают персональные данные.

Что они получают: сам запрос — слова поиска, размеры и идентификаторы моделей, которые отправляет ассистент, — и технические данные (IP-адрес, user agent). Ваше имя, ваш аккаунт у ассистента и ваш разговор мы не получаем; что отправить, решает ассистент.

Как это используется: чтобы ответить на запрос. IP-адрес служит для подсчёта запросов в рамках лимита (около 60 в минуту) — в ограничителе Cloudflare и в памяти сервера, не дольше минуты. Cloudflare хранит технические журналы запросов для работы и защиты сайта несколько дней. Мы не составляем профили, не продаём данные и не используем запросы для обучения моделей. Скачивание файла со ссылкой `?download=1` добавляет единицу к счётчику скачиваний этого файла — больше ничего не записывается.

---

## Polski

### Monge MCP i API katalogu

Serwer MCP (dima-fomin.pl/mcp) i API katalogu (dima-fomin.pl/api/v1) odpowiadają asystentom AI (np. ChatGPT) i programom. Nie wymagają konta i nie proszą o dane osobowe.

Co otrzymują: samo zapytanie — słowa wyszukiwania, rozmiary i identyfikatory modeli wysłane przez asystenta — oraz dane techniczne (adres IP, user agent). Nie otrzymujemy Twojego imienia, konta u asystenta ani rozmowy; o tym, co wysłać, decyduje asystent.

Jak są używane: aby odpowiedzieć na zapytanie. Adres IP służy do liczenia zapytań w ramach limitu (około 60 na minutę) — w ograniczniku Cloudflare i w pamięci serwera, najdłużej przez minutę. Cloudflare przechowuje techniczne logi zapytań przez kilka dni w celu działania i ochrony strony. Nie tworzymy profili, nie sprzedajemy danych i nie używamy zapytań do trenowania modeli. Pobranie pliku z linkiem `?download=1` dodaje jeden do licznika pobrań tego pliku — nic więcej nie jest zapisywane.
