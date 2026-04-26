'use client';

/**
 * Settings — UI language switcher (moved out of Profile so the
 * profile screen can stay focused on cooking preferences).
 *
 * Endpoints:
 *   GET  /api/me                  → current language
 *   PUT  /api/profile/language    → persists user language
 *
 * After a successful change we route to the same `/app/settings`
 * page under the new locale prefix so next-intl picks up the new
 * messages bundle.
 */
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Languages, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { api, ApiError } from '@/lib/chefos-api';
import { updateLanguage } from '@/lib/chefos-mutations';
import type { ChefOSLanguage, MeResponse } from '@/lib/chefos-types';

const LANGS: ChefOSLanguage[] = ['pl', 'en', 'uk', 'ru'];

export function SettingsClient({ locale: _locale }: { locale: string }) {
  const t = useTranslations('app.settings');
  const tNav = useTranslations('app.profile'); // reuse existing lang.* keys
  const uiLocale = useLocale();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<ChefOSLanguage>(
    (uiLocale as ChefOSLanguage) ?? 'pl',
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<MeResponse>('/api/me')
      .then((me) => {
        if (cancelled) return;
        const lang = (me.user.language as ChefOSLanguage) || 'pl';
        setLanguage(LANGS.includes(lang) ? lang : 'pl');
      })
      .catch(() => {
        /* fall back to UI locale */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onChange(next: ChefOSLanguage) {
    if (next === language) return;
    setLanguage(next);
    setSaving(true);
    try {
      await updateLanguage(next);
      toast.success(t('saved'));
      if (next !== uiLocale) {
        router.replace('/app/settings', { locale: next });
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t('errorBody');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black tracking-tight lg:text-3xl">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Languages className="h-4 w-4" />
            {t('languageTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('languageLabel')}
          </Label>
          {loading ? (
            <Skeleton className="h-10 w-full sm:w-64" />
          ) : (
            <Select
              value={language}
              onValueChange={(v) => onChange(v as ChefOSLanguage)}
              disabled={saving}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
                {saving && (
                  <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </SelectTrigger>
              <SelectContent>
                {LANGS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {tNav(`lang.${l}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <p className="text-xs text-muted-foreground">{t('languageHint')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
