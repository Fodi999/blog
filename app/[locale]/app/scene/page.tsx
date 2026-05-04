import { setRequestLocale } from 'next-intl/server';
import { SceneClient } from './_components/SceneClient';

/**
 * 3D Workspace page — /[locale]/app/scene
 * Full-viewport Visual + Simulation tabs, Copilot in right rail.
 */
export default async function ScenePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SceneClient locale={locale} />;
}
