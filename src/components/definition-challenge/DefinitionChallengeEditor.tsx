'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import {
  CHALLENGE_GRID_PRESETS,
  CHALLENGE_LENGTH_PRESETS,
  CHALLENGE_LEVELS,
  MAX_CHALLENGE_BANK,
  MAX_CHALLENGE_GRID,
  MIN_CHALLENGE_GRID,
  challengeDefinitionWarning,
  clampChallengeGameLength,
  clampChallengeGridCount,
  createEmptyChallengeWord,
  normalizeChallengeActivity,
  parseChallengeWordList,
  pickChallengeCallIds,
  shuffleChallengeIds,
  type ChallengeWord,
  type DefinitionChallengeActivity,
} from '@/lib/definition-challenge/types';

async function requestDefinitions(
  activity: DefinitionChallengeActivity,
  words: string[],
  otherWords: string[]
): Promise<{ word: string; definition: string }[]> {
  const response = await fetch('/api/definition-challenge/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'definitions',
      topic: activity.topic,
      level: activity.level,
      words,
      otherWords,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Could not write the definition');
  return Array.isArray(data.definitions) ? data.definitions : [];
}

export default function DefinitionChallengeEditor({ activityId }: { activityId: string }) {
  const router = useRouter();
  const [activity, setActivity] = useState<DefinitionChallengeActivity | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [paste, setPaste] = useState('');
  const [single, setSingle] = useState('');
  const [suggestCount, setSuggestCount] = useState(8);
  const [pending, setPending] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const definedWord = useRef<Record<string, string>>({});

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
        for (const word of loaded.words) {
          if (word.definition.trim()) definedWord.current[word.id] = word.word.trim();
        }
        setActivity(loaded);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load the challenge');
      });
    return () => {
      cancelled = true;
    };
  }, [activityId]);

  function update(next: DefinitionChallengeActivity) {
    setActivity(normalizeChallengeActivity(next));
    setDirty(true);
    setNote('');
  }

  function addToGrid(current: DefinitionChallengeActivity, ids: string[]): DefinitionChallengeActivity {
    const grid = [...current.gridWordIds];
    for (const id of ids) {
      if (grid.length >= current.gridCount) break;
      if (!grid.includes(id)) grid.push(id);
    }
    return normalizeChallengeActivity({ ...current, words: current.words, gridWordIds: grid });
  }

  async function defineAdded(base: DefinitionChallengeActivity, added: ChallengeWord[]) {
    const ids = added.map((word) => word.id);
    setPending((current) => [...current, ...ids]);
    setError('');
    try {
      const definitions = await requestDefinitions(
        base,
        added.map((word) => word.word),
        base.words.filter((word) => !ids.includes(word.id)).map((word) => word.word)
      );
      setActivity((current) => {
        if (!current) return current;
        const byWord = new Map(definitions.map((item) => [item.word.toLowerCase(), item.definition]));
        for (const word of added) {
          if (byWord.has(word.word.toLowerCase())) definedWord.current[word.id] = word.word.trim();
        }
        return {
          ...current,
          words: current.words.map((word) => {
            if (!ids.includes(word.id) || word.definition.trim()) return word;
            const definition = byWord.get(word.word.toLowerCase());
            return definition ? { ...word, definition } : word;
          }),
        };
      });
      setDirty(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not write the definition');
    } finally {
      setPending((current) => current.filter((id) => !ids.includes(id)));
    }
  }

  function insertWords(incoming: string[], withDefinitions: ChallengeWord[] = []) {
    if (!activity) return;
    const known = new Set(activity.words.map((word) => word.word.toLowerCase()));
    const room = MAX_CHALLENGE_BANK - activity.words.length;
    if (room <= 0) {
      setError('The vocabulary list is full.');
      return;
    }
    const added: ChallengeWord[] = [];
    const skipped: string[] = [];
    let unused = 0;
    for (const word of incoming) {
      if (known.has(word.toLowerCase())) {
        skipped.push(word);
        continue;
      }
      if (added.length >= room) {
        unused += 1;
        continue;
      }
      known.add(word.toLowerCase());
      const ready = withDefinitions.find((item) => item.word.toLowerCase() === word.toLowerCase());
      added.push(ready ? { ...ready, word } : createEmptyChallengeWord({ word }));
    }
    if (added.length === 0) {
      setError(skipped.length ? 'Those words are already in the list.' : 'Add a word first.');
      return;
    }
    const next = addToGrid({ ...activity, words: [...activity.words, ...added] }, added.map((word) => word.id));
    for (const word of added) {
      if (word.definition.trim()) definedWord.current[word.id] = word.word.trim();
    }
    setActivity(next);
    setDirty(true);
    setNote(
      [
        skipped.length ? `Skipped duplicates: ${skipped.join(', ')}` : '',
        unused ? `${unused} more words did not fit in the list.` : '',
      ]
        .filter(Boolean)
        .join(' ')
    );
    const needsDefinition = added.filter((word) => !word.definition.trim());
    if (needsDefinition.length) void defineAdded(next, needsDefinition);
  }

  async function suggest() {
    if (!activity) return;
    if (activity.topic.trim().length < 2) {
      setError('Add a topic first.');
      return;
    }
    setPending((current) => [...current, 'suggest']);
    setError('');
    try {
      const response = await fetch('/api/definition-challenge/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'words',
          topic: activity.topic,
          level: activity.level,
          count: suggestCount,
          avoidWords: activity.words.map((word) => word.word),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not suggest words');
      const words = (Array.isArray(data.words) ? data.words : []) as ChallengeWord[];
      insertWords(
        words.map((word) => word.word),
        words
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not suggest words');
    } finally {
      setPending((current) => current.filter((id) => id !== 'suggest'));
    }
  }

  async function regenerate(word: ChallengeWord) {
    if (!activity || !word.word.trim()) return;
    setPending((current) => [...current, word.id]);
    setError('');
    try {
      const definitions = await requestDefinitions(
        activity,
        [word.word],
        activity.words.filter((item) => item.id !== word.id).map((item) => item.word)
      );
      const definition = definitions.find((item) => item.word.toLowerCase() === word.word.toLowerCase())?.definition;
      if (!definition) {
        delete definedWord.current[word.id];
        throw new Error('Could not write a definition that fits only this word.');
      }
      definedWord.current[word.id] = word.word.trim();
      setActivity((current) => {
        if (!current) return current;
        return {
          ...current,
          words: current.words.map((item) =>
            item.id === word.id && item.word === word.word ? { ...item, definition } : item
          ),
        };
      });
      setDirty(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not write the definition');
    } finally {
      setPending((current) => current.filter((id) => id !== word.id));
    }
  }

  function changeWord(word: ChallengeWord, nextWord: string) {
    if (!activity) return;
    const clean = nextWord.replace(/\s+/g, ' ').slice(0, 40);
    const duplicate = activity.words.some(
      (item) => item.id !== word.id && item.word.toLowerCase() === clean.trim().toLowerCase()
    );
    if (duplicate && clean.trim()) {
      setError(`“${clean.trim()}” is already in the list.`);
      return;
    }
    setError('');
    update({
      ...activity,
      words: activity.words.map((item) => (item.id === word.id ? { ...item, word: clean } : item)),
    });
  }

  async function save(): Promise<DefinitionChallengeActivity | null> {
    if (!activity) return null;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/definition-challenge/activities/${activity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not save');
      const saved = normalizeChallengeActivity(data.activity);
      setActivity(saved);
      setDirty(false);
      setNote('Saved.');
      return saved;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function openSaved(path: string) {
    const saved = await save();
    if (saved) router.push(path);
  }

  if (!activity && error) {
    return <ComicText className="font-bold text-[var(--comic-danger)]">{error}</ComicText>;
  }
  if (!activity) return <ComicText className="font-bold">Loading…</ComicText>;

  const onGrid = new Set(activity.gridWordIds);
  const called = new Set(activity.callWordIds);
  const gridFull = activity.gridWordIds.length >= activity.gridCount;

  return (
    <div className="space-y-6">
      <ComicCardBlock>
        <ComicTitle level={3} className="text-[var(--comic-primary)]">
          1. Topic and level
        </ComicTitle>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-bold">Topic</span>
            <input
              value={activity.topic}
              onChange={(event) => update({ ...activity, topic: event.target.value })}
              placeholder="Social media"
              className="comic-input w-full"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold">English level</span>
            <select
              value={activity.level}
              onChange={(event) => update({ ...activity, level: event.target.value as DefinitionChallengeActivity['level'] })}
              className="comic-input w-full"
            >
              {CHALLENGE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-3 block">
          <span className="mb-1 block text-sm font-bold">Title</span>
          <input
            value={activity.title}
            onChange={(event) => update({ ...activity, title: event.target.value })}
            placeholder="Uses the topic if you leave this blank"
            className="comic-input w-full"
          />
        </label>
      </ComicCardBlock>

      <ComicCardBlock>
        <ComicTitle level={3} className="text-[var(--comic-primary)]">
          2. Vocabulary
        </ComicTitle>
        <ComicText className="mt-2 font-bold text-[var(--comic-dark)]">
          Add words yourself, paste a list, or ask for suggestions. A new word gets its own definition. Existing definitions stay as they are.
        </ComicText>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <input
            value={single}
            onChange={(event) => setSingle(event.target.value)}
            placeholder="One word"
            className="comic-input min-w-[12rem] flex-1"
          />
          <ComicButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              insertWords(parseChallengeWordList(single));
              setSingle('');
            }}
          >
            Add word
          </ComicButton>
        </div>
        <textarea
          value={paste}
          onChange={(event) => setPaste(event.target.value)}
          rows={3}
          placeholder={'Paste words, one per line or separated by commas'}
          className="comic-input mt-3 w-full"
        />
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <ComicButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              insertWords(parseChallengeWordList(paste));
              setPaste('');
            }}
          >
            Add pasted words
          </ComicButton>
          <label className="text-sm font-bold">
            Suggest
            <input
              type="number"
              min={1}
              max={20}
              value={suggestCount}
              onChange={(event) => setSuggestCount(Math.max(1, Math.min(20, Number(event.target.value) || 1)))}
              className="comic-input ml-2 w-16 text-center"
            />
          </label>
          <ComicButton type="button" variant="primary" size="sm" disabled={pending.includes('suggest')} onClick={() => void suggest()}>
            {pending.includes('suggest') ? 'Suggesting…' : 'Suggest words'}
          </ComicButton>
        </div>
        <div className="mt-4 space-y-3">
          {activity.words.map((word) => {
            const others = activity.words.filter((item) => item.id !== word.id).map((item) => item.word);
            const warning = challengeDefinitionWarning(word.definition, word.word, others);
            return (
              <div key={word.id} className="space-y-2 border-2 border-[var(--comic-black)] p-3">
                <div className="grid gap-2 md:grid-cols-[14rem_1fr_auto]">
                  <input
                    value={word.word}
                    aria-label={`Word ${word.word || 'blank'}`}
                    onChange={(event) => changeWord(word, event.target.value)}
                    onBlur={() => {
                      const text = word.word.trim();
                      if (!text) return;
                      if (definedWord.current[word.id] === text && word.definition.trim()) return;
                      definedWord.current[word.id] = text;
                      void regenerate(word);
                    }}
                    className="comic-input w-full"
                  />
                  <textarea
                    value={word.definition}
                    aria-label={`Definition for ${word.word || 'word'}`}
                    rows={2}
                    onChange={(event) =>
                      update({
                        ...activity,
                        words: activity.words.map((item) =>
                          item.id === word.id ? { ...item, definition: event.target.value } : item
                        ),
                      })
                    }
                    placeholder={pending.includes(word.id) ? 'Writing a definition…' : 'Definition the teacher reads aloud'}
                    className="comic-input w-full"
                  />
                  <div className="flex flex-col gap-2">
                    <ComicButton type="button" variant="secondary" size="sm" disabled={pending.includes(word.id)} onClick={() => void regenerate(word)}>
                      New definition
                    </ComicButton>
                    <button
                      type="button"
                      className="border-2 border-[var(--comic-black)] px-2 py-1 text-sm font-black"
                      onClick={() => update({ ...activity, words: activity.words.filter((item) => item.id !== word.id) })}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {warning ? <p className="text-sm font-bold text-[var(--comic-danger)]">{warning}</p> : null}
                <div className="flex flex-wrap gap-4 text-sm font-bold">
                  <label>
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={onGrid.has(word.id)}
                      onChange={(event) => {
                        if (event.target.checked && gridFull) {
                          setError('The grid is full. Raise the word count or take another word off.');
                          return;
                        }
                        const gridWordIds = event.target.checked
                          ? [...activity.gridWordIds, word.id]
                          : activity.gridWordIds.filter((id) => id !== word.id);
                        update({ ...activity, gridWordIds });
                      }}
                    />
                    On the student grid
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={called.has(word.id)}
                      disabled={!onGrid.has(word.id)}
                      onChange={(event) => {
                        if (event.target.checked && activity.callWordIds.length >= activity.gameLength) {
                          setError('This round is full. Raise the number of definitions or take one out.');
                          return;
                        }
                        const callWordIds = event.target.checked
                          ? [...activity.callWordIds, word.id]
                          : activity.callWordIds.filter((id) => id !== word.id);
                        update({ ...activity, callWordIds });
                      }}
                    />
                    Read this definition
                  </label>
                </div>
              </div>
            );
          })}
          {activity.words.length === 0 ? (
            <ComicText className="font-bold text-[var(--comic-dark)]">No words yet.</ComicText>
          ) : null}
        </div>
      </ComicCardBlock>

      <ComicCardBlock>
        <ComicTitle level={3} className="text-[var(--comic-primary)]">
          3. Student grid and game length
        </ComicTitle>
        <ComicText className="mt-2 font-bold text-[var(--comic-dark)]">
          {activity.gridWordIds.length} of {activity.gridCount} words on the shared grid. {activity.callWordIds.length} of {activity.gameLength} definitions will be read. Words left off the round stay on the sheet as distractors.
        </ComicText>
        <div className="mt-3 flex flex-wrap gap-2">
          {CHALLENGE_GRID_PRESETS.map((count) => (
            <ComicButton
              key={count}
              type="button"
              size="sm"
              variant={activity.gridCount === count ? 'primary' : 'secondary'}
              onClick={() => update({ ...activity, gridCount: count })}
            >
              {count} words
            </ComicButton>
          ))}
          <label className="text-sm font-bold">
            Custom
            <input
              type="number"
              min={MIN_CHALLENGE_GRID}
              max={MAX_CHALLENGE_GRID}
              value={activity.gridCount}
              onChange={(event) => update({ ...activity, gridCount: clampChallengeGridCount(event.target.value) })}
              className="comic-input ml-2 w-20 text-center"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {CHALLENGE_LENGTH_PRESETS.map((count) => (
            <ComicButton
              key={count}
              type="button"
              size="sm"
              variant={activity.gameLength === count ? 'primary' : 'secondary'}
              disabled={count > activity.gridWordIds.length}
              onClick={() => update({ ...activity, gameLength: count })}
            >
              {count} definitions
            </ComicButton>
          ))}
          <label className="text-sm font-bold">
            Custom
            <input
              type="number"
              min={1}
              max={Math.max(1, activity.gridWordIds.length)}
              value={activity.gameLength}
              onChange={(event) =>
                update({
                  ...activity,
                  gameLength: clampChallengeGameLength(event.target.value, activity.gridWordIds.length),
                })
              }
              className="comic-input ml-2 w-20 text-center"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <ComicButton
            type="button"
            variant="secondary"
            size="sm"
            disabled={activity.gridWordIds.length === 0}
            onClick={() =>
              update({
                ...activity,
                callWordIds: pickChallengeCallIds(activity.gridWordIds, activity.gameLength),
              })
            }
          >
            Pick at random
          </ComicButton>
          <ComicButton
            type="button"
            variant="secondary"
            size="sm"
            disabled={activity.callWordIds.length < 2}
            onClick={() => update({ ...activity, callWordIds: shuffleChallengeIds(activity.callWordIds) })}
          >
            Shuffle order
          </ComicButton>
        </div>
      </ComicCardBlock>

      {error ? <ComicText className="font-bold text-[var(--comic-danger)]">{error}</ComicText> : null}
      {note ? <ComicText className="font-bold text-[var(--comic-success)]">{note}</ComicText> : null}
      <div className="flex flex-wrap gap-2">
        <ComicButton type="button" variant="primary" size="md" disabled={saving} onClick={() => void save()}>
          {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
        </ComicButton>
        <ComicButton type="button" variant="success" size="md" disabled={saving} onClick={() => void openSaved(`/teacher-resources/vocab-bingo/definition-challenge/${activity.id}/call`)}>
          Teacher sheet
        </ComicButton>
        <ComicButton type="button" variant="secondary" size="md" disabled={saving} onClick={() => void openSaved(`/teacher-resources/vocab-bingo/definition-challenge/${activity.id}/print`)}>
          Print student sheets
        </ComicButton>
      </div>
    </div>
  );
}

function ComicCardBlock({ children }: { children: ReactNode }) {
  return <div className="space-y-2 border-4 border-[var(--comic-black)] bg-white p-4">{children}</div>;
}
