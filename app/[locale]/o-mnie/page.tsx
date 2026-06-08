import { notFound } from 'next/navigation';
import { getCopy, isLocale } from '@/lib/i18n';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getCopy(locale);

  return (
    <section className="statement-page">
      <p className="eyebrow">Dima Fomin</p>
      <h1>{t.about.title}</h1>
      <div className="statement-page__copy">
        <p>{t.about.p1}</p>
        <p>{t.about.p2}</p>
      </div>
    </section>
  );
}
