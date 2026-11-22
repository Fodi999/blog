import type { Locale } from '@/lib/i18n';

/* The words of the Monge MCP page (/{locale}/mcp) in three languages. */

export type McpDocs = {
  title: string;
  lead: string;
  endpoint: string;
  facts: [string, string][];
  toolsTitle: string;
  tools: [string, string][];
  tryTitle: string;
  tryLead: string;
  asks: string[];
  connectTitle: string;
  connect: [string, string, string][]; // client, how, config / command
  stdioNote: string;
  checkTitle: string;
  checkLead: string;
  rulesTitle: string;
  rules: string[];
  registryTitle: string;
  registry: string;
  apiLink: string;
};

const url = 'https://dima-fomin.pl/mcp';
const vscode = `// .vscode/mcp.json\n{\n  "servers": {\n    "monge": { "type": "http", "url": "${url}" }\n  }\n}`;
const cursor = `// .cursor/mcp.json\n{\n  "mcpServers": {\n    "monge": { "url": "${url}" }\n  }\n}`;
const stdio = `{\n  "mcpServers": {\n    "monge": { "command": "npx", "args": ["-y", "mcp-remote", "${url}"] }\n  }\n}`;
const claudeCode = `claude mcp add --transport http monge ${url}`;

export const MCP_DOCS: Record<Locale, McpDocs> = {
  en: {
    title: 'Monge MCP — the library for AI assistants',
    lead: 'A public MCP server of the Monge library: an assistant that supports the Model Context Protocol finds a standard part by size, reads its data and checks, and gets direct links to its STEP, STL, 3MF and GLB with SHA-256 checksums. Read-only, no account, free.',
    endpoint: 'Server address',
    facts: [
      ['Transport', 'Streamable HTTP, JSON answers'],
      ['Access', 'public, no registration, read-only'],
      ['Protocol', '2024-11-05 … 2025-11-25 (initialize) and 2026-07-28 (stateless)'],
      ['Data', 'the same catalogue as the site and /api/v1'],
    ],
    toolsTitle: 'Tools',
    tools: [
      ['search_models', 'Search by standard, size, length, thread type (exact — real helical, cosmetic, print — for printing), file format or words in English, Polish or Russian. "exact" — every result has everything asked. "not_found" — nothing has it: the result list is empty and the nearest models are listed apart, each with what differs. Nothing is substituted.'],
      ['get_model', 'Everything known of one model: standard, dimensions, thread, mass, the Monge kernel\'s checks of the geometry (and the print check for the print option), the image, the GLB for a 3D view, the other options of the same size.'],
      ['get_download_links', 'Direct links to the STEP, STL, 3MF and GLB with each file\'s size and SHA-256. Only the free library files.'],
      ['render_model_viewer', 'An interactive 3D view right in the chat (in clients that support MCP Apps, such as ChatGPT): the model\'s own GLB — rotate, zoom, pan, reset the view, full screen — with its standard, size, thread pitch, thread type and file links. Several models (e.g. a bolt and its nut) switch with tabs or stand side by side at true scale. Other clients get the same data as text with a link to the 3D view on the site.'],
    ],
    tryTitle: 'Ask your assistant',
    tryLead: 'With the server connected, ask in your own words:',
    asks: [
      'Find an ISO 4017 M12×60 bolt with a real thread and give me the STEP.',
      'Show me the M12×60 bolt and its nut side by side in 3D.',
      'Is there an M12×61 bolt in the Monge library? If not, what is closest?',
      'Give me the 3MF of an M8 nut for printing and its SHA-256.',
      'Which 6204 bearing variants does Monge have?',
    ],
    connectTitle: 'Connecting',
    connect: [
      ['Claude Code', 'One command in the terminal:', claudeCode],
      ['Claude (web and desktop)', 'Settings → Connectors → Add custom connector, and paste the address (where your plan allows custom connectors).', url],
      ['ChatGPT', 'Custom MCP connectors are added in developer mode, in the settings (where your plan offers it): a new connector, the address, no authentication.', url],
      ['VS Code', 'A file in the project (or the "MCP: Add Server" command):', vscode],
      ['Cursor', 'A file in the project or ~/.cursor/mcp.json:', cursor],
    ],
    stdioNote: 'A client that runs only local (stdio) servers can reach it through the mcp-remote bridge:',
    checkTitle: 'Check it yourself',
    checkLead: 'MCP Inspector, the protocol\'s official tool, lists the tools and calls them from the terminal:',
    rulesTitle: 'Rules and limits',
    rules: [
      'Read-only: no tool writes or changes anything. No account, no keys.',
      'About 60 requests a minute from one address (Cloudflare counts approximately, per location); above that — 429 with Retry-After.',
      'Web pages of other sites cannot call the server from a browser (the Origin check against DNS rebinding the protocol requires). Desktop and server clients, and MCP Inspector on your computer, are not affected. To call it from your site — write to us.',
      'Only the free library files are linked; Pro files are never available here.',
      'A model is never swapped for another: what was not found is reported as not found.',
      'The files are free to use, commercial use included; they may not be resold or redistributed as files (see the licence).',
    ],
    registryTitle: 'Discovery',
    registry: 'The server is described for the official MCP Registry (pl.dima-fomin/monge). A listing helps clients and catalogues find it, but no assistant connects to a server by itself: each person adds it in their client as above.',
    apiLink: 'The same data over plain HTTP — Monge Catalog API',
  },
  pl: {
    title: 'Monge MCP — biblioteka dla asystentów AI',
    lead: 'Publiczny serwer MCP biblioteki Monge: asystent obsługujący Model Context Protocol znajduje część znormalizowaną po rozmiarze, odczytuje jej dane i kontrole oraz dostaje bezpośrednie linki do STEP, STL, 3MF i GLB z sumami SHA-256. Tylko odczyt, bez konta, bezpłatnie.',
    endpoint: 'Adres serwera',
    facts: [
      ['Transport', 'Streamable HTTP, odpowiedzi JSON'],
      ['Dostęp', 'publiczny, bez rejestracji, tylko odczyt'],
      ['Protokół', '2024-11-05 … 2025-11-25 (initialize) i 2026-07-28 (bezstanowy)'],
      ['Dane', 'ten sam katalog co strona i /api/v1'],
    ],
    toolsTitle: 'Narzędzia',
    tools: [
      ['search_models', 'Wyszukiwanie po normie, rozmiarze, długości, rodzaju gwintu (exact — prawdziwy, cosmetic — kosmetyczny, print — do druku), formacie pliku lub słowach po polsku, angielsku albo rosyjsku. „exact” — każdy wynik ma wszystko, o co pytano. „not_found” — nic tego nie ma: lista wyników jest pusta, a najbliższe modele są podane osobno, każdy z tym, czym się różni. Nic nie jest podmieniane.'],
      ['get_model', 'Wszystko o jednym modelu: norma, wymiary, gwint, masa, kontrole geometrii jądra Monge (a dla opcji do druku — kontrola druku), obraz, GLB do podglądu 3D, inne opcje tego samego rozmiaru.'],
      ['get_download_links', 'Bezpośrednie linki do STEP, STL, 3MF i GLB z rozmiarem i SHA-256 każdego pliku. Tylko darmowe pliki biblioteki.'],
      ['render_model_viewer', 'Interaktywny podgląd 3D wprost w czacie (w klientach obsługujących MCP Apps, np. ChatGPT): własny GLB modelu — obrót, zoom, przesuwanie, reset widoku, pełny ekran — z normą, rozmiarem, skokiem i rodzajem gwintu oraz linkami do plików. Kilka modeli (np. śruba i nakrętka) przełącza się zakładkami albo stoi obok siebie w prawdziwej skali. Inne klienty dostają te same dane tekstem z linkiem do podglądu 3D na stronie.'],
    ],
    tryTitle: 'Zapytaj asystenta',
    tryLead: 'Po podłączeniu serwera zapytaj własnymi słowami:',
    asks: [
      'Znajdź śrubę ISO 4017 M12×60 z prawdziwym gwintem i daj mi STEP.',
      'Pokaż w 3D śrubę M12×60 i jej nakrętkę obok siebie.',
      'Czy w bibliotece Monge jest śruba M12×61? Jeśli nie — co jest najbliżej?',
      'Daj mi 3MF nakrętki M8 do druku i jej SHA-256.',
      'Jakie warianty łożyska 6204 ma Monge?',
    ],
    connectTitle: 'Podłączenie',
    connect: [
      ['Claude Code', 'Jedno polecenie w terminalu:', claudeCode],
      ['Claude (web i aplikacja)', 'Ustawienia → Connectors → Add custom connector i wklej adres (jeśli Twój plan pozwala na własne konektory).', url],
      ['ChatGPT', 'Własne konektory MCP dodaje się w trybie deweloperskim w ustawieniach (jeśli Twój plan go oferuje): nowy konektor, adres, bez uwierzytelniania.', url],
      ['VS Code', 'Plik w projekcie (lub polecenie „MCP: Add Server”):', vscode],
      ['Cursor', 'Plik w projekcie lub ~/.cursor/mcp.json:', cursor],
    ],
    stdioNote: 'Klient, który uruchamia tylko lokalne serwery (stdio), połączy się przez most mcp-remote:',
    checkTitle: 'Sprawdź sam',
    checkLead: 'MCP Inspector, oficjalne narzędzie protokołu, wyświetla narzędzia i wywołuje je z terminala:',
    rulesTitle: 'Zasady i limity',
    rules: [
      'Tylko odczyt: żadne narzędzie niczego nie zapisuje ani nie zmienia. Bez konta i kluczy.',
      'Około 60 zapytań na minutę z jednego adresu (Cloudflare liczy w przybliżeniu, w każdej lokalizacji osobno); powyżej — 429 z Retry-After.',
      'Strony innych witryn nie mogą wywołać serwera z przeglądarki (kontrola Origin przeciw DNS rebinding, której wymaga protokół). Klientów desktopowych i serwerowych oraz MCP Inspector na Twoim komputerze to nie dotyczy. Aby wywoływać go ze swojej strony — napisz do nas.',
      'Linkowane są tylko darmowe pliki biblioteki; pliki Pro nigdy nie są tu dostępne.',
      'Model nigdy nie jest zamieniany na inny: czego nie znaleziono, zgłaszane jest jako nieznalezione.',
      'Pliki można używać bezpłatnie, także komercyjnie; nie wolno ich odsprzedawać ani rozpowszechniać jako plików (zob. licencję).',
    ],
    registryTitle: 'Wykrywanie',
    registry: 'Serwer jest opisany dla oficjalnego MCP Registry (pl.dima-fomin/monge). Wpis pomaga klientom i katalogom go znaleźć, ale żaden asystent nie podłącza serwera sam: każdy dodaje go w swoim kliencie jak wyżej.',
    apiLink: 'Te same dane przez zwykłe HTTP — Monge Catalog API',
  },
  ru: {
    title: 'Monge MCP — библиотека для ИИ-ассистентов',
    lead: 'Публичный MCP-сервер библиотеки Monge: ассистент с поддержкой Model Context Protocol находит стандартную деталь по размеру, читает её данные и проверки и получает прямые ссылки на STEP, STL, 3MF и GLB с контрольными суммами SHA-256. Только чтение, без регистрации, бесплатно.',
    endpoint: 'Адрес сервера',
    facts: [
      ['Транспорт', 'Streamable HTTP, ответы в JSON'],
      ['Доступ', 'публичный, без регистрации, только чтение'],
      ['Протокол', '2024-11-05 … 2025-11-25 (initialize) и 2026-07-28 (без состояния)'],
      ['Данные', 'тот же каталог, что на сайте и в /api/v1'],
    ],
    toolsTitle: 'Инструменты',
    tools: [
      ['search_models', 'Поиск по стандарту, размеру, длине, типу резьбы (exact — настоящая, cosmetic — косметическая, print — для печати), формату файла или словами по-русски, по-польски или по-английски. «exact» — у каждого результата есть всё, что спросили. «not_found» — такого нет: список результатов пуст, а ближайшие модели перечислены отдельно, у каждой — чем она отличается. Ничего не подменяется.'],
      ['get_model', 'Всё об одной модели: стандарт, размеры, резьба, масса, проверки геометрии ядром Monge (а для исполнения для печати — проверка печати), изображение, GLB для 3D-просмотра, другие исполнения того же размера.'],
      ['get_download_links', 'Прямые ссылки на STEP, STL, 3MF и GLB с размером и SHA-256 каждого файла. Только бесплатные файлы библиотеки.'],
      ['render_model_viewer', 'Интерактивный 3D-просмотр прямо в чате (в клиентах с поддержкой MCP Apps, например ChatGPT): собственный GLB модели — вращение, масштаб, сдвиг, сброс вида, полный экран — со стандартом, размером, шагом и типом резьбы и ссылками на файлы. Несколько моделей (например, болт и гайка) переключаются вкладками или стоят рядом в настоящем масштабе. Другие клиенты получают те же данные текстом со ссылкой на 3D-просмотр на сайте.'],
    ],
    tryTitle: 'Спросите ассистента',
    tryLead: 'Подключив сервер, спрашивайте своими словами:',
    asks: [
      'Найди болт ISO 4017 M12×60 с настоящей резьбой и дай STEP.',
      'Покажи в 3D болт M12×60 и гайку к нему рядом.',
      'Есть ли в библиотеке Monge болт M12×61? Если нет — что ближе всего?',
      'Дай 3MF гайки M8 для печати и её SHA-256.',
      'Какие исполнения подшипника 6204 есть в Monge?',
    ],
    connectTitle: 'Подключение',
    connect: [
      ['Claude Code', 'Одна команда в терминале:', claudeCode],
      ['Claude (веб и приложение)', 'Настройки → Connectors → Add custom connector, вставьте адрес (если ваш тариф позволяет свои коннекторы).', url],
      ['ChatGPT', 'Свои MCP-коннекторы добавляются в режиме разработчика в настройках (если ваш тариф его даёт): новый коннектор, адрес, без аутентификации.', url],
      ['VS Code', 'Файл в проекте (или команда «MCP: Add Server»):', vscode],
      ['Cursor', 'Файл в проекте или ~/.cursor/mcp.json:', cursor],
    ],
    stdioNote: 'Клиент, который запускает только локальные (stdio) серверы, подключится через мост mcp-remote:',
    checkTitle: 'Проверьте сами',
    checkLead: 'MCP Inspector, официальный инструмент протокола, показывает инструменты и вызывает их из терминала:',
    rulesTitle: 'Правила и ограничения',
    rules: [
      'Только чтение: ни один инструмент ничего не записывает и не меняет. Без аккаунта и ключей.',
      'Около 60 запросов в минуту с одного адреса (Cloudflare считает приблизительно, отдельно в каждой точке присутствия); сверх — 429 с Retry-After.',
      'Страницы чужих сайтов не могут вызывать сервер из браузера (проверка Origin против DNS rebinding, которой требует протокол). Настольных и серверных клиентов, а также MCP Inspector на вашем компьютере это не касается. Чтобы вызывать его со своего сайта — напишите нам.',
      'Ссылки даются только на бесплатные файлы библиотеки; Pro-файлы здесь недоступны никогда.',
      'Модель никогда не подменяется другой: что не найдено, то и сообщается как не найденное.',
      'Файлы бесплатны, в том числе для коммерческого использования; перепродавать и распространять их как файлы нельзя (см. лицензию).',
    ],
    registryTitle: 'Обнаружение',
    registry: 'Сервер описан для официального MCP Registry (pl.dima-fomin/monge). Запись помогает клиентам и каталогам найти его, но ни один ассистент не подключает сервер сам: каждый добавляет его в своём клиенте, как описано выше.',
    apiLink: 'Те же данные по обычному HTTP — Monge Catalog API',
  },
};

export const MCP_URL = url;
export const MCP_STDIO = stdio;
export const MCP_INSPECTOR = `npx @modelcontextprotocol/inspector --cli ${url} --transport http --method tools/list\nnpx @modelcontextprotocol/inspector --cli ${url} --transport http --method tools/call \\\n  --tool-name search_models --tool-arg query="ISO 4017 M12x60 real thread"`;
export const MCP_CURL = `curl -s ${url} \\\n  -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \\\n  -H 'mcp-protocol-version: 2025-06-18' \\\n  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_models","arguments":{"standard":"ISO 4017","size":"M12","length":60,"thread":"exact"}}}'`;
