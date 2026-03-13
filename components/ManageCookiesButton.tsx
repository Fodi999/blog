'use client';

const COOKIE_CONSENT_KEY = 'cookie-consent';

/**
 * "Manage cookies" button for the footer.
 * Clears stored consent so the CookieConsent banner reappears on next page load.
 */
export function ManageCookiesButton({ label }: { label: string }) {
  const handleClick = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    window.location.reload();
  };

  return (
    <button
      onClick={handleClick}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
    >
      {label}
    </button>
  );
}
