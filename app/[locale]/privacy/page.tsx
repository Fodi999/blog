import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/sections';
import { getDict, isLocale, type Locale } from '@/lib/i18n';
import { pageMetadata } from '@/lib/seo';

const CONTACT = 'kontakt@dima-fomin.pl';

const copy: Record<Locale, { lead: string; sections: { title: string; body: React.ReactNode }[] }> = {
  pl: {
    lead: 'Jakie dane zbieramy na stronie Monge, w jakim celu i jakie masz prawa.',
    sections: [
      { title: 'Administrator danych', body: <>Administratorem danych jest Dmytro Fomin, twórca Monge. Kontakt: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</> },
      { title: 'Formularz zgłoszeniowy', body: 'Imię, email, firmę i treść wiadomości przetwarzamy wyłącznie, aby odpowiedzieć na zgłoszenie, przygotować dostęp do Monge i — jeśli zapiszesz się do bety — powiadomić Cię o jej otwarciu i dużych aktualizacjach (art. 6 ust. 1 lit. b i f RODO). Dane są przechowywane w bazie Cloudflare D1 do 24 miesięcy od ostatniego kontaktu.' },
      { title: 'Hosting i pliki', body: 'Strona działa na infrastrukturze Cloudflare (Workers, D1, R2). Cloudflare przetwarza dane techniczne (adres IP, nagłówki przeglądarki) w celu dostarczenia i zabezpieczenia strony.' },
      { title: 'Wideo z YouTube', body: 'Wideo na stronie ładuje się z YouTube (Google) dopiero po kliknięciu „Obejrzyj wideo”, w trybie rozszerzonej prywatności (youtube-nocookie.com). Od tej chwili dane przetwarza Google według własnej polityki prywatności.' },
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
      { title: 'Видео с YouTube', body: 'Видео на сайте загружается с YouTube (Google) только после нажатия «Смотреть видео», в режиме повышенной конфиденциальности (youtube-nocookie.com). С этого момента данные обрабатывает Google по своей политике конфиденциальности.' },
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
      { title: 'YouTube video', body: 'The video on the site loads from YouTube (Google) only after you press “Watch the video”, in privacy-enhanced mode (youtube-nocookie.com). From then on Google processes the data under its own privacy policy.' },
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
        <p className="mt-10 font-mono text-[12px]">2026-10-28</p>
      </article>
    </>
  );
}
