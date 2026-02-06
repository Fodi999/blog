import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { PostCard } from '@/components/PostCard';
import { HeroImage } from '@/components/HeroImage';
import { ImageGallery } from '@/components/ImageGallery';
import { ArrowRight } from 'lucide-react';
import { getLatestPosts } from '@/lib/posts';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  
  const latestPosts = await getLatestPosts(locale, 3);

  const galleryImages = [
    {
      src: 'https://i.postimg.cc/V5QZwGRX/IMG_4239.jpg',
      alt: 'Sushi preparation by Dima Fomin',
    },
    {
      src: 'https://i.postimg.cc/K8QChcY9/DSCF4689.jpg',
      alt: 'Japanese cuisine by Dima Fomin',
    },
    {
      src: 'https://i.postimg.cc/XqFtRwZJ/DSCF4697.jpg',
      alt: 'Culinary art by Dima Fomin',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section - Powerful & Authoritative */}
      <section className="py-12 md:py-16 lg:py-24">
        <div className="text-left mb-8 md:mb-12 px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 text-foreground">
            {t('hero.title')}
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-primary mb-4 md:mb-6 font-medium">
            {t('hero.subtitle')}
          </p>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 md:mb-4 leading-tight max-w-4xl">
            {t('hero.tagline')}
          </p>
          <p className="text-base md:text-lg lg:text-xl text-muted italic max-w-2xl">
            {t('hero.philosophy')}
          </p>
        </div>
        
        <HeroImage 
          src="https://i.postimg.cc/RCf8VLFn/DSCF4639.jpg"
          alt="Dima Fomin - Sushi Chef"
          priority
        />
        
        {/* CTA Button */}
        <div className="mt-8 md:mt-12 px-4 flex justify-center">
          <Link 
            href="/restaurants"
            className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-primary text-white font-bold text-base md:text-lg rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {t('hero.cta')}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Featured Article - Large & Prominent */}
      <section className="py-8 md:py-12">
        <div className="mb-4 md:mb-6 px-4">
          <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="text-red-500">★</span>
            {t('featuredArticle')}
          </h2>
        </div>
        
        {latestPosts.length > 0 && (
          <div className="mb-8 md:mb-12 px-4">
            <Link href={`/blog/${latestPosts[0].slug}`} className="block group">
              <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300">
                {latestPosts[0].coverImage && (
                  <div className="relative h-[250px] sm:h-[300px] md:h-[400px] overflow-hidden">
                    <HeroImage 
                      src={latestPosts[0].coverImage}
                      alt={latestPosts[0].title}
                    />
                  </div>
                )}
                <div className="p-5 md:p-8">
                  <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 flex-wrap">
                    <span className="px-2.5 md:px-3 py-1 bg-primary/10 text-primary text-xs md:text-sm font-medium rounded-full">
                      {latestPosts[0].category}
                    </span>
                    <span className="text-xs md:text-sm text-muted">{latestPosts[0].readTime}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-foreground group-hover:text-primary transition-colors">
                    {latestPosts[0].title}
                  </h3>
                  <p className="text-base md:text-lg text-muted mb-3 md:mb-4">
                    {latestPosts[0].excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-primary font-medium text-sm md:text-base">
                    {t('readMore')}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}
      </section>

      {/* Restaurant Solutions Teaser - B2B Section */}
      <section className="py-8 md:py-12 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl md:rounded-2xl px-5 md:px-8 mb-8 md:mb-12 mx-4">
        <div className="max-w-3xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-2 md:mb-3 text-foreground">
            {t('restaurantsTeaser.title')}
          </h2>
          <p className="text-base md:text-lg text-muted mb-4 md:mb-6">
            {t('restaurantsTeaser.description')}
          </p>
          <Link
            href="/restaurants"
            className="inline-flex items-center gap-2 text-primary font-semibold text-base md:text-lg hover:gap-3 transition-all group"
          >
            {t('restaurantsTeaser.link')}
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Latest Posts Grid */}
      <section className="py-8 md:py-12 px-4">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('latestPosts')}</h2>
          <Link 
            href="/blog"
            className="flex items-center gap-2 text-primary link-hover font-medium text-sm md:text-base"
          >
            {t('allArticles')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {latestPosts.slice(1).map((post) => (
            <PostCard key={post.slug} {...post} />
          ))}
        </div>
      </section>

      {/* About Section - Below Content */}
      <section className="py-8 md:py-12 bg-card border border-border rounded-xl px-5 md:px-8 mt-8 md:mt-12 mx-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-foreground">{t('aboutSection.title')}</h2>
        <p className="text-base md:text-lg text-muted mb-6 md:mb-8">
          {t('aboutSection.description')}
        </p>
        
        <Link 
          href="/about"
          className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all mb-6 md:mb-8 text-sm md:text-base"
        >
          {t('readMore')} <ArrowRight className="h-4 w-4" />
        </Link>
        
        <ImageGallery images={galleryImages} />
      </section>
    </div>
  );
}
