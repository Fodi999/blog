import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ShoppingCart, Smartphone, Globe, Cloud, Clock, CheckCircle, Zap, Star, ArrowLeft, ExternalLink, Package, MapPin, Bell, ChefHat } from 'lucide-react';
import type { Metadata } from 'next';
import { generateMetadata as sharedGenerateMetadata } from '@/lib/metadata';

export const dynamic = 'force-static';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: l } = await params;
  const locale = l as 'pl' | 'en' | 'uk' | 'ru';
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return sharedGenerateMetadata({
    title: t('sushidelivery.title'),
    description: t('sushidelivery.description'),
    locale,
    path: '/demos/sushi-delivery',
  });
}

export default async function SushiDeliveryDemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'sushidelivery' });

  return (
    <main className="max-w-7xl mx-auto space-y-12 md:space-y-16 px-4 sm:px-6 py-8 md:py-12">

      {/* Back Button */}
      <Link
        href="/restaurants"
        className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm md:text-base">{t('backToRestaurants')}</span>
      </Link>

      {/* Hero Section */}
      <section className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-block px-3 py-1.5 rounded-full text-xs font-bold bg-red-500 text-white shadow-md">
                ✓ {t('badge')}
              </span>
              <span className="text-xs md:text-sm text-foreground/60 font-mono">v2.1.0 • Production Ready</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              {t('title')}
            </h1>

            <p className="text-base md:text-lg text-foreground/80 max-w-3xl leading-relaxed">
              {t('subtitle')}
            </p>
          </div>

          <a
            href="https://delivery-omega-six.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-xl bg-primary text-white font-bold hover:shadow-lg hover:scale-105 transition-all text-sm md:text-base whitespace-nowrap"
          >
            <ExternalLink className="h-5 w-5" />
            {t('openDemo')}
          </a>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="p-4 md:p-6 rounded-xl border-2 border-border bg-card dark:bg-muted/10 space-y-2">
            <Zap className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <div className="text-2xl md:text-3xl font-bold text-foreground">{t('metrics.implementation')}</div>
            <p className="text-xs md:text-sm text-foreground/60">{t('metrics.implementationDesc')}</p>
          </div>

          <div className="p-4 md:p-6 rounded-xl border-2 border-border bg-card dark:bg-muted/10 space-y-2">
            <Globe className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <div className="text-2xl md:text-3xl font-bold text-foreground">{t('metrics.languages')}</div>
            <p className="text-xs md:text-sm text-foreground/60">{t('metrics.languagesDesc')}</p>
          </div>

          <div className="p-4 md:p-6 rounded-xl border-2 border-border bg-card dark:bg-muted/10 space-y-2">
            <Cloud className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <div className="text-2xl md:text-3xl font-bold text-foreground">{t('metrics.hosting')}</div>
            <p className="text-xs md:text-sm text-foreground/60">{t('metrics.hostingDesc')}</p>
          </div>

          <div className="p-4 md:p-6 rounded-xl border-2 border-border bg-card dark:bg-muted/10 space-y-2">
            <Smartphone className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <div className="text-2xl md:text-3xl font-bold text-foreground">{t('metrics.mobile')}</div>
            <p className="text-xs md:text-sm text-foreground/60">{t('metrics.mobileDesc')}</p>
          </div>
        </div>
      </section>

      {/* Live Demo Preview */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('preview.title')}</h2>
          <p className="text-sm md:text-base text-foreground/70">{t('preview.subtitle')}</p>
        </div>

        {/* Desktop Preview with Mobile Overlay */}
        <div className="relative">
          {/* Desktop Frame - Hidden on mobile, shown on larger screens */}
          <div className="hidden md:block">
            <div className="relative mx-auto max-w-6xl">
              <div className="relative scale-90 origin-top">
                {/* Desktop Browser Window */}
                <div className="relative w-full rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden border-8 border-gray-800 dark:border-gray-900 bg-white dark:bg-gray-900">
                  {/* Browser Chrome */}
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center gap-2 border-b border-gray-300 dark:border-gray-700">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 mx-4 px-3 py-1 bg-white dark:bg-gray-900 rounded text-xs text-muted-foreground flex items-center gap-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      delivery-omega-six.vercel.app
                    </div>
                  </div>

                  {/* LIVE DEMO Badge */}
                  <div className="absolute top-20 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-red-500/90 backdrop-blur-sm rounded-full">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-xs font-bold text-white">LIVE DEMO</span>
                  </div>

                  {/* Desktop Preview */}
                  <div className="relative w-full aspect-[16/9] overflow-hidden bg-white dark:bg-gray-900">
                    <iframe
                      src="https://delivery-omega-six.vercel.app"
                      className="absolute inset-0 w-full h-full"
                      title="Sushi Delivery System Demo"
                      loading="lazy"
                      sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                  </div>

                  {/* Gradient Overlay Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                </div>

                {/* Mobile Frame Overlay */}
                <div className="hidden lg:block absolute right-[-40px] bottom-[-40px] w-[320px] scale-75 xl:scale-[0.8]">
                  <div className="relative rounded-[2.5rem] shadow-[0_25px_50px_rgba(0,0,0,0.4)] overflow-hidden border-[12px] border-gray-900">
                    {/* Mobile Badge */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full">
                      <span className="text-[10px] font-bold text-white flex items-center gap-1">
                        <Smartphone className="w-3 h-3" />
                        Mobile First
                      </span>
                    </div>

                    {/* Mobile Preview */}
                    <div className="relative w-full aspect-[9/19] overflow-hidden bg-white dark:bg-gray-900">
                      <iframe
                        src="https://delivery-omega-six.vercel.app"
                        className="absolute inset-0 w-[200%] h-[200%] origin-top-left"
                        style={{ transform: 'scale(0.5)' }}
                        title="Mobile Preview"
                        loading="lazy"
                        sandbox="allow-scripts allow-same-origin allow-forms"
                      />
                    </div>
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
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Overview */}
      <section className="space-y-6 md:space-y-8">
        <div className="text-center space-y-3 md:space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('features.title')}</h2>
          <p className="text-base md:text-lg text-foreground/80 max-w-3xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Feature 1: Menu */}
          <div className="p-6 md:p-8 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-red-500/5 to-orange-500/5 dark:from-primary/10 dark:to-transparent space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground">{t('features.menu.title')}</h3>
            </div>

            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              {t('features.menu.description')}
            </p>

            <ul className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm md:text-base text-foreground">{t(`features.menu.feature${i}`)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Feature 2: Cart */}
          <div className="p-6 md:p-8 rounded-2xl border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-blue-500/5 dark:from-green-500/10 dark:to-transparent space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground">{t('features.cart.title')}</h3>
            </div>

            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              {t('features.cart.description')}
            </p>

            <ul className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm md:text-base text-foreground">{t(`features.cart.feature${i}`)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Feature 3: Delivery */}
          <div className="p-6 md:p-8 rounded-2xl border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-transparent space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground">{t('features.delivery.title')}</h3>
            </div>

            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              {t('features.delivery.description')}
            </p>

            <ul className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm md:text-base text-foreground">{t(`features.delivery.feature${i}`)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Feature 4: Tracking */}
          <div className="p-6 md:p-8 rounded-2xl border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-transparent space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Bell className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground">{t('features.tracking.title')}</h3>
            </div>

            <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
              {t('features.tracking.description')}
            </p>

            <ul className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm md:text-base text-foreground">{t(`features.tracking.feature${i}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Technical Stack */}
      <section className="space-y-6 md:space-y-8 bg-gradient-to-br from-gray-500/5 to-gray-500/5 rounded-2xl md:rounded-3xl p-6 md:p-12 border border-border">
        <div className="text-center space-y-3 md:space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('tech.title')}</h2>
          <p className="text-base md:text-lg text-foreground/80 max-w-2xl mx-auto">
            {t('tech.subtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 md:p-6 rounded-xl bg-white/50 dark:bg-muted/10 border border-gray-200/50 dark:border-border/30 space-y-2">
              <h4 className="text-base md:text-lg font-bold text-foreground">{t(`tech.stack${i}.title`)}</h4>
              <p className="text-xs md:text-sm text-foreground/70">{t(`tech.stack${i}.description`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why This System Works */}
      <section className="space-y-6 md:space-y-8">
        <div className="text-center space-y-3 md:space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('why.title')}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          <div className="p-6 md:p-8 rounded-xl border-2 border-border bg-card dark:bg-muted/10 hover:border-primary/30 transition-colors space-y-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <ChefHat className="h-6 w-6 md:h-7 md:w-7 text-primary" />
            </div>
            <h4 className="text-base md:text-lg font-bold text-foreground">{t('why.point1.title')}</h4>
            <p className="text-xs md:text-sm text-foreground/70">{t('why.point1.description')}</p>
          </div>

          <div className="p-6 md:p-8 rounded-xl border-2 border-border bg-card dark:bg-muted/10 hover:border-primary/30 transition-colors space-y-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-2">
              <Smartphone className="h-6 w-6 md:h-7 md:w-7 text-blue-500" />
            </div>
            <h4 className="text-base md:text-lg font-bold text-foreground">{t('why.point2.title')}</h4>
            <p className="text-xs md:text-sm text-foreground/70">{t('why.point2.description')}</p>
          </div>

          <div className="p-6 md:p-8 rounded-xl border-2 border-border bg-card dark:bg-muted/10 hover:border-primary/30 transition-colors space-y-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-2">
              <Zap className="h-6 w-6 md:h-7 md:w-7 text-yellow-500" />
            </div>
            <h4 className="text-base md:text-lg font-bold text-foreground">{t('why.point3.title')}</h4>
            <p className="text-xs md:text-sm text-foreground/70">{t('why.point3.description')}</p>
          </div>
        </div>
      </section>

      {/* Perfect For */}
      <section className="space-y-6 md:space-y-8 bg-gradient-to-br from-primary/5 to-orange-500/5 rounded-2xl md:rounded-3xl p-6 md:p-12 border border-primary/20">
        <div className="text-center space-y-3 md:space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('perfectFor.title')}</h2>
          <p className="text-base md:text-lg text-foreground/80 max-w-2xl mx-auto">
            {t('perfectFor.subtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 md:p-6 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-primary/20 text-center space-y-2">
              <div className="text-4xl mb-2">{t(`perfectFor.type${i}.icon`)}</div>
              <h4 className="text-base md:text-lg font-bold text-foreground">{t(`perfectFor.type${i}.title`)}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-br from-red-500/10 via-orange-500/10 to-red-500/5 rounded-2xl md:rounded-3xl p-8 md:p-12 lg:p-16 text-center space-y-6 md:space-y-8 overflow-hidden border border-red-500/20">
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">
              {t('cta.title')}
            </h2>

            <p className="text-base md:text-lg text-foreground/80 max-w-2xl mx-auto">
              {t('cta.description')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-stretch sm:items-center">
            <a
              href="https://delivery-omega-six.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-xl bg-primary text-white font-bold hover:shadow-2xl hover:scale-105 transition-all text-base md:text-lg"
            >
              <ExternalLink className="h-5 w-5" />
              {t('cta.buttonDemo')}
            </a>

            <Link
              href="/contact?product=sushi-delivery"
              className="inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-xl border-2 border-foreground/20 text-foreground font-semibold hover:border-primary hover:bg-primary/5 transition-all text-base md:text-lg"
            >
              {t('cta.buttonContact')}
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-xs md:text-sm text-foreground/70">
            <div className="flex items-center gap-1.5 md:gap-2">
              <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
              <span>✔ {t('cta.benefit1')}</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
              <span>✔ {t('cta.benefit2')}</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
              <span>✔ {t('cta.benefit3')}</span>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
