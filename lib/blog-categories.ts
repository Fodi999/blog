// ✅ ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ ДЛЯ КАТЕГОРИЙ БЛОГА
// Этот файл можно импортировать как в Server, так и в Client Components

export const BLOG_CATEGORIES = [
  { key: 'Kitchen Tech', emoji: '🔪', i18nKey: 'kitchentech' },
  { key: 'Sushi Mastery', emoji: '🍣', i18nKey: 'sushimastery' },
  { key: 'Chef Mindset', emoji: '🧠', i18nKey: 'chefmindset' },
  { key: 'Restaurants', emoji: '🏪', i18nKey: 'restaurants' },
  { key: 'Products', emoji: '📦', i18nKey: 'products' },
  { key: 'AI & Tech', emoji: '🤖', i18nKey: 'ai' },
] as const;

export type BlogCategory = typeof BLOG_CATEGORIES[number]['key'];

export type PostLevel = 'base' | 'pro';
