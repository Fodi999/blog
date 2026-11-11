import { NotFoundText } from '@/components/NotFoundText';
import { defaultLocale, getDict, locales } from '@/lib/i18n';

// not-found receives no params: the language is taken from the address in the browser (NotFoundText).
// Was: always Polish — a missing page under /ru or /en answered in Polish and led to the Polish home.
export default function NotFound() {
  const texts = Object.fromEntries(locales.map((l) => [l, getDict(l).notFound]));
  return (
    <section className="content-frame relative flex min-h-[78vh] flex-col justify-center pt-28">
      <div className="blueprint pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_30%_50%,black,transparent_70%)]" aria-hidden="true" />
      <p className="relative font-mono text-[13px] text-steel">ERROR 404 · NO SUCH FACE</p>
      <NotFoundText texts={texts} fallback={defaultLocale} />
    </section>
  );
}
