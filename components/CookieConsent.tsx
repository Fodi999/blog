'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { siteButtonVariants } from '@/components/site/Button';

type ConsentCategories = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
};

type StoredConsent = {
  policyVersion: string;
  consentedAt: string;
  categories: ConsentCategories;
};

type ConsentLocale = 'pl' | 'en' | 'ru' | 'uk';

const CONSENT_KEY = 'fominChefCookieConsent';
const CONSENT_VERSION = '2026-06-30-v1';
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const defaultCategories: ConsentCategories = {
  necessary: true,
  analytics: false,
  marketing: false,
  functional: false,
};

const cookieCopy: Record<ConsentLocale, {
  title: string;
  body: string;
  privacy: string;
  acceptAll: string;
  rejectOptional: string;
  settings: string;
  settingsTitle: string;
  closeSettings: string;
  saveSettings: string;
  necessaryTitle: string;
  necessaryDescription: string;
  alwaysActive: string;
  analyticsTitle: string;
  analyticsDescription: string;
  marketingTitle: string;
  marketingDescription: string;
  functionalTitle: string;
  functionalDescription: string;
}> = {
  pl: {
    title: 'Cookies',
    body: 'Używamy plików cookies, aby zapewnić prawidłowe działanie strony, analizować ruch oraz ulepszać treści. Możesz zaakceptować wszystkie pliki cookies, odrzucić opcjonalne lub dostosować ustawienia.',
    privacy: 'Polityka prywatności',
    acceptAll: 'AKCEPTUJ WSZYSTKIE',
    rejectOptional: 'ODRZUĆ OPCJONALNE',
    settings: 'USTAWIENIA',
    settingsTitle: 'Ustawienia cookies',
    closeSettings: 'Zamknij ustawienia cookies',
    saveSettings: 'ZAPISZ USTAWIENIA',
    necessaryTitle: 'Niezbędne cookies',
    necessaryDescription: 'Te pliki są wymagane do prawidłowego działania strony.',
    alwaysActive: 'Zawsze aktywne',
    analyticsTitle: 'Analityczne cookies',
    analyticsDescription: 'Pomagają nam zrozumieć, jak użytkownicy korzystają ze strony.',
    marketingTitle: 'Marketingowe cookies',
    marketingDescription: 'Służą do personalizacji treści i działań reklamowych.',
    functionalTitle: 'Funkcjonalne cookies',
    functionalDescription: 'Zapamiętują wybrane ustawienia, np. język strony.',
  },
  en: {
    title: 'Cookies',
    body: 'We use cookies to keep the website working properly, analyze traffic and improve content. You can accept all cookies, reject optional cookies or adjust your settings.',
    privacy: 'Privacy policy',
    acceptAll: 'ACCEPT ALL',
    rejectOptional: 'REJECT OPTIONAL',
    settings: 'SETTINGS',
    settingsTitle: 'Cookie settings',
    closeSettings: 'Close cookie settings',
    saveSettings: 'SAVE SETTINGS',
    necessaryTitle: 'Necessary cookies',
    necessaryDescription: 'These files are required for the website to work properly.',
    alwaysActive: 'Always active',
    analyticsTitle: 'Analytics cookies',
    analyticsDescription: 'They help us understand how visitors use the website.',
    marketingTitle: 'Marketing cookies',
    marketingDescription: 'They are used to personalize content and advertising activities.',
    functionalTitle: 'Functional cookies',
    functionalDescription: 'They remember selected settings, for example the website language.',
  },
  ru: {
    title: 'Cookies',
    body: 'Мы используем cookies, чтобы сайт работал корректно, анализировать трафик и улучшать материалы. Вы можете принять все cookies, отклонить необязательные или настроить параметры.',
    privacy: 'Политика конфиденциальности',
    acceptAll: 'ПРИНЯТЬ ВСЕ',
    rejectOptional: 'ОТКЛОНИТЬ НЕОБЯЗАТЕЛЬНЫЕ',
    settings: 'НАСТРОЙКИ',
    settingsTitle: 'Настройки cookies',
    closeSettings: 'Закрыть настройки cookies',
    saveSettings: 'СОХРАНИТЬ НАСТРОЙКИ',
    necessaryTitle: 'Необходимые cookies',
    necessaryDescription: 'Эти файлы нужны для корректной работы сайта.',
    alwaysActive: 'Всегда активны',
    analyticsTitle: 'Аналитические cookies',
    analyticsDescription: 'Помогают понять, как пользователи используют сайт.',
    marketingTitle: 'Маркетинговые cookies',
    marketingDescription: 'Используются для персонализации контента и рекламных действий.',
    functionalTitle: 'Функциональные cookies',
    functionalDescription: 'Запоминают выбранные настройки, например язык сайта.',
  },
  uk: {
    title: 'Cookies',
    body: 'Ми використовуємо cookies, щоб сайт працював коректно, аналізувати трафік і покращувати матеріали. Ви можете прийняти всі cookies, відхилити необов’язкові або налаштувати параметри.',
    privacy: 'Політика конфіденційності',
    acceptAll: 'ПРИЙНЯТИ ВСІ',
    rejectOptional: 'ВІДХИЛИТИ НЕОБОВ’ЯЗКОВІ',
    settings: 'НАЛАШТУВАННЯ',
    settingsTitle: 'Налаштування cookies',
    closeSettings: 'Закрити налаштування cookies',
    saveSettings: 'ЗБЕРЕГТИ НАЛАШТУВАННЯ',
    necessaryTitle: 'Необхідні cookies',
    necessaryDescription: 'Ці файли потрібні для коректної роботи сайту.',
    alwaysActive: 'Завжди активні',
    analyticsTitle: 'Аналітичні cookies',
    analyticsDescription: 'Допомагають зрозуміти, як користувачі використовують сайт.',
    marketingTitle: 'Маркетингові cookies',
    marketingDescription: 'Використовуються для персоналізації контенту та рекламних дій.',
    functionalTitle: 'Функціональні cookies',
    functionalDescription: 'Запам’ятовують вибрані налаштування, наприклад мову сайту.',
  },
};

function currentLocale(): ConsentLocale {
  if (typeof window === 'undefined') return 'pl';
  const segment = window.location.pathname.split('/').filter(Boolean)[0];
  return segment === 'en' || segment === 'ru' || segment === 'uk' ? segment : 'pl';
}

function readStoredConsent(): StoredConsent | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.policyVersion !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredConsent(categories: ConsentCategories) {
  const consent: StoredConsent = {
    policyVersion: CONSENT_VERSION,
    consentedAt: new Date().toISOString(),
    categories,
  };
  window.localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent('fominchef:cookie-consent-updated', { detail: consent }));
  return consent;
}

const cookieButtonBase = `${siteButtonVariants({ variant: 'light' })} min-h-[46px] px-4 text-[11px]`;
const cookieButtonOutline = `${siteButtonVariants({ variant: 'outline-light' })} min-h-[46px] px-4 text-[11px]`;
const cookieQuietLink = `${siteButtonVariants({ variant: 'quiet-light' })} min-h-[46px] text-[11px]`;

export function CookieConsent() {
  const [hydrated, setHydrated] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [categories, setCategories] = useState<ConsentCategories>(defaultCategories);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);
  const [locale, setLocale] = useState<ConsentLocale>('pl');
  const copy = cookieCopy[locale];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setLocale(currentLocale());
      const stored = readStoredConsent();
      if (stored) {
        setCategories(stored.categories);
        setAnalyticsAllowed(stored.categories.analytics);
        setBannerOpen(false);
      } else {
        setCategories(defaultCategories);
        setAnalyticsAllowed(false);
        setBannerOpen(true);
      }
      setHydrated(true);
    });

    function openSettings() {
      const current = readStoredConsent();
      setCategories(current?.categories ?? defaultCategories);
      setBannerOpen(false);
      setSettingsOpen(true);
    }

    window.addEventListener('fominchef:open-cookie-settings', openSettings);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('fominchef:open-cookie-settings', openSettings);
    };
  }, []);

  function save(nextCategories: ConsentCategories) {
    const consent = writeStoredConsent(nextCategories);
    setCategories(consent.categories);
    setAnalyticsAllowed(consent.categories.analytics);
    setBannerOpen(false);
    setSettingsOpen(false);
  }

  function acceptAll() {
    save({ necessary: true, analytics: true, marketing: true, functional: true });
  }

  function rejectOptional() {
    save(defaultCategories);
  }

  function openSettingsFromBanner() {
    setBannerOpen(false);
    setSettingsOpen(true);
  }

  function closeSettings(open: boolean) {
    if (open) return;
    setSettingsOpen(false);
    if (!readStoredConsent()) setBannerOpen(true);
  }

  function updateOptional(key: keyof Omit<ConsentCategories, 'necessary'>) {
    setCategories((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <>
      {analyticsAllowed && GA_ID ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { anonymize_ip: true });
            `}
          </Script>
        </>
      ) : null}

      {hydrated && bannerOpen ? (
        <section
          className="fixed right-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-[120] grid w-[min(440px,calc(100vw-32px))] grid-cols-[auto_1fr] gap-[18px] rounded-sm border border-hairline-ink bg-ink-2 p-[22px] text-on-ink shadow-[0_24px_70px_rgba(0,0,0,.35)] max-[580px]:right-3 max-[580px]:bottom-[calc(0.75rem+env(safe-area-inset-bottom))] max-[580px]:w-[calc(100vw-24px)] max-[580px]:grid-cols-1 max-[580px]:gap-3.5 max-[580px]:p-[18px]"
          role="dialog"
          aria-live="polite"
          aria-label={copy.title}
        >
          <div
            aria-hidden
            className="grid size-[34px] place-items-center rounded-full border border-gold font-display text-gold max-[580px]:hidden"
          >
            ◌
          </div>
          <div>
            <h2 className="m-0 font-display text-2xl font-medium">{copy.title}</h2>
            <p className="mt-2.5 text-sm leading-[1.55] text-on-ink-muted">{copy.body}</p>
            <a
              className="mt-3 inline-block border-b border-gold text-[13px] font-bold text-on-ink transition-colors duration-hover ease-premium hover:text-gold"
              href={`/${locale}/polityka-prywatnosci`}
            >
              {copy.privacy}
            </a>
          </div>
          <div className="col-span-full grid grid-cols-2 gap-2.5 max-[420px]:grid-cols-1">
            <button type="button" className={cookieButtonBase} onClick={acceptAll}>{copy.acceptAll}</button>
            <button type="button" className={cookieButtonOutline} onClick={rejectOptional}>{copy.rejectOptional}</button>
            <button type="button" className={`${cookieQuietLink} col-span-full justify-self-start`} onClick={openSettingsFromBanner}>{copy.settings}</button>
          </div>
        </section>
      ) : null}

      <Dialog open={hydrated && settingsOpen} onOpenChange={closeSettings}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[min(760px,calc(100dvh-44px))] w-[min(720px,100%)] max-w-[min(720px,100%)] overflow-auto rounded-sm border border-hairline-ink bg-ink-2 p-[clamp(22px,3vw,34px)] text-on-ink shadow-[0_36px_100px_rgba(0,0,0,.5)] max-[580px]:top-auto max-[580px]:bottom-[calc(0.75rem+env(safe-area-inset-bottom))] max-[580px]:left-3 max-[580px]:right-3 max-[580px]:w-auto max-[580px]:max-w-none max-[580px]:translate-x-0 max-[580px]:translate-y-0 max-[580px]:max-h-[calc(100dvh-24px-env(safe-area-inset-bottom))] max-[580px]:p-5"
        >
          <div className="mb-[22px] flex items-start justify-between gap-[18px] border-b border-hairline-ink pb-[18px]">
            <div>
              <span className="font-sans text-[11px] font-bold tracking-[.16em] text-gold uppercase">FOMIN CHEF</span>
              <DialogTitle className="mt-1.5 font-display text-[clamp(28px,4vw,40px)] font-medium">
                {copy.settingsTitle}
              </DialogTitle>
            </div>
            <button
              type="button"
              className="grid size-11 shrink-0 cursor-pointer place-items-center border border-hairline-ink text-xl text-on-ink-muted transition-colors duration-hover ease-premium hover:border-gold hover:text-gold"
              aria-label={copy.closeSettings}
              onClick={() => closeSettings(false)}
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 border-b border-hairline-ink py-[18px] max-[580px]:grid-cols-1 max-[580px]:gap-3">
            <div>
              <h3 className="m-0 font-sans text-base font-bold">{copy.necessaryTitle}</h3>
              <p className="mt-2.5 text-sm leading-[1.55] text-on-ink-muted">{copy.necessaryDescription}</p>
            </div>
            <strong className="whitespace-nowrap text-xs font-bold text-gold uppercase">{copy.alwaysActive}</strong>
          </div>

          <CookieToggle
            title={copy.analyticsTitle}
            description={copy.analyticsDescription}
            checked={categories.analytics}
            onChange={() => updateOptional('analytics')}
          />
          <CookieToggle
            title={copy.marketingTitle}
            description={copy.marketingDescription}
            checked={categories.marketing}
            onChange={() => updateOptional('marketing')}
          />
          <CookieToggle
            title={copy.functionalTitle}
            description={copy.functionalDescription}
            checked={categories.functional}
            onChange={() => updateOptional('functional')}
          />

          <div className="mt-6 grid grid-cols-3 gap-2.5 max-[580px]:grid-cols-1">
            <button type="button" className={cookieButtonBase} onClick={() => save(categories)}>{copy.saveSettings}</button>
            <button type="button" className={cookieButtonOutline} onClick={acceptAll}>{copy.acceptAll}</button>
            <button type="button" className={cookieButtonOutline} onClick={rejectOptional}>{copy.rejectOptional}</button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CookieToggle({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 border-b border-hairline-ink py-[18px] max-[580px]:grid-cols-1 max-[580px]:gap-3">
      <div>
        <h3 className="m-0 font-sans text-base font-bold">{title}</h3>
        <p className="mt-2.5 text-sm leading-[1.55] text-on-ink-muted">{description}</p>
      </div>
      <Switch variant="brand" size="brand" checked={checked} onCheckedChange={onChange} className="cursor-pointer" />
    </div>
  );
}
