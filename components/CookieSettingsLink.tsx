'use client';

export function CookieSettingsLink() {
  return (
    <button
      type="button"
      className="site-footer__button"
      onClick={() => window.dispatchEvent(new Event('fominchef:open-cookie-settings'))}
    >
      Ustawienia cookies
    </button>
  );
}
