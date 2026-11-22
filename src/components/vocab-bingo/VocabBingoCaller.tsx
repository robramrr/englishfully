'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import {
  bingoActivityTitle,
  bingoWordsReady,
  type BingoWord,
  type VocabBingoActivity,
} from '@/lib/vocab-bingo/types';

function currentFullscreenElement(): Element | null {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return document.fullscreenElement || doc.webkitFullscreenElement || null;
}

function overlayRoot(self: HTMLElement | null): HTMLElement {
  const fullscreen = currentFullscreenElement();
  if (fullscreen instanceof HTMLElement && fullscreen !== self) return fullscreen;
  return document.body;
}

function storageKey(id: string): string {
  return `englishfully.bingo.caller.${id}`;
}

interface CallerState {
  order: string[];
  called: string[];
}

function loadCallerState(activity: VocabBingoActivity): CallerState {
  const ready = bingoWordsReady(activity.words);
  const fallback = ready.map((word) => word.id);
  if (typeof window === 'undefined') return { order: fallback, called: [] };
  try {
    const raw = window.sessionStorage.getItem(storageKey(activity.id));
    if (!raw) return { order: fallback, called: [] };
    const parsed = JSON.parse(raw) as CallerState;
    const known = new Set(fallback);
    const order = (parsed.order || []).filter((id) => known.has(id));
    for (const id of fallback) {
      if (!order.includes(id)) order.push(id);
    }
    const called = (parsed.called || []).filter((id) => known.has(id));
    return { order, called };
  } catch {
    return { order: fallback, called: [] };
  }
}

export default function VocabBingoCaller({
  activityId,
  overlay = false,
  onClose,
}: {
  activityId: string;
  overlay?: boolean;
  onClose?: () => void;
}) {
  const [activity, setActivity] = useState<VocabBingoActivity | null>(null);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<string[]>([]);
  const [called, setCalled] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [hideAnswers, setHideAnswers] = useState(false);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [host, setHost] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError('');
    setActivity(null);
    void fetch(`/api/vocab-bingo/activities/${activityId}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Failed to load activity');
        return data.activity as VocabBingoActivity;
      })
      .then((loaded) => {
        if (cancelled) return;
        const state = loadCallerState(loaded);
        setActivity(loaded);
        setOrder(state.order);
        setCalled(state.called);
        setIndex(0);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load activity');
      });
    return () => {
      cancelled = true;
    };
  }, [activityId]);

  useEffect(() => {
    if (!activity) return;
    window.sessionStorage.setItem(
      storageKey(activity.id),
      JSON.stringify({ order, called })
    );
  }, [activity, order, called]);

  useEffect(() => {
    if (!overlay) return;
    const update = () => setRoot(overlayRoot(host));
    update();
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, [overlay, host]);

  const words = useMemo(() => {
    const byId = new Map((activity ? bingoWordsReady(activity.words) : []).map((word) => [word.id, word]));
    return order.map((id) => byId.get(id)).filter((word): word is BingoWord => Boolean(word));
  }, [activity, order]);

  const current = words[Math.min(index, Math.max(0, words.length - 1))] || null;
  const calledSet = useMemo(() => new Set(called), [called]);

  function toggleCalled(id: string) {
    setCalled((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function shuffle() {
    setOrder((prev) => {
      const next = prev.slice();
      for (let cursor = next.length - 1; cursor > 0; cursor -= 1) {
        const swap = Math.floor(Math.random() * (cursor + 1));
        const item = next[cursor];
        next[cursor] = next[swap];
        next[swap] = item;
      }
      return next;
    });
    setIndex(0);
  }

  function resetRound() {
    if (!activity) return;
    setCalled([]);
    setOrder(bingoWordsReady(activity.words).map((word) => word.id));
    setIndex(0);
  }

  const body = (
    <div
      ref={setHost}
      className={[
        'flex flex-col bg-[var(--comic-light)] text-[var(--comic-dark)]',
        overlay ? 'fixed inset-0 z-[120] overflow-auto' : 'min-h-[70vh]',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-[var(--comic-black)] bg-white px-4 py-3">
        <div>
          <ComicTitle level={3} className="text-[var(--comic-secondary)]">
            {activity ? bingoActivityTitle(activity) : 'Vocabulary Bingo'}
          </ComicTitle>
          <ComicText className="text-sm font-bold">
            Teacher sheet
            {activity ? ` · ${activity.level} · ${activity.topic || 'No topic'}` : ''}
            {words.length ? ` · ${called.length} of ${words.length} called` : ''}
          </ComicText>
        </div>
        <div className="flex flex-wrap gap-2">
          <ComicButton type="button" size="sm" variant={showAll ? 'warning' : 'secondary'} onClick={() => setShowAll((value) => !value)}>
            {showAll ? 'One at a time' : 'Show all'}
          </ComicButton>
          <ComicButton type="button" size="sm" variant={hideAnswers ? 'accent' : 'secondary'} onClick={() => setHideAnswers((value) => !value)}>
            {hideAnswers ? 'Show answers' : 'Hide answers'}
          </ComicButton>
          <ComicButton type="button" size="sm" variant="secondary" onClick={shuffle} disabled={words.length < 2}>
            Shuffle
          </ComicButton>
          <ComicButton type="button" size="sm" variant="accent" onClick={resetRound} disabled={!activity}>
            Reset round
          </ComicButton>
          {onClose ? (
            <ComicButton type="button" size="sm" variant="danger" onClick={onClose}>
              Close
            </ComicButton>
          ) : null}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6">
        {error ? <ComicText className="font-bold text-[var(--comic-danger)]">{error}</ComicText> : null}
        {!activity && !error ? <ComicText className="font-bold">Loading…</ComicText> : null}
        {activity && words.length === 0 ? (
          <ComicText className="font-bold">Add words and definitions before you call this activity.</ComicText>
        ) : null}

        {current && !showAll ? (
          <div className="space-y-4">
            <div className="border-4 border-[var(--comic-black)] bg-white p-6 comic-shadow-md">
              <ComicText className="text-sm font-black uppercase text-[var(--comic-secondary)]">
                Definition {index + 1} of {words.length}
              </ComicText>
              <p className="mt-3 font-bold leading-snug text-[var(--comic-dark)] text-2xl md:text-4xl">
                {current.definition}
              </p>
              {hideAnswers ? null : (
                <p className="mt-6 border-t-4 border-[var(--comic-black)] pt-4 font-bungee text-3xl text-[var(--comic-primary)] md:text-5xl">
                  {current.word}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <ComicButton type="button" size="sm" variant="secondary" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>
                Previous
              </ComicButton>
              <ComicButton type="button" size="sm" variant="primary" disabled={index >= words.length - 1} onClick={() => setIndex((value) => Math.min(words.length - 1, value + 1))}>
                Next
              </ComicButton>
              <ComicButton
                type="button"
                size="sm"
                variant={calledSet.has(current.id) ? 'success' : 'warning'}
                onClick={() => toggleCalled(current.id)}
              >
                {calledSet.has(current.id) ? 'Called' : 'Mark called'}
              </ComicButton>
            </div>
          </div>
        ) : null}

        {showAll && words.length > 0 ? (
          <div className="overflow-x-auto border-4 border-[var(--comic-black)] bg-white">
            <table className="w-full border-collapse text-left">
              <thead className="bg-[var(--comic-yellow)]">
                <tr>
                  <th className="border-b-4 border-[var(--comic-black)] px-3 py-2 font-black">#</th>
                  <th className="border-b-4 border-[var(--comic-black)] px-3 py-2 font-black">Definition</th>
                  {hideAnswers ? null : (
                    <th className="border-b-4 border-[var(--comic-black)] px-3 py-2 font-black">Word</th>
                  )}
                  <th className="border-b-4 border-[var(--comic-black)] px-3 py-2 font-black">Called</th>
                </tr>
              </thead>
              <tbody>
                {words.map((word, wordIndex) => (
                  <tr key={word.id} className={calledSet.has(word.id) ? 'bg-[var(--comic-light)]' : ''}>
                    <td className="border-t-2 border-[var(--comic-black)] px-3 py-3 font-black">{wordIndex + 1}</td>
                    <td className="border-t-2 border-[var(--comic-black)] px-3 py-3 font-bold">{word.definition}</td>
                    {hideAnswers ? null : (
                      <td className="border-t-2 border-[var(--comic-black)] px-3 py-3 font-black text-[var(--comic-primary)]">
                        {word.word}
                      </td>
                    )}
                    <td className="border-t-2 border-[var(--comic-black)] px-3 py-3">
                      <button
                        type="button"
                        className="border-4 border-[var(--comic-black)] bg-white px-3 py-1 text-sm font-black"
                        onClick={() => {
                          setIndex(wordIndex);
                          toggleCalled(word.id);
                        }}
                      >
                        {calledSet.has(word.id) ? 'Called' : 'Mark'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );

  if (!overlay) return body;
  if (!root) return <div ref={setHost} />;
  return createPortal(body, root);
}
