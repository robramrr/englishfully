'use client';

import { useEffect, useRef } from 'react';

export function useAutoSave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  enabled: boolean,
  delayMs = 3000
) {
  const latest = useRef(data);
  const timer = useRef<number | null>(null);
  const isFirst = useRef(true);

  useEffect(() => {
    latest.current = data;
  }, [data]);

  useEffect(() => {
    if (!enabled) return;

    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void saveFn(latest.current);
    }, delayMs);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [data, enabled, delayMs, saveFn]);
}
