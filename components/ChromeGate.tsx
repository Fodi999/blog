'use client';

/**
 * ChromeGate — hides public marketing chrome (Header / Footer) when the
 * user is inside the `/[locale]/app/*` cabinet. Keeps SaaS workspace and
 * the public website visually distinct without restructuring the route
 * tree into a separate group.
 */
import { usePathname } from 'next/navigation';

export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  // Matches "/<locale>/app" and "/<locale>/app/anything".
  const isInsideApp = /^\/[^/]+\/app(?:\/|$)/.test(pathname);
  if (isInsideApp) return null;
  return <>{children}</>;
}
