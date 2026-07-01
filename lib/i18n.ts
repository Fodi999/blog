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
    nav: { home: 'Strona główna', catering: 'Catering', blog: 'Blog', shop: 'Sklep', ingredients: 'Składniki', about: 'O mnie', contact: 'Kontakt' },
    home: {
      eyebrow: 'Gdańsk · Sopot · Gdynia',
      title: 'Blog o Trójmieście, jedzeniu i pracy z produktem.',
      lead: 'Notatki z Gdańska o miejscach, smaku, codziennym życiu nad morzem i tym, jak lokalny produkt zamienia się w markę.',
      readBlog: 'Czytaj blog',
      seeShop: 'Zobacz sklep',
      latest: 'Trójmiasto',
      stories: 'Najnowsze historie z Gdańska, Sopotu i Gdyni',
      allArticles: 'Wszystkie artykuły',
      shop: 'Sklep',
      products: 'Wybrane produkty',
      allShop: 'Cały sklep',
      localTitle: 'Trzy miasta, jeden rytm nad morzem',
      localLead: 'Gdańsk daje historię i portowy charakter, Sopot tempo spaceru i sezonu, Gdynia energię miasta zbudowanego wokół morza. Ten blog porządkuje lokalne obserwacje, jedzenie, pracę i miejsca w Trójmieście.',
      localPlaces: [
        { title: 'Gdańsk', text: 'stare miasto, Wrzeszcz, Oliwa, port, lokalne adresy i codzienność mieszkańca' },
        { title: 'Sopot', text: 'spacery, kawiarnie, sezon, morze i miejsca między turystyką a lokalnym życiem' },
        { title: 'Gdynia', text: 'modernistyczne miasto, Orłowo, Kamienna Góra, rynek produktów i nadmorski rytm' },
      ],
    },
    blog: { eyebrow: 'Blog Trójmiasto', lead: 'Gdańsk, Sopot i Gdynia: lokalne miejsca, jedzenie, praca z produktem i notatki z życia nad morzem.', empty: 'Pierwsze artykuły pojawią się tutaj po publikacji w panelu administracyjnym.' },
    ingredients: { eyebrow: 'Katalog wiedzy', title: 'Składniki', lead: 'Produkty opisane przez wartości odżywcze, charakter i zastosowanie w kuchni. Baza pomaga planować menu, catering i zdrowe posiłki w Trójmieście.', empty: 'Opublikowane składniki z panelu administracyjnego pojawią się tutaj.', calories: 'Kalorie', protein: 'Białko', fat: 'Tłuszcz', carbs: 'Węglowodany', fiber: 'Błonnik', sugar: 'Cukier', density: 'Gęstość', portion: 'Porcja', shelfLife: 'Trwałość', season: 'Sezon', vitamins: 'Witaminy', minerals: 'Minerały', culinary: 'Profil kulinarny', properties: 'Właściwości', diets: 'Diety', states: 'Stany przetwarzania', pairings: 'Najlepsze połączenia', days: 'dni', hours: 'godz.' },
    shop: { eyebrow: 'Wybrane przez szefa', title: 'Sklep', lead: 'Przedmioty i produkty, które mają swoje konkretne miejsce w dobrej kuchni.', empty: 'Sklep jest przygotowywany. Aktywne produkty z panelu administracyjnego pojawią się tutaj automatycznie.', ask: 'Zapytaj o produkt', buy: 'Zamów produkt', priceOnRequest: 'Cena na zapytanie', inStock: 'Dostępne', outOfStock: 'Niedostępne', categories: 'kategorii', brand: 'Marka produktu', availability: 'Dostępność', categoryLabel: 'Kategoria', sku: 'SKU', directContact: 'Oferta bezpośrednia', deliveryNote: 'Zamówienie potwierdzam mailowo. Otrzymasz szczegóły odbioru, dostawy i aktualnej partii.', storyTitle: 'Historia produktu', why: 'Dlaczego warto', trustTitle: 'Zaufanie do produktu', chefRecipe: 'Receptura szefa', chefRecipeText: 'Produkt opisany przez smak, zastosowanie i realną pracę w kuchni.', smallBatch: 'Mała partia', smallBatchText: 'Prezentacja produktu skupia się na konkretnej partii, cenie i dostępności.', brandReady: 'Gotowe do sprzedaży', brandReadyText: 'Zdjęcia, opis, cena i kontakt tworzą pełną kartę produktu.', backToShop: 'Wróć do sklepu', backToCategory: 'Zobacz kategorię', sameCategory: 'Więcej z kategorii' },
    about: {
      title: 'Szef kuchni, technolog produktu i lider procesów kuchennych.',
      p1: 'Od ponad dwudziestu lat pracuję z produktem, ludźmi i procesem w Polsce, Litwie, Estonii, Niemczech, Francji i Kanadzie.',
      p2: 'Łączę pracę kucharza z opracowywaniem nowych produktów, kontrolą jakości, organizacją zakupów, szkoleniem zespołów i układaniem procesów produkcyjnych.',
      offer: {
        eyebrow: 'Produkt i marka',
        title: 'Pomagam sklepom z owocami morza, sushi barom, restauracjom i dostawom tworzyć produkt od zera i zamieniać go w markę.',
        lead: 'Dzisiaj sama strona internetowa jest prawie bezużyteczna, jeśli za nią nie stoi mocny produkt, zrozumiała marka i gotowa oferta handlowa.',
        paragraphs: [
          'Tworzę produkt od zera i przekształcam go w opakowaną markę, którą można sprzedawać online.',
        ],
        listTitle: 'Co mogę zrobić',
        items: [
          'opracować ideę produktu',
          'stworzyć menu albo linię produktową',
          'przemyśleć smak, podanie i format sprzedaży',
          'ubrać produkt w jasną propozycję dla klienta',
          'stworzyć stronę, katalog albo witrynę online',
          'przygotować teksty, strukturę i wizualną prezentację',
          'pomóc przygotować produkt do wejścia na rynek',
        ],
        strength: 'Moją mocną stroną jest połączenie kuchni i developmentu. Rozumiem produkt jak szef kuchni: smak, koszt, podanie i proces. I potrafię opakować go jak developer: w stronę, katalog, prezentację online albo stronę marki.',
        partners: 'Szukam partnerów do projektów w niszy owoców morza, sushi, dostaw i sprzedaży online.',
        cta: 'Napisz do mnie',
      },
      cv: {
        eyebrow: 'CV',
        title: 'Doświadczenie z kuchni, produkcji i pracy z produktem.',
        lead: 'Pełne CV można pobrać jako PDF. Poniżej są najważniejsze informacje z dokumentu.',
        download: 'Pobierz CV',
        contactTitle: 'Kontakt',
        contact: [
          { label: 'Miasto', value: 'Gdańsk, Polska' },
          { label: 'Telefon', value: '+48 576 212 418', href: 'tel:+48576212418' },
          { label: 'Email', value: 'fodi85999@gmail.com', href: 'mailto:fodi85999@gmail.com' },
          { label: 'Instagram', value: '@fodifood', href: 'https://instagram.com/fodifood' },
        ],
        skillsTitle: 'Umiejętności',
        skills: ['Celowy', 'Towarzyski', 'Odporny na stres', 'Pomysłowy', 'Praca z produktami', 'Szkolenie zespołu'],
        sections: [
          { title: 'Doświadczenie', items: ['20 lat pracy za granicą w restauracjach w Polsce, Litwie, Estonii, Niemczech, Francji i Kanadzie.', 'Fish in House, Dniepr - szef kuchni, 10 czerwca 2018 - 1 czerwca 2022. Nowe produkty, jakość, trwałość, zakupy, procesy produkcyjne, HACCP i szkolenie personelu.', 'Restauracja Autorska / Miod Malina Polska, Zgorzelec - kucharz, 1 maja 2017 - 20 maja 2018.', 'Restauracja Charlemagne, Agde, Francja - kucharz, owoce morza, 10 czerwca 2022 - 16 listopada 2022.', 'Boulangerie Patisserie Wawel, Montreal, Kanada - kucharz, 1 grudnia 2022 - 1 sierpnia 2023.'] },
          { title: 'Edukacja', items: ['Dyplomowany kucharz. Szkoła techniczna nr 53, Dniepr, Ukraina, 1 września 2002 - 31 maja 2003. Studia ukończone z wyróżnieniem, ze stażem w restauracji Charlie’s.'] },
        ],
      },
    },
    contact: { title: 'Porozmawiajmy o dobrej pracy.' },
    footer: 'Blog z Gdańska o Trójmieście, jedzeniu, miejscach i pracy z produktem.',
    notFound: 'Nie ma takiej strony.',
    backHome: 'Wróć na stronę główną',
  },
  en: {
    nav: { home: 'Home', catering: 'Catering', blog: 'Blog', shop: 'Shop', ingredients: 'Ingredients', about: 'About', contact: 'Contact' },
    home: { eyebrow: 'Gdansk · Sopot · Gdynia', title: 'A blog about Tricity, food and product work.', lead: 'Notes from Gdansk about local places, taste, life by the sea and how a local product becomes a brand.', readBlog: 'Read the blog', seeShop: 'Visit the shop', latest: 'Tricity', stories: 'Latest stories from Gdansk, Sopot and Gdynia', allArticles: 'All articles', shop: 'Shop', products: 'Selected products', allShop: 'Full shop', localTitle: 'Three cities, one seaside rhythm', localLead: 'Gdansk brings history and port character, Sopot brings walks and seasonal pace, Gdynia brings the energy of a city built around the sea.', localPlaces: [{ title: 'Gdansk', text: 'old town, Wrzeszcz, Oliwa, port, local addresses and everyday city life' }, { title: 'Sopot', text: 'walks, cafes, seasonality, sea and places between tourism and local life' }, { title: 'Gdynia', text: 'modernist city, Orlowo, Kamienna Gora, product markets and seaside rhythm' }] },
    blog: { eyebrow: 'Tricity blog', lead: 'Gdansk, Sopot and Gdynia: local places, food, product work and notes from life by the sea.', empty: 'The first articles will appear here after publication in the admin panel.' },
    ingredients: { eyebrow: 'Knowledge catalog', title: 'Ingredients', lead: 'Products explained through nutrition, character and culinary use. The catalog supports menu planning, catering and healthy meals in Tricity.', empty: 'Published ingredients from the admin panel will appear here.', calories: 'Calories', protein: 'Protein', fat: 'Fat', carbs: 'Carbohydrates', fiber: 'Fiber', sugar: 'Sugar', density: 'Density', portion: 'Portion', shelfLife: 'Shelf life', season: 'Season', vitamins: 'Vitamins', minerals: 'Minerals', culinary: 'Culinary profile', properties: 'Properties', diets: 'Diets', states: 'Processing states', pairings: 'Best pairings', days: 'days', hours: 'hrs' },
    shop: { eyebrow: 'Chef selected', title: 'Shop', lead: 'Objects and products with a clear purpose in a good kitchen.', empty: 'The shop is being prepared. Active products will appear here automatically.', ask: 'Ask about product', buy: 'Order product', priceOnRequest: 'Price on request', inStock: 'In stock', outOfStock: 'Out of stock', categories: 'categories', brand: 'Product brand', availability: 'Availability', categoryLabel: 'Category', sku: 'SKU', directContact: 'Direct offer', deliveryNote: 'Orders are confirmed by email with pickup, delivery and batch details.', storyTitle: 'Product story', why: 'Why it matters', trustTitle: 'Product trust', chefRecipe: 'Chef recipe', chefRecipeText: 'The product is framed through taste, use and real kitchen work.', smallBatch: 'Small batch', smallBatchText: 'The page focuses on a concrete batch, price and availability.', brandReady: 'Ready to sell', brandReadyText: 'Photos, copy, price and contact create a complete product card.', backToShop: 'Back to shop', backToCategory: 'View category', sameCategory: 'More from category' },
    about: {
      title: 'Chef, product technologist and kitchen process leader.',
      p1: 'For more than twenty years I have worked with products, people and process in Poland, Lithuania, Estonia, Germany, France and Canada.',
      p2: 'I combine hands-on cooking with product development, quality control, purchasing, staff training and production process setup.',
      offer: {
        eyebrow: 'Product and brand',
        title: 'I help seafood shops, sushi bars, restaurants and delivery brands create products from scratch and turn them into a brand.',
        lead: 'Today, a website alone is almost useless if there is no strong product, clear brand and ready commercial offer behind it.',
        paragraphs: [
          'I create products from scratch and turn them into a packaged brand that can be sold online.',
        ],
        listTitle: 'What I can do',
        items: [
          'develop a product idea',
          'create a menu or product line',
          'shape the taste, presentation and sales format',
          'turn the product into a clear offer for customers',
          'create a website, catalog or online storefront',
          'prepare copy, structure and visual presentation',
          'help prepare the product for market launch',
        ],
        strength: 'My strength is that I connect kitchen work and development. I understand the product as a chef: taste, cost, presentation and process. And I can package it as a developer: a website, catalog, online presentation or brand page.',
        partners: 'I am looking for partners for seafood, sushi, delivery and online sales projects.',
        cta: 'Contact me',
      },
      cv: {
        eyebrow: 'CV',
        title: 'Experience in kitchens, production and product work.',
        lead: 'The full CV is available as a PDF. The key details from the document are listed below.',
        download: 'Download CV',
        contactTitle: 'Contact',
        contact: [
          { label: 'City', value: 'Gdansk, Poland' },
          { label: 'Phone', value: '+48 576 212 418', href: 'tel:+48576212418' },
          { label: 'Email', value: 'fodi85999@gmail.com', href: 'mailto:fodi85999@gmail.com' },
          { label: 'Instagram', value: '@fodifood', href: 'https://instagram.com/fodifood' },
        ],
        skillsTitle: 'Skills',
        skills: ['Purposeful', 'Sociable', 'Stress resistant', 'Inventive', 'Product work', 'Team training'],
        sections: [
          { title: 'Experience', items: ['20 years working abroad in restaurants in Poland, Lithuania, Estonia, Germany, France and Canada.', 'Fish in House, Dnipro - head chef, June 10, 2018 - June 1, 2022. New product development, quality control, shelf-life improvement, purchasing, production processes, HACCP and staff training.', 'Restauracja Autorska / Miod Malina Polska, Zgorzelec - cook, May 1, 2017 - May 20, 2018.', 'Restaurant Charlemagne, Agde, France - cook, seafood, June 10, 2022 - November 16, 2022.', 'Boulangerie Patisserie Wawel, Montreal, Canada - cook, December 1, 2022 - August 1, 2023.'] },
          { title: 'Education', items: ['Qualified cook. Technical School No. 53, Dnipro, Ukraine, September 1, 2002 - May 31, 2003. Graduated with honors and completed an internship at Charlie’s restaurant.'] },
        ],
      },
    },
    contact: { title: 'Let’s talk about good work.' },
    footer: 'A Gdansk-based blog about Tricity, food, places and product work.',
    notFound: 'This page does not exist.',
    backHome: 'Back to home',
  },
  ru: {
    nav: { home: 'Главная', catering: 'Кейтеринг', blog: 'Блог', shop: 'Магазин', ingredients: 'Ингредиенты', about: 'Обо мне', contact: 'Контакты' },
    home: { eyebrow: 'Гданьск · Сопот · Гдыня', title: 'Блог о Труймясте, еде и работе с продуктом.', lead: 'Заметки из Гданьска о местах, вкусе, жизни у моря и о том, как локальный продукт становится брендом.', readBlog: 'Читать блог', seeShop: 'Открыть магазин', latest: 'Труймясто', stories: 'Новые истории из Гданьска, Сопота и Гдыни', allArticles: 'Все статьи', shop: 'Магазин', products: 'Избранные товары', allShop: 'Весь магазин', localTitle: 'Три города и один ритм у моря', localLead: 'Гданьск дает историю и портовый характер, Сопот - прогулки и сезонность, Гдыня - энергию города, построенного вокруг моря.', localPlaces: [{ title: 'Гданьск', text: 'старый город, Вжещ, Олива, порт, локальные адреса и повседневная жизнь' }, { title: 'Сопот', text: 'прогулки, кафе, сезон, море и места между туризмом и локальной жизнью' }, { title: 'Гдыня', text: 'модернистский город, Орлово, Каменная Гура, продуктовые рынки и морской ритм' }] },
    blog: { eyebrow: 'Блог Труймясто', lead: 'Гданьск, Сопот и Гдыня: локальные места, еда, продукт и заметки о жизни у моря.', empty: 'Первые статьи появятся здесь после публикации в админ-панели.' },
    ingredients: { eyebrow: 'Каталог знаний', title: 'Ингредиенты', lead: 'Продукты через пищевую ценность, характер и применение в кухне. Каталог помогает планировать меню, кейтеринг и здоровую еду в Труймясте.', empty: 'Опубликованные ингредиенты из админ-панели появятся здесь.', calories: 'Калории', protein: 'Белки', fat: 'Жиры', carbs: 'Углеводы', fiber: 'Клетчатка', sugar: 'Сахар', density: 'Плотность', portion: 'Порция', shelfLife: 'Хранение', season: 'Сезон', vitamins: 'Витамины', minerals: 'Минералы', culinary: 'Кулинарный профиль', properties: 'Свойства', diets: 'Диеты', states: 'Состояния обработки', pairings: 'Лучшие сочетания', days: 'дней', hours: 'ч' },
    shop: { eyebrow: 'Выбор шефа', title: 'Магазин', lead: 'Предметы и продукты с конкретной ролью на хорошей кухне.', empty: 'Магазин готовится. Активные товары появятся здесь автоматически.', ask: 'Спросить о товаре', buy: 'Заказать товар', priceOnRequest: 'Цена по запросу', inStock: 'В наличии', outOfStock: 'Нет в наличии', categories: 'категорий', brand: 'Бренд продукта', availability: 'Наличие', categoryLabel: 'Категория', sku: 'SKU', directContact: 'Прямое предложение', deliveryNote: 'Заказ подтверждается по email: детали получения, доставки и актуальной партии.', storyTitle: 'История продукта', why: 'Почему стоит выбрать', trustTitle: 'Доверие к продукту', chefRecipe: 'Рецептура шефа', chefRecipeText: 'Продукт описан через вкус, применение и реальную работу кухни.', smallBatch: 'Малая партия', smallBatchText: 'Страница показывает конкретную партию, цену и наличие.', brandReady: 'Готово к продаже', brandReadyText: 'Фото, текст, цена и контакт собирают полноценную карточку продукта.', backToShop: 'Назад в магазин', backToCategory: 'Смотреть категорию', sameCategory: 'Еще из категории' },
    about: {
      title: 'Шеф-повар, технолог продукта и руководитель кухонных процессов.',
      p1: 'Более двадцати лет я работаю с продуктом, людьми и процессом в Польше, Литве, Эстонии, Германии, Франции и Канаде.',
      p2: 'Я совмещаю работу повара с разработкой новых продуктов, контролем качества, закупками, обучением команды и настройкой производственных процессов.',
      offer: {
        eyebrow: 'Продукт и бренд',
        title: 'Шеф-повар и разработчик помогает магазинам морепродуктов, суши-барам, ресторанам и доставкам создавать продукт с нуля и упаковывать его в бренд.',
        lead: 'Сегодня сайт сам по себе почти бесполезен, если за ним нет сильного продукта, понятного бренда и готового коммерческого предложения.',
        paragraphs: [
          'Я создаю продукт с нуля и превращаю его в упакованный бренд, который можно продавать онлайн.',
        ],
        listTitle: 'Что я могу сделать',
        items: [
          'разработать идею продукта',
          'создать меню или продуктовую линейку',
          'продумать вкус, подачу и формат продажи',
          'оформить продукт в понятное предложение для клиента',
          'создать сайт, каталог или онлайн-витрину',
          'подготовить тексты, структуру и визуальную подачу',
          'помочь подготовить продукт к запуску на рынок',
        ],
        strength: 'Моя сильная сторона в том, что я соединяю кухню и разработку. Я понимаю продукт как шеф-повар: вкус, себестоимость, подачу и процесс. И могу оформить его как разработчик: сайт, каталог, онлайн-презентацию или страницу бренда.',
        partners: 'Ищу партнеров для проектов в нише морепродуктов, суши, доставки и онлайн-продаж.',
        cta: 'Написать мне',
      },
      cv: {
        eyebrow: 'CV',
        title: 'Опыт в кухне, производстве и работе с продуктом.',
        lead: 'Полное CV можно скачать в PDF. Ниже собраны ключевые данные из документа.',
        download: 'Скачать CV',
        contactTitle: 'Контакты',
        contact: [
          { label: 'Город', value: 'Гданьск, Польша' },
          { label: 'Телефон', value: '+48 576 212 418', href: 'tel:+48576212418' },
          { label: 'Email', value: 'fodi85999@gmail.com', href: 'mailto:fodi85999@gmail.com' },
          { label: 'Instagram', value: '@fodifood', href: 'https://instagram.com/fodifood' },
        ],
        skillsTitle: 'Навыки',
        skills: ['Целеустремленность', 'Коммуникабельность', 'Стрессоустойчивость', 'Креативность', 'Работа с продуктами', 'Обучение команды'],
        sections: [
          { title: 'Опыт', items: ['20 лет работы за границей в ресторанах Польши, Литвы, Эстонии, Германии, Франции и Канады.', 'Fish in House, Днепр - шеф-повар, 10 июня 2018 - 1 июня 2022. Разработка новых продуктов, контроль качества, увеличение сроков хранения, закупки, производственные процессы, HACCP и обучение персонала.', 'Restauracja Autorska / Miod Malina Polska, Згожелец - повар, 1 мая 2017 - 20 мая 2018.', 'Restauracja Charlemagne, Агд, Франция - повар, морепродукты, 10 июня 2022 - 16 ноября 2022.', 'Boulangerie Patisserie Wawel, Монреаль, Канада - повар, 1 декабря 2022 - 1 августа 2023.'] },
          { title: 'Образование', items: ['Дипломированный повар. Техническая школа №53, Днепр, Украина, 1 сентября 2002 - 31 мая 2003. Окончил с отличием, проходил стажировку в ресторане Charlie’s.'] },
        ],
      },
    },
    contact: { title: 'Поговорим о хорошей работе.' },
    footer: 'Блог из Гданьска о Труймясте, еде, местах и работе с продуктом.',
    notFound: 'Такой страницы нет.',
    backHome: 'Вернуться на главную',
  },
  uk: {
    nav: { home: 'Головна', catering: 'Кейтеринг', blog: 'Блог', shop: 'Магазин', ingredients: 'Інгредієнти', about: 'Про мене', contact: 'Контакти' },
    home: { eyebrow: 'Гданськ · Сопот · Гдиня', title: 'Блог про Труймясто, їжу та роботу з продуктом.', lead: 'Нотатки з Гданська про місця, смак, життя біля моря і те, як локальний продукт стає брендом.', readBlog: 'Читати блог', seeShop: 'Відкрити магазин', latest: 'Труймясто', stories: 'Нові історії з Гданська, Сопота і Гдині', allArticles: 'Усі статті', shop: 'Магазин', products: 'Обрані товари', allShop: 'Увесь магазин', localTitle: 'Три міста й один ритм біля моря', localLead: 'Гданськ дає історію і портовий характер, Сопот - прогулянки і сезонність, Гдиня - енергію міста, побудованого навколо моря.', localPlaces: [{ title: 'Гданськ', text: 'старе місто, Вжещ, Олива, порт, локальні адреси і щоденне життя' }, { title: 'Сопот', text: 'прогулянки, кавʼярні, сезон, море і місця між туризмом та локальним життям' }, { title: 'Гдиня', text: 'модерністське місто, Орлово, Каменна Гура, продуктові ринки і морський ритм' }] },
    blog: { eyebrow: 'Блог Труймясто', lead: 'Гданськ, Сопот і Гдиня: локальні місця, їжа, продукт і нотатки про життя біля моря.', empty: 'Перші статті з’являться тут після публікації в адмін-панелі.' },
    ingredients: { eyebrow: 'Каталог знань', title: 'Інгредієнти', lead: 'Продукти через харчову цінність, характер і використання на кухні. Каталог допомагає планувати меню, кейтеринг і здорову їжу в Труймясті.', empty: 'Опубліковані інгредієнти з адмін-панелі з’являться тут.', calories: 'Калорії', protein: 'Білки', fat: 'Жири', carbs: 'Вуглеводи', fiber: 'Клітковина', sugar: 'Цукор', density: 'Щільність', portion: 'Порція', shelfLife: 'Зберігання', season: 'Сезон', vitamins: 'Вітаміни', minerals: 'Мінерали', culinary: 'Кулінарний профіль', properties: 'Властивості', diets: 'Дієти', states: 'Стани обробки', pairings: 'Найкращі поєднання', days: 'днів', hours: 'год' },
    shop: { eyebrow: 'Вибір шефа', title: 'Магазин', lead: 'Предмети та продукти з конкретною роллю на хорошій кухні.', empty: 'Магазин готується. Активні товари з’являться тут автоматично.', ask: 'Запитати про товар', buy: 'Замовити товар', priceOnRequest: 'Ціна за запитом', inStock: 'В наявності', outOfStock: 'Немає в наявності', categories: 'категорій', brand: 'Бренд продукту', availability: 'Наявність', categoryLabel: 'Категорія', sku: 'SKU', directContact: 'Пряма пропозиція', deliveryNote: 'Замовлення підтверджується email: деталі отримання, доставки й актуальної партії.', storyTitle: 'Історія продукту', why: 'Чому варто обрати', trustTitle: 'Довіра до продукту', chefRecipe: 'Рецептура шефа', chefRecipeText: 'Продукт описаний через смак, використання й реальну роботу кухні.', smallBatch: 'Мала партія', smallBatchText: 'Сторінка показує конкретну партію, ціну й наявність.', brandReady: 'Готово до продажу', brandReadyText: 'Фото, текст, ціна й контакт створюють повну картку продукту.', backToShop: 'Назад у магазин', backToCategory: 'Дивитися категорію', sameCategory: 'Ще з категорії' },
    about: {
      title: 'Шеф-кухар, технолог продукту й керівник кухонних процесів.',
      p1: 'Понад двадцять років я працюю з продуктом, людьми та процесом у Польщі, Литві, Естонії, Німеччині, Франції та Канаді.',
      p2: 'Я поєдную роботу кухаря з розробкою нових продуктів, контролем якості, закупівлями, навчанням команди й налаштуванням виробничих процесів.',
      offer: {
        eyebrow: 'Продукт і бренд',
        title: 'Шеф-кухар і розробник допомагає магазинам морепродуктів, суші-барам, ресторанам і доставкам створювати продукт з нуля та пакувати його в бренд.',
        lead: 'Сьогодні сайт сам по собі майже марний, якщо за ним немає сильного продукту, зрозумілого бренду й готової комерційної пропозиції.',
        paragraphs: [
          'Я створюю продукт з нуля й перетворюю його на упакований бренд, який можна продавати онлайн.',
        ],
        listTitle: 'Що я можу зробити',
        items: [
          'розробити ідею продукту',
          'створити меню або продуктову лінійку',
          'продумати смак, подачу й формат продажу',
          'оформити продукт у зрозумілу пропозицію для клієнта',
          'створити сайт, каталог або онлайн-вітрину',
          'підготувати тексти, структуру й візуальну подачу',
          'допомогти підготувати продукт до запуску на ринок',
        ],
        strength: 'Моя сильна сторона в тому, що я поєдную кухню й розробку. Я розумію продукт як шеф-кухар: смак, собівартість, подачу й процес. І можу оформити його як розробник: сайт, каталог, онлайн-презентацію або сторінку бренду.',
        partners: 'Шукаю партнерів для проєктів у ніші морепродуктів, суші, доставки й онлайн-продажів.',
        cta: 'Написати мені',
      },
      cv: {
        eyebrow: 'CV',
        title: 'Досвід у кухні, виробництві та роботі з продуктом.',
        lead: 'Повне CV можна завантажити у PDF. Нижче зібрані ключові дані з документа.',
        download: 'Завантажити CV',
        contactTitle: 'Контакти',
        contact: [
          { label: 'Місто', value: 'Гданськ, Польща' },
          { label: 'Телефон', value: '+48 576 212 418', href: 'tel:+48576212418' },
          { label: 'Email', value: 'fodi85999@gmail.com', href: 'mailto:fodi85999@gmail.com' },
          { label: 'Instagram', value: '@fodifood', href: 'https://instagram.com/fodifood' },
        ],
        skillsTitle: 'Навички',
        skills: ['Цілеспрямованість', 'Комунікабельність', 'Стресостійкість', 'Креативність', 'Робота з продуктами', 'Навчання команди'],
        sections: [
          { title: 'Досвід', items: ['20 років роботи за кордоном у ресторанах Польщі, Литви, Естонії, Німеччини, Франції та Канади.', 'Fish in House, Дніпро - шеф-кухар, 10 червня 2018 - 1 червня 2022. Розробка нових продуктів, контроль якості, збільшення термінів зберігання, закупівлі, виробничі процеси, HACCP і навчання персоналу.', 'Restauracja Autorska / Miod Malina Polska, Згожелець - кухар, 1 травня 2017 - 20 травня 2018.', 'Restauracja Charlemagne, Агд, Франція - кухар, морепродукти, 10 червня 2022 - 16 листопада 2022.', 'Boulangerie Patisserie Wawel, Монреаль, Канада - кухар, 1 грудня 2022 - 1 серпня 2023.'] },
          { title: 'Освіта', items: ['Дипломований кухар. Технічна школа №53, Дніпро, Україна, 1 вересня 2002 - 31 травня 2003. Закінчив з відзнакою, проходив стажування в ресторані Charlie’s.'] },
        ],
      },
    },
    contact: { title: 'Поговорімо про хорошу роботу.' },
    footer: 'Блог з Гданська про Труймясто, їжу, місця і роботу з продуктом.',
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

const categoryCopy: Record<Locale, Record<string, string>> = {
  pl: { techniques: 'Techniki', ingredients: 'Składniki', recipes: 'Przepisy', products: 'Produkty', equipment: 'Sprzęt', editorial: 'Redakcja', sushi: 'Sushi', 'sushi-rolls': 'Rolki sushi', 'sushi-sets': 'Zestawy sushi', nigiri: 'Nigiri', gunkan: 'Gunkan', sashimi: 'Sashimi', soups: 'Zupy', salads: 'Sałatki', snacks: 'Przekąski', sauces: 'Sosy', desserts: 'Desery', 'delivery-food': 'Dostawa jedzenia', 'kitchen-tools': 'Narzędzia kuchenne', tableware: 'Zastawa stołowa', beverages: 'Napoje', other: 'Inne' },
  en: { techniques: 'Techniques', ingredients: 'Ingredients', recipes: 'Recipes', products: 'Products', equipment: 'Equipment', editorial: 'Editorial', sushi: 'Sushi', 'sushi-rolls': 'Sushi rolls', 'sushi-sets': 'Sushi sets', nigiri: 'Nigiri', gunkan: 'Gunkan', sashimi: 'Sashimi', soups: 'Soups', salads: 'Salads', snacks: 'Snacks', sauces: 'Sauces', desserts: 'Desserts', 'delivery-food': 'Delivery food', 'kitchen-tools': 'Kitchen tools', tableware: 'Tableware', beverages: 'Beverages', other: 'Other' },
  ru: { techniques: 'Техники', ingredients: 'Ингредиенты', recipes: 'Рецепты', products: 'Продукты', equipment: 'Оборудование', editorial: 'Редакция', sushi: 'Суши', 'sushi-rolls': 'Роллы', 'sushi-sets': 'Суши-сеты', nigiri: 'Нигири', gunkan: 'Гунканы', sashimi: 'Сашими', soups: 'Супы', salads: 'Салаты', snacks: 'Закуски', sauces: 'Соусы', desserts: 'Десерты', 'delivery-food': 'Доставка еды', 'kitchen-tools': 'Кухонные инструменты', tableware: 'Посуда', beverages: 'Напитки', other: 'Другое' },
  uk: { techniques: 'Техніки', ingredients: 'Інгредієнти', recipes: 'Рецепти', products: 'Продукти', equipment: 'Обладнання', editorial: 'Редакція', sushi: 'Суші', 'sushi-rolls': 'Роли', 'sushi-sets': 'Суші-сети', nigiri: 'Нігірі', gunkan: 'Гункани', sashimi: 'Сашимі', soups: 'Супи', salads: 'Салати', snacks: 'Закуски', sauces: 'Соуси', desserts: 'Десерти', 'delivery-food': 'Доставка їжі', 'kitchen-tools': 'Кухонні інструменти', tableware: 'Посуд', beverages: 'Напої', other: 'Інше' },
};

export function categoryName(value: string, locale: Locale): string {
  return categoryCopy[locale][value.trim().toLowerCase()] || value;
}
