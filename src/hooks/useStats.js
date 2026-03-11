import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchStats, fetchHexes, fetchHashpower, fetchDistribution } from '../services/api';

const POLL_INTERVAL = 120000;

export function useStats() {
  const [stats, setStats] = useState(null);
  const [hexes, setHexes] = useState(null);
  const [hashpower, setHashpower] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const load = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [s, h, hp, d] = await Promise.all([
        fetchStats(),
        fetchHexes(),
        fetchHashpower(),
        fetchDistribution(),
      ]);
      setStats(s);
      setHexes(h);
      setHashpower(hp);
      setDistribution(d);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
    intervalRef.current = setInterval(() => load(false), POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [load]);

  return { stats, hexes, hashpower, distribution, loading };
}
