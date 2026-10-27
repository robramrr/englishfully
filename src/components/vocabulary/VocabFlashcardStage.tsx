'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import {
  vocabCardsReady,
  type VocabCard,
  type VocabDeck,
} from '@/lib/vocabulary/types';

function presentationOverlayRoot(): HTMLElement {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  const fullscreen = document.fullscreenElement || doc.webkitFullscreenElement || null;
  if (fullscreen instanceof HTMLElement) return fullscreen;
  return document.body;
}

function speakWord(word: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const text = word.trim();
  if (!text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.92;
  window.speechSynthesis.speak(utterance);
}

function highlightWord(example: string, word: string) {
  const target = word.trim();
  if (!target) return example;
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = example.split(new RegExp(`(${escaped})`, 'ig'));
  return parts.map((part, index) =>
    part.toLowerCase() === target.toLowerCase() ? (
      <span key={`${part}-${index}`} className="text-[var(--comic-primary)]">
        {part}
      </span>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
}

function shuffleIndexes(length: number): number[] {
  const order = Array.from({ length }, (_, index) => index);
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = order[index];
    order[index] = order[swap];
    order[swap] = current;
  }
  return order;
}

function FlashcardFace({
  card,
  flipped,
  onFlip,
}: {
  card: VocabCard;
  flipped: boolean;
  onFlip: () => void;
}) {
  return (
    <div className="h-[min(68vh,620px)] w-full [perspective:1200px]">
      <div
        className={[
          'relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]',
          flipped ? '[transform:rotateY(180deg)]' : '',
        ].join(' ')}
      >
        <button
          type="button"
          className="absolute inset-0 flex h-full w-full cursor-pointer flex-col overflow-hidden border-4 border-[var(--comic-black)] bg-white text-left [backface-visibility:hidden]"
          style={{ pointerEvents: flipped ? 'none' : 'auto' }}
          onClick={onFlip}
        >
          <div className="flex items-center justify-between gap-3 border-b-4 border-[var(--comic-black)] bg-[var(--comic-light)] px-4 py-2">
            <span className="font-bungee text-xs uppercase tracking-wide text-[var(--comic-secondary)]">
              Word
            </span>
            <span className="text-xs font-bold text-[var(--comic-dark)]">Click to see the meaning</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 py-5">
            {card.imageUrl.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.imageUrl}
                alt=""
                className="max-h-[42%] w-full max-w-sm object-contain"
              />
            ) : null}
            <div className="text-center">
              <div className="font-bungee text-4xl leading-tight text-[var(--comic-secondary)] md:text-6xl">
                {card.word || 'New word'}
              </div>
              {card.partOfSpeech.trim() ? (
                <div className="mt-2 text-sm font-bold uppercase tracking-wide text-[var(--comic-primary)]">
                  {card.partOfSpeech}
                </div>
              ) : null}
            </div>
          </div>
        </button>

        <button
          type="button"
          className="absolute inset-0 flex h-full w-full cursor-pointer flex-col overflow-hidden border-4 border-[var(--comic-black)] bg-[#fff8dc] text-left [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{ pointerEvents: flipped ? 'auto' : 'none' }}
          onClick={onFlip}
        >
          <div className="flex items-center justify-between gap-3 border-b-4 border-[var(--comic-black)] bg-[var(--comic-yellow)] px-4 py-2">
            <span className="font-bungee text-xs uppercase tracking-wide text-[var(--comic-secondary)]">
              Meaning
            </span>
            <span className="text-xs font-bold text-[var(--comic-dark)]">Click to see the word</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-5 overflow-auto px-6 py-6 md:px-10">
            <p className="font-bungee text-sm uppercase tracking-wide text-[var(--comic-primary)]">
              {card.word}
            </p>
            <p className="text-2xl font-bold leading-snug text-[var(--comic-dark)] md:text-4xl">
              {card.meaning || 'Add a meaning for this card.'}
            </p>
            {card.example.trim() ? (
              <p className="border-l-4 border-[var(--comic-secondary)] pl-4 text-lg font-bold leading-relaxed text-[var(--comic-dark)] md:text-2xl">
                {highlightWord(card.example, card.word)}
              </p>
            ) : null}
          </div>
        </button>
      </div>
    </div>
  );
}

export default function VocabFlashcardStage({
  deckId,
  onClose,
  overlay = false,
}: {
  deckId: string;
  onClose?: () => void;
  overlay?: boolean;
}) {
  const [deck, setDeck] = useState<VocabDeck | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<number[]>([]);
  const [cursor, setCursor] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [overlayRoot, setOverlayRoot] = useState<HTMLElement | null>(null);

  const cards = useMemo(
    () => (deck ? vocabCardsReady(deck.cards) : []),
    [deck]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    void (async () => {
      try {
        const response = await fetch(`/api/vocabulary/decks/${deckId}`, { cache: 'no-store' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Failed to load deck');
        if (!cancelled) setDeck(data.deck as VocabDeck);
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

  useEffect(() => {
    setOrder(cards.map((_, index) => index));
    setCursor(0);
    setFlipped(false);
    setShuffled(false);
  }, [cards]);

  useEffect(() => {
    if (!overlay) return;
    const update = () => setOverlayRoot(presentationOverlayRoot());
    update();
    document.addEventListener('fullscreenchange', update);
    document.addEventListener('webkitfullscreenchange', update as EventListener);
    return () => {
      document.removeEventListener('fullscreenchange', update);
      document.removeEventListener('webkitfullscreenchange', update as EventListener);
    };
  }, [overlay]);

  const go = useCallback((direction: -1 | 1) => {
    setCursor((current) => {
      const next = current + direction;
      if (next < 0 || next >= order.length) return current;
      return next;
    });
    setFlipped(false);
  }, [order.length]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === 'Escape' && onClose) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        setFlipped((value) => !value);
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        event.stopPropagation();
        go(1);
      }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        event.stopPropagation();
        go(-1);
      }
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [go, onClose]);

  const card = cards[order[cursor] ?? 0];
  const title = deck?.title?.trim() || deck?.topic?.trim() || 'Vocabulary';

  const body = (
    <div
      className={[
        'vocabulary-page flex flex-col bg-[var(--comic-light)] text-[var(--comic-dark)]',
        overlay ? 'fixed inset-0 z-[120] overflow-auto' : 'min-h-screen',
      ].join(' ')}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-[var(--comic-black)] bg-white px-4 py-3 md:px-6">
        <div className="min-w-0">
          <p className="font-bungee text-xs uppercase tracking-wide text-[var(--comic-primary)]">
            Englishfully
          </p>
          <h1 className="truncate font-bungee text-xl text-[var(--comic-secondary)] md:text-3xl">
            {title}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {onClose ? (
            <ComicButton type="button" variant="warning" size="sm" onClick={onClose}>
              Back to slide
            </ComicButton>
          ) : (
            <Link href={`/teacher-resources/vocabulary/${deckId}`}>
              <ComicButton variant="secondary" size="sm">
                Edit deck
              </ComicButton>
            </Link>
          )}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-5 px-4 py-6">
        {loading ? <ComicText className="font-bold">Loading cards…</ComicText> : null}
        {error ? (
          <ComicText className="w-full text-center font-bold text-[var(--comic-danger)]">
            {error}
          </ComicText>
        ) : null}
        {!loading && !error && cards.length === 0 ? (
          <ComicText className="text-center font-bold">
            This deck has no cards yet. Add a word and a meaning, then come back.
          </ComicText>
        ) : null}
        {card ? (
          <>
            <div className="w-full max-w-xl">
              <FlashcardFace card={card} flipped={flipped} onFlip={() => setFlipped((value) => !value)} />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <ComicButton
                type="button"
                variant="secondary"
                size="sm"
                disabled={cursor <= 0}
                onClick={() => go(-1)}
              >
                Previous
              </ComicButton>
              <ComicButton type="button" variant="accent" size="sm" onClick={() => speakWord(card.word)}>
                Listen
              </ComicButton>
              <ComicButton type="button" variant="primary" size="sm" onClick={() => setFlipped((value) => !value)}>
                {flipped ? 'Show word' : 'Show meaning'}
              </ComicButton>
              <ComicButton
                type="button"
                variant="secondary"
                size="sm"
                disabled={cursor >= cards.length - 1}
                onClick={() => go(1)}
              >
                Next
              </ComicButton>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <ComicText className="font-black">
                {cursor + 1} / {cards.length}
                {deck?.level ? ` · ${deck.level}` : ''}
              </ComicText>
              <button
                type="button"
                className="text-sm font-bold text-[var(--comic-secondary)] underline-offset-2 hover:underline"
                onClick={() => {
                  setOrder(shuffled ? cards.map((_, index) => index) : shuffleIndexes(cards.length));
                  setShuffled((value) => !value);
                  setCursor(0);
                  setFlipped(false);
                }}
              >
                {shuffled ? 'Back in order' : 'Shuffle'}
              </button>
            </div>
            <p className="text-center text-sm font-bold text-[var(--comic-dark)]">
              Space flips the card. Arrow keys move between words.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );

  if (!overlay) return body;
  if (!overlayRoot) return null;
  return createPortal(body, overlayRoot);
}
