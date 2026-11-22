import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/sections';
import { getDict, isLocale, type Locale } from '@/lib/i18n';
import { EMAIL, pageMetadata } from '@/lib/seo';

// the author's mailbox (kontakt@dima-fomin.pl had no mail server)
const CONTACT = EMAIL;

const copy: Record<Locale, { lead: string; sections: { title: string; body: React.ReactNode }[] }> = {
  pl: {
    lead: 'Jakie dane zbieramy na stronie Monge, w jakim celu i jakie masz prawa.',
    sections: [
      { title: 'Administrator danych', body: <>Administratorem danych jest Dmytro Fomin, twórca Monge. Kontakt: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</> },
      { title: 'Formularz zgłoszeniowy', body: 'Imię, email, firmę i treść wiadomości przetwarzamy wyłącznie, aby odpowiedzieć na zgłoszenie, przygotować dostęp do Monge i — jeśli zapiszesz się do bety — powiadomić Cię o jej otwarciu i dużych aktualizacjach (art. 6 ust. 1 lit. b i f RODO). Dane są przechowywane w bazie Cloudflare D1 do 24 miesięcy od ostatniego kontaktu.' },
      { title: 'Hosting i pliki', body: 'Strona działa na infrastrukturze Cloudflare (Workers, D1, R2). Cloudflare przetwarza dane techniczne (adres IP, nagłówki przeglądarki) w celu dostarczenia i zabezpieczenia strony.' },
      { title: 'Monge MCP i API katalogu', body: 'Serwer MCP (dima-fomin.pl/mcp) i API katalogu (dima-fomin.pl/api/v1) odpowiadają asystentom AI (np. ChatGPT) i programom; nie wymagają konta. Monge nie otrzymuje automatycznie całej Twojej rozmowy z asystentem — otrzymuje to, co klient AI przekaże narzędziu Monge (zwykle słowa wyszukiwania, rozmiary i identyfikatory modeli), oraz dane techniczne (adres IP, user agent). Wszystko, co asystent umieści w zapytaniu do narzędzia, trafia do nas — nie proś go o przekazywanie danych osobowych narzędziom Monge. Dane służą tylko do odpowiedzi na zapytanie. Do limitu zapytań (około 60 na minutę) serwer liczy zapytania pod jednokierunkowym skrótem (hash) adresu IP, zmienianym codziennie, a nie pod samym adresem; liczniki są usuwane po upływie ich minuty. Cloudflare Workers Logs przechowują przez 7 dni zapis każdego zapytania — czas, URL, status i metadane, które mogą obejmować adres IP i nagłówki — w celu działania i ochrony usługi. Treść zapytań do narzędzi MCP jest w treści żądania i nie trafia do logów; wyszukiwania w API katalogu są częścią URL, więc trafiają. Nie tworzymy profili, nie sprzedajemy danych i nie używamy zapytań do trenowania modeli.' },
      { title: 'Wideo z YouTube', body: 'Wideo na stronie ładuje się z YouTube (Google) dopiero po kliknięciu „Obejrzyj wideo”, w trybie rozszerzonej prywatności (youtube-nocookie.com). Od tej chwili dane przetwarza Google według własnej polityki prywatności.' },
      { title: 'Liczniki na stronie', body: 'Pokazujemy, ile razy pobrano modele i ile osób jest teraz na stronie. Pobranie zapisuje tylko plik i liczbę. Otwarta strona co 45 sekund (gdy karta jest widoczna) wysyła losowy numer, który tworzy w swojej pamięci: nie jest to cookie, nic nie zostaje na urządzeniu, nie zapisujemy adresu IP; numer znika po 5 minutach. Z tych danych nie da się ustalić, kim jesteś.' },
      { title: 'Pliki cookies', body: 'Używamy niezbędnych cookies. Opcjonalne cookies analityczne, marketingowe i funkcjonalne włączamy dopiero po zgodzie w panelu cookies; zmienisz ją linkiem „Ustawienia cookies” w stopce.' },
      { title: 'Twoje prawa', body: <>Masz prawo do dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przeniesienia oraz sprzeciwu, a także do skargi do Prezesa UODO. Napisz: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</> },
    ],
  },
  ru: {
    lead: 'Какие данные мы собираем на сайте Monge, зачем и какие у вас права.',
    sections: [
      { title: 'Администратор данных', body: <>Администратор данных — Dmytro Fomin, автор Monge. Контакт: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</> },
      { title: 'Форма заявки', body: 'Имя, email, компанию и текст сообщения мы обрабатываем только для ответа на заявку, подготовки доступа к Monge и — если вы записались в бету — чтобы сообщить о её открытии и крупных обновлениях (ст. 6 п. 1 b и f GDPR). Данные хранятся в базе Cloudflare D1 до 24 месяцев после последнего контакта.' },
      { title: 'Хостинг и файлы', body: 'Сайт работает на инфраструктуре Cloudflare (Workers, D1, R2). Cloudflare обрабатывает технические данные (IP-адрес, заголовки браузера), чтобы доставлять и защищать сайт.' },
      { title: 'Monge MCP и API каталога', body: 'MCP-сервер (dima-fomin.pl/mcp) и API каталога (dima-fomin.pl/api/v1) отвечают ИИ-ассистентам (например, ChatGPT) и программам; они не требуют аккаунта. Monge не получает автоматически всю вашу переписку с ассистентом — он получает то, что ИИ-клиент передал инструменту Monge (обычно слова поиска, размеры и идентификаторы моделей), и технические данные (IP-адрес, user agent). Всё, что ассистент поместит в запрос к инструменту, дойдёт до нас, — не просите его передавать инструментам Monge персональные данные. Данные используются только для ответа на запрос. Для лимита запросов (около 60 в минуту) сервер считает запросы по одностороннему хэшу IP-адреса, который меняется каждый день, а не по самому адресу; счётчики удаляются, когда их минута прошла. Cloudflare Workers Logs хранят 7 дней запись о каждом запросе — время, URL, статус и метаданные, которые могут включать IP-адрес и заголовки, — для работы и защиты сервиса. Содержание запросов к инструментам MCP передаётся в теле запроса и в журналы не попадает; поиск через API каталога — часть URL и попадает. Мы не составляем профили, не продаём данные и не используем запросы для обучения моделей.' },
      { title: 'Видео с YouTube', body: 'Видео на сайте загружается с YouTube (Google) только после нажатия «Смотреть видео», в режиме повышенной конфиденциальности (youtube-nocookie.com). С этого момента данные обрабатывает Google по своей политике конфиденциальности.' },
      { title: 'Счётчики на сайте', body: 'Мы показываем, сколько раз скачали модели и сколько людей сейчас на сайте. Скачивание записывает только файл и число. Открытая страница раз в 45 секунд (пока вкладка видна) присылает случайный номер, который она создала в своей памяти: это не cookie, на устройстве ничего не остаётся, IP-адрес мы не записываем; номер удаляется через 5 минут. По этим данным нельзя узнать, кто вы.' },
      { title: 'Cookies', body: 'Мы используем необходимые cookies. Аналитические, маркетинговые и функциональные cookies включаются только после согласия в панели cookies; изменить выбор можно ссылкой «Настройки cookies» в подвале сайта.' },
      { title: 'Ваши права', body: <>Вы можете запросить доступ к данным, их исправление, удаление, ограничение обработки, перенос, возразить против обработки и подать жалобу в надзорный орган (UODO). Пишите: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</> },
    ],
  },
  en: {
    lead: 'What data the Monge website collects, why, and what your rights are.',
    sections: [
      { title: 'Data controller', body: <>The controller is Dmytro Fomin, the author of Monge. Contact: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</> },
      { title: 'Request form', body: 'We process your name, email, company and message only to answer your request, prepare access to Monge and — if you join the beta list — tell you when the beta opens and about major updates (Art. 6(1)(b) and (f) GDPR). The data is kept in a Cloudflare D1 database for up to 24 months after the last contact.' },
      { title: 'Hosting and files', body: 'The site runs on Cloudflare infrastructure (Workers, D1, R2). Cloudflare processes technical data (IP address, browser headers) to deliver and protect the site.' },
      { title: 'Monge MCP and the catalogue API', body: 'The MCP server (dima-fomin.pl/mcp) and the catalogue API (dima-fomin.pl/api/v1) answer AI assistants (such as ChatGPT) and programs; they need no account. Monge does not automatically receive your whole conversation with the assistant: it receives what the AI client passes to a Monge tool (usually search words, sizes and model ids) and technical data (IP address, user agent). Whatever the assistant puts into a tool request reaches us — do not ask it to pass personal data to Monge tools. The data are used only to answer the request. For the rate limit (about 60 requests a minute) the server counts requests under a one-way hash of the IP address that changes every day, not the address itself; counts are deleted once their minute is over. Cloudflare Workers Logs keep a record of each request for 7 days — time, URL, status and metadata, which can include the IP address and headers — for operation and security. The content of MCP tool requests travels in the request body and is not logged; catalogue API searches are part of the URL and are. We do not build profiles, do not sell data and do not use requests to train models.' },
      { title: 'YouTube video', body: 'The video on the site loads from YouTube (Google) only after you press “Watch the video”, in privacy-enhanced mode (youtube-nocookie.com). From then on Google processes the data under its own privacy policy.' },
      { title: 'Counters on the site', body: 'We show how many times the models were downloaded and how many people are on the site now. A download records only the file and a number. An open page sends, every 45 seconds while the tab is visible, a random number it made in its own memory: not a cookie, nothing is kept on your device, we do not store the IP address; the number is deleted after 5 minutes. None of this can tell who you are.' },
      { title: 'Cookies', body: 'We use necessary cookies. Optional analytics, marketing and functional cookies are enabled only after consent in the cookie panel; change it via “Cookie settings” in the footer.' },
      { title: 'Your rights', body: <>You may request access, rectification, erasure, restriction, portability, object to processing and complain to the supervisory authority (UODO, Poland). Write to <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</> },
    ],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, '/privacy', getDict(locale).privacy.title, copy[locale].lead);
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const c = copy[locale];
  return (
    <>
      <PageHero title={t.privacy.title} lead={c.lead} />
      <article className="reading-frame prose-monge">
        {c.sections.map((s) => (
          <section key={s.title}>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </section>
        ))}
        <p className="mt-10 font-mono text-[12px]">2026-11-22</p>
      </article>
    </>
  );
}
