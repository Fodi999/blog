import { redirect } from 'next/navigation';

export default async function NutritionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/chef-tools/ingredient-analyzer`);
}

