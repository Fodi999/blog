import { totals } from '@/lib/downloads';
import { API_VERSION, json, options } from '@/lib/api';
import { SITE_URL } from '@/lib/seo';

/** GET /api/v1 — what the Monge Catalog API has and where. */
export function GET() {
  return json({
    name: 'Monge Catalog API',
    version: API_VERSION,
    description: 'Read-only catalogue of the Monge library: standard parts (ISO, DIN, EN) as checked 3D models — STEP, STL, 3MF, GLB — with their dimensions, checks, images and licence.',
    models: totals.geometries,
    sizes: totals.pages,
    endpoints: {
      search: `${SITE_URL}/api/v1/models?q=ISO%204017%20M12x60%20real%20thread%20STEP`,
      model: `${SITE_URL}/api/v1/models/bolt-iso-4017--m12-x-60--exact`,
      catalog: `${SITE_URL}/api/v1/catalog`,
    },
    docs: `${SITE_URL}/en/developers`,
    license: `${SITE_URL}/en/license`,
  }, 200, 'public, max-age=3600');
}
export const OPTIONS = options;
