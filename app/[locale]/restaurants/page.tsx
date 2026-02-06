import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ExternalLink, ShoppingCart, Smartphone, CheckCircle, Zap, Globe, Cloud, Clock, Briefcase } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('restaurants.title'),
    description: t('restaurants.description'),
    openGraph: {
      title: t('restaurants.title'),
      description: t('restaurants.description'),
      url: `https://dima-fomin.pl/${locale}/restaurants`,
      type: 'website',
    },
    alternates: {
      canonical: `https://dima-fomin.pl/${locale}/restaurants`,
      languages: {
        'pl': 'https://dima-fomin.pl/pl/restaurants',
        'en': 'https://dima-fomin.pl/en/restaurants',
        'ru': 'https://dima-fomin.pl/ru/restaurants',
        'uk': 'https://dima-fomin.pl/uk/restaurants',
      },
    },
  };
}

export default async function RestaurantsPage() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'restaurants' });

  return (
    <main className="max-w-6xl mx-auto space-y-12 md:space-y-16 px-4 sm:px-6">
      
      {/* HERO with subtle gradient */}
      <section className="max-w-3xl relative pt-4 md:pt-0">
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
        }}></div>
        
        <div className="relative">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-foreground bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
            {t('title')}
          </h1>
          <p className="text-lg md:text-xl text-muted leading-relaxed">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* TRUST BLOCK - Key differentiator */}
      <section className="relative">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 rounded-2xl p-6 md:p-8 lg:p-10">
            <div className="space-y-4 md:space-y-6">
              {/* Main message */}
              <blockquote className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight">
                "{t('trust.mainMessage')}"
              </blockquote>
              
              {/* Key points */}
              <div className="grid sm:grid-cols-2 gap-3 md:gap-4 pt-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                  <span className="text-sm md:text-base font-medium text-foreground">
                    {t('trust.point1')}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                  <span className="text-sm md:text-base font-medium text-foreground">
                    {t('trust.point2')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="space-y-6 md:space-y-8">
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('whyWorks.title')}</h2>
        </div>
        
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <div className="p-4 md:p-6 rounded-xl border border-border bg-card">
            <Smartphone className="h-7 w-7 md:h-8 md:w-8 text-primary mb-3 md:mb-4" />
            <h3 className="text-base md:text-lg font-semibold mb-2">{t('features.mobile.title')}</h3>
            <p className="text-sm text-muted">{t('features.mobile.description')}</p>
          </div>
          
          <div className="p-4 md:p-6 rounded-xl border border-border bg-card">
            <ShoppingCart className="h-7 w-7 md:h-8 md:w-8 text-primary mb-3 md:mb-4" />
            <h3 className="text-base md:text-lg font-semibold mb-2">{t('features.orders.title')}</h3>
            <p className="text-sm text-muted">{t('features.orders.description')}</p>
          </div>
          
          <div className="p-4 md:p-6 rounded-xl border border-border bg-card sm:col-span-2 md:col-span-1">
            <CheckCircle className="h-7 w-7 md:h-8 md:w-8 text-primary mb-3 md:mb-4" />
            <h3 className="text-base md:text-lg font-semibold mb-2">{t('features.tested.title')}</h3>
            <p className="text-sm text-muted">{t('features.tested.description')}</p>
          </div>
        </div>
      </section>

      {/* DEMOS */}
      <section className="pt-12 md:pt-24 pb-16 md:pb-32 space-y-6 md:space-y-8">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-foreground">{t('demos.title')}</h2>
          <p className="text-base md:text-lg text-muted">{t('demos.subtitle')}</p>
        </div>

        {/* Live Preview - Fixed Container with Scale Control */}
        <div className="mx-auto max-w-6xl mb-16 md:mb-24">
          <div className="relative">
            {/* Desktop Frame - Scaled - Hide on mobile, show simplified version */}
            <div className="hidden md:block relative origin-top-left scale-[0.85] xl:scale-[0.9] 2xl:scale-[0.95] -mb-[15%] xl:-mb-[10%] 2xl:-mb-[5%]">
              {/* Browser Chrome */}
              <div className="bg-gray-200 dark:bg-gray-800 rounded-t-2xl px-4 py-3 flex items-center gap-2 border border-b-0 border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white dark:bg-gray-900 rounded-md px-3 py-1 text-xs text-muted flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    delivery-omega-six.vercel.app
                  </div>
                </div>
              </div>

              {/* Desktop Preview - 16:9 ratio */}
              <div className="relative rounded-b-2xl border border-t-0 border-border overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
                {/* LIVE DEMO Badge */}
                <div className="absolute top-4 left-4 z-10 bg-red-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  LIVE DEMO
                </div>

                <div className="relative w-full aspect-[16/9] bg-white dark:bg-gray-900">
                  <iframe
                    src="https://delivery-omega-six.vercel.app"
                    className="absolute inset-0 w-full h-full"
                    title="Sushi Delivery System Demo"
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    style={{ transform: 'scale(0.6)', transformOrigin: 'top left', width: '166.67%', height: '166.67%' }}
                  />
                  
                  {/* Bottom Gradient Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none"></div>
                </div>
              </div>

              {/* Mobile Frame - Anchored to Desktop */}
              <div className="hidden lg:block absolute right-[-40px] bottom-[-40px] scale-75 xl:scale-[0.8]">
                <div className="w-[320px] bg-gray-900 rounded-[3rem] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)] border-8 border-gray-800">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-gray-900 rounded-b-2xl z-10"></div>
                  
                  {/* Mobile Screen - 9:19 ratio */}
                  <div className="bg-white rounded-[2.5rem] overflow-hidden relative" style={{ height: '640px' }}>
                    <iframe
                      src="https://delivery-omega-six.vercel.app"
                      className="w-full h-full"
                      title="Mobile Preview"
                      loading="lazy"
                      sandbox="allow-scripts allow-same-origin allow-forms"
                      style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}
                    />
                    
                    {/* Mobile Badge */}
                    <div className="absolute top-8 left-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-semibold text-gray-900 text-center">
                      📱 Mobile Ready
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Simplified Preview */}
            <div className="md:hidden">
              <div className="relative rounded-2xl border-2 border-border overflow-hidden shadow-xl bg-white dark:bg-gray-900">
                {/* LIVE DEMO Badge */}
                <div className="absolute top-3 left-3 z-10 bg-red-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                  LIVE
                </div>

                <div className="relative w-full aspect-[9/16] sm:aspect-[16/10]">
                  <iframe
                    src="https://delivery-omega-six.vercel.app"
                    className="absolute inset-0 w-full h-full"
                    title="Sushi Delivery System Demo"
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description and Cards Below */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Demo card 1 - Sushi Delivery - PRIMARY */}
          <div className="rounded-2xl border-2 border-primary/20 p-5 md:p-8 space-y-4 md:space-y-6 bg-gradient-to-br from-red-500/5 to-orange-500/5 hover:shadow-2xl transition-all hover:border-primary/40">
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="inline-block px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold bg-red-500 text-white shadow-md">
                  ✓ {t('demos.sushi.badge')}
                </span>
                <span className="text-[10px] md:text-xs text-muted font-mono">v2.1.0</span>
              </div>
              
              <h3 className="text-xl md:text-2xl font-bold text-foreground">
                {t('demos.sushi.title')}
              </h3>
              
              <p className="text-sm md:text-base text-muted leading-relaxed">
                {t('demos.sushi.description')}
              </p>

              {/* Product Facts */}
              <div className="flex flex-wrap gap-3 md:gap-4 pt-2 text-[10px] md:text-xs text-muted">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary" />
                  <span>7–14 dni</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary" />
                  <span>PL / EN / RU</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Cloud className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary" />
                  <span>Vercel</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-border"></div>

            <ul className="space-y-2.5 md:space-y-3">
              <li className="flex items-start gap-2 md:gap-2.5 text-xs md:text-sm">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{t('demos.sushi.features.menu')}</span>
              </li>
              <li className="flex items-start gap-2 md:gap-2.5 text-xs md:text-sm">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{t('demos.sushi.features.cart')}</span>
              </li>
              <li className="flex items-start gap-2 md:gap-2.5 text-xs md:text-sm">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{t('demos.sushi.features.status')}</span>
              </li>
              <li className="flex items-start gap-2 md:gap-2.5 text-xs md:text-sm">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{t('demos.sushi.features.mobile')}</span>
              </li>
            </ul>

            <div className="flex flex-col gap-2.5 md:gap-3 pt-3 md:pt-4">
              <a
                href="https://delivery-omega-six.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 md:px-6 py-3 md:py-3.5 rounded-xl bg-primary text-white font-bold hover:shadow-lg hover:scale-105 transition-all text-sm md:text-base"
              >
                <ExternalLink className="h-4 w-4 md:h-5 md:w-5" />
                {t('viewDemo')}
              </a>

              <Link
                href="/contact?product=sushi-delivery"
                className="inline-flex items-center justify-center gap-2 px-5 md:px-6 py-2.5 md:py-3 rounded-xl border-2 border-primary/30 text-foreground font-semibold hover:border-primary hover:bg-primary/5 transition-all text-sm md:text-base"
              >
                {t('order')}
              </Link>
            </div>
          </div>

          {/* Placeholder for future demo - MUTED */}
          <div className="rounded-2xl border-2 border-dashed border-border/50 p-5 md:p-8 space-y-4 md:space-y-6 bg-muted/5 opacity-60 hover:opacity-80 transition-opacity">
            <div className="space-y-2.5 md:space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 md:h-6 md:w-6 text-muted" />
                <span className="inline-block px-2.5 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold bg-muted/30 text-muted">
                  {t('demos.comingSoon')}
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-muted">
                {t('demos.next.title')}
              </h3>
              <p className="text-sm md:text-base text-muted leading-relaxed">
                {t('demos.next.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Enhanced with multiple actions */}
      <section className="relative bg-gradient-to-br from-red-500/10 via-orange-500/10 to-red-500/5 rounded-2xl md:rounded-3xl p-8 md:p-12 lg:p-16 text-center space-y-6 md:space-y-8 overflow-hidden border border-red-500/20">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 mb-3 md:mb-4 px-3 md:px-4 py-1.5 md:py-2 bg-red-500/20 rounded-full">
            <Briefcase className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary" />
            <span className="text-xs md:text-sm font-bold text-primary">{t('cta.badge')}</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">
            {t('cta.title')}
          </h2>
          
          <p className="text-base md:text-lg text-muted max-w-2xl mx-auto mb-6 md:mb-8 px-2">
            {t('cta.description')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-stretch sm:items-center px-4 sm:px-0">
            <Link
              href="/contact?type=demo"
              className="inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-xl bg-primary text-white font-bold hover:shadow-2xl hover:scale-105 transition-all text-base md:text-lg"
            >
              {t('cta.button')}
            </Link>
            
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-xl border-2 border-foreground/20 text-foreground font-semibold hover:border-primary hover:bg-primary/5 transition-all text-base md:text-lg"
            >
              {t('cta.buttonSecondary')}
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-6 md:mt-8 text-xs md:text-sm text-muted px-2">
            <div className="flex items-center gap-1.5 md:gap-2">
              <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
              <span>✔ {t('cta.benefits.noHiddenCosts')}</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
              <span>✔ {t('cta.benefits.fastImplementation')}</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
              <span>✔ {t('cta.benefits.supportPL')}</span>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}