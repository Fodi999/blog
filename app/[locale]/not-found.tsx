import Link from 'next/link';
import { siteButtonVariants } from '@/components/site/Button';
import { eyebrowClass } from '@/components/site/classes';
import { getCopy, localPath, type Locale } from '@/lib/i18n';

export default function NotFound() {
  const locale: Locale = 'pl';
  const t = getCopy(locale);
  return (
    <section className="content-frame flex min-h-[72vh] flex-col justify-center py-[110px] max-[580px]:pt-[70px] max-[580px]:pb-20">
      <p className={`${eyebrowClass} animate-reveal`}>404</p>
      <h1 className="animate-reveal mt-5 mb-9 max-w-[20ch] font-display text-[clamp(44px,7.2vw,96px)] leading-[1.02] font-medium" style={{ animationDelay: '60ms' }}>
        {t.notFound}
      </h1>
      <Link className={`${siteButtonVariants({ variant: 'dark' })} animate-reveal w-max`} href={localPath(locale)} style={{ animationDelay: '120ms' }}>
        {t.backHome}
      </Link>
    </section>
  );
}
