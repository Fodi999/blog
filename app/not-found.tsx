import Link from 'next/link';

export default function NotFound() {
  return <section className="statement-page"><p className="eyebrow">404</p><h1>Nie ma takiej strony.</h1><Link className="button button--dark" href="/">Wróć na stronę główną</Link></section>;
}
