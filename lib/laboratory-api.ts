/**
 * Laboratory v2 — Photo → 3D Model.
 *
 * Replaces the legacy food-tech analysis API (project / ingredients / steps /
 * analyze / scenes). The new contract is intentionally tiny:
 *
 *   • POST /api/laboratory/images                      (multipart "file" or JSON URL)
 *   • POST /api/laboratory/images/:id/generate-model   (sync; returns Vision spec +
 *                                                       OBJ model_url when ready)
 *   • GET  /api/laboratory/assets/:id
 *
 * All endpoints are JWT-authenticated. Static files (uploaded images,
 * generated OBJ/MTL) are served from `/static/...` without auth.
 *
 * Backend: `assistant/src/application/laboratory_v2/*`.
 */
import { API_URL } from './api';
import { api, ApiError } from './chefos-api';
import { getAccessToken } from './auth-client';

// ── Types ────────────────────────────────────────────────────────────────────

export type LaboratoryImage = {
  id: string;
  user_id: string;
  tenant_id?: string | null;
  image_url: string;
  mime_type: string;
  original_filename?: string | null;
  byte_size?: number | null;
  width_px?: number | null;
  height_px?: number | null;
  created_at: string;
};

export type AssetStatus =
  | 'pending'
  | 'analyzing_image'
  | 'generating_model'
  | 'ready'
  | 'failed';

export type Laboratory3DAsset = {
  id: string;
  image_id: string;
  user_id: string;
  tenant_id?: string | null;
  status: AssetStatus;
  provider: string;
  object_type?: string | null;
  object_spec?: unknown | null;
  model_format?: string | null;
  model_url?: string | null;
  thumbnail_url?: string | null;
  /** Source-image URL embedded by the backend so the UI can render before/after. */
  image_url?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
};

// ── URL helpers ───────────────────────────────────────────────────────────────

/**
 * Resolve a backend asset URL to a fully-qualified URL.
 *
 * The backend stores relative paths like `/static/laboratory/models/…/model.obj`.
 * When frontend and backend run on different domains (e.g. Next.js on Vercel,
 * Rust API on Koyeb) the browser would look for `/static/…` on the frontend
 * domain — which is wrong.
 *
 * Rule:
 *   - URL already absolute (`http://` or `https://`) → return as-is.
 *   - URL starts with `/` → prepend `API_URL` (the backend origin).
 *   - Anything else → return as-is.
 */
export function resolveAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_URL}${url}`;
  return url;
}

// ── Endpoints ────────────────────────────────────────────────────────────────

/**
 * Upload an image file via `multipart/form-data`. The backend writes it to
 * local storage (or R2 in the future) and returns the persisted record.
 */
export async function uploadLaboratoryImage(file: File): Promise<LaboratoryImage> {
  const form = new FormData();
  form.append('file', file, file.name);

  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api/laboratory/images`, {
    method: 'POST',
    headers,
    body: form,
  });

  const text = await res.text();
  let parsed: unknown = undefined;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const msg =
      (typeof parsed === 'object' && parsed && 'message' in parsed
        ? String((parsed as { message: unknown }).message)
        : null) ?? `Upload failed (${res.status})`;
    throw new ApiError(msg, res.status, parsed);
  }

  return parsed as LaboratoryImage;
}

/**
 * Geometry quality preset (PR #23 backend / PR #24 frontend hookup).
 *
 * Controls the Rust generator's tessellation density:
 *   draft     32 segs · 8 rings   — fast preview
 *   standard  48 segs · 14 rings  — legacy default
 *   high      96 segs · 24 rings  — Studio default (server default)
 *   ultra    128 segs · 32 rings  — final-render GLB
 *
 * Independent from frontend `RenderQuality` (DPR / shadows / AA).
 */
export type GeometryQuality = 'draft' | 'standard' | 'high' | 'ultra';

/**
 * Trigger procedural 3D-model generation for a previously-uploaded image.
 *
 * Synchronous end-to-end: Gemini Vision → geometry dispatch → OBJ stored.
 * Returns asset with `status = "ready"` and `model_url` set on success,
 * or `status = "failed"` with `error_message` on any pipeline error.
 *
 * Pass `quality` to override the geometry preset (default = `high`).
 */
export async function generateLaboratoryModel(
  imageId: string,
  quality?: GeometryQuality,
): Promise<Laboratory3DAsset> {
  const qs = quality ? `?quality=${encodeURIComponent(quality)}` : '';
  return api.post<Laboratory3DAsset>(
    `/api/laboratory/images/${encodeURIComponent(imageId)}/generate-model${qs}`,
  );
}

/** Fetch a 3D asset (with embedded source `image_url`). */
export async function getLaboratoryAsset(assetId: string): Promise<Laboratory3DAsset> {
  return api.get<Laboratory3DAsset>(
    `/api/laboratory/assets/${encodeURIComponent(assetId)}`,
  );
}

// ── PR #31 — Smoothness Slider ────────────────────────────────────────────────

/** Values that the backend actually used when building the surface. */
export type SurfaceTuneInfo = {
  smoothness: number;
  ridge_height: number;
  groove_depth: number;
  center_peak: number;
  surface_irregularity: number;
  highlight_strength: number;
};

export type TuneSurfaceResponse = {
  asset: Laboratory3DAsset;
  surface_info: SurfaceTuneInfo;
};

/**
 * Regenerate the geometry for an existing asset using a `smoothness` value
 * (0.0 = very textured, 1.0 = flat/mirror-smooth) without re-running Gemini.
 *
 * Use `quality = 'draft'` during slider drag (fast preview) and
 * `quality = 'high'` when the user clicks "Apply".
 */
export async function tuneSurface(
  assetId: string,
  smoothness: number,   // 0.0 – 1.0
  quality: GeometryQuality = 'draft',
): Promise<TuneSurfaceResponse> {
  return api.post<TuneSurfaceResponse>(
    `/api/laboratory/assets/${encodeURIComponent(assetId)}/tune-surface`,
    { smoothness: Math.round(smoothness * 1000) / 1000, quality },
  );
}
