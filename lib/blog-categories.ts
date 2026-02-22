// ✅ ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ ДЛЯ КАТЕГОРИЙ БЛОГА
// Этот файл можно импортировать как в Server, так и в Client Components

export const BLOG_CATEGORIES = [
  { key: 'Kitchen Tech', iconName: 'chef-hat', i18nKey: 'kitchentech' },
  { key: 'Sushi Mastery', iconName: 'fish', i18nKey: 'sushimastery' },
  { key: 'Chef Mindset', iconName: 'brain', i18nKey: 'chefmindset' },
  { key: 'Restaurants', iconName: 'store', i18nKey: 'restaurants' },
  { key: 'Products', iconName: 'package', i18nKey: 'products' },
  { key: 'AI & Tech', iconName: 'bot', i18nKey: 'ai' },
] as const;

export type BlogCategory = typeof BLOG_CATEGORIES[number]['key'];

export type PostLevel = 'base' | 'pro';
