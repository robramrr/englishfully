'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import { GrammarLiveTextBox } from '../presentation/GrammarHighlight';
import {
  sentenceContestName,
  type SentenceContestActivity,
} from '@/lib/sentence-contest/types';

const MAX_SENTENCES = 12;

interface ContestRow {
  id: string;
  text: string;
}

interface ContestResult {
  signature: string;
  rowId: string;
  reason: string;
}

function createRowId(): string {
  return `sent_${Math.random().toString(36).slice(2, 10)}`;
}

function filledRows(rows: ContestRow[]): ContestRow[] {
  return rows.filter((row) => row.text.trim());
}

function contestSignature(rows: ContestRow[]): string {
  return filledRows(rows)
    .map((row) => `${row.id}:${row.text.trim()}`)
    .join('\n');
}

function overlayHost(self: HTMLElement | null): HTMLElement {
  const doc = document as Document & { webkitFullscreenElement?: Element };
  const fullscreen = document.fullscreenElement || doc.webkitFullscreenElement;
  if (fullscreen instanceof HTMLElement && fullscreen !== self) return fullscreen;
  return document.body;
}

function SentenceContestPlay({
  activity,
  present = false,
}: {
  activity: SentenceContestActivity;
  present?: boolean;
}) {
  const [rows, setRows] = useState<ContestRow[]>(() => [{ id: createRowId(), text: '' }]);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [awarding, setAwarding] = useState(false);
  const [result, setResult] = useState<ContestResult | null>(null);
  const [error, setError] = useState('');
  const prompt = activity.prompt.trim();
  const filled = filledRows(rows);
  const signature = contestSignature(rows);
  const winner = result && result.signature === signature ? result : null;
  const canAdd =
    rows.length < MAX_SENTENCES && rows[rows.length - 1]?.text.trim().length > 0;
  const fontSize = present ? 28 : 22;

  function addRow() {
    if (!canAdd) return;
    const id = createRowId();
    setRows((prev) => [...prev, { id, text: '' }]);
    setFocusId(id);
    setError('');
  }

  function updateRow(id: string, text: string) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, text } : row)));
  }

  function removeRow(id: string) {
    setRows((prev) => {
      const next = prev.filter((row) => row.id !== id);
      return next.length > 0 ? next : [{ id: createRowId(), text: '' }];
    });
    setError('');
  }

  async function award() {
    const entries = filledRows(rows);
    if (entries.length < 2 || awarding) return;
    if (!activity.criteria.trim()) {
      setError('Add how the AI should award the winner in the editor.');
      return;
    }
    const sentSignature = contestSignature(rows);
    setAwarding(true);
    setError('');
    try {
      const response = await fetch('/api/sentence-contest/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: activity.prompt,
          criteria: activity.criteria,
          grammar_target: activity.grammarTarget,
          sentences: entries.map((row) => row.text.trim()),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not award a winner');
      }
      const winnerIndex = Number(data.winnerIndex);
      const reason = String(data.reason ?? '').trim();
      const winnerRow = entries[winnerIndex];
      if (!winnerRow || !reason) {
        throw new Error('The AI did not pick a sentence. Try again.');
      }
      setResult({ signature: sentSignature, rowId: winnerRow.id, reason });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not award a winner');
    } finally {
      setAwarding(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-4 overflow-auto px-4 py-6 md:px-8">
      <h2 className="border-b-4 border-[var(--comic-black)] pb-2 font-bungee text-3xl leading-tight text-[var(--comic-secondary)] md:text-5xl">
        {sentenceContestName(activity)}
      </h2>
      <p
        className={[
          'font-bold leading-snug',
          present ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl',
          prompt ? '' : 'text-[var(--comic-dark)]/60',
        ].join(' ')}
      >
        {prompt || 'Add a prompt in the editor.'}
      </p>
      <div className="flex flex-col gap-3">
        {rows.map((row, index) => {
          const isWinner = winner?.rowId === row.id;
          return (
            <div key={row.id} className="flex w-full min-w-0 items-start gap-2">
              <span className="mt-2 w-8 shrink-0 text-center font-bungee text-2xl leading-none text-[var(--comic-secondary)]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                {isWinner ? (
                  <p className="mb-1 font-bungee text-sm uppercase text-[var(--comic-success)]">
                    Winner
                  </p>
                ) : null}
                <GrammarLiveTextBox
                  variant="row"
                  tone={isWinner ? 'winner' : 'default'}
                  value={row.text}
                  grammarTarget={activity.grammarTarget}
                  placeholder="Write a sentence…"
                  autoFocus={row.id === focusId}
                  onEnter={addRow}
                  onChange={(text) => updateRow(row.id, text)}
                  className="font-bold"
                  style={{ fontSize: `${fontSize}px`, lineHeight: 1.35 }}
                />
              </div>
              {rows.length > 1 ? (
                <button
                  type="button"
                  className="mt-1 shrink-0 border-4 border-[var(--comic-black)] bg-white px-3 py-1 font-black leading-none"
                  aria-label={`Remove sentence ${index + 1}`}
                  onClick={() => removeRow(row.id)}
                >
                  ×
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ComicButton
          type="button"
          variant="accent"
          size={present ? 'md' : 'sm'}
          disabled={!canAdd}
          onClick={addRow}
        >
          Add
        </ComicButton>
        {filled.length >= 2 ? (
          <ComicButton
            type="button"
            variant="warning"
            size={present ? 'md' : 'sm'}
            disabled={awarding}
            onClick={() => void award()}
          >
            {awarding ? 'Awarding…' : winner ? 'Award again' : 'Award a winner'}
          </ComicButton>
        ) : null}
      </div>
      {winner ? (
        <div className="border-4 border-[var(--comic-black)] bg-[var(--comic-yellow)] px-3 py-2">
          <p className={present ? 'text-xl font-bold md:text-2xl' : 'text-lg font-bold'}>
            {winner.reason}
          </p>
        </div>
      ) : null}
      {error ? <p className="text-sm font-bold text-[var(--comic-danger)]">{error}</p> : null}
    </div>
  );
}

export default function SentenceContestStage({
  activityId,
  activity: activityProp,
  onClose,
  overlay = false,
}: {
  activityId?: string;
  activity?: SentenceContestActivity;
  onClose?: () => void;
  overlay?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<SentenceContestActivity | null>(activityProp || null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!activityProp && Boolean(activityId));
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (activityProp) {
      setLoaded(activityProp);
      setLoading(false);
      setError('');
      return;
    }
    if (!activityId) {
      setLoading(false);
      setError('Sentence contest not found');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    void (async () => {
      try {
        const response = await fetch(`/api/sentence-contest/activities/${activityId}`, {
          cache: 'no-store',
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Failed to load sentence contest');
        if (!cancelled) setLoaded(data.activity as SentenceContestActivity);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load sentence contest');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activityId, activityProp]);

  useEffect(() => {
    if (!overlay) return;
    const update = () => setHost(overlayHost(rootRef.current));
    update();
    document.addEventListener('fullscreenchange', update);
    document.addEventListener('webkitfullscreenchange', update as EventListener);
    return () => {
      document.removeEventListener('fullscreenchange', update);
      document.removeEventListener('webkitfullscreenchange', update as EventListener);
    };
  }, [overlay]);

  const body = (
    <div
      ref={rootRef}
      className={[
        'sentence-contest-stage flex flex-col overflow-hidden bg-[var(--comic-light)] text-[var(--comic-dark)]',
        overlay || !activityProp ? 'fixed inset-0 z-[120]' : 'relative min-h-[70vh] w-full',
      ].join(' ')}
    >
      {onClose ? (
        <header className="flex shrink-0 items-center justify-end gap-2 border-b-4 border-[var(--comic-black)] bg-white px-3 py-2">
          <ComicButton type="button" variant="warning" size="sm" onClick={onClose}>
            Back
          </ComicButton>
        </header>
      ) : null}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <ComicText className="font-bold">Loading sentence contest…</ComicText>
        </div>
      ) : null}
      {error ? (
        <div className="flex flex-1 items-center justify-center px-6">
          <ComicText className="text-center font-bold text-[var(--comic-danger)]">{error}</ComicText>
        </div>
      ) : null}
      {!loading && !error && loaded ? (
        <SentenceContestPlay key={loaded.id} activity={loaded} present={overlay || !activityProp} />
      ) : null}
    </div>
  );

  if (!overlay) return body;
  if (!host) return null;
  return createPortal(body, host);
}
