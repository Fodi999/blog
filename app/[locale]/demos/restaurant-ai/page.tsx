import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ExternalLink, ArrowLeft, Package, ChefHat, TrendingUp, Brain, CheckCircle, BarChart3, DollarSign, AlertTriangle, Star, Construction } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('restaurantai.title'),
    description: t('restaurantai.description'),
    openGraph: {
      title: t('restaurantai.title'),
      description: t('restaurantai.description'),
      url: `https://dima-fomin.pl/${locale}/demos/restaurant-ai`,
      type: 'website',
    },
    alternates: {
      canonical: `https://dima-fomin.pl/${locale}/demos/restaurant-ai`,
      languages: {
        'pl': 'https://dima-fomin.pl/pl/demos/restaurant-ai',
        'en': 'https://dima-fomin.pl/en/demos/restaurant-ai',
        'ru': 'https://dima-fomin.pl/ru/demos/restaurant-ai',
        'uk': 'https://dima-fomin.pl/uk/demos/restaurant-ai',
        'x-default': 'https://dima-fomin.pl/pl/demos/restaurant-ai',
      },
    },
  };
}

export default async function RestaurantAIDemoPage() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'restaurantai' });

  return (
    <main className="max-w-7xl mx-auto space-y-12 md:space-y-16 px-4 sm:px-6 py-8 md:py-12">
      
      {/* Back Button */}
      <Link 
        href="/restaurants"
        className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm md:text-base">{t('backToRestaurants')}</span>
      </Link>

      {/* Hero Section */}
      <section className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-orange-500 text-white shadow-md">
                <Construction className="h-3 w-3" />
                {t('badge')}
              </span>
              <span className="text-xs md:text-sm text-muted font-mono">v1.0.0 • B2B SaaS</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              {t('title')}
            </h1>
            
            <p className="text-base md:text-lg text-muted max-w-3xl leading-relaxed">
              {t('subtitle')}
            </p>
          </div>

          <a
            href="https://b2b-saas-tau.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-xl bg-blue-500 text-white font-bold hover:shadow-lg hover:scale-105 transition-all text-sm md:text-base whitespace-nowrap"
          >
            <ExternalLink className="h-5 w-5" />
            {t('openDemo')}
          </a>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="p-4 md:p-6 rounded-xl border-2 border-border bg-card space-y-2">
            <Package className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            <div className="text-2xl md:text-3xl font-bold text-foreground">{t('metrics.inventory')}</div>
            <p className="text-xs md:text-sm text-muted">{t('metrics.inventoryDesc')}</p>
          </div>

          <div className="p-4 md:p-6 rounded-xl border-2 border-border bg-card space-y-2">
            <ChefHat className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            <div className="text-2xl md:text-3xl font-bold text-foreground">{t('metrics.recipes')}</div>
            <p className="text-xs md:text-sm text-muted">{t('metrics.recipesDesc')}</p>
          </div>

          <div className="p-4 md:p-6 rounded-xl border-2 border-border bg-card space-y-2">
            <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            <div className="text-2xl md:text-3xl font-bold text-foreground">{t('metrics.menu')}</div>
            <p className="text-xs md:text-sm text-muted">{t('metrics.menuDesc')}</p>
          </div>

          <div className="p-4 md:p-6 rounded-xl border-2 border-border bg-card space-y-2">
            <Brain className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            <div className="text-2xl md:text-3xl font-bold text-foreground">{t('metrics.ai')}</div>
            <p className="text-xs md:text-sm text-muted">{t('metrics.aiDesc')}</p>
          </div>
        </div>
      </section>

      {/* Live Demo Preview */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('preview.title')}</h2>
          <p className="text-sm md:text-base text-muted">{t('preview.subtitle')}</p>
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
                      b2b-saas-tau.vercel.app
                    </div>
                  </div>

                  {/* LIVE DEMO Badge */}
                  <div className="absolute top-20 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-blue-500/90 backdrop-blur-sm rounded-full">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-xs font-bold text-white">LIVE DEMO</span>
                  </div>

                  {/* Desktop Preview */}
                  <div className="relative w-full aspect-[16/9] overflow-hidden bg-white dark:bg-gray-900">
                    <iframe
                      src="https://b2b-saas-tau.vercel.app"
                      className="absolute inset-0 w-full h-full"
                      title="RestaurantAI Demo"
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
                        <CheckCircle className="w-3 h-3" />
                        Mobile Ready
                      </span>
                    </div>

                    {/* Mobile Preview */}
                    <div className="relative w-full aspect-[9/19] overflow-hidden bg-white dark:bg-gray-900">
                      <iframe
                        src="https://b2b-saas-tau.vercel.app"
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
              <div className="absolute top-3 left-3 z-10 bg-blue-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                LIVE
              </div>

              <div className="relative w-full aspect-[9/16] sm:aspect-[16/10]">
                <iframe
                  src="https://b2b-saas-tau.vercel.app"
                  className="absolute inset-0 w-full h-full"
                  title="RestaurantAI Demo"
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="space-y-6 md:space-y-8 bg-gradient-to-br from-red-500/5 to-orange-500/5 rounded-2xl md:rounded-3xl p-6 md:p-12 border border-red-500/20">
        <div className="text-center space-y-3 md:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-full">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-bold text-red-600 dark:text-red-400">{t('problem.badge')}</span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('problem.title')}</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 md:p-6 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-red-200/50 dark:border-red-900/30 space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">✗</span>
                </div>
                <p className="text-sm md:text-base text-foreground font-medium">
                  {t(`problem.point${i}`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Solution - How it Works */}
      <section className="space-y-8 md:space-y-12">
        <div className="text-center space-y-3 md:space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('solution.title')}</h2>
          <p className="text-base md:text-lg text-muted max-w-3xl mx-auto">
            {t('solution.subtitle')}
          </p>
        </div>

        <div className="space-y-8 md:space-y-12">
          {/* Module 1: Inventory */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Package className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-foreground">{t('modules.inventory.title')}</h3>
              </div>

              <p className="text-sm md:text-base text-muted leading-relaxed">
                {t('modules.inventory.description')}
              </p>

              <ul className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm md:text-base text-foreground">{t(`modules.inventory.feature${i}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 md:p-8 rounded-2xl border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
              <div className="aspect-video rounded-xl overflow-hidden">
                <img 
                  src="https://i.postimg.cc/htX7NPGw/fodifood_Ultra_smooth_3D_animation_of_minimalist_white_blocks_p_88052e9b_bafe_41e9_9dd2_8bf8c137880b.png"
                  alt="Inventory Management System"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Module 2: Recipes */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
            <div className="order-2 md:order-1 p-6 md:p-8 rounded-2xl border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-blue-500/5">
              <div className="aspect-video rounded-xl overflow-hidden">
                <img 
                  src="https://i.postimg.cc/BvDPQYHY/fodifood_black_and_white_hand_drawn_sketch_illustration_of_a_pr_477616d0_66b8_4466_b4e7_d93fe0a6c0c6.png"
                  alt="Recipe Management System"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="order-1 md:order-2 space-y-4 md:space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <ChefHat className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-foreground">{t('modules.recipes.title')}</h3>
              </div>

              <p className="text-sm md:text-base text-muted leading-relaxed">
                {t('modules.recipes.description')}
              </p>

              <ul className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm md:text-base text-foreground">{t(`modules.recipes.feature${i}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Module 3: Menu Engineering */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-foreground">{t('modules.menu.title')}</h3>
              </div>

              <p className="text-sm md:text-base text-muted leading-relaxed">
                {t('modules.menu.description')}
              </p>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="p-3 md:p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <Star className="h-5 w-5 text-yellow-500 mb-2" />
                  <div className="text-sm font-bold text-foreground">Star</div>
                  <p className="text-xs text-muted">{t('modules.menu.star')}</p>
                </div>

                <div className="p-3 md:p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <DollarSign className="h-5 w-5 text-green-500 mb-2" />
                  <div className="text-sm font-bold text-foreground">Cash Cow</div>
                  <p className="text-xs text-muted">{t('modules.menu.cashcow')}</p>
                </div>

                <div className="p-3 md:p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mb-2" />
                  <div className="text-sm font-bold text-foreground">Question</div>
                  <p className="text-xs text-muted">{t('modules.menu.question')}</p>
                </div>

                <div className="p-3 md:p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <TrendingUp className="h-5 w-5 text-red-500 mb-2 rotate-180" />
                  <div className="text-sm font-bold text-foreground">Dog</div>
                  <p className="text-xs text-muted">{t('modules.menu.dog')}</p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 rounded-2xl border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
              <div className="aspect-video rounded-xl overflow-hidden">
                <img 
                  src="https://i.postimg.cc/Vv7dH3PP/fodifood_Top_down_futuristic_visual_of_a_3D_printed_steak_being_5a218c16_6f1b_42d0_a67d_de2e8b551dbb.png"
                  alt="Menu Engineering Matrix"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Module 4: AI Recommendations */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
            <div className="order-2 md:order-1 p-6 md:p-8 rounded-2xl border-2 border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
              <div className="aspect-video rounded-xl overflow-hidden">
                <img 
                  src="https://i.postimg.cc/t47p5sg9/fodifood-Abstract-high-end-technology-visualization-representin-b000a618-2095-441d-a556-802fa7b8f8ea.png"
                  alt="AI Recommendations System"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="order-1 md:order-2 space-y-4 md:space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Brain className="h-5 w-5 md:h-6 md:w-6 text-indigo-500" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-foreground">{t('modules.ai.title')}</h3>
              </div>

              <p className="text-sm md:text-base text-muted leading-relaxed">
                {t('modules.ai.description')}
              </p>

              <div className="p-4 md:p-6 rounded-xl bg-indigo-500/10 border-2 border-indigo-500/20 space-y-3">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">{t('modules.ai.example')}</p>
                    <p className="text-xs md:text-sm text-muted italic">
                      "{t('modules.ai.exampleText')}"
                    </p>
                  </div>
                </div>
              </div>

              <ul className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm md:text-base text-foreground">{t(`modules.ai.feature${i}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why It Works */}
      <section className="space-y-6 md:space-y-8 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl md:rounded-3xl p-6 md:p-12 border border-blue-500/20">
        <div className="text-center space-y-3 md:space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('why.title')}</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 md:p-6 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-blue-200/50 dark:border-blue-900/30 space-y-3">
              <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
              <h4 className="text-base md:text-lg font-bold text-foreground">{t(`why.point${i}.title`)}</h4>
              <p className="text-xs md:text-sm text-muted">{t(`why.point${i}.description`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Target Audience */}
      <section className="space-y-6 md:space-y-8">
        <div className="text-center space-y-3 md:space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('target.title')}</h2>
          <p className="text-base md:text-lg text-muted max-w-2xl mx-auto">
            {t('target.subtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 md:p-6 rounded-xl border-2 border-border bg-card hover:border-primary/30 transition-colors text-center space-y-2">
              <h4 className="text-base md:text-lg font-bold text-foreground">{t(`target.type${i}.title`)}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* Results/Benefits */}
      <section className="space-y-6 md:space-y-8 bg-gradient-to-br from-green-500/5 to-blue-500/5 rounded-2xl md:rounded-3xl p-6 md:p-12 border border-green-500/20">
        <div className="text-center space-y-3 md:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm font-bold text-green-600 dark:text-green-400">{t('results.badge')}</span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('results.title')}</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 md:p-6 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-green-200/50 dark:border-green-900/30 text-center space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">
                {t(`results.metric${i}.value`)}
              </div>
              <p className="text-xs md:text-sm text-muted">{t(`results.metric${i}.label`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/5 rounded-2xl md:rounded-3xl p-8 md:p-12 lg:p-16 text-center space-y-6 md:space-y-8 overflow-hidden border border-blue-500/20">
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">
              {t('cta.title')}
            </h2>
            
            <p className="text-base md:text-lg text-muted max-w-2xl mx-auto">
              {t('cta.description')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-stretch sm:items-center">
            <a
              href="https://b2b-saas-tau.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-xl bg-blue-500 text-white font-bold hover:shadow-2xl hover:scale-105 transition-all text-base md:text-lg"
            >
              <ExternalLink className="h-5 w-5" />
              {t('cta.buttonDemo')}
            </a>
            
            <Link
              href="/contact?product=restaurant-ai"
              className="inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-xl border-2 border-foreground/20 text-foreground font-semibold hover:border-blue-500 hover:bg-blue-500/5 transition-all text-base md:text-lg"
            >
              {t('cta.buttonContact')}
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-xs md:text-sm text-muted">
            <div className="flex items-center gap-1.5 md:gap-2">
              <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-500 flex-shrink-0" />
              <span>✔ {t('cta.benefit1')}</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-500 flex-shrink-0" />
              <span>✔ {t('cta.benefit2')}</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-500 flex-shrink-0" />
              <span>✔ {t('cta.benefit3')}</span>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
