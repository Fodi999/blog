import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { BlogCategory, PostLevel } from './blog-categories';
import { API_URL } from './api';

const contentDirectory = path.join(process.cwd(), 'content');

export interface Post {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  readTime?: string;
  coverImage?: string;
  content: string;
  series?: string;
  seriesOrder?: number;
  level?: PostLevel;
  publishedAt?: string;
}

type CmsArticle = {
  slug: string;
  category: string;
  title_en: string;
  title_pl: string;
  title_ru: string;
  title_uk: string;
  content_en: string;
  content_pl: string;
  content_ru: string;
  content_uk: string;
  image_url?: string | null;
  seo_description?: string;
  created_at: string;
  updated_at: string;
};

type CmsArticleList = {
  data: CmsArticle[];
};

function localized(article: CmsArticle, field: 'title' | 'content', locale: string): string {
  const key = `${field}_${locale}` as keyof CmsArticle;
  const fallback = `${field}_en` as keyof CmsArticle;
  return String(article[key] || article[fallback] || '');
}

function cmsArticleToPost(article: CmsArticle, locale: string): Post {
  const content = localized(article, 'content', locale);
  const plainText = content
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/[#>*_`[\]-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    slug: article.slug,
    title: localized(article, 'title', locale),
    date: article.created_at,
    publishedAt: article.updated_at,
    category: article.category || 'General',
    excerpt: article.seo_description || `${plainText.slice(0, 180)}${plainText.length > 180 ? '…' : ''}`,
    readTime: `${Math.max(1, Math.ceil(plainText.split(/\s+/).length / 220))} min`,
    coverImage: article.image_url || undefined,
    content,
  };
}

async function fetchCmsArticles(): Promise<CmsArticle[]> {
  try {
    const response = await fetch(`${API_URL}/public/articles?limit=100`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];
    const payload = await response.json() as CmsArticleList;
    return payload.data || [];
  } catch (error) {
    console.warn('CMS articles are temporarily unavailable:', error);
    return [];
  }
}

async function fetchCmsArticle(slug: string): Promise<CmsArticle | null> {
  try {
    const response = await fetch(`${API_URL}/public/articles/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    return await response.json() as CmsArticle;
  } catch (error) {
    console.warn(`CMS article is temporarily unavailable: ${slug}`, error);
    return null;
  }
}

/**
 * Получить пост по slug и локали
 * @param locale - Язык (pl, en, uk, ru)
 * @param slug - URL slug поста
 */
export async function getPostBySlug(locale: string, slug: string): Promise<Post | null> {
  try {
    const fullPath = path.join(contentDirectory, locale, 'blog', `${slug}.mdx`);
    
    if (!fs.existsSync(fullPath)) {
      const cmsArticle = await fetchCmsArticle(slug);
      return cmsArticle ? cmsArticleToPost(cmsArticle, locale) : null;
    }
    
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: data.title || 'Untitled',
      date: data.date || new Date().toISOString().split('T')[0],
      category: data.category || 'General',
      excerpt: data.excerpt || '',
      readTime: data.readTime,
      coverImage: data.coverImage,
      content,
      series: data.series,
      seriesOrder: data.seriesOrder,
      level: data.level,
      publishedAt: data.publishedAt || data.date,
    };
  } catch (error) {
    console.error(`Error reading post ${locale}/blog/${slug}:`, error);
    return null;
  }
}

/**
 * Получить все посты для заданной локали
 * @param locale - Язык (pl, en, uk, ru)
 */
export async function getAllPosts(locale: string): Promise<Omit<Post, 'content'>[]> {
  const postsDirectory = path.join(contentDirectory, locale, 'blog');
  
  try {
    // Проверяем существование директории
    if (!fs.existsSync(postsDirectory)) {
      console.warn(`Posts directory not found for locale: ${locale}`);
      return (await fetchCmsArticles()).map((article) => {
        const { content: _content, ...post } = cmsArticleToPost(article, locale);
        return post;
      });
    }
    
    const fileNames = fs.readdirSync(postsDirectory);
    const validPosts: Omit<Post, 'content'>[] = [];
    
    for (const fileName of fileNames) {
      if (!fileName.endsWith('.mdx')) continue;
      
      const slug = fileName.replace(/\.mdx$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      
      try {
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data } = matter(fileContents);

        validPosts.push({
          slug,
          title: data.title || 'Untitled',
          date: data.date || new Date().toISOString().split('T')[0],
          category: data.category || 'General',
          excerpt: data.excerpt || '',
          readTime: data.readTime,
          coverImage: data.coverImage,
          series: data.series,
          seriesOrder: data.seriesOrder,
          level: data.level,
          publishedAt: data.publishedAt || data.date,
        });
      } catch (error) {
        console.error(`Error reading post ${fileName}:`, error);
      }
    }
    
    const localSlugs = new Set(validPosts.map((post) => post.slug));
    const cmsPosts = (await fetchCmsArticles())
      .filter((article) => !localSlugs.has(article.slug))
      .map((article) => {
        const { content: _content, ...post } = cmsArticleToPost(article, locale);
        return post;
      });

    // Сортировка: новые статьи первыми (по publishedAt, затем по date)
    return [...cmsPosts, ...validPosts].sort((a, b) => {
      const dateA = a.publishedAt || a.date;
      const dateB = b.publishedAt || b.date;
      return dateB.localeCompare(dateA); // Descending order (новые первыми)
    });
  } catch (error) {
    console.error(`Error reading posts directory for ${locale}:`, error);
    return [];
  }
}

/**
 * Получить последние N постов
 * @param locale - Язык (pl, en, uk, ru)
 * @param count - Количество постов (по умолчанию 3)
 */
export async function getLatestPosts(locale: string, count: number = 3): Promise<Omit<Post, 'content'>[]> {
  const posts = await getAllPosts(locale);
  return posts.slice(0, count);
}

/**
 * Получить все категории для заданной локали
 */
export async function getAllCategories(locale: string): Promise<string[]> {
  const posts = await getAllPosts(locale);
  const categories = [...new Set(posts.map((post) => post.category))];
  return categories.sort();
}
