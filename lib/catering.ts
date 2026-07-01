import type { Locale } from '@/lib/i18n';

export const cateringSlugs = ['catering-trojmiasto', 'catering-gdansk', 'catering-sopot', 'catering-gdynia'] as const;

export type CateringSlug = (typeof cateringSlugs)[number];

type CityCopy = {
  title: Record<Locale, string>;
  lead: Record<Locale, string>;
  metaDescription: Record<Locale, string>;
  city: string;
  area: string;
  districts: string[];
  image: string;
};

export const cateringPages: Record<CateringSlug, CityCopy> = {
  'catering-trojmiasto': {
    city: 'Trójmiasto',
    area: 'Gdańsk, Sopot, Gdynia',
    districts: ['Gdańsk Wrzeszcz', 'Oliwa', 'Przymorze', 'Sopot Centrum', 'Sopot Wyścigi', 'Gdynia Orłowo', 'Gdynia Śródmieście', 'Redłowo'],
    image: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=1600&q=82',
    title: {
      pl: 'Catering dietetyczny Trójmiasto - Gdańsk, Sopot, Gdynia',
      en: 'Diet catering in Tricity - Gdansk, Sopot, Gdynia',
      ru: 'Диетический кейтеринг в Труймясте - Гданьск, Сопот, Гдыня',
      uk: 'Дієтичний кейтеринг у Труймясті - Гданськ, Сопот, Гдиня',
    },
    lead: {
      pl: 'Zdrowe posiłki, catering firmowy i menu na małe wydarzenia z dostawą w Gdańsku, Sopocie i Gdyni. Oferta budowana przez szefa kuchni z doświadczeniem w produkcie, jakości i procesach.',
      en: 'Healthy meals, office catering and menus for small events delivered across Gdansk, Sopot and Gdynia. A chef-led offer shaped by product, quality and process experience.',
      ru: 'Здоровые блюда, кейтеринг для офисов и меню для небольших событий с доставкой по Гданьску, Сопоту и Гдыне. Предложение собирает шеф с опытом продукта, качества и процессов.',
      uk: 'Здорові страви, офісний кейтеринг і меню для невеликих подій з доставкою по Гданську, Сопоту й Гдині. Пропозицію формує шеф із досвідом продукту, якості та процесів.',
    },
    metaDescription: {
      pl: 'Catering dietetyczny Trójmiasto: Gdańsk, Sopot, Gdynia. Zdrowe posiłki, catering firmowy, menu na wydarzenia, dostawa do domu i biura.',
      en: 'Diet catering in Tricity: Gdansk, Sopot, Gdynia. Healthy meals, office catering, event menus and delivery to home or office.',
      ru: 'Диетический кейтеринг в Труймясте: Гданьск, Сопот, Гдыня. Здоровая еда, офисный кейтеринг, события, доставка домой и в офис.',
      uk: 'Дієтичний кейтеринг у Труймясті: Гданськ, Сопот, Гдиня. Здорова їжа, офісний кейтеринг, події, доставка додому й в офіс.',
    },
  },
  'catering-gdansk': {
    city: 'Gdańsk',
    area: 'Gdańsk',
    districts: ['Wrzeszcz', 'Oliwa', 'Przymorze', 'Zaspa', 'Śródmieście', 'Morena', 'Jasień', 'Letnica'],
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1600&q=82',
    title: {
      pl: 'Catering dietetyczny Gdańsk z dostawą do domu i biura',
      en: 'Diet catering in Gdansk with home and office delivery',
      ru: 'Диетический кейтеринг в Гданьске с доставкой домой и в офис',
      uk: 'Дієтичний кейтеринг у Гданську з доставкою додому й в офіс',
    },
    lead: {
      pl: 'Codzienne posiłki, lunche do biura i catering na spotkania w Gdańsku. Prosta oferta dla osób, które chcą jeść dobrze bez tracenia czasu na planowanie.',
      en: 'Daily meals, office lunches and catering for meetings in Gdansk. A simple offer for people who want to eat well without spending time planning.',
      ru: 'Ежедневные блюда, офисные ланчи и кейтеринг для встреч в Гданьске. Простое предложение для тех, кто хочет хорошо есть без лишнего планирования.',
      uk: 'Щоденні страви, офісні ланчі та кейтеринг для зустрічей у Гданську. Проста пропозиція для тих, хто хоче добре їсти без зайвого планування.',
    },
    metaDescription: {
      pl: 'Catering dietetyczny Gdańsk: dostawa do domu i biura, lunch firmowy, menu na spotkania, zdrowe posiłki od szefa kuchni.',
      en: 'Diet catering in Gdansk: home and office delivery, office lunch, meeting menus and healthy chef-led meals.',
      ru: 'Диетический кейтеринг Гданьск: доставка домой и в офис, офисные ланчи, меню для встреч, здоровая еда от шефа.',
      uk: 'Дієтичний кейтеринг Гданськ: доставка додому й в офіс, офісні ланчі, меню для зустрічей, здорова їжа від шефа.',
    },
  },
  'catering-sopot': {
    city: 'Sopot',
    area: 'Sopot',
    districts: ['Centrum', 'Dolny Sopot', 'Górny Sopot', 'Wyścigi', 'Karlikowo', 'Kamienny Potok'],
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1600&q=82',
    title: {
      pl: 'Catering dietetyczny Sopot - posiłki i menu na kameralne wydarzenia',
      en: 'Diet catering in Sopot - meals and menus for small events',
      ru: 'Диетический кейтеринг в Сопоте - блюда и меню для небольших событий',
      uk: 'Дієтичний кейтеринг у Сопоті - страви й меню для невеликих подій',
    },
    lead: {
      pl: 'Lekki catering do pracy, domu, apartamentu i na małe spotkania w Sopocie. Menu może być codzienne, sezonowe albo przygotowane pod konkretny format wydarzenia.',
      en: 'Light catering for work, home, apartments and small meetings in Sopot. Menus can be daily, seasonal or built around a specific event format.',
      ru: 'Легкий кейтеринг для работы, дома, апартаментов и небольших встреч в Сопоте. Меню может быть ежедневным, сезонным или под конкретный формат события.',
      uk: 'Легкий кейтеринг для роботи, дому, апартаментів і невеликих зустрічей у Сопоті. Меню може бути щоденним, сезонним або під конкретний формат події.',
    },
    metaDescription: {
      pl: 'Catering dietetyczny Sopot: zdrowe posiłki, catering do apartamentu, lunch do pracy i menu na małe wydarzenia.',
      en: 'Diet catering in Sopot: healthy meals, apartment catering, office lunch and menus for small events.',
      ru: 'Диетический кейтеринг Сопот: здоровая еда, доставка в апартамент, офисные ланчи и меню для небольших событий.',
      uk: 'Дієтичний кейтеринг Сопот: здорова їжа, доставка в апартамент, офісні ланчі й меню для невеликих подій.',
    },
  },
  'catering-gdynia': {
    city: 'Gdynia',
    area: 'Gdynia',
    districts: ['Śródmieście', 'Orłowo', 'Redłowo', 'Witomino', 'Mały Kack', 'Chylonia', 'Grabówek', 'Działki Leśne'],
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1600&q=82',
    title: {
      pl: 'Catering dietetyczny Gdynia - jedzenie z dostawą dla domu i biura',
      en: 'Diet catering in Gdynia - delivered meals for home and office',
      ru: 'Диетический кейтеринг в Гдыне - еда с доставкой домой и в офис',
      uk: 'Дієтичний кейтеринг у Гдині - їжа з доставкою додому й в офіс',
    },
    lead: {
      pl: 'Zbilansowane posiłki, lunch do pracy i catering na spotkania w Gdyni. Dobre rozwiązanie dla aktywnych osób, zespołów biurowych i małych wydarzeń.',
      en: 'Balanced meals, work lunches and meeting catering in Gdynia. A good fit for active people, office teams and small events.',
      ru: 'Сбалансированные блюда, рабочие ланчи и кейтеринг для встреч в Гдыне. Подходит активным людям, офисным командам и небольшим событиям.',
      uk: 'Збалансовані страви, робочі ланчі та кейтеринг для зустрічей у Гдині. Підходить активним людям, офісним командам і невеликим подіям.',
    },
    metaDescription: {
      pl: 'Catering dietetyczny Gdynia: zdrowe jedzenie z dostawą, lunch do biura, catering firmowy i menu na spotkania.',
      en: 'Diet catering in Gdynia: healthy food delivery, office lunch, company catering and meeting menus.',
      ru: 'Диетический кейтеринг Гдыня: здоровая еда с доставкой, офисный ланч, корпоративный кейтеринг и меню для встреч.',
      uk: 'Дієтичний кейтеринг Гдиня: здорова їжа з доставкою, офісний ланч, корпоративний кейтеринг і меню для зустрічей.',
    },
  },
};

export const cateringText: Record<Locale, {
  eyebrow: string;
  primaryCta: string;
  secondaryCta: string;
  proof: string[];
  serviceTitle: string;
  serviceLead: string;
  services: Array<{ title: string; text: string }>;
  deliveryTitle: string;
  deliveryLead: string;
  packageTitle: string;
  packages: Array<{ title: string; text: string }>;
  processTitle: string;
  process: string[];
  faqTitle: string;
  faq: Array<{ question: string; answer: string }>;
  formTitle: string;
  formLead: string;
  fields: { name: string; phone: string; city: string; date: string; message: string; submit: string };
  cityLinksTitle: string;
}> = {
  pl: {
    eyebrow: 'Catering z dostawą',
    primaryCta: 'Zapytaj o ofertę',
    secondaryCta: 'Zobacz miasta',
    proof: ['Gdańsk, Sopot, Gdynia', 'dom, biuro, małe wydarzenia', 'menu tworzone przez szefa kuchni'],
    serviceTitle: 'Oferta, która musi być konkretna przed pierwszym telefonem',
    serviceLead: 'Konkurencja pokazuje od razu miasta, typy diet, ceny, dostawę i FAQ. Ta strona robi to samo dla lokalnej oferty w Trójmieście, ale opiera komunikację na realnym doświadczeniu kuchni i produktu.',
    services: [
      { title: 'Dieta pudełkowa', text: 'Codzienne zestawy posiłków do domu lub pracy, z możliwością dopasowania kaloryczności i preferencji.' },
      { title: 'Catering firmowy', text: 'Lunch, bufet albo regularne posiłki dla zespołu w biurze, showroomie lub podczas spotkań.' },
      { title: 'Małe wydarzenia', text: 'Menu dla kameralnych spotkań, warsztatów, degustacji i prywatnych wydarzeń w Trójmieście.' },
    ],
    deliveryTitle: 'Strefa dostawy',
    deliveryLead: 'Najważniejsze lokalizacje są nazwane wprost, żeby użytkownik i Google od razu widzieli, gdzie działa usługa.',
    packageTitle: 'Formaty oferty',
    packages: [
      { title: 'Start', text: 'Prosty zestaw dzienny lub lunch testowy dla jednej osoby.' },
      { title: 'Biuro', text: 'Regularne lunche dla zespołu, z rozliczeniem tygodniowym lub miesięcznym.' },
      { title: 'Event', text: 'Menu pod spotkanie, liczbę osób, termin i charakter wydarzenia.' },
    ],
    processTitle: 'Jak działa zamówienie',
    process: ['Krótko opisujesz miasto, termin i liczbę osób.', 'Ustalamy format: dieta, lunch firmowy albo wydarzenie.', 'Dostajesz propozycję menu, budżet i następny krok.'],
    faqTitle: 'FAQ dla wyszukiwarki i klienta',
    faq: [
      { question: 'Czy catering działa w całym Trójmieście?', answer: 'Oferta jest przygotowana pod Gdańsk, Sopot i Gdynię. Szczegóły dostawy zależą od terminu, liczby osób i formatu menu.' },
      { question: 'Czy można zamówić catering do biura?', answer: 'Tak. Strona celowo zawiera format firmowy, bo zapytania typu catering firmowy Gdańsk i lunch do biura Trójmiasto mają dobry potencjał SEO.' },
      { question: 'Czy to jest gotowy sklep z płatnością online?', answer: 'Pierwszy etap to formularz zapytania. Dzięki temu można zebrać realne leady i dopiero potem podłączyć pełne zamówienia w CRM.' },
    ],
    formTitle: 'Zapytaj o catering',
    formLead: 'Napisz, czego potrzebujesz. Formularz otworzy wiadomość email z gotowymi polami.',
    fields: { name: 'Imię', phone: 'Telefon', city: 'Miasto', date: 'Termin', message: 'Co przygotować?', submit: 'Wyślij zapytanie' },
    cityLinksTitle: 'Strony lokalne',
  },
  en: {
    eyebrow: 'Delivered catering',
    primaryCta: 'Ask for an offer',
    secondaryCta: 'View cities',
    proof: ['Gdansk, Sopot, Gdynia', 'home, office, small events', 'chef-led menu'],
    serviceTitle: 'The offer must be clear before the first call',
    serviceLead: 'Strong competitors show cities, diet types, pricing, delivery and FAQ immediately. This page follows that structure for a local Tricity offer built on real kitchen and product experience.',
    services: [
      { title: 'Meal plans', text: 'Daily meal sets delivered to home or work, with calories and preferences shaped around the request.' },
      { title: 'Office catering', text: 'Lunches, buffets or regular meals for teams in offices, showrooms and meetings.' },
      { title: 'Small events', text: 'Menus for intimate meetings, workshops, tastings and private events in Tricity.' },
    ],
    deliveryTitle: 'Delivery area',
    deliveryLead: 'Important locations are named clearly so people and search engines can see where the service is available.',
    packageTitle: 'Offer formats',
    packages: [
      { title: 'Start', text: 'A simple daily set or test lunch for one person.' },
      { title: 'Office', text: 'Regular team lunches with weekly or monthly planning.' },
      { title: 'Event', text: 'A menu shaped by date, guest count, budget and occasion.' },
    ],
    processTitle: 'How ordering works',
    process: ['You describe the city, date and number of people.', 'We choose the format: meal plan, office lunch or event.', 'You receive a menu direction, budget and next step.'],
    faqTitle: 'FAQ for search and clients',
    faq: [
      { question: 'Is the service available across Tricity?', answer: 'The offer is built for Gdansk, Sopot and Gdynia. Delivery details depend on date, guest count and menu format.' },
      { question: 'Can I order catering for an office?', answer: 'Yes. The office format is important because local company lunch searches have strong SEO intent.' },
      { question: 'Is this already a full online ordering shop?', answer: 'The first step is a request form. It lets us collect real leads before connecting full CRM orders.' },
    ],
    formTitle: 'Ask for catering',
    formLead: 'Tell me what you need. The form opens an email with prepared fields.',
    fields: { name: 'Name', phone: 'Phone', city: 'City', date: 'Date', message: 'What should be prepared?', submit: 'Send request' },
    cityLinksTitle: 'Local pages',
  },
  ru: {
    eyebrow: 'Кейтеринг с доставкой',
    primaryCta: 'Запросить предложение',
    secondaryCta: 'Смотреть города',
    proof: ['Гданьск, Сопот, Гдыня', 'дом, офис, небольшие события', 'меню от шеф-повара'],
    serviceTitle: 'Предложение должно быть понятным до первого звонка',
    serviceLead: 'Сильные конкуренты сразу показывают города, типы диет, цены, доставку и FAQ. Эта страница собирает такую же структуру для локального предложения в Труймясте.',
    services: [
      { title: 'Рационы', text: 'Ежедневные наборы блюд домой или на работу с настройкой калорийности и предпочтений.' },
      { title: 'Офисный кейтеринг', text: 'Ланчи, буфет или регулярные блюда для команды в офисе, шоуруме или на встрече.' },
      { title: 'Небольшие события', text: 'Меню для камерных встреч, воркшопов, дегустаций и частных событий в Труймясте.' },
    ],
    deliveryTitle: 'Зона доставки',
    deliveryLead: 'Локации названы прямо, чтобы и клиент, и Google понимали, где работает услуга.',
    packageTitle: 'Форматы предложения',
    packages: [
      { title: 'Start', text: 'Простой дневной набор или тестовый ланч для одного человека.' },
      { title: 'Office', text: 'Регулярные ланчи для команды с недельным или месячным планированием.' },
      { title: 'Event', text: 'Меню под дату, количество гостей, бюджет и формат события.' },
    ],
    processTitle: 'Как работает заказ',
    process: ['Вы описываете город, дату и количество людей.', 'Выбираем формат: рацион, офисный ланч или событие.', 'Вы получаете направление меню, бюджет и следующий шаг.'],
    faqTitle: 'FAQ для поиска и клиента',
    faq: [
      { question: 'Кейтеринг работает по всему Труймясту?', answer: 'Предложение подготовлено под Гданьск, Сопот и Гдыню. Детали доставки зависят от даты, количества людей и формата меню.' },
      { question: 'Можно заказать кейтеринг в офис?', answer: 'Да. Офисный формат важен, потому что локальные запросы про lunch do biura и catering firmowy имеют хороший SEO-потенциал.' },
      { question: 'Это уже полноценный магазин с оплатой онлайн?', answer: 'Первый этап - форма заявки. Так можно собрать реальные лиды и потом подключить полноценные заказы в CRM.' },
    ],
    formTitle: 'Запросить кейтеринг',
    formLead: 'Напишите, что нужно. Форма откроет email с готовыми полями.',
    fields: { name: 'Имя', phone: 'Телефон', city: 'Город', date: 'Дата', message: 'Что подготовить?', submit: 'Отправить заявку' },
    cityLinksTitle: 'Локальные страницы',
  },
  uk: {
    eyebrow: 'Кейтеринг з доставкою',
    primaryCta: 'Запитати пропозицію',
    secondaryCta: 'Дивитися міста',
    proof: ['Гданськ, Сопот, Гдиня', 'дім, офіс, невеликі події', 'меню від шеф-кухаря'],
    serviceTitle: 'Пропозиція має бути зрозумілою до першого дзвінка',
    serviceLead: 'Сильні конкуренти одразу показують міста, типи дієт, ціни, доставку й FAQ. Ця сторінка збирає таку саму структуру для локальної пропозиції у Труймясті.',
    services: [
      { title: 'Раціони', text: 'Щоденні набори страв додому або на роботу з налаштуванням калорійності й побажань.' },
      { title: 'Офісний кейтеринг', text: 'Ланчі, буфет або регулярні страви для команди в офісі, шоурумі чи на зустрічі.' },
      { title: 'Невеликі події', text: 'Меню для камерних зустрічей, воркшопів, дегустацій і приватних подій у Труймясті.' },
    ],
    deliveryTitle: 'Зона доставки',
    deliveryLead: 'Локації названі прямо, щоб і клієнт, і Google розуміли, де працює послуга.',
    packageTitle: 'Формати пропозиції',
    packages: [
      { title: 'Start', text: 'Простий денний набір або тестовий ланч для однієї людини.' },
      { title: 'Office', text: 'Регулярні ланчі для команди з тижневим або місячним плануванням.' },
      { title: 'Event', text: 'Меню під дату, кількість гостей, бюджет і формат події.' },
    ],
    processTitle: 'Як працює замовлення',
    process: ['Ви описуєте місто, дату й кількість людей.', 'Обираємо формат: раціон, офісний ланч або подія.', 'Ви отримуєте напрям меню, бюджет і наступний крок.'],
    faqTitle: 'FAQ для пошуку й клієнта',
    faq: [
      { question: 'Кейтеринг працює по всьому Труймясту?', answer: 'Пропозиція підготовлена під Гданськ, Сопот і Гдиню. Деталі доставки залежать від дати, кількості людей і формату меню.' },
      { question: 'Можна замовити кейтеринг в офіс?', answer: 'Так. Офісний формат важливий, бо локальні запити про lunch do biura і catering firmowy мають добрий SEO-потенціал.' },
      { question: 'Це вже повний магазин з оплатою онлайн?', answer: 'Перший етап - форма заявки. Так можна зібрати реальні ліди й потім підключити повноцінні замовлення в CRM.' },
    ],
    formTitle: 'Запитати кейтеринг',
    formLead: 'Напишіть, що потрібно. Форма відкриє email із готовими полями.',
    fields: { name: 'Імʼя', phone: 'Телефон', city: 'Місто', date: 'Дата', message: 'Що підготувати?', submit: 'Надіслати заявку' },
    cityLinksTitle: 'Локальні сторінки',
  },
};

export function isCateringSlug(value: string): value is CateringSlug {
  return cateringSlugs.includes(value as CateringSlug);
}
