'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import {
  buildGrammarHighlightSpans,
  type GrammarHighlightSpan,
} from '@/lib/presentation/grammarHighlight';

function endsWithSentencePause(text: string): string | null {
  const trimmed = text.replace(/\s+$/u, '');
  if (!/[.!?]$/u.test(trimmed)) return null;
  return trimmed;
}

/** True when the user finished a sentence — not when they only pressed Enter after one. */
function shouldRunHighlight(next: string, prev: string): boolean {
  const nextSentence = endsWithSentencePause(next);
  if (!nextSentence) return false;
  const prevSentence = endsWithSentencePause(prev);
  // Only added trailing newlines/spaces after an already-complete sentence
  if (prevSentence === nextSentence && next.length >= prev.length) {
    return false;
  }
  return true;
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

/** Plain-text caret offset inside the editor (counts like readEditablePlainText). */
function getCaretPlainOffset(root: HTMLElement): number | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.focusNode || !root.contains(selection.focusNode)) {
    return null;
  }
  const range = selection.getRangeAt(0).cloneRange();
  range.selectNodeContents(root);
  range.setEnd(selection.focusNode, selection.focusOffset);
  const pre = range.cloneContents();
  const walkerHost = document.createElement('div');
  walkerHost.appendChild(pre);
  return readEditablePlainText(walkerHost).length;
}

function setCaretPlainOffset(root: HTMLElement, offset: number) {
  const selection = window.getSelection();
  if (!selection) return;
  let remaining = Math.max(0, offset);

  const place = (node: Node, at: number) => {
    const range = document.createRange();
    range.setStart(node, at);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const walk = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || '').replace(/\u00a0/g, ' ');
      if (remaining <= text.length) {
        place(node, remaining);
        return true;
      }
      remaining -= text.length;
      return false;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    const el = node as HTMLElement;
    if (el.tagName === 'BR') {
      if (remaining === 0) {
        // Place after this <br>
        const range = document.createRange();
        range.setStartAfter(el);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        return true;
      }
      remaining -= 1;
      return false;
    }
    for (const child of Array.from(el.childNodes)) {
      if (walk(child)) return true;
    }
    return false;
  };

  if (!walk(root)) {
    placeCaretAtEnd(root);
  }
}

/**
 * Read plain text without Chrome's "Enter → <div><br>" doubling newlines.
 * One visual line break = one \n.
 */
function readEditablePlainText(root: HTMLElement): string {
  let result = '';

  const appendNewline = () => {
    if (!result.endsWith('\n')) result += '\n';
  };

  const walk = (node: Node, isRoot = false) => {
    if (node.nodeType === Node.TEXT_NODE) {
      result += (node.textContent || '').replace(/\u00a0/g, ' ');
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName;

    if (tag === 'BR') {
      result += '\n';
      return;
    }

    const children = Array.from(el.childNodes);
    const isBlock = tag === 'DIV' || tag === 'P' || tag === 'LI';

    if (isBlock && !isRoot) {
      // Empty line box from browser Enter
      if (
        children.length === 0 ||
        (children.length === 1 &&
          children[0].nodeType === Node.ELEMENT_NODE &&
          (children[0] as HTMLElement).tagName === 'BR')
      ) {
        result += '\n';
        return;
      }
      if (result.length > 0 && !result.endsWith('\n')) {
        appendNewline();
      }
      children.forEach((child) => walk(child));
      return;
    }

    children.forEach((child) => walk(child));
  };

  walk(root, true);
  return result.replace(/\r/g, '');
}

function insertSingleLineBreak() {
  // Prefer a single <br> — avoids block <div> that doubles with innerText
  if (document.queryCommandSupported?.('insertLineBreak')) {
    document.execCommand('insertLineBreak');
    return;
  }
  document.execCommand('insertText', false, '\n');
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
  style,
  placeholder = 'Example...',
  editable = true,
}: {
  value: string;
  onChange?: (value: string) => void;
  grammarTarget: string;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  editable?: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const placeholderMeasureRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);
  const ignoreSyncRef = useRef(false);
  const highlightedForRef = useRef('');
  const requestIdRef = useRef(0);
  const [error, setError] = useState('');
  const [boxMinHeight, setBoxMinHeight] = useState<number | undefined>(undefined);

  const setEditorHtml = useCallback(
    (text: string, spans: GrammarHighlightSpan[], caretOffset: number | null) => {
      const el = editorRef.current;
      if (!el) return;
      el.innerHTML = text ? spansToHtml(text, spans) : '';
      if (editable && document.activeElement === el) {
        if (caretOffset == null) {
          placeCaretAtEnd(el);
        } else {
          setCaretPlainOffset(el, Math.min(caretOffset, text.length));
        }
      }
    },
    [editable]
  );

  // Keep DOM in sync when parent value changes (slide switch / external edit)
  useEffect(() => {
    const current = editorRef.current
      ? readEditablePlainText(editorRef.current)
      : '';

    // Echo of our own onChange — skip only if DOM already matches.
    // If value jumped (e.g. slide change while ignore was set), fall through and sync.
    if (ignoreSyncRef.current) {
      ignoreSyncRef.current = false;
      if (value === valueRef.current && current === value) {
        return;
      }
    }

    if (value === valueRef.current && current === value) {
      return;
    }

    // Cancel in-flight highlight from a previous value / slide
    requestIdRef.current += 1;
    highlightedForRef.current = '';
    valueRef.current = value;
    setError('');
    setEditorHtml(value, [], null);

    // Auto-highlight prepared text that already ends with a sentence
    if (grammarTarget.trim() && value.trim() && endsWithSentencePause(value)) {
      void highlight(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, grammarTarget, setEditorHtml]);

  async function highlight(text: string) {
    if (!grammarTarget.trim() || !text.trim()) {
      highlightedForRef.current = '';
      const el = editorRef.current;
      const caret = el ? getCaretPlainOffset(el) : null;
      setEditorHtml(text, [], caret);
      return;
    }
    const requestId = ++requestIdRef.current;
    const requestedBase = text.replace(/\s+$/u, '');
    setError('');
    try {
      const matches = await fetchGrammarMatches(text, grammarTarget);
      if (requestId !== requestIdRef.current) return;

      const el = editorRef.current;
      const live = el ? readEditablePlainText(el) : valueRef.current;
      const liveBase = live.replace(/\s+$/u, '');
      const caret = el && document.activeElement === el ? getCaretPlainOffset(el) : null;

      // User changed the sentence itself while waiting — drop stale result
      if (liveBase !== requestedBase && !live.startsWith(requestedBase)) {
        return;
      }

      // Keep any line breaks / typing added after the sentence while AI ran
      const textToPaint = live.startsWith(requestedBase) ? live : text;
      const spans = buildGrammarHighlightSpans(textToPaint, matches);
      highlightedForRef.current = textToPaint;
      valueRef.current = textToPaint;
      ignoreSyncRef.current = true;
      onChange?.(textToPaint);
      // Prefer the user's current caret (e.g. already on the new line after Enter)
      setEditorHtml(
        textToPaint,
        spans,
        caret == null ? textToPaint.length : Math.min(caret, textToPaint.length)
      );
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to highlight grammar');
    }
  }

  function commitPlainText(plain: string) {
    const prev = valueRef.current;
    valueRef.current = plain;
    ignoreSyncRef.current = true;
    onChange?.(plain);
    if (grammarTarget.trim() && shouldRunHighlight(plain, prev)) {
      void highlight(plain);
    }
  }

  function handleInput() {
    const el = editorRef.current;
    if (!el || !editable) return;
    let plain = readEditablePlainText(el);
    // If user keeps typing after highlights, drop marks and continue in the same box
    if (el.querySelector('mark') && !endsWithSentencePause(plain)) {
      const caret = getCaretPlainOffset(el);
      highlightedForRef.current = '';
      setEditorHtml(plain, [], caret);
      plain = readEditablePlainText(el);
    }
    commitPlainText(plain);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    event.stopPropagation();
    if (!editable) return;
    if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      insertSingleLineBreak();
      // insertLineBreak does not always fire input in every browser
      requestAnimationFrame(() => handleInput());
    }
  }

  const showPlaceholder = !value.trim();

  useEffect(() => {
    if (!showPlaceholder) {
      setBoxMinHeight(undefined);
      return;
    }

    const measure = () => {
      const el = placeholderMeasureRef.current;
      if (!el) return;
      // padding (p-3 = 12px * 2) + border breathing room
      const next = Math.max(128, Math.ceil(el.scrollHeight) + 8);
      setBoxMinHeight(next);
    };

    measure();
    const el = placeholderMeasureRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [showPlaceholder, placeholder, className]);

  const boxStyle = boxMinHeight ? { minHeight: boxMinHeight } : undefined;

  return (
    <div className="space-y-1">
      <div
        className="relative min-h-[8rem] border-4 border-[var(--comic-black)] bg-white/90 comic-shadow-sm"
        style={boxStyle}
      >
        {showPlaceholder ? (
          <div
            ref={placeholderMeasureRef}
            aria-hidden
            className={[
              'pointer-events-none absolute inset-x-0 top-0 z-0 p-3 font-bold whitespace-pre-wrap text-[color-mix(in_srgb,var(--comic-dark)_45%,white)]',
              className,
            ].join(' ')}
            style={style}
          >
            {placeholder}
          </div>
        ) : null}
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          contentEditable={editable}
          suppressContentEditableWarning
          className={[
            'grammar-live-textbox relative z-[1] w-full min-h-[8rem] whitespace-pre-wrap bg-transparent p-3 outline-none',
            editable ? 'cursor-text' : 'cursor-default',
            className,
          ].join(' ')}
          style={{ ...style, ...(boxStyle || {}) }}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={(event) => {
            if (!editable) return;
            event.preventDefault();
            const text = event.clipboardData.getData('text/plain').replace(/\r\n/g, '\n');
            document.execCommand('insertText', false, text);
          }}
        />
      </div>
      <style jsx global>{`
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
