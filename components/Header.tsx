import Link from 'next/link';

const links = [
  ['/', 'Strona główna'],
  ['/blog', 'Blog'],
  ['/sklep', 'Sklep'],
  ['/o-mnie', 'O mnie'],
  ['/kontakt', 'Kontakt'],
] as const;

export function Header() {
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Główna nawigacja">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="site-nav__link">
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
