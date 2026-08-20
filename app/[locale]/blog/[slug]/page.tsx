import { notFound } from 'next/navigation';
import { ViewItemTracker } from '@/components/AnalyticsEvents';
import { ArticleBody } from '@/components/ArticleBody';
import { eyebrowClass } from '@/components/site/classes';
import { articleContent, articleDescription, articleSeoTitle, articleTitle, getArticle } from '@/lib/cms';
import { categoryName, isLocale, type Locale } from '@/lib/i18n';
import { articleLocales, languageAlternates, safeDate, SITE_URL } from '@/lib/seo';

export const revalidate = 300;

const articleUi = {
  pl: {
    author: 'Autor: Szef Kuchni',
    read: 'min czytania',
    whyTitle: 'Dlaczego skórka jest kluczem?',
    whyCopy: 'Skórka to nie tylko tekstura. To bariera chroniąca delikatne mięso, nośnik smaku i sygnał dobrze kontrolowanej temperatury.',
    quote: 'Chrupkość to nie przypadek. To wynik kontroli nad wilgocią, temperaturą i cierpliwością.',
    ruleTitle: 'Złota zasada',
    ruleCopy: 'Nigdy nie przewracaj ryby, dopóki skórka sama nie odchodzi od patelni. To znak, że jest gotowa.',
    ruleQuote: 'Pozwól jej się zrumienić. Nie pomagaj. Nie spiesz się.',
    steps: [
      ['Suszenie', 'Dokładnie osusz skórę ręcznikiem papierowym. Wilgoć to największy wróg chrupkości.'],
      ['Nacisk', 'Delikatny nacisk podczas smażenia zapewnia równy kontakt skórki z patelnią.'],
      ['Temperatura', 'Średnia temperatura i cierpliwość. Nie ruszaj ryby, pozwól skórce zrobić swoją pracę.'],
    ],
  },
  en: {
    author: 'Author: Chef',
    read: 'min read',
    whyTitle: 'Why is the skin the key?',
    whyCopy: 'The skin is more than texture. It protects delicate flesh, carries flavor and shows whether heat is under control.',
    quote: 'Crispness is not an accident. It is control over moisture, temperature and patience.',
    ruleTitle: 'Golden rule',
    ruleCopy: 'Never turn the fish until the skin releases from the pan by itself. That is the signal it is ready.',
    ruleQuote: 'Let it brown. Do not help. Do not rush.',
    steps: [
      ['Drying', 'Dry the skin thoroughly with a paper towel. Moisture is the enemy of crispness.'],
      ['Pressure', 'Gentle pressure during frying keeps the skin in even contact with the pan.'],
      ['Temperature', 'Use medium heat and patience. Let the skin do its work.'],
    ],
  },
  ru: {
    author: 'Автор: Шеф кухни',
    read: 'мин чтения',
    whyTitle: 'Почему кожа решает всё?',
    whyCopy: 'Кожа даёт не только текстуру. Она защищает нежное мясо, несёт вкус и показывает, насколько точно контролируется тепло.',
    quote: 'Хруст не случайность. Это контроль влажности, температуры и терпения.',
    ruleTitle: 'Золотое правило',
    ruleCopy: 'Не переворачивай рыбу, пока кожа сама не отойдёт от сковороды. Это знак, что она готова.',
    ruleQuote: 'Дай ей подрумяниться. Не помогай. Не спеши.',
    steps: [
      ['Сушка', 'Тщательно обсуши кожу бумажным полотенцем. Влага главный враг хруста.'],
      ['Нажим', 'Мягкий нажим во время жарки даёт ровный контакт кожи со сковородой.'],
      ['Температура', 'Средний огонь и терпение. Не двигай рыбу, пусть кожа делает свою работу.'],
    ],
  },
  uk: {
    author: 'Автор: Шеф кухні',
    read: 'хв читання',
    whyTitle: 'Чому шкірка є ключем?',
    whyCopy: 'Шкірка дає не тільки текстуру. Вона захищає ніжне мʼясо, несе смак і показує, наскільки точно контролюється тепло.',
    quote: 'Хрумкість не випадковість. Це контроль вологості, температури й терпіння.',
    ruleTitle: 'Золоте правило',
    ruleCopy: 'Не перевертай рибу, доки шкірка сама не відійде від пательні. Це знак, що вона готова.',
    ruleQuote: 'Дай їй підрумʼянитися. Не допомагай. Не поспішай.',
    steps: [
      ['Сушіння', 'Ретельно обсуши шкірку паперовим рушником. Волога головний ворог хрумкості.'],
      ['Натиск', 'Мʼякий натиск під час смаження дає рівний контакт шкірки з пательнею.'],
      ['Температура', 'Середній вогонь і терпіння. Не рухай рибу, нехай шкірка робить свою роботу.'],
    ],
  },
} satisfies Record<Locale, {
  author: string;
  read: string;
  whyTitle: string;
  whyCopy: string;
  quote: string;
  ruleTitle: string;
  ruleCopy: string;
  ruleQuote: string;
  steps: [string, string][];
}>;

function extractMarkdownImages(content: string) {
  return Array.from(content.matchAll(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g)).map((match) => ({
    alt: match[1],
    src: match[2],
  }));
}

function stripVisualStory(content: string) {
  return content.replace(/\n{0,2}##\s+Visual story[\s\S]*$/i, '').trim();
}

function readingMinutes(content: string) {
  const words = content.replace(/!\[[^\]]*\]\([^)]+\)/g, '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

function formatArticleDate(value: string | number[] | null | undefined, locale: Locale) {
  const date = safeDate(value);
  if (!date) return '';
  const localeCode = { pl: 'pl-PL', en: 'en-US', ru: 'ru-RU', uk: 'uk-UA' }[locale];
  return new Intl.DateTimeFormat(localeCode, { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function parseAvatarPosition(value?: string | null): { x: number; y: number; scale: number } {
  const match = value?.match(/^(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)(?:%\s+(\d+(?:\.\d+)?))?$/);
  if (match) return { x: Number(match[1]), y: Number(match[2]), scale: Number(match[3] || 1.3) };
  if (value === 'top') return { x: 50, y: 0, scale: 1.3 };
  if (value === 'bottom') return { x: 50, y: 100, scale: 1.3 };
  if (value === 'left') return { x: 0, y: 50, scale: 1.3 };
  if (value === 'right') return { x: 100, y: 50, scale: 1.3 };
  return { x: 50, y: 50, scale: 1.3 };
}

function avatarPanStyle(position?: string | null) {
  const { x, y, scale } = parseAvatarPosition(position);
  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${scale * 100}%`,
    height: `${scale * 100}%`,
    transform: `translate(-${x}%, -${y}%)`
  };
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const article = await getArticle(slug);
  if (!article) return {};
  const path = `/blog/${article.slug}`;
  return {
    title: articleSeoTitle(article, locale),
    description: articleDescription(article, locale),
    alternates: {
      canonical: `/${locale}${path}`,
      languages: languageAlternates(path, articleLocales(article))
    },
    openGraph: {
      title: articleSeoTitle(article, locale),
      description: articleDescription(article, locale),
      url: `${SITE_URL}/${locale}${path}`,
      type: 'article',
      locale,
      images: article.image_url ? [{ url: article.image_url }] : undefined
    },
    twitter: {
      card: article.image_url ? 'summary_large_image' : 'summary',
      title: articleSeoTitle(article, locale),
      description: articleDescription(article, locale),
      images: article.image_url ? [article.image_url] : undefined
    }
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const article = await getArticle(slug);
  if (!article) notFound();
  const title = articleTitle(article, locale);
  const content = articleContent(article, locale);
  const cleanContent = stripVisualStory(content);
  const storyImages = extractMarkdownImages(content);
  const ui = articleUi[locale];
  const heroImage = article.image_url || storyImages[0]?.src;
  const stepImages = storyImages.slice(0, 3);
  const featureImage = storyImages[2]?.src || storyImages[1]?.src || storyImages[0]?.src || heroImage;
  const authorName = article.author_name || ui.author.replace(/^Автор:\s*|^Author:\s*|^Autor:\s*/i, '');
  const authorInitials = authorName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'SK';
  const articleDate = article.published_at || article.created_at;
  const formattedDate = formatArticleDate(articleDate, locale);
  const publishedDate = safeDate(articleDate);
  const modifiedDate = safeDate(article.updated_at);
  const pageUrl = `${SITE_URL}/${locale}/blog/${article.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: articleDescription(article, locale),
    url: pageUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
    inLanguage: locale,
    ...(heroImage ? { image: heroImage } : {}),
    ...(publishedDate ? { datePublished: publishedDate.toISOString() } : {}),
    ...(modifiedDate ? { dateModified: modifiedDate.toISOString() } : {}),
    author: { '@type': 'Person', name: authorName },
    publisher: { '@type': 'Organization', name: 'Dima Fomin', url: SITE_URL },
  };

  const metaSpanClass = (index: number) =>
    index >= 2 ? "before:mr-3.5 before:content-['•'] max-[580px]:before:mr-2.5" : undefined;

  return (
    <article className="bg-bone">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ViewItemTracker item={{
        item_id: article.slug,
        item_name: title,
        item_category: categoryName(article.category, locale),
        item_type: 'article'
      }} />
      <div className="content-frame max-w-[1180px] pt-14 pb-24 md:pt-20 md:pb-32">
        <header className="animate-reveal max-w-[75ch]">
          <p className={eyebrowClass}>{categoryName(article.category, locale)}</p>
          <h1 className="mt-5 font-display text-[clamp(38px,6.2vw,72px)] leading-[1.02] font-medium">{title}</h1>
          <p className="mt-6 max-w-[62ch] text-xl leading-[1.55] text-on-bone-muted">{articleDescription(article, locale)}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4 text-[13px] font-bold max-[580px]:gap-3">
            <span className="relative grid size-12 place-items-center overflow-hidden rounded-full bg-ink font-display text-[13px] tracking-[-0.03em] text-on-ink shadow-[0_0_0_1px_rgba(214,179,106,.3)]">
              {article.author_avatar_url ? (
                <img className="absolute object-cover pointer-events-none" src={article.author_avatar_url} alt={authorName} style={avatarPanStyle(article.author_avatar_position)} />
              ) : (
                authorInitials
              )}
            </span>
            <span>{authorName}</span>
            {formattedDate && <span className={metaSpanClass(2)}>{formattedDate}</span>}
            <span className={metaSpanClass(formattedDate ? 3 : 2)}>{readingMinutes(content)} {ui.read}</span>
          </div>
        </header>

        {heroImage && (
          <div className="my-12 aspect-[16/9] animate-reveal overflow-hidden bg-white md:my-16">
            <img className="size-full object-cover" src={heroImage} alt={title} />
          </div>
        )}

        <section className="grid animate-reveal grid-cols-[minmax(220px,0.85fr)_minmax(360px,1.15fr)] items-center gap-[clamp(38px,7vw,110px)] border-b border-hairline-bone pb-12 max-[900px]:grid-cols-1" aria-label={ui.whyTitle}>
          <div>
            <h2 className="mb-3 font-display text-[clamp(24px,2.6vw,34px)] leading-[1.1] font-medium">{ui.whyTitle}</h2>
            <p className="text-[15.5px] leading-[1.6] text-on-bone-muted">{ui.whyCopy}</p>
          </div>
          <blockquote className="border-l-2 border-gold pl-8 max-[900px]:border-l-0 max-[900px]:border-t max-[900px]:pt-8 max-[900px]:pl-0">
            <p className="max-w-[38ch] font-display text-[clamp(24px,2.8vw,34px)] leading-[1.2] font-medium italic">{ui.quote}</p>
            <cite className="mt-4 block text-[13px] font-bold text-on-bone-muted not-italic uppercase tracking-[.04em]">— Szef Kuchni</cite>
          </blockquote>
        </section>

        {stepImages.length > 0 && (
          <section className="grid animate-reveal grid-cols-3 gap-10 border-b border-hairline-bone py-12 max-[900px]:grid-cols-1" aria-label="Visual story">
            {ui.steps.map(([heading, copy], index) => {
              const image = stepImages[index];
              return (
                <div
                  className="group min-w-0"
                  style={index === 1 ? { animationDelay: '80ms' } : index === 2 ? { animationDelay: '160ms' } : undefined}
                  key={heading}
                >
                  {image && (
                    <div className="mb-4 aspect-video overflow-hidden bg-bone-2">
                      <img
                        className="size-full object-cover transition-[transform,filter] duration-reveal ease-premium group-hover:scale-[1.035] group-hover:[filter:saturate(1.06)_contrast(1.03)]"
                        src={image.src}
                        alt={image.alt || heading}
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-sm italic text-gold">{String(index + 1).padStart(2, '0')}</span>
                    <h3 className="font-display text-lg font-medium">{heading}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-[1.5] text-on-bone-muted">{copy}</p>
                </div>
              );
            })}
          </section>
        )}

        {featureImage && (
          <section className="my-16 grid animate-reveal grid-cols-[minmax(260px,0.75fr)_minmax(420px,1.25fr)] items-stretch bg-ink text-on-ink max-[900px]:grid-cols-1">
            <div className="flex flex-col justify-center p-[clamp(38px,6vw,72px)]">
              <h2 className="mb-3 font-display text-[clamp(24px,2.6vw,34px)] leading-[1.1] font-medium">{ui.ruleTitle}</h2>
              <p className="text-[15.5px] leading-[1.6] text-on-ink-muted">{ui.ruleCopy}</p>
              <strong className="mt-8 block max-w-[38ch] border-t border-hairline-ink pt-6 font-display text-2xl leading-[1.2] font-medium italic">
                „{ui.ruleQuote}”
              </strong>
            </div>
            <div className="min-h-[280px] overflow-hidden max-[900px]:min-h-[320px]">
              <img className="size-full object-cover" src={featureImage} alt={ui.ruleTitle} loading="lazy" />
            </div>
          </section>
        )}

        <ArticleBody content={cleanContent} />
      </div>
    </article>
  );
}
