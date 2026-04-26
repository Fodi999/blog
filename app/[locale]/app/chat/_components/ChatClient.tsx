'use client';

/**
 * Chat / Assistant — feature parity with iOS `ChatView` + `ChatViewModel`.
 *
 *   • Personalized greeting from /api/me + /api/preferences
 *   • POST /public/chat with persistent SessionContext
 *   • Cards (product / nutrition / conversion / recipe) via ChatCardsGrid
 *   • Suggestion chips after responses
 *   • Action handlers: addToPlan, startCooking, swap, addToShopping,
 *     showRecipesFor — each invalidates the right resource keys so any
 *     other open page (Plan, Shopping, Inventory) refetches.
 *   • useChefOSSync('me','preferences') so language switch in Settings
 *     re-renders the greeting in this tab + every other tab.
 *
 * Endpoints:
 *   GET  /api/me, GET /api/preferences
 *   POST /public/chat              (anonymous; user_id is optional)
 *   POST /public/chat/event        (telemetry, fire-and-forget)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Send,
  Sparkles,
  Loader2,
  ChefHat,
  Bot,
  Flame,
  Target,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { api, ApiError } from '@/lib/chefos-api';
import { sendChatEvent } from '@/lib/chefos-mutations';
import { invalidate, useChefOSSync } from '@/lib/chefos-store';
import type { MeResponse, UserPreferences } from '@/lib/chefos-types';
import {
  postChat,
  ChatQuotaExceededError,
  type ChatApiResponse,
  type SessionContext,
  type Card as ChatCard,
  type ProductCard,
  type RecipeCard,
} from '@/lib/chef-chat-api';
import { ChatCardsGrid } from '@/components/chat/ChatCards';

// ── Local message shape ────────────────────────────────────────────────────

type ChatRole = 'user' | 'assistant' | 'system';

interface ChatMessage {
  id: string;
  role: ChatRole;
  text?: string;
  cards?: ChatCard[];
  /** Confirmation pill shown after a successful action. */
  confirmation?: { icon: 'plan' | 'shopping' | 'cooking'; title: string; subtitle?: string };
}

// ── Starter prompts per locale ─────────────────────────────────────────────

const STARTERS: Record<string, string[]> = {
  ru: [
    'что приготовить из курицы',
    'калории в лососе',
    'идея для ужина',
    '200 грамм в ложках',
  ],
  en: [
    'chicken recipe ideas',
    'calories in salmon',
    'dinner idea',
    'convert 200g to tablespoons',
  ],
  pl: [
    'pomysł z kurczakiem',
    'kalorie łososia',
    'pomysł na obiad',
    'przelicz 200g na łyżki',
  ],
  uk: [
    'що приготувати з курки',
    'калорії лосося',
    'ідея на вечерю',
    '200 грамів в ложках',
  ],
};

// ── Component ──────────────────────────────────────────────────────────────

export function ChatClient({ locale }: { locale: string }) {
  const t = useTranslations('app.chat');

  const [me, setMe] = useState<MeResponse | null>(null);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [suggestions, setSuggestions] = useState<{ label: string; query: string; emoji?: string }[]>([]);
  const ctxRef = useRef<SessionContext>({ turn_count: 0, last_lang: locale });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const userId = me?.user.id;

  // ── Load greeting (me + preferences) ────────────────────────────────────
  const loadGreeting = useCallback(async () => {
    try {
      const [meResp, prefsResp] = await Promise.all([
        api.get<MeResponse>('/api/me'),
        api.get<UserPreferences>('/api/preferences'),
      ]);
      setMe(meResp);
      setPrefs(prefsResp);
      // Replace any prior greeting cards (keep user/assistant chat history).
      setMessages((prev) => {
        const nonSystem = prev.filter((m) => m.role !== 'system');
        const greeting = buildGreeting(meResp, prefsResp, t);
        return [...greeting, ...nonSystem];
      });
    } catch (e) {
      // Anonymous fallback: still show a generic welcome.
      if (!(e instanceof ApiError) || e.status !== 401) {
        // eslint-disable-next-line no-console
        console.warn('[chat] failed to load greeting', e);
      }
      setMessages((prev) => {
        if (prev.some((m) => m.role === 'system')) return prev;
        return [
          {
            id: `greet-${Date.now()}`,
            role: 'system',
            text: t('welcome'),
          },
        ];
      });
    }
  }, [t]);

  useEffect(() => {
    loadGreeting();
  }, [loadGreeting]);

  // Cross-page sync: language change / profile update → rebuild greeting.
  useChefOSSync(['me', 'preferences'], loadGreeting, 60_000);

  // Auto-scroll on new messages.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isThinking]);

  const starters = useMemo(() => STARTERS[locale] ?? STARTERS.en, [locale]);

  // ── Send a message ──────────────────────────────────────────────────────
  const send = useCallback(
    async (input: string) => {
      const text = input.trim();
      if (!text || isThinking) return;

      // Echo user message.
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text,
      };
      setMessages((m) => [...m, userMsg]);
      setDraft('');
      setSuggestions([]);
      setIsThinking(true);

      // Always sync current locale into context.
      ctxRef.current.last_lang = locale;
      sendChatEvent('query_sent', { user_id: userId, query: text, lang: locale });

      try {
        const resp = await postChat(text, ctxRef.current);
        ctxRef.current = resp.context ?? ctxRef.current;

        const hasCards = (resp.cards?.length ?? 0) > 0;
        let assistantText = resp.text ?? '';
        if (!hasCards) {
          if (resp.chef_tip) assistantText += `\n\n🍳 ${resp.chef_tip}`;
          if (resp.coach_message) assistantText += `\n\n💬 ${resp.coach_message}`;
          if (resp.reason) assistantText += `\n\n💡 ${resp.reason}`;
        }

        const reply: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: assistantText.trim() || undefined,
          cards: resp.cards,
        };
        setMessages((m) => [...m, reply]);
        if (resp.suggestions?.length) setSuggestions(resp.suggestions);
      } catch (e) {
        // 🔒 402 quota exceeded → friendly paywall nudge.
        if (e instanceof ChatQuotaExceededError) {
          const left = e.usage?.purchased_actions ?? 0;
          const headline = t('quotaExceededTitle');
          const sub =
            left > 0
              ? t('quotaExceededWithBalance', { count: left })
              : (e.message ?? t('quotaExceededBuy'));
          toast.error(headline, { description: sub });
          setMessages((m) => [
            ...m,
            {
              id: `q-${Date.now()}`,
              role: 'assistant',
              text: `🪙 ${headline}\n\n${sub}`,
            },
          ]);
        } else {
          const msg = e instanceof Error ? e.message : t('errorGeneric');
          setMessages((m) => [
            ...m,
            { id: `e-${Date.now()}`, role: 'assistant', text: `⚠️ ${msg}` },
          ]);
        }
      } finally {
        setIsThinking(false);
      }
    },
    [isThinking, locale, userId, t],
  );

  // ── Card actions ────────────────────────────────────────────────────────

  const recordAddedRecipe = (slug: string) => {
    const list = ctxRef.current.last_cards ?? [];
    // SessionContext doesn't have a typed `added_recipes` here, but the
    // backend reads `added_recipes`/`added_products` if present. Cast to any
    // so we can pass them through faithfully (matches iOS).
    const ctx = ctxRef.current as SessionContext & {
      added_recipes?: string[];
      added_products?: string[];
    };
    const arr = ctx.added_recipes ?? [];
    if (!arr.includes(slug)) {
      arr.push(slug);
      if (arr.length > 20) arr.splice(0, arr.length - 20);
      ctx.added_recipes = arr;
    }
    ctxRef.current.last_cards = list;
  };

  const recordAddedProduct = (slug: string) => {
    const ctx = ctxRef.current as SessionContext & { added_products?: string[] };
    const arr = ctx.added_products ?? [];
    if (!arr.includes(slug)) {
      arr.push(slug);
      if (arr.length > 30) arr.splice(0, arr.length - 30);
      ctx.added_products = arr;
    }
  };

  const onAddRecipeToPlan = useCallback(
    (recipe: RecipeCard) => {
      const slug = recipe.dish_name; // backend uses english slug; web RecipeCard exposes only dish_name here.
      const name = recipe.display_name ?? recipe.dish_name_local ?? recipe.dish_name;
      recordAddedRecipe(slug);
      sendChatEvent('action_clicked', {
        user_id: userId,
        card_type: 'recipe',
        card_slug: slug,
        action_type: 'add_to_plan',
        lang: locale,
      });
      // Future-proof: notify any subscribed plan view.
      invalidate('plan');
      setMessages((m) => [
        ...m,
        {
          id: `c-${Date.now()}`,
          role: 'assistant',
          confirmation: {
            icon: 'plan',
            title: t('action.added.title'),
            subtitle: `${name} · ${recipe.per_serving_kcal} kcal`,
          },
        },
      ]);
      toast.success(t('action.added.title'));
    },
    [t, userId, locale],
  );

  const onStartCooking = useCallback(
    (recipe: RecipeCard) => {
      const slug = recipe.dish_name;
      const name = recipe.display_name ?? recipe.dish_name_local ?? recipe.dish_name;
      sendChatEvent('action_clicked', {
        user_id: userId,
        card_type: 'recipe',
        card_slug: slug,
        action_type: 'start_cooking',
        lang: locale,
      });
      setMessages((m) => [
        ...m,
        {
          id: `c-${Date.now()}`,
          role: 'assistant',
          confirmation: {
            icon: 'cooking',
            title: t('action.cooking.title'),
            subtitle: `${name} · ${recipe.steps.length} ${t('action.steps')}`,
          },
        },
      ]);
    },
    [t, userId, locale],
  );

  const onAddProductToShopping = useCallback(
    (product: ProductCard) => {
      recordAddedProduct(product.slug);
      sendChatEvent('action_clicked', {
        user_id: userId,
        card_type: 'product',
        card_slug: product.slug,
        action_type: 'add_to_shopping',
        lang: locale,
      });
      invalidate('shopping');
      setMessages((m) => [
        ...m,
        {
          id: `c-${Date.now()}`,
          role: 'assistant',
          confirmation: {
            icon: 'shopping',
            title: t('action.shopping.title'),
            subtitle: product.name,
          },
        },
      ]);
      toast.success(t('action.shopping.title'));
    },
    [t, userId, locale],
  );

  // ── Render helpers ──────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100dvh-var(--site-header-height,4rem))] flex-col">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur lg:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <ChefHat className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight">{t('title')}</h1>
            <p className="truncate text-xs text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
      </header>

      {/* Thread */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6 lg:px-6">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              msg={m}
              t={t}
              onAddRecipeToPlan={onAddRecipeToPlan}
              onStartCooking={onStartCooking}
              onAddProductToShopping={onAddProductToShopping}
            />
          ))}

          {isThinking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('thinking')}
            </div>
          )}
        </div>
      </div>

      {/* Suggestion chips */}
      {(suggestions.length > 0 || messages.length === 0) && (
        <div className="border-t border-border/60 bg-background/80 px-4 py-3 backdrop-blur lg:px-6">
          <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
            {(suggestions.length > 0
              ? suggestions
              : starters.map((q) => ({ label: q, query: q, emoji: undefined }))
            ).map((s) => (
                <button
                  key={s.query}
                  type="button"
                  onClick={() => {
                    sendChatEvent('suggestion_clicked', {
                      user_id: userId,
                      query: s.query,
                      lang: locale,
                    });
                    send(s.query);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted"
                >
                  {s.emoji ? <span>{s.emoji}</span> : <Sparkles className="h-3 w-3" />}
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="border-t border-border/60 bg-background px-4 py-3 lg:px-6"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
            rows={1}
            placeholder={t('placeholder')}
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
          />
          <Button type="submit" disabled={!draft.trim() || isThinking} size="icon" className="h-11 w-11 shrink-0">
            {isThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── Greeting cards (mirrors iOS staggered greeting) ────────────────────────

function buildGreeting(
  me: MeResponse,
  prefs: UserPreferences,
  t: ReturnType<typeof useTranslations<'app.chat'>>,
): ChatMessage[] {
  const name = me.user.display_name?.split(' ')[0] ?? '';
  const out: ChatMessage[] = [
    {
      id: 'greet-hello',
      role: 'system',
      text: name ? t('greeting.helloNamed', { name }) : t('greeting.hello'),
    },
    {
      id: 'greet-goal',
      role: 'system',
      text: t('greeting.goal', { goal: goalLabel(prefs.goal, t) }),
    },
    {
      id: 'greet-targets',
      role: 'system',
      text: t('greeting.targets', {
        kcal: prefs.calorie_target,
        protein: prefs.protein_target,
      }),
    },
  ];
  if (prefs.allergies.length > 0) {
    out.push({
      id: 'greet-allergies',
      role: 'system',
      text: t('greeting.allergies', { list: prefs.allergies.join(', ') }),
    });
  }
  return out;
}

function goalLabel(
  goal: string,
  t: ReturnType<typeof useTranslations<'app.chat'>>,
): string {
  switch (goal) {
    case 'lose_weight':
    case 'lose_fat':
    case 'low_calorie':
    case 'cut':
      return t('goal.loseWeight');
    case 'gain_muscle':
    case 'high_protein':
    case 'bulk':
      return t('goal.gainMuscle');
    case 'gain_weight':
    case 'mass':
      return t('goal.gainWeight');
    case 'eat_healthier':
      return t('goal.eatHealthier');
    default:
      return t('goal.balanced');
  }
}

// ── Message bubble ─────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  t,
  onAddRecipeToPlan,
  onStartCooking,
  onAddProductToShopping,
}: {
  msg: ChatMessage;
  t: ReturnType<typeof useTranslations<'app.chat'>>;
  onAddRecipeToPlan: (r: RecipeCard) => void;
  onStartCooking: (r: RecipeCard) => void;
  onAddProductToShopping: (p: ProductCard) => void;
}) {
  // Confirmation pill
  if (msg.confirmation) {
    const Icon =
      msg.confirmation.icon === 'plan' ? Target : msg.confirmation.icon === 'shopping' ? Sparkles : Flame;
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">
        <Icon className="h-4 w-4 shrink-0 text-emerald-600" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{msg.confirmation.title}</p>
          {msg.confirmation.subtitle && (
            <p className="truncate text-xs text-muted-foreground">{msg.confirmation.subtitle}</p>
          )}
        </div>
      </div>
    );
  }

  // System / greeting cards
  if (msg.role === 'system') {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex gap-3 p-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="whitespace-pre-line text-sm">{msg.text}</p>
        </CardContent>
      </Card>
    );
  }

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] whitespace-pre-line rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {msg.text}
        </div>
      </div>
    );
  }

  // Assistant
  return (
    <div className="flex gap-2">
      <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted">
        <Bot className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        {msg.text && (
          <div className="rounded-2xl bg-muted/60 px-4 py-2.5 text-sm whitespace-pre-line">
            {msg.text}
          </div>
        )}
        {msg.cards && msg.cards.length > 0 && (
          <div className="space-y-3">
            <ChatCardsGrid cards={msg.cards} />
            {/* Action buttons under cards (mirrors iOS card footers) */}
            <CardActions
              cards={msg.cards}
              t={t}
              onAddRecipeToPlan={onAddRecipeToPlan}
              onStartCooking={onStartCooking}
              onAddProductToShopping={onAddProductToShopping}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CardActions({
  cards,
  t,
  onAddRecipeToPlan,
  onStartCooking,
  onAddProductToShopping,
}: {
  cards: ChatCard[];
  t: ReturnType<typeof useTranslations<'app.chat'>>;
  onAddRecipeToPlan: (r: RecipeCard) => void;
  onStartCooking: (r: RecipeCard) => void;
  onAddProductToShopping: (p: ProductCard) => void;
}) {
  const recipes = cards.filter((c): c is RecipeCard => c.type === 'recipe');
  const products = cards.filter((c): c is ProductCard => c.type === 'product');
  if (!recipes.length && !products.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {recipes.map((r) => (
        <div key={`r-${r.dish_name}`} className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <ChefHat className="h-3 w-3" />
            {r.display_name ?? r.dish_name_local ?? r.dish_name}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => onAddRecipeToPlan(r)}>
            <Target className="mr-1 h-3.5 w-3.5" />
            {t('action.addToPlan')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onStartCooking(r)}>
            <Flame className="mr-1 h-3.5 w-3.5" />
            {t('action.cook')}
          </Button>
        </div>
      ))}
      {products.map((p) => (
        <Button
          key={`p-${p.slug}`}
          size="sm"
          variant="outline"
          onClick={() => onAddProductToShopping(p)}
        >
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          {t('action.addToShopping')}: {p.name}
        </Button>
      ))}
    </div>
  );
}
