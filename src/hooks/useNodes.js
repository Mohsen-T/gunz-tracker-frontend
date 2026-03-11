import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchNodes } from '../services/api';

const POLL_INTERVAL = 120000; // 2 minutes — matches backend sync

export function useNodes() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const load = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const data = await fetchNodes();
      setNodes(data.nodes || []);
      setLastUpdated(data.updatedAt);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch nodes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
    intervalRef.current = setInterval(() => load(false), POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [load]);

  return { nodes, loading, error, lastUpdated, refresh: () => load(false) };
}
