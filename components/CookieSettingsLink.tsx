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
      className="cursor-pointer border-0 bg-transparent p-0 uppercase text-inherit [font:inherit] transition-colors duration-hover ease-premium hover:text-gold"
      onClick={() => window.dispatchEvent(new Event('fominchef:open-cookie-settings'))}
    >
      {labels[locale] ?? labels.pl}
    </button>
  );
}
