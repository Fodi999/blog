import { getTranslations, getLocale } from 'next-intl/server';
import { Mail, MessageSquare } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('contact.title'),
    description: t('contact.description'),
    openGraph: {
      title: t('contact.title'),
      description: t('contact.description'),
    },
  };
}

export default async function ContactPage() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'contact' });

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="mb-8 md:mb-12 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4">{t('title')}</h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400">
          {t('description')}
        </p>
      </div>

      <div className="space-y-4 md:space-y-6">
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 md:p-6">
          <div className="flex items-center gap-2.5 md:gap-3 mb-2.5 md:mb-3">
            <Mail className="h-5 w-5 text-red-600 dark:text-red-500" />
            <h2 className="text-lg md:text-xl font-bold">{t('email.title')}</h2>
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            <a href={`mailto:${t('email.primary')}`} className="hover:text-red-600 dark:hover:text-red-500 transition-colors break-all">
              {t('email.primary')}
            </a>
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 md:p-6">
          <div className="flex items-center gap-2.5 md:gap-3 mb-2.5 md:mb-3">
            <MessageSquare className="h-5 w-5 text-red-600 dark:text-red-500" />
            <h2 className="text-lg md:text-xl font-bold">{t('social.title')}</h2>
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            <a 
              href={t('social.instagramUrl')} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-red-600 dark:hover:text-red-500 transition-colors"
            >
              {t('social.instagram')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
