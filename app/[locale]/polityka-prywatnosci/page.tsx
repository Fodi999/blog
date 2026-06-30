import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Polityka prywatności',
  description: 'Informacje o prywatności i plikach cookies na stronie FOMIN CHEF.',
};

const privacyCopy: Record<Locale, {
  title: string;
  lead: string;
  sections: Array<{ title: string; body: ReactNode }>;
}> = {
  pl: {
    title: 'Polityka prywatności',
    lead: 'Krótka informacja o danych, kontakcie i plikach cookies używanych na stronie.',
    sections: [
      { title: 'Administrator danych', body: <>Administratorem danych związanych z kontaktem przez stronę jest Dima Fomin. Kontakt: <a href="mailto:kontakt@dima-fomin.pl">kontakt@dima-fomin.pl</a>.</> },
      { title: 'Kontakt', body: 'Jeżeli napiszesz do nas przez email, przetwarzamy dane podane w wiadomości wyłącznie w celu odpowiedzi i obsługi zapytania.' },
      { title: 'Pliki cookies', body: 'Strona używa niezbędnych cookies do prawidłowego działania. Opcjonalne cookies analityczne, marketingowe i funkcjonalne są używane tylko po wyrażeniu zgody w panelu cookies.' },
      { title: 'Zmiana ustawień', body: 'W każdej chwili możesz zmienić wybór przez link “Ustawienia cookies” w stopce strony.' },
    ],
  },
  en: {
    title: 'Privacy policy',
    lead: 'A short note about data, contact and cookies used on this website.',
    sections: [
      { title: 'Data controller', body: <>The controller of data related to website contact is Dima Fomin. Contact: <a href="mailto:kontakt@dima-fomin.pl">kontakt@dima-fomin.pl</a>.</> },
      { title: 'Contact', body: 'If you email us, we process the data included in your message only to reply and handle your request.' },
      { title: 'Cookies', body: 'The website uses necessary cookies for proper operation. Optional analytics, marketing and functional cookies are used only after consent in the cookie panel.' },
      { title: 'Changing settings', body: 'You can change your choice at any time using the “Cookie settings” link in the website footer.' },
    ],
  },
  ru: {
    title: 'Политика конфиденциальности',
    lead: 'Короткая информация о данных, контакте и cookies, которые используются на сайте.',
    sections: [
      { title: 'Администратор данных', body: <>Администратор данных, связанных с обращениями через сайт, — Dima Fomin. Контакт: <a href="mailto:kontakt@dima-fomin.pl">kontakt@dima-fomin.pl</a>.</> },
      { title: 'Контакт', body: 'Если вы пишете нам по email, мы обрабатываем данные из сообщения только для ответа и обработки запроса.' },
      { title: 'Cookies', body: 'Сайт использует необходимые cookies для корректной работы. Необязательные аналитические, маркетинговые и функциональные cookies используются только после согласия в панели cookies.' },
      { title: 'Изменение настроек', body: 'Вы можете изменить выбор в любой момент через ссылку “Настройки cookies” в footer сайта.' },
    ],
  },
  uk: {
    title: 'Політика конфіденційності',
    lead: 'Коротка інформація про дані, контакт і cookies, які використовуються на сайті.',
    sections: [
      { title: 'Адміністратор даних', body: <>Адміністратор даних, пов’язаних зі зверненнями через сайт, — Dima Fomin. Контакт: <a href="mailto:kontakt@dima-fomin.pl">kontakt@dima-fomin.pl</a>.</> },
      { title: 'Контакт', body: 'Якщо ви пишете нам email, ми обробляємо дані з повідомлення лише для відповіді та обробки запиту.' },
      { title: 'Cookies', body: 'Сайт використовує необхідні cookies для коректної роботи. Необов’язкові аналітичні, маркетингові та функціональні cookies використовуються лише після згоди в панелі cookies.' },
      { title: 'Зміна налаштувань', body: 'Ви можете змінити вибір у будь-який момент через посилання “Налаштування cookies” у footer сайту.' },
    ],
  },
};

export default async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = privacyCopy[locale];

  return (
    <article className="article privacy-page">
      <header className="article__heading">
        <p className="eyebrow">FOMIN CHEF</p>
        <h1>{copy.title}</h1>
        <p>{copy.lead}</p>
      </header>
      <div className="privacy-content">
        {copy.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
