import Link from 'next/link';

export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>Dima Fomin</strong>
        <p>Jedzenie, technika i rzeczy stworzone z myślą o kuchni.</p>
      </div>
      <div className="site-footer__links">
        <Link href="/blog">Blog</Link>
        <Link href="/sklep">Sklep</Link>
        <Link href="/kontakt">Kontakt</Link>
      </div>
    </footer>
  );
}
