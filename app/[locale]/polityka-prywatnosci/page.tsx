import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Polityka prywatności',
  description: 'Informacje o prywatności i plikach cookies na stronie FOMIN CHEF.',
};

export default async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <article className="article privacy-page">
      <header className="article__heading">
        <p className="eyebrow">FOMIN CHEF</p>
        <h1>Polityka prywatności</h1>
        <p>Krótka informacja o danych, kontakcie i plikach cookies używanych na stronie.</p>
      </header>
      <div className="privacy-content">
        <section>
          <h2>Administrator danych</h2>
          <p>Administratorem danych związanych z kontaktem przez stronę jest Dima Fomin. Kontakt: <a href="mailto:kontakt@dima-fomin.pl">kontakt@dima-fomin.pl</a>.</p>
        </section>
        <section>
          <h2>Kontakt</h2>
          <p>Jeżeli napiszesz do nas przez email, przetwarzamy dane podane w wiadomości wyłącznie w celu odpowiedzi i obsługi zapytania.</p>
        </section>
        <section>
          <h2>Pliki cookies</h2>
          <p>Strona używa niezbędnych cookies do prawidłowego działania. Opcjonalne cookies analityczne, marketingowe i funkcjonalne są używane tylko po wyrażeniu zgody w panelu cookies.</p>
        </section>
        <section>
          <h2>Zmiana ustawień</h2>
          <p>W każdej chwili możesz zmienić wybór przez link “Ustawienia cookies” w stopce strony.</p>
        </section>
      </div>
    </article>
  );
}
