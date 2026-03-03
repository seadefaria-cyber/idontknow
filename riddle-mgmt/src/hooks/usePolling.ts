"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export default function usePolling<T>(
  fetcher: () => Promise<T>,
  interval = 5000
): { data: T | null; loading: boolean; refresh: () => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const id = setInterval(() => {
      if (!document.hidden) {
        fetcherRef.current().then(setData).catch(() => {});
      }
    }, interval);

    return () => clearInterval(id);
  }, [interval, refresh]);

  return { data, loading, refresh };
}
