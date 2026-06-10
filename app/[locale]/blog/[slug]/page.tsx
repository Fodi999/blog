import { notFound } from 'next/navigation';
import { ViewItemTracker } from '@/components/AnalyticsEvents';
import { ArticleBody } from '@/components/ArticleBody';
import { articleContent, articleDescription, articleSeoTitle, articleTitle, getArticle } from '@/lib/cms';
import { categoryName, isLocale, locales, type Locale } from '@/lib/i18n';

export const revalidate = 300;

const SITE_URL = 'https://dima-fomin.pl';

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

function dateFromValue(value?: string | number[] | null) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [year, month = 1, day = 1, hour = 0, minute = 0, second = 0] = value;
    if (!year) return null;
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatArticleDate(value: string | number[] | null | undefined, locale: Locale) {
  const date = dateFromValue(value);
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
      languages: {
        ...Object.fromEntries(locales.map((item) => [item, `${SITE_URL}/${item}${path}`])),
        'x-default': `${SITE_URL}/pl${path}`
      }
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

  return (
    <article className="article">
      <ViewItemTracker item={{
        item_id: article.slug,
        item_name: title,
        item_category: categoryName(article.category, locale),
        item_type: 'article'
      }} />
      <header className="article__heading">
        <p className="eyebrow">{categoryName(article.category, locale)}</p>
        <h1>{title}</h1>
        <p>{articleDescription(article, locale)}</p>
        <div className="article__meta">
          <span className="article__avatar">
            {article.author_avatar_url ? <img src={article.author_avatar_url} alt={authorName} style={avatarPanStyle(article.author_avatar_position)} /> : authorInitials}
          </span>
          <span>{authorName}</span>
          {formattedDate && <span>{formattedDate}</span>}
          <span>{readingMinutes(content)} {ui.read}</span>
        </div>
      </header>
      {heroImage && <img className="article__hero" src={heroImage} alt={title} />}

      <section className="article__intro-grid" aria-label={ui.whyTitle}>
        <div>
          <h2>{ui.whyTitle}</h2>
          <p>{ui.whyCopy}</p>
        </div>
        <blockquote>
          <span aria-hidden="true">“</span>
          <p>{ui.quote}</p>
          <cite>Szef Kuchni</cite>
        </blockquote>
      </section>

      {stepImages.length > 0 && (
        <section className="article__step-grid" aria-label="Visual story">
          {ui.steps.map(([heading, copy], index) => {
            const image = stepImages[index];
            return (
              <div className="article__step" key={heading}>
                <div className="article__step-heading">
                  <strong>{String(index + 1).padStart(2, '0')}</strong>
                  <h3>{heading}</h3>
                </div>
                <p>{copy}</p>
                {image && <img src={image.src} alt={image.alt || heading} loading="lazy" />}
              </div>
            );
          })}
        </section>
      )}

      {featureImage && (
        <section className="article__rule">
          <div>
            <h2>{ui.ruleTitle}</h2>
            <p>{ui.ruleCopy}</p>
            <strong>„{ui.ruleQuote}”</strong>
          </div>
          <img src={featureImage} alt={ui.ruleTitle} loading="lazy" />
        </section>
      )}

      <ArticleBody content={cleanContent} />
    </article>
  );
}
