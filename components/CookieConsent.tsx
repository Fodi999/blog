'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

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

export function CookieConsent() {
  const [hydrated, setHydrated] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [categories, setCategories] = useState<ConsentCategories>(defaultCategories);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);
  const [locale, setLocale] = useState<ConsentLocale>('pl');
  const copy = cookieCopy[locale];

  useEffect(() => {
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

    function openSettings() {
      const current = readStoredConsent();
      setCategories(current?.categories ?? defaultCategories);
      setBannerOpen(false);
      setSettingsOpen(true);
    }

    window.addEventListener('fominchef:open-cookie-settings', openSettings);
    return () => window.removeEventListener('fominchef:open-cookie-settings', openSettings);
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

  function closeSettings() {
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
        <section className="cookie-consent" role="dialog" aria-live="polite" aria-label={copy.title}>
          <div className="cookie-consent__icon" aria-hidden="true">◌</div>
          <div className="cookie-consent__copy">
            <h2>{copy.title}</h2>
            <p>{copy.body}</p>
            <a href={`/${locale}/polityka-prywatnosci`}>{copy.privacy}</a>
          </div>
          <div className="cookie-consent__actions">
            <button type="button" className="cookie-button cookie-button--dark" onClick={acceptAll}>{copy.acceptAll}</button>
            <button type="button" className="cookie-button cookie-button--light" onClick={rejectOptional}>{copy.rejectOptional}</button>
            <button type="button" className="cookie-button cookie-button--gold" onClick={openSettingsFromBanner}>{copy.settings}</button>
          </div>
        </section>
      ) : null}

      {hydrated && settingsOpen ? (
        <div className="cookie-modal" role="dialog" aria-modal="true" aria-labelledby="cookie-settings-title">
          <div className="cookie-modal__panel">
            <div className="cookie-modal__head">
              <div>
                <span>FOMIN CHEF</span>
                <h2 id="cookie-settings-title">{copy.settingsTitle}</h2>
              </div>
              <button type="button" className="cookie-modal__close" aria-label={copy.closeSettings} onClick={closeSettings}>×</button>
            </div>

            <div className="cookie-category">
              <div>
                <h3>{copy.necessaryTitle}</h3>
                <p>{copy.necessaryDescription}</p>
              </div>
              <strong>{copy.alwaysActive}</strong>
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

            <div className="cookie-modal__actions">
              <button type="button" className="cookie-button cookie-button--dark" onClick={() => save(categories)}>{copy.saveSettings}</button>
              <button type="button" className="cookie-button cookie-button--light" onClick={acceptAll}>{copy.acceptAll}</button>
              <button type="button" className="cookie-button cookie-button--gold" onClick={rejectOptional}>{copy.rejectOptional}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function CookieToggle({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="cookie-category">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <button type="button" className={`cookie-toggle${checked ? ' active' : ''}`} role="switch" aria-checked={checked} onClick={onChange}>
        <span />
      </button>
    </div>
  );
}
