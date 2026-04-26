import type { Metadata } from 'next';
import { ChatClient } from './_components/ChatClient';

export const metadata: Metadata = {
  title: 'Assistant — ChefOS',
};

type Params = Promise<{ locale: string }>;

export default async function ChatPage({ params }: { params: Params }) {
  const { locale } = await params;
  return <ChatClient locale={locale} />;
}
