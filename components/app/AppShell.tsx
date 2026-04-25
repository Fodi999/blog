'use client';

/**
 * AppShell — main layout for /[locale]/app/*.
 * Desktop:  fixed sidebar on the left + content.
 * Mobile:   content + bottom navigation bar.
 *
 * Stays minimal: no marketing chrome. Header/Footer from the
 * parent locale layout still wraps this; we'll factor those out
 * with a route group once the cabinet has more screens.
 */
import { Sidebar } from './Sidebar';
import { MobileAppNav } from './MobileAppNav';

export function AppShell({ children, locale }: { children: React.ReactNode; locale: string }) {
  return (
    <div className="-my-12 lg:-my-20 min-h-[calc(100vh-4rem)] bg-muted/30">
      <div className="mx-auto flex w-full max-w-[1400px] gap-6 px-4 py-6 lg:px-8">
        <Sidebar locale={locale} className="hidden lg:flex" />
        <main className="min-w-0 flex-1 pb-24 lg:pb-6">{children}</main>
      </div>
      <MobileAppNav locale={locale} />
    </div>
  );
}
