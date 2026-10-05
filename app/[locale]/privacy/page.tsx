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
      { title: 'Administrator danych', body: <>Administratorem danych jest Dima Fomin, twórca Monge. Kontakt: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</> },
      { title: 'Formularz zgłoszeniowy', body: 'Imię, email, firmę i treść wiadomości przetwarzamy wyłącznie, aby odpowiedzieć na zgłoszenie i przygotować dostęp do Monge (art. 6 ust. 1 lit. b i f RODO). Dane są przechowywane w bazie Cloudflare D1 do 24 miesięcy od ostatniego kontaktu.' },
      { title: 'Hosting i pliki', body: 'Strona działa na infrastrukturze Cloudflare (Workers, D1, R2). Cloudflare przetwarza dane techniczne (adres IP, nagłówki przeglądarki) w celu dostarczenia i zabezpieczenia strony.' },
      { title: 'Pliki cookies', body: 'Używamy niezbędnych cookies. Opcjonalne cookies analityczne, marketingowe i funkcjonalne włączamy dopiero po zgodzie w panelu cookies; zmienisz ją linkiem „Ustawienia cookies” w stopce.' },
      { title: 'Twoje prawa', body: <>Masz prawo do dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przeniesienia oraz sprzeciwu, a także do skargi do Prezesa UODO. Napisz: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</> },
    ],
  },
  ru: {
    lead: 'Какие данные мы собираем на сайте Monge, зачем и какие у вас права.',
    sections: [
      { title: 'Администратор данных', body: <>Администратор данных — Dima Fomin, автор Monge. Контакт: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</> },
      { title: 'Форма заявки', body: 'Имя, email, компанию и текст сообщения мы обрабатываем только для ответа на заявку и подготовки доступа к Monge (ст. 6 п. 1 b и f GDPR). Данные хранятся в базе Cloudflare D1 до 24 месяцев после последнего контакта.' },
      { title: 'Хостинг и файлы', body: 'Сайт работает на инфраструктуре Cloudflare (Workers, D1, R2). Cloudflare обрабатывает технические данные (IP-адрес, заголовки браузера), чтобы доставлять и защищать сайт.' },
      { title: 'Cookies', body: 'Мы используем необходимые cookies. Аналитические, маркетинговые и функциональные cookies включаются только после согласия в панели cookies; изменить выбор можно ссылкой «Настройки cookies» в подвале сайта.' },
      { title: 'Ваши права', body: <>Вы можете запросить доступ к данным, их исправление, удаление, ограничение обработки, перенос, возразить против обработки и подать жалобу в надзорный орган (UODO). Пишите: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</> },
    ],
  },
  en: {
    lead: 'What data the Monge website collects, why, and what your rights are.',
    sections: [
      { title: 'Data controller', body: <>The controller is Dima Fomin, the author of Monge. Contact: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</> },
      { title: 'Request form', body: 'We process your name, email, company and message only to answer your request and prepare access to Monge (Art. 6(1)(b) and (f) GDPR). The data is kept in a Cloudflare D1 database for up to 24 months after the last contact.' },
      { title: 'Hosting and files', body: 'The site runs on Cloudflare infrastructure (Workers, D1, R2). Cloudflare processes technical data (IP address, browser headers) to deliver and protect the site.' },
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
        <p className="mt-10 font-mono text-[12px]">2026-10-05</p>
      </article>
    </>
  );
}
