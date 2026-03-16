/**
 * Pre-defined recipe templates for SEO recipe analysis pages.
 * Each recipe generates a static page at /chef-tools/recipe-analysis/[slug]
 * with full nutrition, flavor, doctor diagnosis — unique indexable content.
 */

export type RecipeTemplate = {
  slug: string;
  /** i18n keys for title */
  title: { en: string; pl: string; ru: string; uk: string };
  /** i18n keys for description (meta) */
  description: { en: string; pl: string; ru: string; uk: string };
  /** Ingredients with grams */
  ingredients: { slug: string; grams: number }[];
  portions: number;
  /** Category for grouping: pasta, salad, soup, bowl, breakfast, dessert */
  category: string;
};

export const RECIPE_TEMPLATES: RecipeTemplate[] = [
  // ── Pasta ──────────────────────────────────────────────────────────────
  {
    slug: "pasta-pomodoro",
    title: {
      en: "Pasta Pomodoro — Nutrition & Flavor Analysis",
      pl: "Pasta Pomodoro — Analiza odżywcza i smakowa",
      ru: "Паста Помодоро — Анализ питания и вкуса",
      uk: "Паста Помодоро — Аналіз харчування та смаку",
    },
    description: {
      en: "Complete nutrition breakdown, flavor profile, and recipe improvement tips for classic Pasta Pomodoro. Calories, protein, fat, carbs per portion.",
      pl: "Pełna analiza odżywcza, profil smakowy i wskazówki ulepszenia przepisu na klasyczne Pasta Pomodoro. Kalorie, białko, tłuszcz, węglowodany na porcję.",
      ru: "Полный разбор питательной ценности, вкусового профиля и советы по улучшению классической Пасты Помодоро. Калории, белок, жиры, углеводы на порцию.",
      uk: "Повний розбір харчової цінності, смакового профілю та поради щодо покращення класичної Пасти Помодоро. Калорії, білок, жири, вуглеводи на порцію.",
    },
    ingredients: [
      { slug: "pasta", grams: 200 },
      { slug: "tomato", grams: 200 },
      { slug: "olive-oil", grams: 15 },
      { slug: "garlic", grams: 5 },
      { slug: "basil", grams: 3 },
    ],
    portions: 2,
    category: "pasta",
  },
  {
    slug: "carbonara",
    title: {
      en: "Carbonara — Nutrition & Flavor Analysis",
      pl: "Carbonara — Analiza odżywcza i smakowa",
      ru: "Карбонара — Анализ питания и вкуса",
      uk: "Карбонара — Аналіз харчування та смаку",
    },
    description: {
      en: "Complete nutrition breakdown, flavor profile, and recipe doctor for classic Carbonara. Calories, macros, flavor balance per portion.",
      pl: "Pełna analiza odżywcza, profil smakowy i diagnoza przepisu na klasyczną Carbonarę.",
      ru: "Полный разбор питательной ценности, вкусового профиля и диагностика рецепта классической Карбонары.",
      uk: "Повний розбір харчової цінності, смакового профілю та діагностика рецепту класичної Карбонари.",
    },
    ingredients: [
      { slug: "pasta", grams: 200 },
      { slug: "chicken-eggs", grams: 120 },
      { slug: "hard-cheese", grams: 50 },
      { slug: "black-pepper", grams: 2 },
      { slug: "olive-oil", grams: 10 },
    ],
    portions: 2,
    category: "pasta",
  },
  // ── Salads ─────────────────────────────────────────────────────────────
  {
    slug: "greek-salad",
    title: {
      en: "Greek Salad — Nutrition & Flavor Analysis",
      pl: "Sałatka grecka — Analiza odżywcza i smakowa",
      ru: "Греческий салат — Анализ питания и вкуса",
      uk: "Грецький салат — Аналіз харчування та смаку",
    },
    description: {
      en: "Complete nutrition, flavor balance, and improvement tips for Greek Salad. Calories, vitamins, macros per portion.",
      pl: "Pełna analiza odżywcza, profil smakowy i wskazówki dla sałatki greckiej.",
      ru: "Полный разбор питательной ценности, баланса вкусов и советы по улучшению Греческого салата.",
      uk: "Повний розбір харчової цінності, балансу смаків та поради щодо покращення Грецького салату.",
    },
    ingredients: [
      { slug: "tomato", grams: 150 },
      { slug: "cucumber", grams: 100 },
      { slug: "bell-pepper", grams: 80 },
      { slug: "onion", grams: 40 },
      { slug: "olive-oil", grams: 20 },
      { slug: "mozzarella-cheese", grams: 80 },
    ],
    portions: 2,
    category: "salad",
  },
  {
    slug: "caesar-salad",
    title: {
      en: "Caesar Salad — Nutrition & Flavor Analysis",
      pl: "Sałatka Cezar — Analiza odżywcza i smakowa",
      ru: "Салат Цезарь — Анализ питания и вкуса",
      uk: "Салат Цезар — Аналіз харчування та смаку",
    },
    description: {
      en: "Complete nutrition breakdown and flavor profile for Caesar Salad with chicken. Calories, protein, fat per portion.",
      pl: "Pełna analiza odżywcza i profil smakowy sałatki Cezar z kurczakiem.",
      ru: "Полный разбор питательной ценности и вкусового профиля салата Цезарь с курицей.",
      uk: "Повний розбір харчової цінності та смакового профілю салату Цезар з куркою.",
    },
    ingredients: [
      { slug: "chicken-breast", grams: 150 },
      { slug: "hard-cheese", grams: 30 },
      { slug: "olive-oil", grams: 15 },
      { slug: "lemon", grams: 15 },
      { slug: "garlic", grams: 3 },
    ],
    portions: 2,
    category: "salad",
  },
  // ── Bowls ──────────────────────────────────────────────────────────────
  {
    slug: "salmon-bowl",
    title: {
      en: "Salmon Bowl — Nutrition & Flavor Analysis",
      pl: "Miska z łososiem — Analiza odżywcza i smakowa",
      ru: "Боул с лососем — Анализ питания и вкуса",
      uk: "Боул з лососем — Аналіз харчування та смаку",
    },
    description: {
      en: "Complete nutrition breakdown and flavor profile for Salmon Rice Bowl. Omega-3, protein, calories per portion.",
      pl: "Pełna analiza odżywcza i profil smakowy miski z łososiem i ryżem. Omega-3, białko, kalorie na porcję.",
      ru: "Полный разбор питательной ценности и вкуса боула с лососем и рисом. Омега-3, белок, калории на порцию.",
      uk: "Повний розбір харчової цінності та смаку боулу з лососем та рисом. Омега-3, білок, калорії на порцію.",
    },
    ingredients: [
      { slug: "salmon", grams: 150 },
      { slug: "rice", grams: 150 },
      { slug: "avocado", grams: 70 },
      { slug: "cucumber", grams: 50 },
      { slug: "soy-sauce", grams: 10 },
      { slug: "lemon", grams: 10 },
    ],
    portions: 1,
    category: "bowl",
  },
  {
    slug: "chicken-rice-bowl",
    title: {
      en: "Chicken & Rice Bowl — Nutrition & Flavor Analysis",
      pl: "Miska z kurczakiem i ryżem — Analiza odżywcza",
      ru: "Боул с курицей и рисом — Анализ питания",
      uk: "Боул з куркою та рисом — Аналіз харчування",
    },
    description: {
      en: "Complete nutrition and flavor analysis for Chicken Rice Bowl. High protein, balanced macros. Calories per portion.",
      pl: "Pełna analiza odżywcza miski z kurczakiem i ryżem. Wysokie białko, zrównoważone makro.",
      ru: "Полный анализ питательной ценности боула с курицей и рисом. Высокий белок, сбалансированные макросы.",
      uk: "Повний аналіз харчової цінності боулу з куркою та рисом. Високий білок, збалансовані макроси.",
    },
    ingredients: [
      { slug: "chicken-breast", grams: 180 },
      { slug: "rice", grams: 150 },
      { slug: "broccoli", grams: 100 },
      { slug: "olive-oil", grams: 10 },
      { slug: "garlic", grams: 3 },
      { slug: "lemon", grams: 10 },
    ],
    portions: 1,
    category: "bowl",
  },
  // ── Breakfast ──────────────────────────────────────────────────────────
  {
    slug: "oatmeal-bowl",
    title: {
      en: "Oatmeal Breakfast Bowl — Nutrition & Flavor Analysis",
      pl: "Miska owsiana na śniadanie — Analiza odżywcza",
      ru: "Овсянка на завтрак — Анализ питания и вкуса",
      uk: "Вівсянка на сніданок — Аналіз харчування та смаку",
    },
    description: {
      en: "Complete nutrition breakdown for Oatmeal Breakfast Bowl with honey and walnuts. Fiber, calories, vitamins per portion.",
      pl: "Pełna analiza odżywcza miski owsianej z miodem i orzechami. Błonnik, kalorie, witaminy na porcję.",
      ru: "Полный разбор питательной ценности овсяной каши с мёдом и грецкими орехами. Клетчатка, калории, витамины.",
      uk: "Повний розбір харчової цінності вівсяної каші з медом та горіхами. Клітковина, калорії, вітаміни.",
    },
    ingredients: [
      { slug: "oatmeal", grams: 80 },
      { slug: "milk", grams: 200 },
      { slug: "honey", grams: 15 },
      { slug: "walnuts", grams: 20 },
      { slug: "apple", grams: 100 },
    ],
    portions: 1,
    category: "breakfast",
  },
  // ── Soup ───────────────────────────────────────────────────────────────
  {
    slug: "tomato-soup",
    title: {
      en: "Tomato Soup — Nutrition & Flavor Analysis",
      pl: "Zupa pomidorowa — Analiza odżywcza i smakowa",
      ru: "Томатный суп — Анализ питания и вкуса",
      uk: "Томатний суп — Аналіз харчування та смаку",
    },
    description: {
      en: "Complete nutrition breakdown and flavor profile for classic Tomato Soup. Low calorie, high vitamin content.",
      pl: "Pełna analiza odżywcza i profil smakowy klasycznej zupy pomidorowej. Niska kaloryczność, wysoka zawartość witamin.",
      ru: "Полный разбор питательной ценности и вкусового профиля классического томатного супа. Низкая калорийность, много витаминов.",
      uk: "Повний розбір харчової цінності та смакового профілю класичного томатного супу. Низька калорійність, багато вітамінів.",
    },
    ingredients: [
      { slug: "tomato", grams: 400 },
      { slug: "onion", grams: 80 },
      { slug: "garlic", grams: 5 },
      { slug: "olive-oil", grams: 15 },
      { slug: "basil", grams: 5 },
      { slug: "carrot", grams: 50 },
    ],
    portions: 2,
    category: "soup",
  },
  {
    slug: "lentil-soup",
    title: {
      en: "Lentil Soup — Nutrition & Flavor Analysis",
      pl: "Zupa z soczewicy — Analiza odżywcza i smakowa",
      ru: "Суп из чечевицы — Анализ питания и вкуса",
      uk: "Суп із сочевиці — Аналіз харчування та смаку",
    },
    description: {
      en: "Complete nutrition breakdown for Lentil Soup. High fiber, high protein, excellent flavor balance.",
      pl: "Pełna analiza odżywcza zupy z soczewicy. Wysokie białko, dużo błonnika.",
      ru: "Полный разбор питательной ценности супа из чечевицы. Высокий белок, много клетчатки.",
      uk: "Повний розбір харчової цінності супу із сочевиці. Високий білок, багато клітковини.",
    },
    ingredients: [
      { slug: "lentils", grams: 150 },
      { slug: "onion", grams: 80 },
      { slug: "carrot", grams: 60 },
      { slug: "garlic", grams: 5 },
      { slug: "olive-oil", grams: 15 },
      { slug: "tomato", grams: 100 },
      { slug: "lemon", grams: 10 },
    ],
    portions: 2,
    category: "soup",
  },
  // ── Main courses ───────────────────────────────────────────────────────
  {
    slug: "grilled-salmon-vegetables",
    title: {
      en: "Grilled Salmon with Vegetables — Nutrition Analysis",
      pl: "Grillowany łosoś z warzywami — Analiza odżywcza",
      ru: "Лосось на гриле с овощами — Анализ питания",
      uk: "Лосось на грилі з овочами — Аналіз харчування",
    },
    description: {
      en: "Complete nutrition and flavor analysis for Grilled Salmon with Vegetables. Omega-3, protein, low carb.",
      pl: "Pełna analiza odżywcza grillowanego łososia z warzywami. Omega-3, białko, niski indeks glikemiczny.",
      ru: "Полный анализ питательной ценности лосося на гриле с овощами. Омега-3, белок, низкоуглеводный.",
      uk: "Повний аналіз харчової цінності лосося на грилі з овочами. Омега-3, білок, низьковуглеводний.",
    },
    ingredients: [
      { slug: "salmon", grams: 200 },
      { slug: "broccoli", grams: 120 },
      { slug: "bell-pepper", grams: 80 },
      { slug: "olive-oil", grams: 15 },
      { slug: "lemon", grams: 15 },
      { slug: "garlic", grams: 3 },
    ],
    portions: 1,
    category: "main",
  },
  {
    slug: "chicken-stir-fry",
    title: {
      en: "Chicken Stir-Fry — Nutrition & Flavor Analysis",
      pl: "Kurczak stir-fry — Analiza odżywcza i smakowa",
      ru: "Курица стир-фрай — Анализ питания и вкуса",
      uk: "Курка стір-фрай — Аналіз харчування та смаку",
    },
    description: {
      en: "Complete nutrition breakdown for Chicken Stir-Fry with vegetables. High protein, balanced macros, rich umami.",
      pl: "Pełna analiza odżywcza kurczaka stir-fry z warzywami. Wysokie białko, zrównoważone makro.",
      ru: "Полный разбор питания курицы стир-фрай с овощами. Высокий белок, сбалансированные макросы, богатый умами.",
      uk: "Повний розбір харчування курки стір-фрай з овочами. Високий білок, збалансовані макроси, багатий умамі.",
    },
    ingredients: [
      { slug: "chicken-breast", grams: 200 },
      { slug: "bell-pepper", grams: 80 },
      { slug: "broccoli", grams: 80 },
      { slug: "onion", grams: 50 },
      { slug: "garlic", grams: 5 },
      { slug: "soy-sauce", grams: 15 },
      { slug: "olive-oil", grams: 10 },
    ],
    portions: 2,
    category: "main",
  },
];
