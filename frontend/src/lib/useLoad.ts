'use client';

import { useCallback, useEffect, useState } from 'react';

export function useLoad<T>(fn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await run());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }, [run]);

  useEffect(() => { void reload(); }, [reload]);
  return { data, error, loading, reload, setData };
}
