import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleBody } from '@/components/ArticleBody';
import { articleContent, articleDescription, articleTitle, getSiteArticle } from '@/lib/cms';
import { getCopy, isLocale, localPath } from '@/lib/i18n';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getCopy(locale);
  const page = await getSiteArticle('kontakt');
  return {
    title: page ? articleTitle(page, locale) : t.contact.title,
    description: page ? articleDescription(page, locale) : t.contact.title,
    alternates: { canonical: localPath(locale, '/kontakt') },
  };
}

function contactConfig(content: string) {
  let email = 'kontakt@dima-fomin.pl';
  let instagram = 'https://instagram.com';
  const body: string[] = [];

  for (const line of content.split(/\r?\n/)) {
    const emailMatch = line.match(/^email:\s*(.+)$/i);
    const instagramMatch = line.match(/^instagram:\s*(.+)$/i);

    if (emailMatch) {
      email = emailMatch[1].trim();
      continue;
    }

    if (instagramMatch) {
      instagram = instagramMatch[1].trim();
      continue;
    }

    body.push(line);
  }

  return { email, instagram, body: body.join('\n').trim() };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getCopy(locale);
  const page = await getSiteArticle('kontakt');
  const title = page ? articleTitle(page, locale) : t.contact.title;
  const content = page ? articleContent(page, locale) : '';
  const contact = contactConfig(content);

  return (
    <section className="statement-page">
      <p className="eyebrow">{t.nav.contact}</p>
      <h1>{title}</h1>
      {contact.body ? <ArticleBody content={contact.body} /> : null}
      <div className="contact-links">
        <a href={`mailto:${contact.email}`} data-ga-event="email_click" data-ga-label="contact_email">{contact.email} <span>↗</span></a>
        <a href={contact.instagram} target="_blank" rel="noreferrer" data-ga-event="social_click" data-ga-label="instagram">Instagram <span>↗</span></a>
      </div>
    </section>
  );
}
