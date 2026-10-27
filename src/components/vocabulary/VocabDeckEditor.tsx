'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import VocabFlashcardStage from './VocabFlashcardStage';
import {
  MAX_AI_CARDS,
  MAX_VOCAB_CARDS,
  VOCAB_LEVELS,
  createEmptyVocabCard,
  normalizeVocabDeck,
  parseWordList,
  type VocabCard,
  type VocabDeck,
  type VocabLevel,
} from '@/lib/vocabulary/types';

function signature(deck: VocabDeck): string {
  const { updatedAt: _updatedAt, ...rest } = deck;
  return JSON.stringify(rest);
}

function CardFields({
  card,
  index,
  total,
  uploading,
  onChange,
  onRemove,
  onMove,
  onUpload,
}: {
  card: VocabCard;
  index: number;
  total: number;
  uploading: boolean;
  onChange: (patch: Partial<VocabCard>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="space-y-3 border-4 border-[var(--comic-black)] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ComicText className="font-black">Card {index + 1}</ComicText>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="text-sm font-bold text-[var(--comic-secondary)] underline-offset-2 hover:underline disabled:opacity-40"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            Up
          </button>
          <button
            type="button"
            className="text-sm font-bold text-[var(--comic-secondary)] underline-offset-2 hover:underline disabled:opacity-40"
            disabled={index >= total - 1}
            onClick={() => onMove(1)}
          >
            Down
          </button>
          <button
            type="button"
            className="text-sm font-bold text-[var(--comic-primary)] underline-offset-2 hover:underline"
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_9rem]">
        <label className="block space-y-1">
          <ComicText className="text-sm font-bold">Word</ComicText>
          <input
            className="comic-input w-full"
            value={card.word}
            onChange={(event) => onChange({ word: event.target.value })}
            placeholder="menu"
          />
        </label>
        <label className="block space-y-1">
          <ComicText className="text-sm font-bold">Type</ComicText>
          <input
            className="comic-input w-full"
            value={card.partOfSpeech}
            onChange={(event) => onChange({ partOfSpeech: event.target.value })}
            placeholder="noun"
          />
        </label>
      </div>

      <label className="block space-y-1">
        <ComicText className="text-sm font-bold">Meaning</ComicText>
        <input
          className="comic-input w-full"
          value={card.meaning}
          onChange={(event) => onChange({ meaning: event.target.value })}
          placeholder="A list of food and drinks you can order"
        />
      </label>

      <label className="block space-y-1">
        <ComicText className="text-sm font-bold">Example</ComicText>
        <input
          className="comic-input w-full"
          value={card.example}
          onChange={(event) => onChange({ example: event.target.value })}
          placeholder="Can I see the menu, please?"
        />
      </label>

      <div className="space-y-2">
        <label className="block space-y-1">
          <ComicText className="text-sm font-bold">Picture URL (optional)</ComicText>
          <input
            className="comic-input w-full"
            value={card.imageUrl}
            onChange={(event) => onChange({ imageUrl: event.target.value.trim() })}
            placeholder="https://…"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center border-4 border-[var(--comic-black)] bg-[var(--comic-light)] px-3 py-1.5 text-sm font-bold">
            {uploading ? 'Uploading…' : 'Upload picture'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) onUpload(file);
              }}
            />
          </label>
          {card.imageUrl.trim() ? (
            <button
              type="button"
              className="text-sm font-bold text-[var(--comic-primary)] underline-offset-2 hover:underline"
              onClick={() => onChange({ imageUrl: '' })}
            >
              Remove picture
            </button>
          ) : null}
        </div>
        {card.imageUrl.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.imageUrl}
            alt=""
            className="h-28 w-28 border-4 border-[var(--comic-black)] bg-[var(--comic-light)] object-contain"
          />
        ) : null}
      </div>
    </div>
  );
}

export default function VocabDeckEditor({ deckId }: { deckId: string }) {
  const [deck, setDeck] = useState<VocabDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [mode, setMode] = useState<'topic' | 'words'>('topic');
  const [wordText, setWordText] = useState('');
  const [count, setCount] = useState(8);
  const [notes, setNotes] = useState('');
  const [replaceCards, setReplaceCards] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploadingId, setUploadingId] = useState('');
  const [practicing, setPracticing] = useState(false);
  const deckRef = useRef<VocabDeck | null>(null);
  const savedSignature = useRef('');
  const ready = useRef(false);

  useEffect(() => {
    deckRef.current = deck;
  }, [deck]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/vocabulary/decks/${deckId}`, { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Deck not found');
        const loaded = normalizeVocabDeck(data.deck);
        if (cancelled) return;
        savedSignature.current = signature(loaded);
        ready.current = true;
        setDeck(loaded);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load deck');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deckId]);

  async function persist(next: VocabDeck): Promise<boolean> {
    const current = signature(next);
    if (current === savedSignature.current) return true;
    setSaveState('saving');
    try {
      const response = await fetch(`/api/vocabulary/decks/${next.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deck: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save');
      const saved = normalizeVocabDeck(data.deck);
      if (signature(deckRef.current || next) === current) {
        savedSignature.current = signature(saved);
        setDeck((prev) => (prev && signature(prev) === current ? saved : prev));
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
    if (!deck || !ready.current) return;
    const handle = window.setTimeout(() => {
      void persist(deck);
    }, 700);
    return () => window.clearTimeout(handle);
    // persist is stable enough for this editor; deck identity drives the save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck]);

  function updateCard(cardId: string, patch: Partial<VocabCard>) {
    setDeck((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        cards: prev.cards.map((card) => (card.id === cardId ? { ...card, ...patch } : card)),
      };
    });
  }

  function moveCard(index: number, direction: -1 | 1) {
    setDeck((prev) => {
      if (!prev) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.cards.length) return prev;
      const cards = [...prev.cards];
      const [item] = cards.splice(index, 1);
      cards.splice(nextIndex, 0, item);
      return { ...prev, cards };
    });
  }

  async function handleUpload(card: VocabCard, file: File) {
    if (!deck) return;
    setUploadingId(card.id);
    setError('');
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('deck_id', deck.id);
      form.set('word', card.word || 'word');
      const response = await fetch('/api/vocabulary/upload-image', {
        method: 'POST',
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to upload picture');
      updateCard(card.id, { imageUrl: String(data.image_url || '') });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload picture');
    } finally {
      setUploadingId('');
    }
  }

  async function handleGenerate() {
    if (!deck) return;
    const words = parseWordList(wordText).slice(0, MAX_AI_CARDS);
    if (mode === 'topic' && !deck.topic.trim()) {
      setError('Type a topic, like “restaurant food” or “past travel”.');
      return;
    }
    if (mode === 'words' && words.length === 0) {
      setError('Add at least one word.');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const response = await fetch('/api/vocabulary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: deck.topic,
          words: mode === 'words' ? words : [],
          count,
          level: deck.level,
          notes,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create cards');
      const rawCards: unknown[] = Array.isArray(data.cards) ? data.cards : [];
      const created = rawCards.map((card) =>
        createEmptyVocabCard(
          card && typeof card === 'object' ? (card as Partial<VocabCard>) : {}
        )
      );
      if (created.length === 0) throw new Error('AI did not return any cards');
      setDeck((prev) => {
        if (!prev) return prev;
        const existing: VocabCard[] = replaceCards ? [] : prev.cards;
        const seen = new Set(existing.map((card) => card.word.trim().toLowerCase()).filter(Boolean));
        const additions = created.filter((card) => {
          const key = card.word.trim().toLowerCase();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        const title =
          prev.title.trim() && prev.title.trim() !== 'Untitled deck'
            ? prev.title
            : prev.topic.trim() || prev.title;
        return {
          ...prev,
          title,
          cards: [...existing, ...additions].slice(0, MAX_VOCAB_CARDS),
        };
      });
      setWordText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create cards');
    } finally {
      setGenerating(false);
    }
  }

  async function handlePractice() {
    if (!deckRef.current) return;
    const ok = await persist(deckRef.current);
    if (ok) setPracticing(true);
  }

  if (loading) {
    return (
      <ComicCard className="comic-shadow-xl">
        <ComicText className="font-bold">Loading deck…</ComicText>
      </ComicCard>
    );
  }

  if (!deck) {
    return (
      <ComicCard className="comic-shadow-xl">
        <ComicText className="font-bold text-[var(--comic-danger)]">
          {error || 'Deck not found'}
        </ComicText>
      </ComicCard>
    );
  }

  const wordCount = parseWordList(wordText).length;
  const filledCount = deck.cards.filter((card) => card.word.trim()).length;

  return (
    <div className="space-y-6">
      <ComicCard className="comic-shadow-xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <ComicTitle level={3} className="text-[var(--comic-primary)]">
              Vocabulary deck
            </ComicTitle>
            <ComicText className="font-bold text-[var(--comic-dark)]">
              Front of the card: word and picture. Back: simple meaning and one example.
            </ComicText>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
              {saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Not saved' : 'Saved'}
              {' · '}
              {filledCount} cards
            </ComicText>
            <ComicButton
              type="button"
              variant="success"
              size="sm"
              disabled={filledCount === 0}
              onClick={() => void handlePractice()}
            >
              Practice
            </ComicButton>
            <Link href={`/vocabulary/${deck.id}`} target="_blank">
              <ComicButton variant="secondary" size="sm">
                Open full screen
              </ComicButton>
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_8rem]">
          <label className="block space-y-1">
            <ComicText className="text-sm font-bold">Deck name</ComicText>
            <input
              className="comic-input w-full"
              value={deck.title}
              onChange={(event) => setDeck({ ...deck, title: event.target.value })}
              placeholder="Restaurant words"
            />
          </label>
          <label className="block space-y-1">
            <ComicText className="text-sm font-bold">Topic</ComicText>
            <input
              className="comic-input w-full"
              value={deck.topic}
              onChange={(event) => setDeck({ ...deck, topic: event.target.value })}
              placeholder="food at a restaurant"
            />
          </label>
          <label className="block space-y-1">
            <ComicText className="text-sm font-bold">Level</ComicText>
            <select
              className="comic-input w-full font-bold"
              value={deck.level}
              onChange={(event) =>
                setDeck({ ...deck, level: event.target.value as VocabLevel })
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
        {error ? (
          <ComicText className="font-bold text-[var(--comic-danger)]">{error}</ComicText>
        ) : null}
      </ComicCard>

      <ComicCard className="comic-shadow-xl space-y-4">
        <ComicTitle level={4} className="text-[var(--comic-secondary)]">
          Create with AI
        </ComicTitle>
        <ComicText className="font-bold text-[var(--comic-dark)]">
          Give a topic, or paste the words you already want. AI writes a simple meaning and an example for each one.
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
          <div className="space-y-2">
            <ComicText className="text-sm font-bold">How many words</ComicText>
            <div className="flex flex-wrap items-center gap-2">
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
                max={MAX_AI_CARDS}
                className="comic-input w-20 text-center font-black"
                value={count}
                onChange={(event) => {
                  const next = Math.round(Number(event.target.value));
                  if (!Number.isFinite(next)) return;
                  setCount(Math.max(1, Math.min(MAX_AI_CARDS, next)));
                }}
              />
              <ComicButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setCount((value) => Math.min(MAX_AI_CARDS, value + 1))}
              >
                +
              </ComicButton>
              <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                Up to {MAX_AI_CARDS}. Uses the topic and level above.
              </ComicText>
            </div>
          </div>
        ) : (
          <label className="block space-y-1">
            <ComicText className="text-sm font-bold">
              Words {wordCount > 0 ? `(${Math.min(wordCount, MAX_AI_CARDS)})` : ''}
            </ComicText>
            <textarea
              className="comic-textarea w-full min-h-[120px]"
              value={wordText}
              onChange={(event) => setWordText(event.target.value)}
              placeholder={'menu\nbill\norder\ndessert'}
            />
            <ComicText className="text-xs font-bold text-[var(--comic-dark)]">
              One word per line, or separate them with commas. Up to {MAX_AI_CARDS} at a time.
            </ComicText>
          </label>
        )}

        <label className="block space-y-1">
          <ComicText className="text-sm font-bold">Extra instructions (optional)</ComicText>
          <input
            className="comic-input w-full"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Use British spelling. Keep the words very easy."
          />
        </label>

        {deck.cards.length > 0 ? (
          <label className="inline-flex cursor-pointer items-center gap-2 font-bold">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[var(--comic-primary)]"
              checked={replaceCards}
              onChange={(event) => setReplaceCards(event.target.checked)}
            />
            Replace the cards already in this deck
          </label>
        ) : null}

        <ComicButton
          type="button"
          variant="primary"
          size="md"
          disabled={generating}
          onClick={() => void handleGenerate()}
        >
          {generating ? 'Creating cards…' : replaceCards ? 'Replace with AI cards' : 'Create cards'}
        </ComicButton>
      </ComicCard>

      <div className="space-y-3">
        {deck.cards.length === 0 ? (
          <ComicCard className="comic-shadow-xl">
            <ComicText className="font-bold text-[var(--comic-dark)]">
              No cards yet. Create a set with AI, or add one card yourself.
            </ComicText>
          </ComicCard>
        ) : (
          deck.cards.map((card, index) => (
            <CardFields
              key={card.id}
              card={card}
              index={index}
              total={deck.cards.length}
              uploading={uploadingId === card.id}
              onChange={(patch) => updateCard(card.id, patch)}
              onRemove={() =>
                setDeck((prev) =>
                  prev ? { ...prev, cards: prev.cards.filter((item) => item.id !== card.id) } : prev
                )
              }
              onMove={(direction) => moveCard(index, direction)}
              onUpload={(file) => void handleUpload(card, file)}
            />
          ))
        )}
        <ComicButton
          type="button"
          variant="secondary"
          size="sm"
          disabled={deck.cards.length >= MAX_VOCAB_CARDS}
          onClick={() =>
            setDeck((prev) =>
              prev ? { ...prev, cards: [...prev.cards, createEmptyVocabCard()] } : prev
            )
          }
        >
          + Add a card
        </ComicButton>
      </div>

      {practicing ? (
        <VocabFlashcardStage deckId={deck.id} overlay onClose={() => setPracticing(false)} />
      ) : null}
    </div>
  );
}
