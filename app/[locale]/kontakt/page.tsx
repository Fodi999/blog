import { notFound } from 'next/navigation';
import { getCopy, isLocale } from '@/lib/i18n';

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getCopy(locale);

  return (
    <section className="statement-page">
      <p className="eyebrow">{t.nav.contact}</p>
      <h1>{t.contact.title}</h1>
      <div className="contact-links">
        <a href="mailto:kontakt@dima-fomin.pl">kontakt@dima-fomin.pl <span>↗</span></a>
        <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram <span>↗</span></a>
      </div>
    </section>
  );
}
