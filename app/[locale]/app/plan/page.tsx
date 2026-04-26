import type { Metadata } from 'next';
import { PlanClient } from './_components/PlanClient';

export const metadata: Metadata = {
  title: 'Plan — ChefOS',
};

type Params = Promise<{ locale: string }>;

export default async function PlanPage({ params }: { params: Params }) {
  const { locale } = await params;
  return <PlanClient locale={locale} />;
}
