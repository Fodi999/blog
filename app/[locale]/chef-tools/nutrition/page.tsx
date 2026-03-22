import { redirect } from 'next/navigation';

export const revalidate = 86400; // static redirect, ISR 1 day

export default async function NutritionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/chef-tools/ingredient-analyzer`);
}

