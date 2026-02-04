import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

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
      console.warn(`Post not found: ${locale}/blog/${slug}.mdx`);
      return null;
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
      return [];
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
        });
      } catch (error) {
        console.error(`Error reading post ${fileName}:`, error);
      }
    }
    
    return validPosts.sort((a, b) => (a.date > b.date ? -1 : 1));
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
