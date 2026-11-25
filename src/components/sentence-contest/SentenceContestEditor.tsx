'use client';

import { useEffect, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import SentenceContestStage from './SentenceContestStage';
import SentenceContestShare from './SentenceContestShare';
import {
  normalizeSentenceContest,
  type SentenceContestActivity,
} from '@/lib/sentence-contest/types';

export default function SentenceContestEditor({ activityId }: { activityId: string }) {
  const [activity, setActivity] = useState<SentenceContestActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
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
        if (!cancelled) setActivity(normalizeSentenceContest(data.activity));
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
  }, [activityId]);

  function update(patch: Partial<SentenceContestActivity>) {
    setActivity((prev) => (prev ? { ...prev, ...patch } : prev));
    setMessage('');
  }

  async function save() {
    if (!activity || saving) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/sentence-contest/activities/${activity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to save');
      setActivity(normalizeSentenceContest(data.activity));
      setMessage('Saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ComicCard>
        <ComicText className="font-bold">Loading sentence contest…</ComicText>
      </ComicCard>
    );
  }

  if (!activity) {
    return (
      <ComicCard>
        <ComicText className="font-bold text-[var(--comic-danger)]">
          {error || 'Sentence contest not found'}
        </ComicText>
      </ComicCard>
    );
  }

  return (
    <div className="space-y-6">
      <ComicCard className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ComicTitle level={3} className="text-[var(--comic-secondary)]">
            Sentence contest
          </ComicTitle>
          <div className="flex shrink-0 items-center gap-2">
            <ComicButton type="button" variant="secondary" size="sm" disabled={saving} onClick={() => void save()}>
              {saving ? 'Saving…' : 'Save'}
            </ComicButton>
            <ComicButton type="button" variant="primary" size="sm" onClick={() => setPlaying(true)}>
              Play
            </ComicButton>
            <SentenceContestShare activityId={activity.id} showLink />
          </div>
        </div>
        <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
          Students write sentences on the play screen. Target grammar is highlighted yellow.
          Award a winner once there are at least two sentences.
        </ComicText>
        {message ? (
          <ComicText className="font-bold text-[var(--comic-success)]">{message}</ComicText>
        ) : null}
        {error ? (
          <ComicText className="font-bold text-[var(--comic-danger)]">{error}</ComicText>
        ) : null}
        <label className="block space-y-1">
          <ComicText className="text-sm font-bold">Title</ComicText>
          <input
            className="comic-input w-full"
            value={activity.title}
            onChange={(event) => update({ title: event.target.value })}
            placeholder="Frequency adverbs"
          />
        </label>
        <label className="block space-y-1">
          <ComicText className="text-sm font-bold">Prompt</ComicText>
          <textarea
            className="comic-textarea w-full min-h-[90px]"
            value={activity.prompt}
            onChange={(event) => update({ prompt: event.target.value })}
            placeholder="Write a sentence using an adverb of frequency or certainty."
          />
        </label>
        <label className="block space-y-1">
          <ComicText className="text-sm font-bold">How the AI awards the winner</ComicText>
          <input
            className="comic-input w-full"
            value={activity.criteria}
            onChange={(event) => update({ criteria: event.target.value })}
            placeholder="the funniest sentence"
          />
        </label>
        <label className="block space-y-1">
          <ComicText className="text-sm font-bold">Target grammar</ComicText>
          <ComicText className="text-xs font-bold text-[var(--comic-dark)]">
            Highlighted yellow in each sentence.
          </ComicText>
          <input
            className="comic-input w-full"
            value={activity.grammarTarget}
            onChange={(event) => update({ grammarTarget: event.target.value })}
            placeholder="Adverbs of frequency or certainty"
          />
        </label>
      </ComicCard>
      {playing ? (
        <SentenceContestStage activity={activity} overlay onClose={() => setPlaying(false)} />
      ) : null}
    </div>
  );
}
