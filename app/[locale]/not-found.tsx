import Link from 'next/link';
import { getCopy, localPath, type Locale } from '@/lib/i18n';

export default function NotFound() {
  const locale: Locale = 'pl';
  const t = getCopy(locale);
  return <section className="statement-page"><p className="eyebrow">404</p><h1>{t.notFound}</h1><Link className="button button--dark" href={localPath(locale)}>{t.backHome}</Link></section>;
}
