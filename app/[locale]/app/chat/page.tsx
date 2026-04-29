import type { Metadata } from 'next';
import { AISousChef } from '@/app/[locale]/chef-tools/dashboard/AISousChef';

export const metadata: Metadata = {
  title: 'Кухонный терминал — ChefOS',
};

type Params = Promise<{ locale: string }>;

export default async function ChatPage({ params: _params }: { params: Params }) {
  return <AISousChef />;
}
