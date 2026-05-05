/**
 * hooks/useCityMap.ts
 *
 * Fetches the city map from GET /api/city/map.
 * Returns { map, loading, error }.
 * Falls back gracefully to null when unauthenticated (offline mode).
 */

'use client';

import { useState, useEffect } from 'react';
import type { CityMap } from '@/types/city-api';

const BASE_URL = 'https://ministerial-yetta-fodi999-c58d8823.koyeb.app';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  // Must match ACCESS_KEY in lib/auth-client.ts
  return localStorage.getItem('chefos.access_token');
}

export interface UseCityMapResult {
  map: CityMap | null;
  loading: boolean;
  error: string | null;
}

export function useCityMap(): UseCityMapResult {
  const [map, setMap] = useState<CityMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    fetch(`${BASE_URL}/api/city/map`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) return null; // silent offline
          throw new Error(`City map error: ${res.status}`);
        }
        return res.json() as Promise<CityMap>;
      })
      .then((data) => {
        if (!cancelled && data) setMap(data);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { map, loading, error };
}
