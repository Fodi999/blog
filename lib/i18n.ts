export const locales = ['pl', 'en', 'ru', 'uk'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'pl';

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function localPath(locale: Locale, path = ''): string {
  const normalized = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${normalized}`;
}

export const copy = {
  pl: {
    nav: { home: 'Strona główna', blog: 'Blog', shop: 'Sklep', ingredients: 'Składniki', about: 'O mnie', contact: 'Kontakt' },
    home: {
      eyebrow: 'Chef · Technolog · Autor',
      title: 'Kuchnia bez zbędnych słów.',
      lead: 'Profesjonalna wiedza, konkretne produkty i doświadczenie zbudowane przy stole oraz na zapleczu kuchni.',
      readBlog: 'Czytaj blog',
      seeShop: 'Zobacz sklep',
      latest: 'Najnowsze',
      stories: 'Historie i techniki',
      allArticles: 'Wszystkie artykuły',
      shop: 'Sklep',
      products: 'Wybrane produkty',
      allShop: 'Cały sklep',
    },
    blog: { eyebrow: 'Wiedza z kuchni', lead: 'Technika, produkt i proces. Bez dekoracji, tylko rzeczy, które działają.', empty: 'Pierwsze artykuły pojawią się tutaj po publikacji w panelu administracyjnym.' },
    ingredients: { eyebrow: 'Katalog wiedzy', title: 'Składniki', lead: 'Produkty opisane przez wartości odżywcze, charakter i zastosowanie w kuchni.', empty: 'Opublikowane składniki z panelu administracyjnego pojawią się tutaj.', calories: 'Kalorie', protein: 'Białko', fat: 'Tłuszcz', carbs: 'Węglowodany', season: 'Sezon' },
    shop: { eyebrow: 'Wybrane przez szefa', title: 'Sklep', lead: 'Przedmioty i produkty, które mają swoje konkretne miejsce w dobrej kuchni.', empty: 'Sklep jest przygotowywany. Aktywne produkty z panelu administracyjnego pojawią się tutaj automatycznie.', ask: 'Zapytaj o produkt', priceOnRequest: 'Cena na zapytanie' },
    about: { title: 'Kuchnia jest rzemiosłem. Smak jest konsekwencją.', p1: 'Od ponad dwudziestu lat pracuję z produktem, ludźmi i procesem. Interesuje mnie kuchnia, która jest precyzyjna, uczciwa i możliwa do powtórzenia.', p2: 'Na tej stronie publikuję praktyczną wiedzę oraz rzeczy, których sam chciałbym używać w profesjonalnej kuchni.' },
    contact: { title: 'Porozmawiajmy o dobrej pracy.' },
    footer: 'Jedzenie, technika i rzeczy stworzone z myślą o kuchni.',
    notFound: 'Nie ma takiej strony.',
    backHome: 'Wróć na stronę główną',
  },
  en: {
    nav: { home: 'Home', blog: 'Blog', shop: 'Shop', ingredients: 'Ingredients', about: 'About', contact: 'Contact' },
    home: { eyebrow: 'Chef · Technologist · Author', title: 'Cooking without unnecessary words.', lead: 'Professional knowledge, purposeful products and experience built at the table and behind the kitchen line.', readBlog: 'Read the blog', seeShop: 'Visit the shop', latest: 'Latest', stories: 'Stories and techniques', allArticles: 'All articles', shop: 'Shop', products: 'Selected products', allShop: 'Full shop' },
    blog: { eyebrow: 'Kitchen knowledge', lead: 'Technique, product and process. No decoration, only what works.', empty: 'The first articles will appear here after publication in the admin panel.' },
    ingredients: { eyebrow: 'Knowledge catalog', title: 'Ingredients', lead: 'Products explained through nutrition, character and culinary use.', empty: 'Published ingredients from the admin panel will appear here.', calories: 'Calories', protein: 'Protein', fat: 'Fat', carbs: 'Carbohydrates', season: 'Season' },
    shop: { eyebrow: 'Chef selected', title: 'Shop', lead: 'Objects and products with a clear purpose in a good kitchen.', empty: 'The shop is being prepared. Active products will appear here automatically.', ask: 'Ask about product', priceOnRequest: 'Price on request' },
    about: { title: 'Cooking is a craft. Flavor is the consequence.', p1: 'For more than twenty years I have worked with products, people and process. I care about cooking that is precise, honest and repeatable.', p2: 'Here I publish practical knowledge and things I would want to use in a professional kitchen.' },
    contact: { title: 'Let’s talk about good work.' },
    footer: 'Food, technique and things designed with the kitchen in mind.',
    notFound: 'This page does not exist.',
    backHome: 'Back to home',
  },
  ru: {
    nav: { home: 'Главная', blog: 'Блог', shop: 'Магазин', ingredients: 'Ингредиенты', about: 'Обо мне', contact: 'Контакты' },
    home: { eyebrow: 'Шеф · Технолог · Автор', title: 'Кухня без лишних слов.', lead: 'Профессиональные знания, конкретные продукты и опыт, созданный за столом и на профессиональной кухне.', readBlog: 'Читать блог', seeShop: 'Открыть магазин', latest: 'Новое', stories: 'Истории и техники', allArticles: 'Все статьи', shop: 'Магазин', products: 'Избранные товары', allShop: 'Весь магазин' },
    blog: { eyebrow: 'Знания кухни', lead: 'Техника, продукт и процесс. Без декораций, только то, что работает.', empty: 'Первые статьи появятся здесь после публикации в админ-панели.' },
    ingredients: { eyebrow: 'Каталог знаний', title: 'Ингредиенты', lead: 'Продукты через пищевую ценность, характер и применение в кухне.', empty: 'Опубликованные ингредиенты из админ-панели появятся здесь.', calories: 'Калории', protein: 'Белки', fat: 'Жиры', carbs: 'Углеводы', season: 'Сезон' },
    shop: { eyebrow: 'Выбор шефа', title: 'Магазин', lead: 'Предметы и продукты с конкретной ролью на хорошей кухне.', empty: 'Магазин готовится. Активные товары появятся здесь автоматически.', ask: 'Спросить о товаре', priceOnRequest: 'Цена по запросу' },
    about: { title: 'Кухня — это ремесло. Вкус — результат.', p1: 'Более двадцати лет я работаю с продуктом, людьми и процессом. Мне интересна точная, честная и воспроизводимая кухня.', p2: 'Здесь я публикую практические знания и вещи, которыми сам хотел бы пользоваться на профессиональной кухне.' },
    contact: { title: 'Поговорим о хорошей работе.' },
    footer: 'Еда, техника и вещи, созданные с мыслью о кухне.',
    notFound: 'Такой страницы нет.',
    backHome: 'Вернуться на главную',
  },
  uk: {
    nav: { home: 'Головна', blog: 'Блог', shop: 'Магазин', ingredients: 'Інгредієнти', about: 'Про мене', contact: 'Контакти' },
    home: { eyebrow: 'Шеф · Технолог · Автор', title: 'Кухня без зайвих слів.', lead: 'Професійні знання, конкретні продукти та досвід, створений за столом і на професійній кухні.', readBlog: 'Читати блог', seeShop: 'Відкрити магазин', latest: 'Нове', stories: 'Історії та техніки', allArticles: 'Усі статті', shop: 'Магазин', products: 'Обрані товари', allShop: 'Увесь магазин' },
    blog: { eyebrow: 'Знання кухні', lead: 'Техніка, продукт і процес. Без декорацій, лише те, що працює.', empty: 'Перші статті з’являться тут після публікації в адмін-панелі.' },
    ingredients: { eyebrow: 'Каталог знань', title: 'Інгредієнти', lead: 'Продукти через харчову цінність, характер і використання на кухні.', empty: 'Опубліковані інгредієнти з адмін-панелі з’являться тут.', calories: 'Калорії', protein: 'Білки', fat: 'Жири', carbs: 'Вуглеводи', season: 'Сезон' },
    shop: { eyebrow: 'Вибір шефа', title: 'Магазин', lead: 'Предмети та продукти з конкретною роллю на хорошій кухні.', empty: 'Магазин готується. Активні товари з’являться тут автоматично.', ask: 'Запитати про товар', priceOnRequest: 'Ціна за запитом' },
    about: { title: 'Кухня — це ремесло. Смак — результат.', p1: 'Понад двадцять років я працюю з продуктом, людьми та процесом. Мене цікавить точна, чесна й відтворювана кухня.', p2: 'Тут я публікую практичні знання та речі, якими сам хотів би користуватися на професійній кухні.' },
    contact: { title: 'Поговорімо про хорошу роботу.' },
    footer: 'Їжа, техніка та речі, створені з думкою про кухню.',
    notFound: 'Такої сторінки немає.',
    backHome: 'Повернутися на головну',
  },
} as const;

export function getCopy(locale: Locale) {
  return copy[locale];
}

const seasonCopy: Record<Locale, Record<string, string>> = {
  pl: { spring: 'Wiosna', summer: 'Lato', autumn: 'Jesień', fall: 'Jesień', winter: 'Zima', all_year: 'Cały rok', 'all year': 'Cały rok' },
  en: { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', fall: 'Autumn', winter: 'Winter', all_year: 'All year', 'all year': 'All year' },
  ru: { spring: 'Весна', summer: 'Лето', autumn: 'Осень', fall: 'Осень', winter: 'Зима', all_year: 'Весь год', 'all year': 'Весь год' },
  uk: { spring: 'Весна', summer: 'Літо', autumn: 'Осінь', fall: 'Осінь', winter: 'Зима', all_year: 'Увесь рік', 'all year': 'Увесь рік' },
};

export function seasonName(value: string, locale: Locale): string {
  return seasonCopy[locale][value.trim().toLowerCase()] || value;
}
