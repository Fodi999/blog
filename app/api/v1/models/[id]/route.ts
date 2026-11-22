import { json, localeOf, options, problem, withCatalog } from '@/lib/api';
import { catalogModel } from '@/lib/catalog-search';

/** GET /api/v1/models/{id} — one geometry: everything the catalogue knows of it, every file with its checksum, the
    other options of its size. id: <part>--<size>--<option>, e.g. bolt-iso-4017--m12-x-60--exact. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withCatalog(() => {
    const r = catalogModel(decodeURIComponent(id), localeOf(new URL(request.url).searchParams.get('locale')));
    return r.ok ? json(r.body) : problem(r.status, r.error, r.message, r.extra);
  });
}
export const OPTIONS = options;
