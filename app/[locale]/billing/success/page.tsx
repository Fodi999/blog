import { setRequestLocale } from 'next-intl/server';
import { SuccessClient } from './_components/SuccessClient';

export default async function BillingSuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SuccessClient locale={locale} />;
}
