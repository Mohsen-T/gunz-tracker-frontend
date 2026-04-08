import { useEffect, useState } from 'react';

/**
 * Fetch the current GUN/USD price.
 * Tries CoinGecko first, falls back to a sensible default if the API is unreachable
 * (e.g. local dev with no network).
 *
 * Cached in memory for the session — refetched every 5 minutes.
 */

const FALLBACK_PRICE_USD = 0.012; // sensible fallback for offline dev
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

let _cachedPrice = null;
let _lastFetch = 0;
const _subscribers = new Set();

async function fetchPrice() {
  try {
    // CoinGecko id for GUN: 'gunz' (free public API, no auth needed)
    const resp = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=gunz&vs_currencies=usd',
      { signal: AbortSignal.timeout(5000) }
    );
    if (!resp.ok) throw new Error('CoinGecko fetch failed');
    const data = await resp.json();
    const price = data?.gunz?.usd;
    if (typeof price === 'number' && price > 0) return price;
    throw new Error('No price in response');
  } catch {
    return FALLBACK_PRICE_USD;
  }
}

async function refresh() {
  const price = await fetchPrice();
  _cachedPrice = price;
  _lastFetch = Date.now();
  _subscribers.forEach(cb => cb(price));
}

export function useGunPrice() {
  const [price, setPrice] = useState(_cachedPrice ?? FALLBACK_PRICE_USD);

  useEffect(() => {
    _subscribers.add(setPrice);
    // Trigger initial fetch if stale
    if (!_cachedPrice || Date.now() - _lastFetch > REFRESH_INTERVAL_MS) {
      refresh();
    } else {
      setPrice(_cachedPrice);
    }
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => {
      _subscribers.delete(setPrice);
      clearInterval(interval);
    };
  }, []);

  return price;
}

/**
 * Format a GUN amount as a USD string. Returns '~$0.00' format.
 */
export function formatUsd(gun, pricePerGun) {
  const value = (Number(gun) || 0) * (pricePerGun || 0);
  if (value === 0) return '$0.00';
  if (value < 0.01) return '<$0.01';
  if (value < 1000) return `$${value.toFixed(2)}`;
  if (value < 1_000_000) return `$${(value / 1000).toFixed(2)}K`;
  return `$${(value / 1_000_000).toFixed(2)}M`;
}
