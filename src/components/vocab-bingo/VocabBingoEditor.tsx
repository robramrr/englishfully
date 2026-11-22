'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import {
  BINGO_DEFINITION_STYLES,
  BINGO_GRID_SIZES,
  BINGO_LEVELS,
  bingoCellCount,
  clampBingoWordCount,
  createEmptyBingoDistractor,
  createEmptyBingoWord,
  definitionLeaksAnswer,
  distractorsNeeded,
  normalizeBingoActivity,
  type BingoWord,
  type VocabBingoActivity,
} from '@/lib/vocab-bingo/types';

export default function VocabBingoEditor({ activityId }: { activityId: string }) {
  const [activity, setActivity] = useState<VocabBingoActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/vocab-bingo/activities/${activityId}`, {
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load activity');
      setActivity(normalizeBingoActivity(data.activity));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    void load();
  }, [load]);

  function patch(next: Partial<VocabBingoActivity>) {
    setActivity((current) => (current ? { ...current, ...next } : current));
  }

  function updateWord(id: string, next: Partial<BingoWord>) {
    if (!activity) return;
    patch({
      words: activity.words.map((word) => (word.id === id ? { ...word, ...next } : word)),
    });
  }

  async function save(next = activity) {
    if (!next) return null;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/vocab-bingo/activities/${activityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity: normalizeBingoActivity({ ...next, id: activityId }) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save');
      const saved = normalizeBingoActivity(data.activity);
      setActivity(saved);
      setMessage('Saved.');
      return saved;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function generateAll() {
    if (!activity) return;
    if (!activity.topic.trim()) {
      setError('Add a topic first.');
      return;
    }
    if (
      activity.words.length > 0 &&
      !window.confirm('Replace the current words and filler words?')
    ) {
      return;
    }
    setGenerating('activity');
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/vocab-bingo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'activity',
          topic: activity.topic,
          level: activity.level,
          wordCount: activity.wordCount,
          gridSize: activity.gridSize,
          definitionStyle: activity.definitionStyle,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate');
      const next = {
        ...activity,
        words: data.words || [],
        distractors: data.distractors || [],
      };
      setActivity(next);
      await save(next);
      setMessage('Words and definitions are ready. Read them, then edit anything that does not sound right.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setGenerating('');
    }
  }

  async function regenerateWord(wordId: string) {
    if (!activity) return;
    setGenerating(wordId);
    setError('');
    try {
      const response = await fetch('/api/vocab-bingo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'word',
          topic: activity.topic,
          level: activity.level,
          definitionStyle: activity.definitionStyle,
          avoidWords: activity.words.map((word) => word.word),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to replace the word');
      updateWord(wordId, { word: data.word.word, definition: data.word.definition });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to replace the word');
    } finally {
      setGenerating('');
    }
  }

  async function regenerateDefinition(word: BingoWord) {
    if (!activity) return;
    setGenerating(`def-${word.id}`);
    setError('');
    try {
      const response = await fetch('/api/vocab-bingo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'definition',
          topic: activity.topic,
          level: activity.level,
          definitionStyle: activity.definitionStyle,
          word: word.word,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to rewrite the definition');
      updateWord(word.id, { definition: data.definition });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rewrite the definition');
    } finally {
      setGenerating('');
    }
  }

  async function fillDistractors() {
    if (!activity) return;
    const count = distractorsNeeded(activity);
    if (count === 0) return;
    setGenerating('distractors');
    setError('');
    try {
      const response = await fetch('/api/vocab-bingo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'distractors',
          topic: activity.topic,
          words: [
            ...activity.words.map((word) => word.word),
            ...activity.distractors.map((item) => item.word),
          ],
          count,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add filler words');
      patch({ distractors: [...activity.distractors, ...(data.distractors || [])] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add filler words');
    } finally {
      setGenerating('');
    }
  }

  if (loading) {
    return <ComicText className="font-bold">Loading…</ComicText>;
  }
  if (!activity) {
    return <ComicText className="font-bold text-[var(--comic-danger)]">{error || 'Activity not found'}</ComicText>;
  }

  const cells = bingoCellCount(activity.gridSize);
  const fillersNeeded = Math.max(0, cells - activity.words.filter((word) => word.word.trim()).length - activity.distractors.filter((item) => item.word.trim()).length);

  return (
    <div className="space-y-6">
      <ComicCard className="comic-shadow-xl space-y-4">
        <ComicTitle level={3} className="text-[var(--comic-primary)]">
          Vocabulary Bingo
        </ComicTitle>
        <ComicText className="font-bold text-[var(--comic-dark)]">
          Students hear a definition and cross out the word. You never say the word. Generate the
          list, edit it, print a different card for each student, then call the definitions.
        </ComicText>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <ComicText className="text-sm font-black">Title</ComicText>
            <input
              className="comic-input w-full"
              value={activity.title}
              placeholder="Social media bingo"
              onChange={(event) => patch({ title: event.target.value })}
            />
          </label>
          <label className="space-y-1">
            <ComicText className="text-sm font-black">Topic</ComicText>
            <input
              className="comic-input w-full"
              value={activity.topic}
              placeholder="Social media, food, travel…"
              onChange={(event) => patch({ topic: event.target.value })}
            />
          </label>
          <label className="space-y-1">
            <ComicText className="text-sm font-black">English level</ComicText>
            <select
              className="comic-input w-full font-bold"
              value={activity.level}
              onChange={(event) => patch({ level: event.target.value as VocabBingoActivity['level'] })}
            >
              {BINGO_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <ComicText className="text-sm font-black">Definition style</ComicText>
            <select
              className="comic-input w-full font-bold"
              value={activity.definitionStyle}
              onChange={(event) =>
                patch({ definitionStyle: event.target.value as VocabBingoActivity['definitionStyle'] })
              }
            >
              {BINGO_DEFINITION_STYLES.map((style) => (
                <option key={style} value={style}>
                  {style === 'simple' ? 'Simple' : style === 'challenging' ? 'Challenging' : 'Standard'}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <ComicText className="text-sm font-black">Target words</ComicText>
            <input
              type="number"
              min={4}
              max={cells}
              className="comic-input w-full font-bold"
              value={activity.wordCount}
              onChange={(event) =>
                patch({ wordCount: clampBingoWordCount(event.target.value, activity.gridSize) })
              }
            />
          </label>
          <label className="space-y-1">
            <ComicText className="text-sm font-black">Grid size</ComicText>
            <select
              className="comic-input w-full font-bold"
              value={activity.gridSize}
              onChange={(event) => {
                const gridSize = Number(event.target.value) === 5 ? 5 : 4;
                patch({
                  gridSize,
                  wordCount: clampBingoWordCount(activity.wordCount, gridSize),
                });
              }}
            >
              {BINGO_GRID_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}×{size}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <ComicButton type="button" variant="primary" size="sm" disabled={Boolean(generating) || saving} onClick={() => void generateAll()}>
            {generating === 'activity' ? 'Generating…' : 'Generate with AI'}
          </ComicButton>
          <ComicButton type="button" variant="secondary" size="sm" disabled={saving} onClick={() => void save()}>
            {saving ? 'Saving…' : 'Save'}
          </ComicButton>
          <Link href={`/teacher-resources/vocab-bingo/${activity.id}/call`}>
            <ComicButton variant="success" size="sm">
              Teacher sheet
            </ComicButton>
          </Link>
          <Link href={`/teacher-resources/vocab-bingo/${activity.id}/grids`}>
            <ComicButton variant="accent" size="sm">
              Student grids
            </ComicButton>
          </Link>
        </div>
        {message ? <ComicText className="font-bold text-[var(--comic-success)]">{message}</ComicText> : null}
        {error ? <ComicText className="font-bold text-[var(--comic-danger)]">{error}</ComicText> : null}
      </ComicCard>

      <ComicCard className="comic-shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ComicTitle level={3} className="text-[var(--comic-secondary)]">
            Words you will call
          </ComicTitle>
          <ComicButton
            type="button"
            size="sm"
            variant="secondary"
            disabled={activity.words.length >= cells}
            onClick={() => patch({ words: [...activity.words, createEmptyBingoWord()] })}
          >
            + Add word
          </ComicButton>
        </div>
        <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
          Every student card includes these words. A definition should not contain the answer.
          Replace one word or one definition without starting over.
        </ComicText>
        {activity.words.length === 0 ? (
          <ComicText className="font-bold">No words yet. Generate a set, or add a word.</ComicText>
        ) : (
          <div className="space-y-3">
            {activity.words.map((word, index) => {
              const leaks = Boolean(word.word.trim() && word.definition.trim() && definitionLeaksAnswer(word.definition, word.word));
              return (
                <div key={word.id} className="space-y-2 border-4 border-[var(--comic-black)] bg-white p-3">
                  <div className="grid gap-2 md:grid-cols-[8rem_1fr]">
                    <label className="space-y-1">
                      <ComicText className="text-xs font-black">{index + 1}. Word</ComicText>
                      <input
                        className="comic-input w-full"
                        value={word.word}
                        onChange={(event) => updateWord(word.id, { word: event.target.value })}
                      />
                    </label>
                    <label className="space-y-1">
                      <ComicText className="text-xs font-black">Definition you read aloud</ComicText>
                      <textarea
                        className="comic-textarea w-full min-h-[4.5rem]"
                        value={word.definition}
                        onChange={(event) => updateWord(word.id, { definition: event.target.value })}
                      />
                    </label>
                  </div>
                  {leaks ? (
                    <ComicText className="text-sm font-bold text-[var(--comic-danger)]">
                      This definition includes the answer. Rewrite it before you read it to the class.
                    </ComicText>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <ComicButton type="button" size="sm" variant="secondary" disabled={Boolean(generating)} onClick={() => void regenerateWord(word.id)}>
                      {generating === word.id ? 'Replacing…' : 'New word'}
                    </ComicButton>
                    <ComicButton type="button" size="sm" variant="secondary" disabled={Boolean(generating) || !word.word.trim()} onClick={() => void regenerateDefinition(word)}>
                      {generating === `def-${word.id}` ? 'Rewriting…' : 'New definition'}
                    </ComicButton>
                    <ComicButton
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => patch({ words: activity.words.filter((item) => item.id !== word.id) })}
                    >
                      Remove
                    </ComicButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ComicCard>

      <ComicCard className="comic-shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <ComicTitle level={3} className="text-[var(--comic-secondary)]">
              Extra words on the card
            </ComicTitle>
            <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
              These fill the empty squares. They are not called.
              {fillersNeeded > 0 ? ` This grid still needs ${fillersNeeded} more.` : ' The grid is full.'}
            </ComicText>
          </div>
          <div className="flex flex-wrap gap-2">
            <ComicButton type="button" size="sm" variant="secondary" disabled={Boolean(generating) || fillersNeeded === 0} onClick={() => void fillDistractors()}>
              {generating === 'distractors' ? 'Adding…' : 'Generate fillers'}
            </ComicButton>
            <ComicButton
              type="button"
              size="sm"
              variant="accent"
              onClick={() => patch({ distractors: [...activity.distractors, createEmptyBingoDistractor()] })}
            >
              + Add word
            </ComicButton>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {activity.distractors.map((item) => (
            <div key={item.id} className="flex gap-2">
              <input
                className="comic-input min-w-0 flex-1"
                value={item.word}
                onChange={(event) =>
                  patch({
                    distractors: activity.distractors.map((entry) =>
                      entry.id === item.id ? { ...entry, word: event.target.value } : entry
                    ),
                  })
                }
              />
              <ComicButton
                type="button"
                size="sm"
                variant="danger"
                onClick={() =>
                  patch({ distractors: activity.distractors.filter((entry) => entry.id !== item.id) })
                }
              >
                ×
              </ComicButton>
            </div>
          ))}
        </div>
      </ComicCard>
    </div>
  );
}
