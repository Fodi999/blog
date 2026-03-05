'use client';

import dynamic from 'next/dynamic';

// MobileMenu uses Radix UI Dialog which generates aria-controls IDs.
// SSR produces different IDs than the client, causing hydration mismatch.
// Solution: render only on the client side.
const MobileMenu = dynamic(
  () => import('./MobileMenu').then((m) => m.MobileMenu),
  { ssr: false },
);

export function MobileMenuWrapper() {
  return <MobileMenu />;
}
