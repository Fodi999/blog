export const metadata = { title: 'Kontakt' };

export default function ContactPage() {
  return (
    <section className="statement-page">
      <p className="eyebrow">Kontakt</p>
      <h1>Porozmawiajmy o dobrej pracy.</h1>
      <div className="contact-links">
        <a href="mailto:kontakt@dima-fomin.pl">kontakt@dima-fomin.pl <span>↗</span></a>
        <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram <span>↗</span></a>
      </div>
    </section>
  );
}
