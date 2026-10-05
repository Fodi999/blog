import Link from 'next/link';
import { siteButtonVariants } from '@/components/site/Button';
import { getDict, localPath } from '@/lib/i18n';

// not-found receives no params, so it is written in the default locale (Polish).
export default function NotFound() {
  const t = getDict('pl');
  return (
    <section className="content-frame relative flex min-h-[78vh] flex-col justify-center pt-28">
      <div className="blueprint pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_30%_50%,black,transparent_70%)]" aria-hidden="true" />
      <p className="relative font-mono text-[13px] text-steel">ERROR 404 · NO SUCH FACE</p>
      <h1 className="relative mt-5 max-w-[16ch] font-display text-[clamp(40px,7vw,88px)] leading-[1.02] font-semibold tracking-[-.03em] text-on-ink">{t.notFound.title}</h1>
      <p className="relative mt-5 text-[18px] text-on-ink-muted">{t.notFound.text}</p>
      <Link className={`${siteButtonVariants({ variant: 'primary' })} relative mt-9 w-max`} href={localPath('pl')}>
        {t.notFound.cta}
      </Link>
    </section>
  );
}
