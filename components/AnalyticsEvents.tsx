'use client';

import { useEffect } from 'react';

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(event: string, payload: AnalyticsPayload = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', event, sanitizePayload(payload));
}

export function AnalyticsClickTracker() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-ga-event]') : null;
      if (!target) return;

      const eventName = target.dataset.gaEvent;
      if (!eventName) return;

      trackEvent(eventName, {
        link_url: target instanceof HTMLAnchorElement ? target.href : undefined,
        label: target.dataset.gaLabel || target.textContent?.trim(),
        item_id: target.dataset.gaItemId,
        item_name: target.dataset.gaItemName,
        item_category: target.dataset.gaItemCategory,
        currency: target.dataset.gaCurrency,
        value: parseNumber(target.dataset.gaValue),
      });
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return null;
}

export function ViewItemTracker({ item }: { item: AnalyticsPayload }) {
  useEffect(() => {
    trackEvent('view_item', item);
  }, [JSON.stringify(item)]);

  return null;
}

function sanitizePayload(payload: AnalyticsPayload): AnalyticsPayload {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
