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
    <div className="max-w-2xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('title')}</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          {t('description')}
        </p>
      </div>

      <div className="space-y-6">
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="h-5 w-5 text-red-600 dark:text-red-500" />
            <h2 className="text-xl font-bold">{t('email.title')}</h2>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            <a href={`mailto:${t('email.primary')}`} className="hover:text-red-600 dark:hover:text-red-500 transition-colors">
              {t('email.primary')}
            </a>
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <MessageSquare className="h-5 w-5 text-red-600 dark:text-red-500" />
            <h2 className="text-xl font-bold">{t('social.title')}</h2>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
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
