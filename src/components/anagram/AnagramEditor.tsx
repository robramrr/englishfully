'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import AnagramStage from './AnagramStage';
import { generateQrDataUrl, getAnagramActivityUrl } from '@/lib/anagram/qr';
import {
  MAX_AI_ANAGRAM_WORDS,
  MAX_ANAGRAM_WORDS,
  MIN_ANAGRAM_LETTERS,
  VOCAB_LEVELS,
  anagramWordsReady,
  createEmptyAnagramWord,
  httpUrl,
  normalizeAnagramActivity,
  parseAnagramWordList,
  puzzleWord,
  type AnagramActivity,
  type AnagramAudioMode,
  type AnagramLevel,
  type AnagramWord,
} from '@/lib/anagram/types';

function signature(activity: AnagramActivity): string {
  const { updatedAt: _updatedAt, ...rest } = activity;
  return JSON.stringify(rest);
}

function mergeGenerated(
  existing: AnagramWord[],
  created: { word: string; clue: string }[],
  replace: boolean
): AnagramWord[] {
  const incoming = created.map((item) =>
    createEmptyAnagramWord({ word: puzzleWord(item.word), clue: item.clue })
  );
  if (replace) return incoming.slice(0, MAX_ANAGRAM_WORDS);
  const next = existing.map((item) => ({ ...item }));
  for (const item of incoming) {
    const key = puzzleWord(item.word);
    if (key.length < MIN_ANAGRAM_LETTERS) continue;
    const found = next.find((row) => puzzleWord(row.word) === key);
    if (!found) {
      next.push(item);
      continue;
    }
    if (!found.clue.trim() && item.clue.trim()) found.clue = item.clue;
  }
  return next.slice(0, MAX_ANAGRAM_WORDS);
}

function WordRow({
  item,
  index,
  total,
  clueBusy,
  onChange,
  onMove,
  onDuplicate,
  onRemove,
  onWriteClue,
}: {
  item: AnagramWord;
  index: number;
  total: number;
  clueBusy: boolean;
  onChange: (patch: Partial<AnagramWord>) => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onWriteClue: () => void;
}) {
  const letters = puzzleWord(item.word);
  const picture = httpUrl(item.imageUrl);
  return (
    <div className="grid grid-cols-[2.5rem_minmax(8rem,0.9fr)_minmax(12rem,1.4fr)_minmax(10rem,1fr)_minmax(10rem,1fr)_8.5rem] items-start gap-2 border-4 border-[var(--comic-black)] bg-white p-2">
      <ComicText className="pt-2 text-center text-sm font-black">{index + 1}</ComicText>
      <label className="block space-y-1">
        <span className="sr-only">Word</span>
        <input
          className="comic-input w-full"
          value={item.word}
          onChange={(event) => onChange({ word: event.target.value })}
          placeholder="school"
          aria-label={`Word ${index + 1}`}
        />
        <span className="block text-xs font-bold text-[var(--comic-dark)]">
          {letters.length < MIN_ANAGRAM_LETTERS
            ? 'At least 2 letters'
            : letters !== item.word.trim().toLowerCase()
              ? `Plays as ${letters}`
              : `${letters.length} letters`}
        </span>
      </label>
      <div className="space-y-1">
        <input
          className="comic-input w-full"
          value={item.clue}
          onChange={(event) => onChange({ clue: event.target.value })}
          placeholder="a place where students learn"
          aria-label={`Clue ${index + 1}`}
        />
        <button
          type="button"
          className="text-xs font-black text-[var(--comic-secondary)] underline-offset-2 hover:underline disabled:opacity-40"
          disabled={clueBusy || letters.length < MIN_ANAGRAM_LETTERS}
          onClick={onWriteClue}
        >
          {clueBusy ? 'Writing…' : 'AI clue'}
        </button>
      </div>
      <div className="space-y-1">
        <select
          className="comic-input w-full text-sm font-bold"
          value={item.audioMode}
          aria-label={`Audio ${index + 1}`}
          onChange={(event) => onChange({ audioMode: event.target.value as AnagramAudioMode })}
        >
          <option value="none">No audio</option>
          <option value="tts">Speak the word</option>
          <option value="url">Audio link</option>
        </select>
        {item.audioMode === 'url' ? (
          <input
            className="comic-input w-full text-sm"
            value={item.audioUrl}
            onChange={(event) => onChange({ audioUrl: event.target.value.trim() })}
            placeholder="https://…"
            aria-label={`Audio link ${index + 1}`}
          />
        ) : null}
      </div>
      <label className="block space-y-1">
        <span className="sr-only">Image</span>
        <input
          className="comic-input w-full text-sm"
          value={item.imageUrl}
          onChange={(event) => onChange({ imageUrl: event.target.value.trim() })}
          placeholder="https://…"
          aria-label={`Image URL ${index + 1}`}
        />
        {picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={picture} alt="" className="h-12 w-12 object-contain" />
        ) : null}
      </label>
      <div className="flex flex-col gap-1 pt-1">
        <button
          type="button"
          className="text-left text-sm font-bold text-[var(--comic-secondary)] underline-offset-2 hover:underline disabled:opacity-40"
          disabled={index === 0}
          onClick={() => onMove(-1)}
        >
          Up
        </button>
        <button
          type="button"
          className="text-left text-sm font-bold text-[var(--comic-secondary)] underline-offset-2 hover:underline disabled:opacity-40"
          disabled={index >= total - 1}
          onClick={() => onMove(1)}
        >
          Down
        </button>
        <button
          type="button"
          className="text-left text-sm font-bold text-[var(--comic-primary)] underline-offset-2 hover:underline"
          onClick={onDuplicate}
        >
          Duplicate
        </button>
        <button
          type="button"
          className="text-left text-sm font-bold text-[var(--comic-danger)] underline-offset-2 hover:underline"
          onClick={onRemove}
        >
          Trash
        </button>
      </div>
    </div>
  );
}

export default function AnagramEditor({ activityId }: { activityId: string }) {
  const [activity, setActivity] = useState<AnagramActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [mode, setMode] = useState<'topic' | 'words'>('topic');
  const [wordText, setWordText] = useState('');
  const [manualText, setManualText] = useState('');
  const [count, setCount] = useState(8);
  const [notes, setNotes] = useState('');
  const [replaceWords, setReplaceWords] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [clueBusyId, setClueBusyId] = useState('');
  const [fillingClues, setFillingClues] = useState(false);
  const [practicing, setPracticing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [copied, setCopied] = useState(false);
  const activityRef = useRef<AnagramActivity | null>(null);
  const savedSignature = useRef('');
  const ready = useRef(false);

  useEffect(() => {
    activityRef.current = activity;
  }, [activity]);

  useEffect(() => {
    if (!activityId) {
      setShareUrl('');
      setQrCode('');
      return;
    }
    const url = getAnagramActivityUrl(activityId, window.location.origin);
    setShareUrl(url);
    let cancelled = false;
    void generateQrDataUrl(url)
      .then((dataUrl) => {
        if (!cancelled) setQrCode(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrCode('');
      });
    return () => {
      cancelled = true;
    };
  }, [activityId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/anagram/activities/${activityId}`, { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Activity not found');
        const loaded = normalizeAnagramActivity(data.activity);
        if (cancelled) return;
        savedSignature.current = signature(loaded);
        ready.current = true;
        setActivity(loaded);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load activity');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activityId]);

  async function persist(next: AnagramActivity): Promise<boolean> {
    const current = signature(next);
    if (current === savedSignature.current) return true;
    setSaveState('saving');
    try {
      const response = await fetch(`/api/anagram/activities/${next.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save');
      const saved = normalizeAnagramActivity(data.activity);
      if (signature(activityRef.current || next) === current) {
        savedSignature.current = signature(saved);
        setActivity((prev) => (prev && signature(prev) === current ? saved : prev));
      } else {
        savedSignature.current = current;
      }
      setSaveState('saved');
      return true;
    } catch (err) {
      setSaveState('error');
      setError(err instanceof Error ? err.message : 'Failed to save');
      return false;
    }
  }

  useEffect(() => {
    if (!activity || !ready.current) return;
    const handle = window.setTimeout(() => {
      void persist(activity);
    }, 700);
    return () => window.clearTimeout(handle);
    // persist follows the activity, same as the flashcard editor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity]);

  function updateWord(wordId: string, patch: Partial<AnagramWord>) {
    setActivity((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        words: prev.words.map((item) => (item.id === wordId ? { ...item, ...patch } : item)),
      };
    });
  }

  function moveWord(index: number, direction: -1 | 1) {
    setActivity((prev) => {
      if (!prev) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.words.length) return prev;
      const words = [...prev.words];
      const [item] = words.splice(index, 1);
      words.splice(nextIndex, 0, item);
      return { ...prev, words };
    });
  }

  function duplicateWord(index: number) {
    setActivity((prev) => {
      if (!prev || prev.words.length >= MAX_ANAGRAM_WORDS) return prev;
      const source = prev.words[index];
      if (!source) return prev;
      const copy = createEmptyAnagramWord({
        word: source.word,
        clue: source.clue,
        audioMode: source.audioMode,
        audioUrl: source.audioUrl,
        imageUrl: source.imageUrl,
      });
      const words = [...prev.words];
      words.splice(index + 1, 0, copy);
      return { ...prev, words };
    });
  }

  function removeWord(index: number) {
    setActivity((prev) => {
      if (!prev) return prev;
      return { ...prev, words: prev.words.filter((_, itemIndex) => itemIndex !== index) };
    });
  }

  function addBlankWord() {
    setActivity((prev) => {
      if (!prev || prev.words.length >= MAX_ANAGRAM_WORDS) return prev;
      return { ...prev, words: [...prev.words, createEmptyAnagramWord()] };
    });
  }

  function addManualWords() {
    const parsed = parseAnagramWordList(manualText);
    if (parsed.length === 0) {
      setError('Add at least one word, one per line or separated by commas.');
      return;
    }
    setError('');
    setActivity((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        words: mergeGenerated(
          prev.words,
          parsed.map((word) => ({ word, clue: '' })),
          false
        ),
      };
    });
    setManualText('');
  }

  async function requestWords(body: Record<string, unknown>) {
    const response = await fetch('/api/anagram/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create words');
    const raw: unknown[] = Array.isArray(data.words) ? data.words : [];
    return raw
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const record = item as { word?: unknown; clue?: unknown };
        const word = puzzleWord(String(record.word ?? ''));
        if (word.length < MIN_ANAGRAM_LETTERS) return null;
        return { word, clue: String(record.clue ?? '').trim() };
      })
      .filter((item): item is { word: string; clue: string } => Boolean(item));
  }

  async function handleGenerate() {
    if (!activity) return;
    const words = parseAnagramWordList(wordText).slice(0, MAX_AI_ANAGRAM_WORDS);
    if (mode === 'topic' && !activity.topic.trim()) {
      setError('Type a topic, like “classroom objects” or “food”.');
      return;
    }
    if (mode === 'words' && words.length === 0) {
      setError('Add at least one word.');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const created = await requestWords({
        topic: activity.topic,
        words: mode === 'words' ? words : [],
        count,
        level: activity.level,
        notes,
      });
      if (created.length === 0) throw new Error('AI did not return any words');
      setActivity((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          words: mergeGenerated(prev.words, created, replaceWords),
        };
      });
      if (mode === 'words') setWordText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create words');
    } finally {
      setGenerating(false);
    }
  }

  async function handleWriteClue(item: AnagramWord) {
    if (!activity) return;
    const word = puzzleWord(item.word);
    if (word.length < MIN_ANAGRAM_LETTERS) {
      setError('Type a word with at least 2 letters before asking for a clue.');
      return;
    }
    setClueBusyId(item.id);
    setError('');
    try {
      const created = await requestWords({
        topic: activity.topic,
        words: [word],
        count: 1,
        level: activity.level,
        notes,
      });
      const clue = created[0]?.clue || '';
      if (!clue) throw new Error('AI did not return a clue');
      updateWord(item.id, { clue });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to write a clue');
    } finally {
      setClueBusyId('');
    }
  }

  async function handleFillClues() {
    if (!activity) return;
    const missing = activity.words
      .map((item) => puzzleWord(item.word))
      .filter((word, index) => {
        const source = activity.words[index];
        return word.length >= MIN_ANAGRAM_LETTERS && source && !source.clue.trim();
      })
      .slice(0, MAX_AI_ANAGRAM_WORDS);
    if (missing.length === 0) {
      setError('Every word already has a clue, or the words are still too short.');
      return;
    }
    setFillingClues(true);
    setError('');
    try {
      const created = await requestWords({
        topic: activity.topic,
        words: missing,
        count: missing.length,
        level: activity.level,
        notes,
      });
      setActivity((prev) => {
        if (!prev) return prev;
        return { ...prev, words: mergeGenerated(prev.words, created, false) };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to write clues');
    } finally {
      setFillingClues(false);
    }
  }

  async function handlePractice() {
    if (!activityRef.current) return;
    const ok = await persist(activityRef.current);
    if (ok) setPracticing(true);
  }

  async function handleCopyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (loading) {
    return (
      <ComicCard className="comic-shadow-xl">
        <ComicText className="font-bold">Loading anagram…</ComicText>
      </ComicCard>
    );
  }

  if (!activity) {
    return (
      <ComicCard className="comic-shadow-xl">
        <ComicText className="font-bold text-[var(--comic-danger)]">
          {error || 'Activity not found'}
        </ComicText>
      </ComicCard>
    );
  }

  const readyCount = anagramWordsReady(activity.words).length;
  const pastedCount = parseAnagramWordList(wordText).length;

  return (
    <div className="space-y-6">
      <ComicCard className="comic-shadow-xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <ComicTitle level={3} className="text-[var(--comic-primary)]">
              Anagram activity
            </ComicTitle>
            <ComicText className="font-bold text-[var(--comic-dark)]">
              Students unscramble one word at a time. A tap fills the first open box. A drag
              places the letter on a box they choose.
            </ComicText>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
              {saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Not saved' : 'Saved'}
              {' · '}
              {readyCount} words
            </ComicText>
            <ComicButton
              type="button"
              variant="success"
              size="sm"
              disabled={readyCount === 0}
              onClick={() => void handlePractice()}
            >
              Practice
            </ComicButton>
            <Link href={`/anagram/${activity.id}`} target="_blank">
              <ComicButton variant="secondary" size="sm">
                Open full screen
              </ComicButton>
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_8rem]">
          <label className="block space-y-1">
            <ComicText className="text-sm font-bold">Title (optional)</ComicText>
            <input
              className="comic-input w-full"
              value={activity.title}
              onChange={(event) => setActivity({ ...activity, title: event.target.value })}
              placeholder="Classroom words"
            />
          </label>
          <label className="block space-y-1">
            <ComicText className="text-sm font-bold">Topic</ComicText>
            <input
              className="comic-input w-full"
              value={activity.topic}
              onChange={(event) => setActivity({ ...activity, topic: event.target.value })}
              placeholder="things in a classroom"
            />
          </label>
          <label className="block space-y-1">
            <ComicText className="text-sm font-bold">Level</ComicText>
            <select
              className="comic-input w-full font-bold"
              value={activity.level}
              onChange={(event) =>
                setActivity({ ...activity, level: event.target.value as AnagramLevel })
              }
            >
              {VOCAB_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-2 border-4 border-[var(--comic-black)] bg-white p-3">
            <ComicText className="font-black">Clues</ComicText>
            <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
              With clues, a tap on the clue icon shows the definition. The next tap shows the
              picture, when the word has one.
            </ComicText>
            <div className="flex flex-wrap gap-2">
              <ComicButton
                type="button"
                variant={activity.cluesEnabled ? 'primary' : 'accent'}
                size="sm"
                onClick={() => setActivity({ ...activity, cluesEnabled: true })}
              >
                With clues
              </ComicButton>
              <ComicButton
                type="button"
                variant={!activity.cluesEnabled ? 'primary' : 'accent'}
                size="sm"
                onClick={() => setActivity({ ...activity, cluesEnabled: false })}
              >
                Without clues
              </ComicButton>
            </div>
          </div>
          <div className="space-y-2 border-4 border-[var(--comic-black)] bg-white p-3">
            <ComicText className="font-black">Timer</ComicText>
            <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
              Optional. Each word gets the same amount of time. Leave it off for no limit.
            </ComicText>
            <label className="inline-flex items-center gap-2 font-bold">
              <input
                type="checkbox"
                className="h-5 w-5 accent-[var(--comic-primary)]"
                checked={activity.timerEnabled}
                onChange={(event) =>
                  setActivity({ ...activity, timerEnabled: event.target.checked })
                }
              />
              Time limit per word
            </label>
            {activity.timerEnabled ? (
              <label className="flex items-center gap-2">
                <input
                  type="number"
                  min={5}
                  max={180}
                  className="comic-input w-24"
                  value={activity.secondsPerWord}
                  onChange={(event) =>
                    setActivity({
                      ...activity,
                      secondsPerWord: Number(event.target.value) || 30,
                    })
                  }
                />
                <ComicText className="text-sm font-bold">seconds</ComicText>
              </label>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-4 border-[var(--comic-black)] bg-white p-3">
          {qrCode ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrCode}
              alt="QR code for this anagram activity"
              className="h-32 w-32 shrink-0 object-contain"
            />
          ) : (
            <div className="flex h-32 w-32 shrink-0 items-center justify-center border-4 border-[var(--comic-black)] bg-[var(--comic-light)] text-center text-xs font-bold">
              Generating QR code…
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <ComicText className="font-black">Student link</ComicText>
            <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
              Students scan the code or open the link. Full screen is on the play screen.
            </ComicText>
            {shareUrl ? (
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="block break-all text-sm font-bold text-[var(--comic-secondary)] underline-offset-2 hover:underline"
              >
                {shareUrl}
              </a>
            ) : null}
            <ComicButton
              type="button"
              variant="secondary"
              size="sm"
              disabled={!shareUrl}
              onClick={() => void handleCopyLink()}
            >
              {copied ? 'Link copied' : 'Copy link'}
            </ComicButton>
          </div>
        </div>
        {error ? (
          <ComicText className="font-bold text-[var(--comic-danger)]">{error}</ComicText>
        ) : null}
      </ComicCard>

      <ComicCard className="comic-shadow-xl space-y-4">
        <ComicTitle level={4} className="text-[var(--comic-secondary)]">
          Create with AI
        </ComicTitle>
        <ComicText className="font-bold text-[var(--comic-dark)]">
          Give a topic, or paste the words you already want. AI writes a short clue for each one.
        </ComicText>
        <div className="flex flex-wrap gap-2">
          <ComicButton
            type="button"
            variant={mode === 'topic' ? 'primary' : 'accent'}
            size="sm"
            onClick={() => setMode('topic')}
          >
            From a topic
          </ComicButton>
          <ComicButton
            type="button"
            variant={mode === 'words' ? 'primary' : 'accent'}
            size="sm"
            onClick={() => setMode('words')}
          >
            From my words
          </ComicButton>
        </div>
        {mode === 'topic' ? (
          <div className="flex flex-wrap items-center gap-2">
            <ComicText className="text-sm font-bold">How many words</ComicText>
            <ComicButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCount((value) => Math.max(1, value - 1))}
            >
              −
            </ComicButton>
            <input
              type="number"
              min={1}
              max={MAX_AI_ANAGRAM_WORDS}
              className="comic-input w-20"
              value={count}
              onChange={(event) =>
                setCount(
                  Math.max(1, Math.min(MAX_AI_ANAGRAM_WORDS, Number(event.target.value) || 1))
                )
              }
            />
            <ComicButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCount((value) => Math.min(MAX_AI_ANAGRAM_WORDS, value + 1))}
            >
              +
            </ComicButton>
          </div>
        ) : (
          <label className="block space-y-1">
            <ComicText className="text-sm font-bold">
              Words {pastedCount > 0 ? `(${Math.min(pastedCount, MAX_AI_ANAGRAM_WORDS)})` : ''}
            </ComicText>
            <textarea
              className="comic-input min-h-28 w-full"
              value={wordText}
              onChange={(event) => setWordText(event.target.value)}
              placeholder={'school\ngarden\nwindow'}
            />
          </label>
        )}
        <label className="block space-y-1">
          <ComicText className="text-sm font-bold">Notes for the AI (optional)</ComicText>
          <input
            className="comic-input w-full"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="everyday objects, nothing scary"
          />
        </label>
        <label className="inline-flex items-center gap-2 font-bold">
          <input
            type="checkbox"
            className="h-5 w-5 accent-[var(--comic-primary)]"
            checked={replaceWords}
            onChange={(event) => setReplaceWords(event.target.checked)}
          />
          Replace the current word list
        </label>
        <ComicButton
          type="button"
          variant="primary"
          size="sm"
          disabled={generating}
          onClick={() => void handleGenerate()}
        >
          {generating ? 'Writing…' : 'AI assist'}
        </ComicButton>
      </ComicCard>

      <ComicCard className="comic-shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ComicTitle level={4} className="text-[var(--comic-secondary)]">
            Words
          </ComicTitle>
          <div className="flex flex-wrap gap-2">
            <ComicButton type="button" variant="secondary" size="sm" onClick={addBlankWord}>
              Add word
            </ComicButton>
            <ComicButton
              type="button"
              variant="accent"
              size="sm"
              disabled={fillingClues}
              onClick={() => void handleFillClues()}
            >
              {fillingClues ? 'Writing clues…' : 'AI clues for empty rows'}
            </ComicButton>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[16rem] flex-1 space-y-1">
            <ComicText className="text-sm font-bold">Add words yourself</ComicText>
            <textarea
              className="comic-input min-h-20 w-full"
              value={manualText}
              onChange={(event) => setManualText(event.target.value)}
              placeholder={'pencil\nchair\nboard'}
            />
          </label>
          <ComicButton type="button" variant="secondary" size="sm" onClick={addManualWords}>
            Add these words
          </ComicButton>
        </div>
        {activity.words.length === 0 ? (
          <ComicText className="font-bold text-[var(--comic-dark)]">
            No words yet. Add them yourself, or use AI assist above.
          </ComicText>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[52rem] space-y-2">
              <div className="sticky top-0 z-10 grid grid-cols-[2.5rem_minmax(8rem,0.9fr)_minmax(12rem,1.4fr)_minmax(10rem,1fr)_minmax(10rem,1fr)_8.5rem] gap-2 border-4 border-[var(--comic-black)] bg-[var(--comic-yellow)] px-2 py-2 text-xs font-black uppercase tracking-wide">
                <span />
                <span>Word</span>
                <span>Clue</span>
                <span>Audio</span>
                <span>Image</span>
                <span />
              </div>
              {activity.words.map((item, index) => (
                <WordRow
                  key={item.id}
                  item={item}
                  index={index}
                  total={activity.words.length}
                  clueBusy={clueBusyId === item.id}
                  onChange={(patch) => updateWord(item.id, patch)}
                  onMove={(direction) => moveWord(index, direction)}
                  onDuplicate={() => duplicateWord(index)}
                  onRemove={() => removeWord(index)}
                  onWriteClue={() => void handleWriteClue(item)}
                />
              ))}
            </div>
          </div>
        )}
      </ComicCard>

      {practicing ? (
        <AnagramStage
          activityId={activity.id}
          overlay
          onClose={() => setPracticing(false)}
        />
      ) : null}
    </div>
  );
}
