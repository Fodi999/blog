'use client';

/**
 * Laboratory v2 — Photo → 3D Model (uploader-only MVP).
 *
 * Flow:
 *   1. user picks an image  →  preview locally
 *   2. clicks "Upload"      →  POST /api/laboratory/images (multipart)
 *   3. clicks "Generate 3D" →  POST /api/laboratory/images/:id/generate-model
 *      (currently 500 not_implemented — UI shows a graceful "coming soon")
 *
 * The legacy Copilot / Constructor / Analysis / Visual-Story UI is gone.
 * Everything 3D-related (viewer, drei, asset polling) lands in PR #3.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ApiError } from '@/lib/chefos-api';
import {
  generateLaboratoryModel,
  uploadLaboratoryImage,
  type Laboratory3DAsset,
  type LaboratoryImage,
} from '@/lib/laboratory-api';

const ACCEPTED_MIME = 'image/png,image/jpeg,image/webp';
const MAX_BYTES = 10 * 1024 * 1024;

export function LaboratoryClient(_props: { locale: string }) {
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
      toast.success('3D model generated.');
    } catch (err) {
      // Backend currently returns 500 not_implemented — show as info, not error.
      if (err instanceof ApiError && /not_implemented/i.test(String(err.message))) {
        toast.info('3D generation is coming in the next release.');
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

      {/* ── Asset card (placeholder until PR #3) ──────────────────────────── */}
      {asset ? (
        <section className="rounded-lg border bg-card p-4 text-sm">
          <h2 className="mb-2 font-medium">3D asset</h2>
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-muted-foreground">
            <dt>id</dt>
            <dd className="font-mono text-xs">{asset.id}</dd>
            <dt>status</dt>
            <dd>{asset.status}</dd>
            {asset.model_url ? (
              <>
                <dt>model</dt>
                <dd className="break-all font-mono text-xs">{asset.model_url}</dd>
              </>
            ) : null}
          </dl>
        </section>
      ) : null}
    </div>
  );
}
