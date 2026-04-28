/**
 * Laboratory v2 — Photo → 3D Model.
 *
 * Replaces the legacy food-tech analysis API (project / ingredients / steps /
 * analyze / scenes). The new contract is intentionally tiny:
 *
 *   • POST /api/laboratory/images                      (multipart "file" or JSON URL)
 *   • POST /api/laboratory/images/:id/generate-model   (sync; PR #3 returns
 *                                                       Vision spec + status
 *                                                       `generating_model`,
 *                                                       OBJ/GLB lands in PR #4)
 *   • GET  /api/laboratory/assets/:id
 *
 * All endpoints are JWT-authenticated. Static files (uploaded images,
 * generated OBJ/GLB) are served from `/static/...` without auth.
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
 * Trigger procedural 3D-model generation for a previously-uploaded image.
 *
 * MVP is synchronous. As of PR #3 the backend runs Gemini Vision inline and
 * returns the asset with `object_type` + `object_spec` populated and
 * `status = "generating_model"`. The OBJ/GLB itself (and `model_url`) lands
 * in PR #4 — until then `model_url` will be `null` and the UI should treat
 * `generating_model` as a successful intermediate state.
 */
export async function generateLaboratoryModel(imageId: string): Promise<Laboratory3DAsset> {
  return api.post<Laboratory3DAsset>(
    `/api/laboratory/images/${encodeURIComponent(imageId)}/generate-model`,
  );
}

/** Fetch a 3D asset (with embedded source `image_url`). */
export async function getLaboratoryAsset(assetId: string): Promise<Laboratory3DAsset> {
  return api.get<Laboratory3DAsset>(
    `/api/laboratory/assets/${encodeURIComponent(assetId)}`,
  );
}
