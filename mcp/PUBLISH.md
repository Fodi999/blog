# Monge MCP — публикация в официальном MCP Registry

Сервер: `https://dima-fomin.pl/mcp` (код — `lib/mcp.ts`, маршрут — `app/mcp/route.ts`, документация — `/{ru,pl,en}/mcp`).
Описание для реестра — `mcp/server.json` (проверено по схеме `2025-12-11/server.schema.json`).

Имя `pl.dima-fomin/monge` подтверждается владением доменом dima-fomin.pl через HTTP:
реестр читает `https://dima-fomin.pl/.well-known/mcp-registry-auth` (файл `public/.well-known/mcp-registry-auth`,
в нём только открытый ключ). Закрытый ключ лежит вне репозитория: `~/.monge/mcp-registry/key.pem` (права 600) —
не коммитить и никому не передавать.

## Шаги

1. Убедиться, что файл доступен и отдаётся без редиректа (реестр ходит с User-Agent `mcp-registry/1.0` из Google Cloud;
   если Cloudflare его заблокирует — разрешить этот путь в правилах безопасности):

   ```bash
   curl -s -A "mcp-registry/1.0" https://dima-fomin.pl/.well-known/mcp-registry-auth
   ```

2. Установить `mcp-publisher` (macOS): `brew install mcp-publisher`
   (или бинарник со страницы релизов github.com/modelcontextprotocol/registry).

3. Войти, подписав ключом домена:

   ```bash
   MCP_PRIVATE_KEY="$(openssl pkey -in ~/.monge/mcp-registry/key.pem -noout -text | sed -n '/priv:/,/pub:/p' | sed '1d;$d' | tr -d ' :\n')" \
     mcp-publisher login http --domain dima-fomin.pl
   ```

4. Опубликовать из папки `mcp/`:

   ```bash
   cd mcp && mcp-publisher publish
   ```

5. Проверить запись:

   ```bash
   curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=pl.dima-fomin/monge"
   ```

Новая версия сервера: поднять `version` в `server.json` и в `MCP_SERVER.version` (`lib/mcp.ts`), опубликовать снова.

## Чего реестр не делает

Запись в реестре помогает клиентам и каталогам найти сервер. Ни один ИИ-ассистент не подключает сервер сам —
каждый пользователь добавляет его в своём клиенте (инструкции — на странице /mcp).
