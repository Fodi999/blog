import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/sections';
import { getDict, isLocale, type Locale } from '@/lib/i18n';
import { EMAIL, pageMetadata } from '@/lib/seo';

// the author's mailbox (kontakt@dima-fomin.pl had no mail server)
const CONTACT = EMAIL;

/* The licence of the files downloaded from the Monge library (STEP, STL, 3MF, GLB). */
const copy: Record<Locale, { lead: string; sections: { title: string; body: React.ReactNode }[] }> = {
  ru: {
    lead: 'Модели библиотеки Monge можно скачивать бесплатно и использовать в своих изделиях и проектах, в том числе коммерческих. Нельзя только перепродавать или раздавать сами файлы.',
    sections: [
      { title: 'Что можно', body: 'Скачивать файлы STEP, STL, 3MF и GLB без регистрации; вставлять модели в свои сборки, чертежи и проекты; изменять их; печатать и изготавливать детали и продавать изготовленное; использовать модели как часть своего продукта — изделия, проекта, игры, визуализации, ролика — в том числе за деньги.' },
      { title: 'Что нельзя', body: 'Продавать, раздавать или выкладывать сами файлы — как есть или с небольшими изменениями — отдельно или в составе другой библиотеки, каталога или набора моделей; выдавать модели за свои в каталогах моделей.' },
      { title: 'Размеры и ответственность', body: 'Модели построены по таблицам стандартов ISO, DIN и EN, которые сверены по двум источникам; таблицы и источники открыты на сайте. Это справочные данные: перед изготовлением и в расчётах сверяйтесь с действующей редакцией стандарта, национальным приложением и данными производителя. Файлы предоставляются как есть, без гарантий; автор не отвечает за ущерб от их использования.' },
      { title: 'Ссылка на Monge', body: 'Не обязательна, но мы будем рады строке «модели — библиотека Monge, dima-fomin.pl».' },
      { title: 'Права и вопросы', body: <>Модели и файлы — © Dmytro Fomin, Monge; все права, не названные выше, сохраняются. Вопросы и другие условия (например, своя библиотека для компании): <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</> },
    ],
  },
  pl: {
    lead: 'Modele z biblioteki Monge można pobierać bezpłatnie i używać we własnych wyrobach i projektach, także komercyjnych. Nie wolno jedynie odsprzedawać ani rozpowszechniać samych plików.',
    sections: [
      { title: 'Co wolno', body: 'Pobierać pliki STEP, STL, 3MF i GLB bez rejestracji; wstawiać modele do własnych złożeń, rysunków i projektów; zmieniać je; drukować i wytwarzać części oraz sprzedawać to, co wytworzono; używać modeli jako części własnego produktu — wyrobu, projektu, gry, wizualizacji, filmu — także odpłatnie.' },
      { title: 'Czego nie wolno', body: 'Sprzedawać, rozpowszechniać ani publikować samych plików — bez zmian lub z niewielkimi zmianami — osobno lub w ramach innej biblioteki, katalogu czy zestawu modeli; podawać modeli za własne w katalogach modeli.' },
      { title: 'Wymiary i odpowiedzialność', body: 'Modele zbudowano według tablic norm ISO, DIN i EN sprawdzonych w dwóch źródłach; tablice i źródła są otwarte na stronie. To dane informacyjne: przed wykonaniem i w obliczeniach sprawdzaj aktualne wydanie normy, załącznik krajowy i dane producenta. Pliki są udostępniane w stanie „tak jak są”, bez gwarancji; autor nie odpowiada za szkody wynikłe z ich użycia.' },
      { title: 'Wzmianka o Monge', body: 'Nie jest wymagana, ale ucieszy nas linijka „modele — biblioteka Monge, dima-fomin.pl”.' },
      { title: 'Prawa i pytania', body: <>Modele i pliki — © Dmytro Fomin, Monge; wszelkie prawa niewymienione powyżej są zastrzeżone. Pytania i inne warunki (np. własna biblioteka dla firmy): <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</> },
    ],
  },
  en: {
    lead: 'Models from the Monge library are free to download and to use in your own products and projects, commercial ones included. The only thing you may not do is resell or redistribute the files themselves.',
    sections: [
      { title: 'You may', body: 'Download the STEP, STL, 3MF and GLB files without signing up; put the models into your assemblies, drawings and projects; change them; print and make the parts and sell what you make; use the models as part of your own product — a product, a project, a game, a visualisation, a film — including paid ones.' },
      { title: 'You may not', body: 'Sell, share or publish the files themselves — as they are or slightly changed — on their own or as part of another library, catalogue or model pack; present the models as your own in model catalogues.' },
      { title: 'Dimensions and liability', body: 'The models are built by tables of ISO, DIN and EN standards checked against two sources; the tables and their sources are open on this site. They are reference data: before manufacturing and in calculations, check the current edition of the standard, the national annex and the maker’s data. The files are provided as is, without warranty; the author is not liable for damage from their use.' },
      { title: 'Credit', body: 'Not required, but we will be glad of a line “models — the Monge library, dima-fomin.pl”.' },
      { title: 'Rights and questions', body: <>Models and files — © Dmytro Fomin, Monge; all rights not named above are reserved. Questions and other terms (for example, a library of your own for a company): <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</> },
    ],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, '/license', getDict(locale).license.title, copy[locale].lead);
}

export default async function LicensePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const c = copy[locale];
  return (
    <>
      <PageHero eyebrow={t.nav.library} title={t.license.title} lead={c.lead} />
      <article className="reading-frame prose-monge">
        {c.sections.map((s) => (
          <section key={s.title}>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </section>
        ))}
        <p className="mt-10 font-mono text-[12px]">2026-11-21</p>
      </article>
    </>
  );
}
