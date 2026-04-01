import { setRequestLocale } from 'next-intl/server';
import { ChefOSChat } from '@/components/chat/ChefOSChat';

export default async function ChefChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden shadow-xl">
        <ChefOSChat />
      </div>
    </div>
  );
}
