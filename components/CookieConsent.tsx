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

const CONSENT_KEY = 'fominChefCookieConsent';
const CONSENT_VERSION = '2026-06-30-v1';
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const defaultCategories: ConsentCategories = {
  necessary: true,
  analytics: false,
  marketing: false,
  functional: false,
};

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

  useEffect(() => {
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
        <section className="cookie-consent" role="dialog" aria-live="polite" aria-label="Cookies">
          <div className="cookie-consent__icon" aria-hidden="true">◌</div>
          <div className="cookie-consent__copy">
            <h2>Cookies</h2>
            <p>Używamy plików cookies, aby zapewnić prawidłowe działanie strony, analizować ruch oraz ulepszać treści. Możesz zaakceptować wszystkie pliki cookies, odrzucić opcjonalne lub dostosować ustawienia.</p>
            <a href="/pl/polityka-prywatnosci">Polityka prywatności</a>
          </div>
          <div className="cookie-consent__actions">
            <button type="button" className="cookie-button cookie-button--dark" onClick={acceptAll}>AKCEPTUJ WSZYSTKIE</button>
            <button type="button" className="cookie-button cookie-button--light" onClick={rejectOptional}>ODRZUĆ OPCJONALNE</button>
            <button type="button" className="cookie-button cookie-button--gold" onClick={openSettingsFromBanner}>USTAWIENIA</button>
          </div>
        </section>
      ) : null}

      {hydrated && settingsOpen ? (
        <div className="cookie-modal" role="dialog" aria-modal="true" aria-labelledby="cookie-settings-title">
          <div className="cookie-modal__panel">
            <div className="cookie-modal__head">
              <div>
                <span>FOMIN CHEF</span>
                <h2 id="cookie-settings-title">Ustawienia cookies</h2>
              </div>
              <button type="button" className="cookie-modal__close" aria-label="Zamknij ustawienia cookies" onClick={closeSettings}>×</button>
            </div>

            <div className="cookie-category">
              <div>
                <h3>Niezbędne cookies</h3>
                <p>Te pliki są wymagane do prawidłowego działania strony.</p>
              </div>
              <strong>Zawsze aktywne</strong>
            </div>

            <CookieToggle
              title="Analityczne cookies"
              description="Pomagają nam zrozumieć, jak użytkownicy korzystają ze strony."
              checked={categories.analytics}
              onChange={() => updateOptional('analytics')}
            />
            <CookieToggle
              title="Marketingowe cookies"
              description="Służą do personalizacji treści i działań reklamowych."
              checked={categories.marketing}
              onChange={() => updateOptional('marketing')}
            />
            <CookieToggle
              title="Funkcjonalne cookies"
              description="Zapamiętują wybrane ustawienia, np. język strony."
              checked={categories.functional}
              onChange={() => updateOptional('functional')}
            />

            <div className="cookie-modal__actions">
              <button type="button" className="cookie-button cookie-button--dark" onClick={() => save(categories)}>ZAPISZ USTAWIENIA</button>
              <button type="button" className="cookie-button cookie-button--light" onClick={acceptAll}>AKCEPTUJ WSZYSTKIE</button>
              <button type="button" className="cookie-button cookie-button--gold" onClick={rejectOptional}>ODRZUĆ OPCJONALNE</button>
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
