'use client';

const labels = {
  pl: 'Ustawienia cookies',
  en: 'Cookie settings',
  ru: 'Настройки cookies',
  uk: 'Налаштування cookies',
} as const;

export function CookieSettingsLink({ locale }: { locale: keyof typeof labels }) {
  return (
    <button
      type="button"
      className="site-footer__button"
      onClick={() => window.dispatchEvent(new Event('fominchef:open-cookie-settings'))}
    >
      {labels[locale] ?? labels.pl}
    </button>
  );
}
