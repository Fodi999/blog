import { getTranslations, getLocale } from 'next-intl/server';

export async function Footer() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'footer' });

  return (
    <footer className="border-t border-border mt-20">
      <div className="container mx-auto px-4 py-8 text-center text-sm text-muted">
        {t('rights')}
      </div>
    </footer>
  );
}
