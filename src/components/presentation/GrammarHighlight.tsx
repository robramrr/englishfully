'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  buildGrammarHighlightSpans,
  type GrammarHighlightSpan,
} from '@/lib/presentation/grammarHighlight';

interface UseGrammarHighlightParams {
  enabled: boolean;
  text: string;
  grammarTarget: string;
  debounceMs?: number;
}

export function useGrammarHighlight({
  enabled,
  text,
  grammarTarget,
  debounceMs = 700,
}: UseGrammarHighlightParams) {
  const [matches, setMatches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled || !grammarTarget.trim() || !text.trim()) {
      setMatches([]);
      setLoading(false);
      setError('');
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError('');

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/presentation/grammar-highlight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            grammar_target: grammarTarget.trim(),
          }),
        });
        const data = await response.json();
        if (requestId !== requestIdRef.current) return;
        if (!response.ok) {
          throw new Error(data.error || 'Failed to highlight grammar');
        }
        setMatches(Array.isArray(data.matches) ? data.matches : []);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setMatches([]);
        setError(err instanceof Error ? err.message : 'Failed to highlight grammar');
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [enabled, text, grammarTarget, debounceMs]);

  const spans = useMemo(
    () => (enabled ? buildGrammarHighlightSpans(text, matches) : []),
    [enabled, text, matches]
  );

  return { spans, matches, loading, error };
}

export function GrammarHighlightedText({
  text,
  spans,
  className = '',
  placeholder = '',
}: {
  text: string;
  spans: GrammarHighlightSpan[];
  className?: string;
  placeholder?: string;
}) {
  if (!text.trim()) {
    return <p className={className}>{placeholder}</p>;
  }

  if (spans.length === 0) {
    return <p className={`whitespace-pre-wrap ${className}`}>{text}</p>;
  }

  const parts: ReactNode[] = [];
  let cursor = 0;
  spans.forEach((span, index) => {
    if (span.start > cursor) {
      parts.push(
        <span key={`t-${cursor}`}>{text.slice(cursor, span.start)}</span>
      );
    }
    parts.push(
      <mark
        key={`h-${span.start}-${index}`}
        className="rounded-sm bg-[#facc15] px-0.5 text-[var(--comic-dark)]"
      >
        {text.slice(span.start, span.end)}
      </mark>
    );
    cursor = span.end;
  });
  if (cursor < text.length) {
    parts.push(<span key={`t-end-${cursor}`}>{text.slice(cursor)}</span>);
  }

  return <p className={`whitespace-pre-wrap ${className}`}>{parts}</p>;
}
