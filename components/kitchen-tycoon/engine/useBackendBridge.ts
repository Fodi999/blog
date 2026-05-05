'use client';

/**
 * useBackendBridge.ts
 *
 * Connects the real ChefOS backend to the Food Empire game:
 *
 *   GET /api/me              → restaurantName, userName
 *   GET /api/dishes          → real menu items (count shown in game)
 *   GET /api/inventory/products → real stock quantities → seed game stock
 *
 * Returns `authenticated: false` silently when not logged in (401).
 * The game works in full offline/simulation mode in that case.
 */

import { useEffect, useState } from 'react';
import { api } from '@/lib/chefos-api';
import type { MeResponse, Dish, InventoryItem, InventoryListResponse, DishListResponse } from '@/lib/chefos-types';

export interface BackendBridgeData {
  restaurantName: string;
  userName: string;
  dishes: Dish[];
  inventory: InventoryItem[];
  /** Total stock value in cents from backend */
  stockValueCents: number;
  /** Ingredient name → quantity in grams/ml/pcs */
  stockMap: Record<string, number>;
  loading: boolean;
  authenticated: boolean;
}

const DEFAULT: BackendBridgeData = {
  restaurantName: 'Food Empire',
  userName: '',
  dishes: [],
  inventory: [],
  stockValueCents: 0,
  stockMap: {},
  loading: true,
  authenticated: false,
};

export function useBackendBridge(): BackendBridgeData {
  const [data, setData] = useState<BackendBridgeData>(DEFAULT);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // 1. Identity
      let restaurantName = 'Food Empire';
      let userName = '';
      let authenticated = false;

      try {
        const me = await api.get<MeResponse>('/api/me');
        restaurantName = me.tenant.name?.trim() || 'Food Empire';
        userName = me.user.display_name?.trim() || me.user.email;
        authenticated = true;
      } catch {
        // Not logged in or network error — game works offline
        if (cancelled) return;
        setData((prev) => ({ ...prev, loading: false, authenticated: false }));
        return;
      }

      if (cancelled) return;

      // 2. Dishes (menu) — parallel
      let dishes: Dish[] = [];
      let inventory: InventoryItem[] = [];

      const [dishesResult, invResult] = await Promise.allSettled([
        api.get<DishListResponse>('/api/dishes?per_page=100'),
        api.get<InventoryListResponse>('/api/inventory/products?per_page=200'),
      ]);

      if (dishesResult.status === 'fulfilled') {
        dishes = dishesResult.value.items ?? [];
      }

      if (invResult.status === 'fulfilled') {
        inventory = invResult.value.items ?? [];
      }

      // 3. Build stockMap: ingredient name (lowercased) → remaining_quantity
      const stockMap: Record<string, number> = {};
      let stockValueCents = 0;
      for (const item of inventory) {
        const key = item.product.name.toLowerCase().trim();
        stockMap[key] = (stockMap[key] ?? 0) + item.remaining_quantity;
        // Approximate stock value
        stockValueCents += item.remaining_quantity * item.price_per_unit_cents;
      }

      if (!cancelled) {
        setData({
          restaurantName,
          userName,
          dishes,
          inventory,
          stockValueCents,
          stockMap,
          loading: false,
          authenticated,
        });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
