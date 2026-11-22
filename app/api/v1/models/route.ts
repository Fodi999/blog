import { json, options, problem, withCatalog } from '@/lib/api';
import { catalogSearch } from '@/lib/catalog-search';

/** GET /api/v1/models?q=&standard=&category=&size=&length=&thread=&format=&locale=&limit=&cursor=
    The geometries that have everything asked (match: "exact"), or — none — match: "not_found" and the nearest, each
    with what differs. Filters override what q says. */
export function GET(request: Request) {
  return withCatalog(() => {
    const r = catalogSearch(new URL(request.url).searchParams);
    return r.ok ? json(r.body) : problem(r.status, r.error, r.message);
  });
}
export const OPTIONS = options;
