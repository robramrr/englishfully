'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  buildGrammarHighlightSpans,
  type GrammarHighlightSpan,
} from '@/lib/presentation/grammarHighlight';

function endsWithSentencePause(text: string): boolean {
  return /[.!?]["')\]]?\s*$/.test(text.trimEnd());
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function spansToHtml(text: string, spans: GrammarHighlightSpan[]): string {
  if (!text) return '';
  if (spans.length === 0) {
    return escapeHtml(text).replace(/\n/g, '<br>');
  }
  let html = '';
  let cursor = 0;
  for (const span of spans) {
    if (span.start > cursor) {
      html += escapeHtml(text.slice(cursor, span.start)).replace(/\n/g, '<br>');
    }
    html += `<mark class="grammar-hl">${escapeHtml(text.slice(span.start, span.end))}</mark>`;
    cursor = span.end;
  }
  if (cursor < text.length) {
    html += escapeHtml(text.slice(cursor)).replace(/\n/g, '<br>');
  }
  return html;
}

function placeCaretAtEnd(element: HTMLElement) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

async function fetchGrammarMatches(text: string, grammarTarget: string): Promise<string[]> {
  const response = await fetch('/api/presentation/grammar-highlight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      grammar_target: grammarTarget.trim(),
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to highlight grammar');
  }
  return Array.isArray(data.matches) ? data.matches : [];
}

/**
 * Single text box: type normally; after . ! ? AI yellow-highlights
 * target grammar in the same box (no mirror field).
 */
export function GrammarLiveTextBox({
  value,
  onChange,
  grammarTarget,
  className = '',
  placeholder = 'Example...',
  editable = true,
}: {
  value: string;
  onChange?: (value: string) => void;
  grammarTarget: string;
  className?: string;
  placeholder?: string;
  editable?: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);
  const ignoreSyncRef = useRef(false);
  const highlightedForRef = useRef('');
  const requestIdRef = useRef(0);
  const [error, setError] = useState('');

  const setEditorHtml = useCallback(
    (text: string, spans: GrammarHighlightSpan[], moveCaretToEnd: boolean) => {
      const el = editorRef.current;
      if (!el) return;
      el.innerHTML = text ? spansToHtml(text, spans) : '';
      if (moveCaretToEnd && editable && document.activeElement === el) {
        placeCaretAtEnd(el);
      }
    },
    [editable]
  );

  // Keep DOM in sync when parent value changes (slide switch / external edit)
  useEffect(() => {
    if (ignoreSyncRef.current) {
      ignoreSyncRef.current = false;
      valueRef.current = value;
      return;
    }
    if (value === valueRef.current && editorRef.current?.innerText.replace(/\u00a0/g, ' ') === value) {
      return;
    }
    valueRef.current = value;
    // Preserve highlights only if this exact string was already highlighted
    if (highlightedForRef.current === value && value) {
      void (async () => {
        try {
          const matches = await fetchGrammarMatches(value, grammarTarget);
          setEditorHtml(value, buildGrammarHighlightSpans(value, matches), false);
        } catch {
          setEditorHtml(value, [], false);
        }
      })();
    } else {
      setEditorHtml(value, [], false);
      // Auto-highlight prepared text that already ends with a sentence
      if (grammarTarget.trim() && value.trim() && endsWithSentencePause(value)) {
        void highlight(value);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, grammarTarget, setEditorHtml]);

  async function highlight(text: string) {
    if (!grammarTarget.trim() || !text.trim()) {
      highlightedForRef.current = '';
      setEditorHtml(text, [], true);
      return;
    }
    const requestId = ++requestIdRef.current;
    setError('');
    try {
      const matches = await fetchGrammarMatches(text, grammarTarget);
      if (requestId !== requestIdRef.current) return;
      const spans = buildGrammarHighlightSpans(text, matches);
      highlightedForRef.current = text;
      valueRef.current = text;
      setEditorHtml(text, spans, true);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to highlight grammar');
    }
  }

  function handleInput() {
    const el = editorRef.current;
    if (!el || !editable) return;
    let plain = el.innerText.replace(/\u00a0/g, ' ');
    // If user keeps typing after highlights, drop marks and continue in the same box
    if (el.querySelector('mark') && !endsWithSentencePause(plain)) {
      el.innerText = plain;
      placeCaretAtEnd(el);
      plain = el.innerText.replace(/\u00a0/g, ' ');
      highlightedForRef.current = '';
    }
    valueRef.current = plain;
    ignoreSyncRef.current = true;
    onChange?.(plain);
    if (endsWithSentencePause(plain)) {
      void highlight(plain);
    }
  }

  return (
    <div className="space-y-1">
      <div
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        contentEditable={editable}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className={[
          'grammar-live-textbox w-full min-h-[8rem] whitespace-pre-wrap border-4 border-[var(--comic-black)] bg-white/90 p-3 comic-shadow-sm outline-none',
          editable ? 'cursor-text' : 'cursor-default',
          className,
        ].join(' ')}
        onInput={handleInput}
        onKeyDown={(event) => event.stopPropagation()}
        onPaste={(event) => {
          if (!editable) return;
          event.preventDefault();
          const text = event.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
        }}
      />
      <style jsx global>{`
        .grammar-live-textbox:empty:before {
          content: attr(data-placeholder);
          color: color-mix(in srgb, var(--comic-dark) 45%, white);
          font-weight: 700;
          pointer-events: none;
        }
        .grammar-live-textbox mark.grammar-hl,
        .grammar-live-textbox mark {
          background: #facc15;
          color: var(--comic-dark);
          border-radius: 0.15rem;
          padding: 0 0.1rem;
        }
      `}</style>
      {error ? (
        <p className="text-xs font-bold text-[var(--comic-danger)]">{error}</p>
      ) : null}
    </div>
  );
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
      parts.push(<span key={`t-${cursor}`}>{text.slice(cursor, span.start)}</span>);
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
