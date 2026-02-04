# 🍣 Dima Fomin - Personal BlogThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



Modern, production-ready personal blog for sushi chef Dima Fomin built with Next.js 15, featuring multilingual support, dark mode, and SEO optimization.## Getting Started



## ✨ FeaturesFirst, run the development server:



- **🌐 Multilingual (i18n)**: Polish, English, Ukrainian, Russian```bash

- **🌙 Dark/Light Theme**: System-aware with manual togglenpm run dev

- **📝 MDX Content**: Write blog posts in Markdown with React components# or

- **🎨 Modern UI**: Tailwind CSS + shadcn/ui componentsyarn dev

- **⚡ Next.js 15**: App Router, Server Components, Turbopack# or

- **🔍 SEO Optimized**: Sitemap, robots.txt, structured data, hreflangpnpm dev

- **📱 Responsive**: Mobile-first design# or

- **🚀 Performance**: Optimized fonts, images, and bundle sizebun dev

```

## 🛠 Tech Stack

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

- **Framework**: Next.js 15 (App Router)

- **Language**: TypeScriptYou can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

- **Styling**: Tailwind CSS

- **UI Components**: shadcn/ui, Radix UIThis project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

- **i18n**: next-intl

- **Theme**: next-themes## Learn More

- **Content**: MDX (gray-matter, next-mdx-remote)

- **Icons**: Lucide ReactTo learn more about Next.js, take a look at the following resources:

- **Fonts**: Inter, Noto Sans JP

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

## 📁 Project Structure- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.



```You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

blog/

├── app/## Deploy on Vercel

│   ├── [locale]/          # Localized routes

│   │   ├── layout.tsx     # Locale layoutThe easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

│   │   ├── page.tsx       # Home page

│   │   ├── blog/          # Blog pagesCheck out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

│   │   ├── about/         # About page
│   │   └── contact/       # Contact page
│   ├── layout.tsx         # Root layout
│   ├── sitemap.ts         # Dynamic sitemap
│   └── robots.ts          # SEO robots
├── components/
│   ├── Header.tsx         # Navigation header
│   ├── Footer.tsx         # Footer
│   ├── ThemeToggle.tsx    # Dark mode toggle
│   ├── LanguageSwitcher.tsx # Language selector
│   ├── PostCard.tsx       # Blog post card
│   └── MDXContent.tsx     # MDX renderer
├── content/
│   ├── pl/blog/           # Polish posts
│   ├── en/blog/           # English posts
│   ├── uk/blog/           # Ukrainian posts
│   └── ru/blog/           # Russian posts
├── lib/
│   ├── posts.ts           # Post utilities
│   ├── metadata.ts        # SEO metadata
│   └── utils.ts           # Common utilities
├── messages/
│   ├── pl.json            # Polish translations
│   ├── en.json            # English translations
│   ├── uk.json            # Ukrainian translations
│   └── ru.json            # Russian translations
├── i18n.ts                # i18n configuration
└── middleware.ts          # i18n middleware
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000/pl](http://localhost:3000/pl) in your browser.

## 📝 Writing Blog Posts

Create a new MDX file in `content/[locale]/blog/`:

```mdx
---
title: "Your Post Title"
date: "2026-02-01"
category: "Sushi Mastery"
excerpt: "Short description of your post"
readTime: "8 min"
---

# Your Post Title

Your content here...

## Section

More content...
```

### Blog Categories

- **Sushi Mastery**: Techniques, recipes, tips
- **Product & Ingredients**: Fish, rice, tools
- **Kitchen Tech**: Equipment, automation
- **Chef Diary**: Personal stories, experiences
- **Education**: Guides, tutorials

## 🌍 Supported Languages

- 🇵🇱 **Polish (pl)** - Primary
- 🇬🇧 **English (en)**
- 🇺🇦 **Ukrainian (uk)**
- 🇷🇺 **Russian (ru)**

URL structure: `https://dima-fomin.pl/[locale]/[page]`

## 🎨 Theming

The blog supports light and dark modes:

- **Light**: Clean white background with red accents
- **Dark**: Dark gray background with softer red accents
- **Auto**: Follows system preferences

Toggle manually using the sun/moon icon in the header.

## 🔍 SEO Features

- ✅ Dynamic sitemap generation
- ✅ Robots.txt configuration
- ✅ hreflang tags for all languages
- ✅ OpenGraph metadata
- ✅ Twitter Cards
- ✅ Structured data (JSON-LD)
- ✅ Canonical URLs
- ✅ Semantic HTML

## 📦 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Other Platforms

The blog is a standard Next.js app and can be deployed to:
- Netlify
- Railway
- Render
- AWS Amplify
- Self-hosted with Docker

## 🔧 Configuration

### Domain

Update the domain in:
- `app/layout.tsx` - metadataBase
- `lib/metadata.ts` - baseUrl
- `app/sitemap.ts` - baseUrl

### Social Links

Update social media links in:
- `app/[locale]/contact/page.tsx`
- `lib/metadata.ts` - jsonLdPerson

### Theme Colors

Customize colors in `tailwind.config.ts`:
```typescript
colors: {
  // Your custom colors
}
```

## 📈 Future Enhancements

- [ ] Newsletter subscription
- [ ] Comments system
- [ ] Search functionality
- [ ] Related posts
- [ ] RSS feed
- [ ] Analytics integration
- [ ] CMS integration (Strapi/Sanity)
- [ ] Image optimization pipeline
- [ ] Video content support
- [ ] Course/product pages

## 🤝 Contributing

This is a personal blog, but suggestions are welcome! Open an issue to discuss ideas.

## 📄 License

© 2026 Dima Fomin. All rights reserved.

---

Built with ❤️ and 🍣 by Dima Fomin
# blog
