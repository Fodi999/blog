'use client';

/**
 * StudioRouteClient — client wrapper around `LaboratoryStudioViewer`.
 *
 * Handles:
 *   * loading state while the asset is fetched
 *   * error state (404 / unauthorised / network)
 *   * a thin "back to Laboratory" CTA on failure
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  getLaboratoryAsset,
  type Laboratory3DAsset,
} from '@/lib/laboratory-api';
import { LaboratoryStudioViewer } from './LaboratoryStudioViewer';

interface Props {
  assetId: string;
  locale: string;
}

export function StudioRouteClient({ assetId, locale }: Props) {
  const [asset, setAsset] = useState<Laboratory3DAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const backHref = `/${locale}/app/laboratory`;

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setAsset(null);
    getLaboratoryAsset(assetId)
      .then((a) => {
        if (!cancelled) setAsset(a);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg =
          e instanceof Error ? e.message : 'Failed to load asset';
        setError(msg);
      });
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-zinc-950 text-zinc-300">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center">
          <p className="font-medium text-rose-300">Could not load asset</p>
          <p className="mt-1 text-sm text-zinc-500">{error}</p>
          <Link
            href={backHref}
            className="mt-4 inline-block rounded-md border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800"
          >
            ← Back to Laboratory
          </Link>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          loading asset…
        </div>
      </div>
    );
  }

  return <LaboratoryStudioViewer asset={asset} backHref={backHref} />;
}
