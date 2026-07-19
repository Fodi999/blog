import { notFound } from 'next/navigation';

// Funnels every unmatched URL under a valid locale into the localized
// not-found page, since there is no root layout to host a global one.
export default function CatchAllPage() {
  notFound();
}
