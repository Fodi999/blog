'use client';

/**
 * Laboratory v2 — Photo → 3D Model.
 *
 * Flow:
 *   1. user picks an image  →  preview locally
 *   2. clicks "Upload"      →  POST /api/laboratory/images (multipart)
 *   3. clicks "Generate 3D" →  POST /api/laboratory/images/:id/generate-model
 *      PR #4 backend: Gemini Vision → geometry dispatch → OBJ → status = ready.
 *
 * When asset.status === "ready" the ObjViewer replaces the placeholder card.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import Link from 'next/link';

import { ApiError } from '@/lib/chefos-api';
import {
  generateLaboratoryModel,
  resolveAssetUrl,
  uploadLaboratoryImage,
  type Laboratory3DAsset,
  type LaboratoryImage,
} from '@/lib/laboratory-api';

// Dynamic import — three.js is large, no need to SSR it.
const ModelViewer = dynamic(
  () => import('./ModelViewer').then((m) => m.ModelViewer),
  { ssr: false, loading: () => <div className="h-72 rounded-xl bg-zinc-900 animate-pulse" /> }
);

const ACCEPTED_MIME = 'image/png,image/jpeg,image/webp';
const MAX_BYTES = 10 * 1024 * 1024;

export function LaboratoryClient({ locale }: { locale: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [image, setImage] = useState<LaboratoryImage | null>(null);
  const [asset, setAsset] = useState<Laboratory3DAsset | null>(null);

  const onPick = useCallback((next: File | null) => {
    setAsset(null);
    setImage(null);
    if (!next) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (next.size > MAX_BYTES) {
      toast.error('File too large (max 10 MB).');
      return;
    }
    setFile(next);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(next);
    });
  }, []);

  const onUpload = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    try {
      const persisted = await uploadLaboratoryImage(file);
      setImage(persisted);
      toast.success('Image uploaded.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }, [file]);

  const onGenerate = useCallback(async () => {
    if (!image) return;
    setGenerating(true);
    try {
      const next = await generateLaboratoryModel(image.id);
      setAsset(next);
      if (next.status === 'ready' && next.model_url) {
        toast.success('3D model generated.');
      } else if (next.status === 'generating_model') {
        toast.success(
          `Vision analysis done${next.object_type ? ` · ${next.object_type}` : ''}.`,
        );
      } else if (next.status === 'failed') {
        toast.error(next.error_message ?? 'Generation failed');
      } else {
        toast.info(`Asset status: ${next.status}`);
      }
    } catch (err) {
      // Backend may still return 500 if GEMINI_API_KEY is missing in the env.
      if (err instanceof ApiError && /not_implemented|GEMINI_API_KEY/i.test(String(err.message))) {
        toast.info('3D generation is temporarily unavailable.');
      } else {
        const msg = err instanceof Error ? err.message : 'Generation failed';
        toast.error(msg);
      }
    } finally {
      setGenerating(false);
    }
  }, [image]);

  const fileLabel = useMemo(() => {
    if (!file) return 'No file selected';
    const kb = (file.size / 1024).toFixed(1);
    return `${file.name} · ${kb} KB`;
  }, [file]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Laboratory · Photo → 3D</h1>
        <p className="text-sm text-muted-foreground">
          Upload a product photo (PNG / JPEG / WebP, up to 10 MB) and generate
          a procedural 3D model.
        </p>
      </header>

      {/* ── Picker ────────────────────────────────────────────────────────── */}
      <section className="rounded-lg border bg-card p-4">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_MIME}
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            onClick={() => inputRef.current?.click()}
          >
            Choose image…
          </button>
          <span className="truncate text-sm text-muted-foreground">{fileLabel}</span>
        </div>

        {previewUrl ? (
          <div className="mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-80 rounded-md border object-contain"
            />
          </div>
        ) : null}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={!file || uploading || !!image}
            onClick={onUpload}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : image ? 'Uploaded ✓' : 'Upload'}
          </button>
          <button
            type="button"
            disabled={!image || generating}
            onClick={onGenerate}
            className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {generating ? 'Generating…' : 'Generate 3D model'}
          </button>
          {asset ? (
            <button
              type="button"
              disabled={!image || generating}
              onClick={() => { setAsset(null); void onGenerate(); }}
              className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {generating ? 'Regenerating…' : 'Regenerate'}
            </button>
          ) : null}
        </div>
      </section>

      {/* ── Persisted image card ──────────────────────────────────────────── */}
      {image ? (
        <section className="rounded-lg border bg-card p-4 text-sm">
          <h2 className="mb-2 font-medium">Source image</h2>
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-muted-foreground">
            <dt>id</dt>
            <dd className="font-mono text-xs">{image.id}</dd>
            <dt>url</dt>
            <dd className="break-all font-mono text-xs">{image.image_url}</dd>
            <dt>mime</dt>
            <dd>{image.mime_type}</dd>
            {image.byte_size != null ? (
              <>
                <dt>size</dt>
                <dd>{(image.byte_size / 1024).toFixed(1)} KB</dd>
              </>
            ) : null}
          </dl>
        </section>
      ) : null}

      {/* ── Asset card — Vision spec + 3D viewer ─────────────────────── */}
      {asset ? (
        <section className="rounded-lg border bg-card p-4 text-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-medium">3D asset</h2>
            {asset.status === 'ready' && asset.model_url ? (
              <Link
                href={`/${locale}/app/laboratory/assets/${asset.id}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200 transition hover:bg-amber-500/20"
              >
                Open in Studio
                <span aria-hidden>→</span>
              </Link>
            ) : null}
          </div>

          {/* OBJ viewer — shown when model is ready */}
          {asset.status === 'ready' && asset.model_url ? (
            <ModelViewer modelUrl={resolveAssetUrl(asset.model_url)!} className="mb-4 h-72 w-full" />
          ) : null}

          {/* Failed state placeholder */}
          {asset.status === 'failed' ? (
            <div className="mb-4 flex h-40 items-center justify-center rounded-xl border border-dashed border-destructive/40 bg-destructive/5 text-sm text-destructive">
              Generation failed — click&nbsp;<strong>Regenerate</strong>&nbsp;to retry.
            </div>
          ) : null}

          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-muted-foreground">
            <dt>id</dt>
            <dd className="font-mono text-xs">{asset.id}</dd>
            <dt>status</dt>
            <dd>{asset.status}</dd>
            {asset.object_type ? (
              <>
                <dt>object</dt>
                <dd>{asset.object_type}</dd>
              </>
            ) : null}
            {asset.error_message ? (
              <>
                <dt>error</dt>
                <dd className="text-destructive">{asset.error_message}</dd>
              </>
            ) : null}
            {asset.model_url ? (
              <>
                <dt>model</dt>
                <dd className="break-all font-mono text-xs">{asset.model_url}</dd>
              </>
            ) : null}
          </dl>

          {asset.object_spec ? (
            <details className="mt-3 group">
              <summary className="cursor-pointer select-none rounded-md border border-dashed border-zinc-700 px-2 py-1 text-xs text-muted-foreground transition hover:bg-zinc-900/40 hover:text-foreground">
                <span className="group-open:hidden">▸ Advanced (debug spec)</span>
                <span className="hidden group-open:inline">▾ Hide debug spec</span>
              </summary>
              <pre className="mt-2 max-h-72 overflow-auto rounded-md bg-muted p-2 text-xs">
                {JSON.stringify(asset.object_spec, null, 2)}
              </pre>
            </details>
          ) : null}

          {asset.status === 'generating_model' && !asset.model_url ? (
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Generating 3D model…
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
