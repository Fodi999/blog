'use client';

/**
 * ChefOS Web — Register page.
 * email + password + restaurant_name (+ owner_name) → POST /api/auth/register
 * → /app/dashboard
 *
 * Sends current locale as `language` so backend stores user UI preference.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { register, AuthError } from '@/lib/auth-client';

const SUPPORTED = ['pl', 'en', 'uk', 'ru'] as const;
type SupportedLocale = (typeof SUPPORTED)[number];

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const rawLocale = params?.locale ?? 'pl';
  const locale: SupportedLocale = (SUPPORTED as readonly string[]).includes(rawLocale)
    ? (rawLocale as SupportedLocale)
    : 'pl';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (password.length < 8) {
      toast.error(t('passwordTooShort'));
      return;
    }
    setSubmitting(true);
    try {
      await register({
        email: email.trim().toLowerCase(),
        password,
        restaurant_name: restaurantName.trim(),
        owner_name: ownerName.trim() || undefined,
        language: locale,
      });
      toast.success(t('successTitle'));
      router.push('/app/dashboard');
    } catch (err) {
      const message =
        err instanceof AuthError && err.status === 409
          ? t('emailTaken')
          : err instanceof Error
            ? err.message
            : t('genericError');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center px-4">
      <Card className="w-full border-border/60 shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-black tracking-tight">{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="restaurant">{t('restaurantName')}</Label>
              <Input
                id="restaurant"
                required
                maxLength={255}
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder={t('restaurantPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner">
                {t('ownerName')} <span className="text-muted-foreground">({t('optional')})</span>
              </Label>
              <Input
                id="owner"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder={t('ownerPlaceholder')}
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chef@restaurant.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <p className="text-xs text-muted-foreground">{t('passwordHint')}</p>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('submitting')}
                </>
              ) : (
                t('submit')
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t('haveAccount')}{' '}
              <Link href="/login" locale={locale} className="font-semibold text-primary hover:underline">
                {t('signIn')}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
