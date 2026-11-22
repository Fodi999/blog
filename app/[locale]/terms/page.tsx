import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/sections';
import { isLocale, localPath, type Locale } from '@/lib/i18n';
import { EMAIL, pageMetadata } from '@/lib/seo';

/* Terms of use of the site, the catalogue API and the MCP server (Monge CAD). The files themselves: /license. */
const copy: Record<Locale, { title: string; lead: string; license: string; sections: { title: string; body: React.ReactNode }[] }> = {
  en: {
    title: 'Terms of use',
    lead: 'The terms of the Monge website, its catalogue API and the Monge CAD MCP server.',
    license: 'model licence',
    sections: [
      { title: 'Service', body: 'Monge CAD gives access to the Monge library of standard part models through the website dima-fomin.pl, its catalogue API (/api/v1) and its MCP server (/mcp). The service is provided by Dmytro Fomin, Gdańsk, Poland. It is free and needs no account.' },
      { title: 'Files', body: 'The model files are used under the model licence: free, commercial use included; the files themselves may not be resold or redistributed.' },
      { title: 'Fair use', body: 'Do not try to get around the rate limits, overload the service, or copy the library in bulk to republish it. We may limit or block traffic that does.' },
      { title: 'No warranty', body: 'The service and the files are provided “as is”. Dimensions are reference data from the standards’ tables; check the current edition of the standard and the maker’s data before manufacturing. Answers given by an AI assistant that uses this service are the assistant’s; check them against the model page.' },
      { title: 'Liability', body: 'To the extent the law allows, the author is not liable for damage arising from the use of the service or the files.' },
      { title: 'Changes', body: 'The service, the library and these terms may change; the date below shows the current version. The service may be interrupted for maintenance.' },
      { title: 'Law and contact', body: <>Polish law applies. Contact: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.</> },
    ],
  },
  ru: {
    title: 'Условия использования',
    lead: 'Условия сайта Monge, API каталога и MCP-сервера Monge CAD.',
    license: 'лицензия моделей',
    sections: [
      { title: 'Сервис', body: 'Monge CAD даёт доступ к библиотеке моделей стандартных деталей Monge через сайт dima-fomin.pl, API каталога (/api/v1) и MCP-сервер (/mcp). Сервис предоставляет Дмитрий Фомин, Гданьск, Польша. Он бесплатен и не требует аккаунта.' },
      { title: 'Файлы', body: 'Файлы моделей используются по лицензии моделей: бесплатно, в том числе коммерчески; перепродавать и распространять сами файлы нельзя.' },
      { title: 'Добросовестное использование', body: 'Не пытайтесь обходить ограничения частоты запросов, перегружать сервис или массово копировать библиотеку для повторной публикации. Такой трафик мы можем ограничить или заблокировать.' },
      { title: 'Без гарантий', body: 'Сервис и файлы предоставляются «как есть». Размеры — справочные данные из таблиц стандартов; перед изготовлением сверяйтесь с действующей редакцией стандарта и данными производителя. Ответы ИИ-ассистента, использующего сервис, — ответы ассистента; сверяйте их со страницей модели.' },
      { title: 'Ответственность', body: 'В пределах, допускаемых законом, автор не несёт ответственности за ущерб от использования сервиса или файлов.' },
      { title: 'Изменения', body: 'Сервис, библиотека и эти условия могут меняться; дата ниже указывает действующую редакцию. Работа сервиса может прерываться на обслуживание.' },
      { title: 'Право и контакт', body: <>Применяется право Польши. Контакт: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.</> },
    ],
  },
  pl: {
    title: 'Warunki korzystania',
    lead: 'Warunki strony Monge, API katalogu i serwera MCP Monge CAD.',
    license: 'licencja modeli',
    sections: [
      { title: 'Usługa', body: 'Monge CAD daje dostęp do biblioteki modeli części znormalizowanych Monge przez stronę dima-fomin.pl, API katalogu (/api/v1) i serwer MCP (/mcp). Usługę świadczy Dmytro Fomin, Gdańsk, Polska. Jest bezpłatna i nie wymaga konta.' },
      { title: 'Pliki', body: 'Z plików modeli korzysta się na zasadach licencji modeli: bezpłatnie, także komercyjnie; samych plików nie wolno odsprzedawać ani rozpowszechniać.' },
      { title: 'Uczciwe korzystanie', body: 'Nie próbuj obchodzić limitów zapytań, przeciążać usługi ani masowo kopiować biblioteki w celu ponownej publikacji. Taki ruch możemy ograniczyć lub zablokować.' },
      { title: 'Bez gwarancji', body: 'Usługa i pliki są udostępniane „tak jak są”. Wymiary to dane referencyjne z tabel norm; przed produkcją sprawdź aktualne wydanie normy i dane producenta. Odpowiedzi asystenta AI korzystającego z usługi są odpowiedziami asystenta; sprawdzaj je na stronie modelu.' },
      { title: 'Odpowiedzialność', body: 'W zakresie dozwolonym przez prawo autor nie odpowiada za szkody wynikłe z korzystania z usługi lub plików.' },
      { title: 'Zmiany', body: 'Usługa, biblioteka i te warunki mogą się zmieniać; data poniżej wskazuje obowiązującą wersję. Działanie usługi może być przerywane na czas konserwacji.' },
      { title: 'Prawo i kontakt', body: <>Obowiązuje prawo polskie. Kontakt: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.</> },
    ],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, '/terms', copy[locale].title, copy[locale].lead);
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const c = copy[locale];
  return (
    <>
      <PageHero title={c.title} lead={c.lead} />
      <article className="reading-frame prose-monge">
        {c.sections.map((s) => (
          <section key={s.title}>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </section>
        ))}
        <p>
          <Link href={localPath(locale, '/license')}>{c.license} →</Link>
        </p>
        <p className="mt-10 font-mono text-[12px]">2026-11-22</p>
      </article>
    </>
  );
}
