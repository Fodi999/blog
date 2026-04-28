import { setRequestLocale } from 'next-intl/server';

import { StudioRouteClient } from '@/app/[locale]/app/laboratory/_components/StudioRouteClient';

/**
 * Fullscreen 3D Product Studio (PR #19).
 *
 * Server-rendered shell that hands the asset id to a client component
 * which fetches `getLaboratoryAsset` (auth lives in localStorage on the
 * client) and mounts `LaboratoryStudioViewer`.
 */
export default async function StudioAssetPage({
  params,
}: {
  params: Promise<{ locale: string; assetId: string }>;
}) {
  const { locale, assetId } = await params;
  setRequestLocale(locale);
  return <StudioRouteClient assetId={assetId} locale={locale} />;
}
