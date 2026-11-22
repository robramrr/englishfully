'use client';

import { useEffect, useMemo, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import {
  challengeActivityTitle,
  challengeCallWords,
  challengeColumns,
  challengeGridWords,
  normalizeChallengeActivity,
  shuffleChallengeIds,
  type DefinitionChallengeActivity,
} from '@/lib/definition-challenge/types';

function storageKey(id: string): string {
  return `englishfully.challenge.caller.${id}`;
}

export default function DefinitionChallengeCaller({ activityId }: { activityId: string }) {
  const [activity, setActivity] = useState<DefinitionChallengeActivity | null>(null);
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [checking, setChecking] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/definition-challenge/activities/${activityId}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Failed to load the challenge');
        return normalizeChallengeActivity(data.activity);
      })
      .then((loaded) => {
        if (cancelled) return;
        setActivity(loaded);
        try {
          const raw = JSON.parse(sessionStorage.getItem(storageKey(loaded.id)) || '[]') as unknown;
          const known = new Set(loaded.callWordIds);
          setReadIds(Array.isArray(raw) ? raw.map(String).filter((id) => known.has(id)) : []);
        } catch {
          setReadIds([]);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load the challenge');
      });
    return () => {
      cancelled = true;
    };
  }, [activityId]);

  useEffect(() => {
    if (!activity) return;
    sessionStorage.setItem(storageKey(activity.id), JSON.stringify(readIds));
  }, [activity, readIds]);

  const calls = useMemo(() => (activity ? challengeCallWords(activity) : []), [activity]);
  const grid = useMemo(() => (activity ? challengeGridWords(activity) : []), [activity]);
  const safeIndex = Math.min(index, Math.max(0, calls.length - 1));
  const current = calls[safeIndex];
  const callNumber = new Map(calls.map((word, position) => [word.id, position + 1]));

  function markRead(id: string, read: boolean) {
    setReadIds((currentIds) => {
      const next = currentIds.filter((item) => item !== id);
      return read ? [...next, id] : next;
    });
  }

  async function shuffle() {
    if (!activity) return;
    const next = normalizeChallengeActivity({
      ...activity,
      callWordIds: shuffleChallengeIds(activity.callWordIds),
    });
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/definition-challenge/activities/${activity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity: next }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not shuffle');
      setActivity(normalizeChallengeActivity(data.activity));
      setIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not shuffle');
    } finally {
      setSaving(false);
    }
  }

  if (error && !activity) {
    return <ComicText className="font-bold text-[var(--comic-danger)]">{error}</ComicText>;
  }
  if (!activity) return <ComicText className="font-bold">Loading the teacher sheet…</ComicText>;

  const title = challengeActivityTitle(activity);

  return (
    <div>
      <style jsx global>{`
        @media print {
          footer,
          nav,
          header,
          .challenge-live {
            display: none !important;
          }
          .challenge-teacher-sheet {
            border-width: 1px;
            color: black;
            background: white;
          }
        }
      `}</style>

      <div className="challenge-live space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <ComicButton type="button" variant={showAll ? 'secondary' : 'primary'} size="sm" onClick={() => setShowAll(false)}>
            One at a time
          </ComicButton>
          <ComicButton type="button" variant={showAll ? 'primary' : 'secondary'} size="sm" onClick={() => setShowAll(true)}>
            Show all
          </ComicButton>
          <ComicButton type="button" variant={checking ? 'primary' : 'secondary'} size="sm" onClick={() => setChecking((value) => !value)}>
            {checking ? 'Hide checker' : 'Check a grid'}
          </ComicButton>
          <ComicButton type="button" variant="secondary" size="sm" disabled={saving || calls.length < 2} onClick={() => void shuffle()}>
            {saving ? 'Shuffling…' : 'Shuffle'}
          </ComicButton>
          <ComicButton type="button" variant="primary" size="sm" onClick={() => window.print()}>
            Print teacher sheet
          </ComicButton>
        </div>
        {error ? <ComicText className="font-bold text-[var(--comic-danger)]">{error}</ComicText> : null}
        <ComicText className="font-bold text-[var(--comic-dark)]">
          {activity.level} · {grid.length} words on the student grid · {calls.length} definitions in this round
        </ComicText>

        {checking ? (
          <div className="border-4 border-[var(--comic-black)] bg-white p-4">
            <ComicTitle level={3}>Answer check</ComicTitle>
            <ComicText className="mt-2 font-bold text-[var(--comic-dark)]">
              A winning grid has these numbered words crossed out, and no others.
            </ComicText>
            <div
              className="mt-3 grid gap-1"
              style={{ gridTemplateColumns: `repeat(${challengeColumns(grid.length)}, minmax(0, 1fr))` }}
            >
              {grid.map((word) => {
                const number = callNumber.get(word.id);
                return (
                  <div
                    key={word.id}
                    className={`border-2 border-[var(--comic-black)] p-2 text-center font-black ${
                      number ? 'bg-[var(--comic-yellow)]' : 'bg-white text-[var(--brand-medium-gray)]'
                    }`}
                  >
                    {number ? <span className="mr-1">{number}.</span> : null}
                    {word.word}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {!showAll && current ? (
          <div className="border-4 border-[var(--comic-black)] bg-white p-6 text-center">
            <p className="font-black text-[var(--comic-secondary)]">
              Definition {safeIndex + 1} of {calls.length}
            </p>
            <p className="mt-4 text-2xl font-bold text-[var(--comic-dark)]">{current.definition}</p>
            <p className="mt-4 text-3xl font-black">{current.word}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <ComicButton type="button" variant="secondary" size="sm" disabled={safeIndex === 0} onClick={() => setIndex(safeIndex - 1)}>
                Previous
              </ComicButton>
              <ComicButton
                type="button"
                variant={readIds.includes(current.id) ? 'success' : 'primary'}
                size="sm"
                onClick={() => markRead(current.id, !readIds.includes(current.id))}
              >
                {readIds.includes(current.id) ? 'Read' : 'Mark as read'}
              </ComicButton>
              <ComicButton
                type="button"
                variant="secondary"
                size="sm"
                disabled={safeIndex >= calls.length - 1}
                onClick={() => setIndex(safeIndex + 1)}
              >
                Next
              </ComicButton>
            </div>
          </div>
        ) : null}
      </div>

      <article className="challenge-teacher-sheet mt-6 border-4 border-[var(--comic-black)] bg-white p-4">
        <p className="text-sm font-black uppercase tracking-wide">Teacher copy · {activity.level}</p>
        <h1 className="text-3xl font-black">{title}</h1>
        <p className="mt-2 text-sm font-bold">
          Read the definitions in this order. Do not say the word. A correct paper crosses out only these answers.
        </p>
        <ol className="mt-4 space-y-3">
          {calls.map((word, position) => (
            <li key={word.id} className="border-b border-black pb-2">
              <p className="font-black">
                {position + 1}. {word.definition}
              </p>
              <p className="font-bold">Answer: {word.word}</p>
              <button
                type="button"
                className="challenge-live mt-1 border-2 border-black px-2 text-sm font-black"
                onClick={() => markRead(word.id, !readIds.includes(word.id))}
              >
                {readIds.includes(word.id) ? 'Already read' : 'Mark as read'}
              </button>
            </li>
          ))}
        </ol>
        {calls.length === 0 ? (
          <p className="mt-4 font-bold">Choose the definitions for this round before you play.</p>
        ) : null}
        <div className="mt-6 space-y-2 text-base font-bold">
          <p>Winner: ______________________________</p>
          <p>Also correct: ______________________________</p>
        </div>
      </article>
    </div>
  );
}
