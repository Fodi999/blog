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
      { title: 'Monge MCP i API katalogu', body: 'Serwer MCP (dima-fomin.pl/mcp) i API katalogu (dima-fomin.pl/api/v1) odpowiadają asystentom AI (np. ChatGPT) i programom; nie wymagają konta i nie proszą o dane osobowe. Otrzymują samo zapytanie — słowa wyszukiwania, rozmiary i identyfikatory modeli wysłane przez asystenta — oraz dane techniczne (adres IP, user agent). Nie otrzymujemy Twojego imienia, konta u asystenta ani rozmowy; o tym, co wysłać, decyduje asystent. Dane służą tylko do odpowiedzi; adres IP liczy zapytania w ramach limitu (około 60 na minutę) — w ograniczniku Cloudflare i w pamięci serwera, najdłużej przez minutę. Cloudflare przechowuje techniczne logi zapytań przez kilka dni w celu działania i ochrony strony. Nie tworzymy profili, nie sprzedajemy danych i nie używamy zapytań do trenowania modeli.' },
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
      { title: 'Monge MCP и API каталога', body: 'MCP-сервер (dima-fomin.pl/mcp) и API каталога (dima-fomin.pl/api/v1) отвечают ИИ-ассистентам (например, ChatGPT) и программам; они не требуют аккаунта и не запрашивают персональные данные. Они получают сам запрос — слова поиска, размеры и идентификаторы моделей, которые отправляет ассистент, — и технические данные (IP-адрес, user agent). Ваше имя, ваш аккаунт у ассистента и ваш разговор мы не получаем; что отправить, решает ассистент. Данные используются только для ответа; IP-адрес служит для подсчёта запросов в рамках лимита (около 60 в минуту) — в ограничителе Cloudflare и в памяти сервера, не дольше минуты. Cloudflare хранит технические журналы запросов несколько дней для работы и защиты сайта. Мы не составляем профили, не продаём данные и не используем запросы для обучения моделей.' },
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
      { title: 'Monge MCP and the catalogue API', body: 'The MCP server (dima-fomin.pl/mcp) and the catalogue API (dima-fomin.pl/api/v1) answer AI assistants (such as ChatGPT) and programs; they need no account and do not ask for personal data. They receive the request itself — the search words, sizes and model ids the assistant sends — and technical data (IP address, user agent). We do not receive your name, your account with the assistant or your conversation; the assistant decides what it sends. The data is used only to answer; the IP address counts requests for the rate limit (about 60 a minute) — in Cloudflare\'s rate limiter and in the server\'s memory, for at most one minute. Cloudflare keeps technical request logs for a few days for operation and security. We do not build profiles, do not sell data and do not use requests to train models.' },
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
