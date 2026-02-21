import { redirect } from "next/navigation";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://dima-fomin.pl/pl',
  },
};

export default function RootPage() {
  redirect("/pl");
}
