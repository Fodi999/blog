import { redirect } from "next/navigation";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://dima-fomin.pl'),
  alternates: {
    canonical: 'https://dima-fomin.pl/pl',
    languages: {
      'pl': 'https://dima-fomin.pl/pl',
      'en': 'https://dima-fomin.pl/en',
      'ru': 'https://dima-fomin.pl/ru',
      'uk': 'https://dima-fomin.pl/uk',
      'x-default': 'https://dima-fomin.pl/pl',
    },
  },
};

export default function RootPage() {
  redirect("/pl");
}
