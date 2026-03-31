'use client';

import { type ReactNode } from 'react';

export function ChefPageLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  // Skip the hero animation — go straight to tools
  return <>{children}</>;
}
