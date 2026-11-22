import { json, localeOf, options, problem } from '@/lib/api';
import { allEntries, entryOf, modelId, parseId, record } from '@/lib/catalog';

/** GET /api/v1/models/{id} — one geometry: everything the catalogue knows of it, every file with its checksum, the
    other options of its size. id: <part>--<size>--<option>, e.g. bolt-iso-4017--m12-x-60--exact. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = localeOf(new URL(request.url).searchParams.get('locale'));
  const e = entryOf(decodeURIComponent(id));
  if (!e) {
    const p = parseId(id);
    const same = p ? allEntries().filter((x) => x.item.slug === p.slug && x.page.id === p.page) : [];
    return problem(404, 'not_found', `No model «${id}».`, same.length ? { options_of_this_size: same.map((x) => modelId(x.item.slug, x.page.id, x.opt.id)) } : {});
  }
  return json({
    ...record(e, locale, true),
    other_options: e.page.options.filter((o) => o.id !== e.opt.id).map((o) => ({ id: modelId(e.item.slug, e.page.id, o.id), label: o.label[locale] })),
  });
}
export const OPTIONS = options;
