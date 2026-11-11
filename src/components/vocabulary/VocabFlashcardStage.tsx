'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faArrowsRotate,
  faCompress,
  faExpand,
  faVolumeHigh,
} from '@fortawesome/free-solid-svg-icons';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import {
  vocabCardsReady,
  type VocabCard,
  type VocabDeck,
} from '@/lib/vocabulary/types';

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

function currentFullscreenElement(): Element | null {
  const doc = document as FullscreenDocument;
  return document.fullscreenElement || doc.webkitFullscreenElement || null;
}

function presentationOverlayRoot(): HTMLElement {
  const fullscreen = currentFullscreenElement();
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

function CardImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative h-full min-h-0 w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain p-1 md:p-3"
      />
    </div>
  );
}

/** Picture fills a tall column beside the words on a projector, and sits above them on a phone. */
function CardSplit({ imageUrl, children }: { imageUrl: string; children: ReactNode }) {
  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1.2fr)_auto] lg:grid-cols-2 lg:grid-rows-1">
      <CardImage src={imageUrl} alt="" />
      <div className="flex min-h-0 items-center justify-center overflow-auto border-t-4 border-[var(--comic-black)] px-5 py-4 text-center lg:border-l-4 lg:border-t-0 lg:px-8">
        {children}
      </div>
    </div>
  );
}

function MeaningCopy({
  card,
  word,
  heroWord,
}: {
  card: VocabCard;
  word: string;
  heroWord: boolean;
}) {
  return (
    <div className="flex max-w-full flex-col gap-3 md:gap-4">
      <div>
        <p
          className="font-bungee leading-none break-words text-[var(--comic-secondary)]"
          style={{
            fontSize: heroWord ? 'clamp(2.6rem, 5vw, 5.75rem)' : 'clamp(1.6rem, 2.8vw, 2.75rem)',
          }}
        >
          {word}
        </p>
        {card.partOfSpeech.trim() ? (
          <p className="mt-2 text-base font-bold uppercase tracking-wide text-[var(--comic-primary)] md:text-xl">
            {card.partOfSpeech}
          </p>
        ) : null}
      </div>
      <p
        className="font-bold leading-snug text-[var(--comic-dark)]"
        style={{ fontSize: 'clamp(1.45rem, 2.6vw, 2.6rem)' }}
      >
        {card.meaning || 'Add a meaning for this card.'}
      </p>
      {card.example.trim() ? (
        <p
          className="font-bold leading-relaxed text-[var(--comic-dark)]"
          style={{ fontSize: 'clamp(1.1rem, 1.8vw, 1.7rem)' }}
        >
          {highlightWord(card.example, card.word)}
        </p>
      ) : null}
    </div>
  );
}

function FlashcardFace({
  card,
  flipped,
  pictureFirst,
  onFlip,
}: {
  card: VocabCard;
  flipped: boolean;
  pictureFirst: boolean;
  onFlip: () => void;
}) {
  const hasImage = Boolean(card.imageUrl.trim());
  const pictureOnly = pictureFirst && hasImage;
  const word = card.word || 'New word';

  return (
    <div className="absolute inset-0 [perspective:1600px]">
      <div
        className={[
          'relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none',
          flipped ? '[transform:rotateY(180deg)]' : '',
        ].join(' ')}
      >
        <button
          type="button"
          aria-label={pictureOnly ? 'Picture. Flip to reveal the word and meaning' : 'Word. Flip to the meaning'}
          className="absolute inset-0 h-full w-full cursor-pointer overflow-hidden bg-white text-left [backface-visibility:hidden]"
          style={{ pointerEvents: flipped ? 'none' : 'auto' }}
          tabIndex={flipped ? -1 : 0}
          aria-hidden={flipped}
          onClick={onFlip}
        >
          {pictureOnly ? (
            <div className="relative h-full w-full">
              <CardImage src={card.imageUrl} alt="" />
            </div>
          ) : hasImage ? (
            <CardSplit imageUrl={card.imageUrl}>
              <div className="max-w-full">
                <div
                  className="font-bungee leading-none break-words text-[var(--comic-secondary)]"
                  style={{ fontSize: 'clamp(2.75rem, 5.5vw, 6.5rem)' }}
                >
                  {word}
                </div>
                {card.partOfSpeech.trim() ? (
                  <div className="mt-2 text-lg font-bold uppercase tracking-wide text-[var(--comic-primary)] md:text-2xl">
                    {card.partOfSpeech}
                  </div>
                ) : null}
              </div>
            </CardSplit>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div className="max-w-full">
                <div
                  className="font-bungee leading-none break-words text-[var(--comic-secondary)]"
                  style={{ fontSize: 'clamp(3.5rem, 12vw, 9.5rem)' }}
                >
                  {word}
                </div>
                {card.partOfSpeech.trim() ? (
                  <div className="mt-3 text-lg font-bold uppercase tracking-wide text-[var(--comic-primary)] md:text-2xl">
                    {card.partOfSpeech}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </button>

        <button
          type="button"
          aria-label="Meaning. Flip back to the word"
          className="absolute inset-0 h-full w-full cursor-pointer overflow-hidden bg-[#fff8dc] text-left [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{ pointerEvents: flipped ? 'auto' : 'none' }}
          tabIndex={flipped ? 0 : -1}
          aria-hidden={!flipped}
          onClick={onFlip}
        >
          {hasImage ? (
            <CardSplit imageUrl={card.imageUrl}>
              <MeaningCopy card={card} word={word} heroWord={pictureOnly} />
            </CardSplit>
          ) : (
            <div className="flex h-full items-center justify-center overflow-auto px-6 py-4 text-center md:px-12">
              <MeaningCopy card={card} word={word} heroWord={pictureOnly} />
            </div>
          )}
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
  const rootRef = useRef<HTMLDivElement>(null);
  const [deck, setDeck] = useState<VocabDeck | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<number[]>([]);
  const [cursor, setCursor] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [overlayRoot, setOverlayRoot] = useState<HTMLElement | null>(null);
  const [fullscreenOwner, setFullscreenOwner] = useState<'self' | 'other' | 'none'>('none');

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

  useEffect(() => {
    function syncFullscreen() {
      const current = currentFullscreenElement();
      if (!current) setFullscreenOwner('none');
      else if (current === rootRef.current) setFullscreenOwner('self');
      else setFullscreenOwner('other');
    }
    syncFullscreen();
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen as EventListener);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('webkitfullscreenchange', syncFullscreen as EventListener);
    };
  }, []);

  const go = useCallback((direction: -1 | 1) => {
    setCursor((current) => {
      const next = current + direction;
      if (next < 0 || next >= order.length) return current;
      setFlipped(false);
      return next;
    });
  }, [order.length]);

  const flip = useCallback(() => {
    setFlipped((value) => !value);
  }, []);

  const exitOwnFullscreen = useCallback(async () => {
    if (currentFullscreenElement() !== rootRef.current) return;
    const doc = document as FullscreenDocument;
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
    } catch {
      // Browser may already be leaving fullscreen.
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = rootRef.current as FullscreenElement | null;
    if (!el) return;
    const doc = document as FullscreenDocument;
    try {
      if (currentFullscreenElement() === el) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
        return;
      }
      if (currentFullscreenElement()) return;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    } catch {
      // Browser may deny fullscreen without a user gesture.
    }
  }, []);

  const close = useCallback(() => {
    if (!onClose) return;
    void exitOwnFullscreen().finally(onClose);
  }, [exitOwnFullscreen, onClose]);

  const card = cards[order[cursor] ?? 0];
  const pictureOnly = Boolean(deck?.pictureFirst && card?.imageUrl.trim());

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
      if (event.key === 'Escape') {
        if (currentFullscreenElement() === rootRef.current) return;
        if (!onClose) return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key === 'f' || event.key === 'F') {
        if (fullscreenOwner === 'other') return;
        event.preventDefault();
        void toggleFullscreen();
        return;
      }
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        flip();
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
  }, [flip, fullscreenOwner, go, onClose, toggleFullscreen]);

  const title = deck?.title?.trim() || deck?.topic?.trim() || 'Vocabulary';
  const faceLabel = flipped ? 'Meaning' : pictureOnly ? 'Picture' : 'Word';

  const body = (
    <div
      ref={rootRef}
      className={[
        'vocabulary-page flex flex-col overflow-hidden bg-[var(--comic-light)] text-[var(--comic-dark)]',
        overlay ? 'fixed inset-0 z-[120]' : 'fixed inset-0 z-[40]',
      ].join(' ')}
    >
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b-4 border-[var(--comic-black)] bg-white px-3 py-2 md:gap-3 md:px-5">
        <h1 className="min-w-0 flex-1 truncate font-bungee text-lg text-[var(--comic-secondary)] md:text-2xl">
          {title}
        </h1>
        {card ? (
          <p className="shrink-0 text-sm font-black md:text-lg">
            <span className="mr-2 hidden font-bungee text-xs uppercase tracking-wide text-[var(--comic-primary)] sm:inline">
              {faceLabel}
            </span>
            {cursor + 1} / {cards.length}
            {deck?.level ? ` · ${deck.level}` : ''}
          </p>
        ) : null}
        {cards.length > 1 ? (
          <ComicButton
            type="button"
            variant="accent"
            size="sm"
            onClick={() => {
              setOrder(shuffled ? cards.map((_, index) => index) : shuffleIndexes(cards.length));
              setShuffled((value) => !value);
              setCursor(0);
              setFlipped(false);
            }}
          >
            {shuffled ? 'In order' : 'Shuffle'}
          </ComicButton>
        ) : null}
        {fullscreenOwner !== 'other' ? (
          <ComicButton type="button" variant="success" size="sm" onClick={() => void toggleFullscreen()}>
            <FontAwesomeIcon
              icon={fullscreenOwner === 'self' ? faCompress : faExpand}
              className="mr-2 h-4 w-4"
            />
            {fullscreenOwner === 'self' ? 'Exit full screen' : 'Full screen'}
          </ComicButton>
        ) : null}
        {onClose ? (
          <ComicButton type="button" variant="warning" size="sm" onClick={close}>
            Back
          </ComicButton>
        ) : null}
      </header>

      <div className="relative min-h-0 flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center px-6">
            <ComicText className="font-bold">Loading cards…</ComicText>
          </div>
        ) : null}
        {error ? (
          <div className="flex h-full items-center justify-center px-6">
            <ComicText className="text-center font-bold text-[var(--comic-danger)]">{error}</ComicText>
          </div>
        ) : null}
        {!loading && !error && cards.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6">
            <ComicText className="text-center font-bold">
              This deck has no cards yet. Add a word and a meaning, then come back.
            </ComicText>
          </div>
        ) : null}
        {card ? (
          <FlashcardFace
            card={card}
            flipped={flipped}
            pictureFirst={Boolean(deck?.pictureFirst)}
            onFlip={flip}
          />
        ) : null}
      </div>

      {card ? (
        <footer className="flex shrink-0 flex-col items-center gap-1 border-t-4 border-[var(--comic-black)] bg-white px-3 py-2 md:px-5 md:py-3">
          <div className="flex w-full max-w-4xl items-center justify-center gap-2">
            <ComicButton
              type="button"
              variant="secondary"
              size="md"
              disabled={cursor <= 0}
              onClick={() => go(-1)}
              className="!px-3 sm:!px-5"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sr-only sm:hidden">Previous</span>
            </ComicButton>
            <ComicButton
              type="button"
              variant="accent"
              size="md"
              onClick={() => speakWord(card.word)}
              className="!px-3 sm:!px-5"
            >
              <FontAwesomeIcon icon={faVolumeHigh} className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">Listen</span>
              <span className="sr-only sm:hidden">Listen</span>
            </ComicButton>
            <ComicButton
              type="button"
              variant="primary"
              size="lg"
              onClick={flip}
              className="min-w-[7.5rem] !px-6"
            >
              <FontAwesomeIcon icon={faArrowsRotate} className="mr-2 h-5 w-5" />
              Flip
            </ComicButton>
            <ComicButton
              type="button"
              variant="secondary"
              size="md"
              disabled={cursor >= cards.length - 1}
              onClick={() => go(1)}
              className="!px-3 sm:!px-5"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sr-only sm:hidden">Next</span>
              <FontAwesomeIcon icon={faArrowRight} className="h-5 w-5 sm:ml-2" />
            </ComicButton>
          </div>
          <p className="text-center text-xs font-bold text-[var(--comic-dark)] md:text-sm">
            Click the card or press space to flip. Arrow keys move between cards.
          </p>
        </footer>
      ) : null}
    </div>
  );

  if (!overlay) return body;
  if (!overlayRoot) return null;
  return createPortal(body, overlayRoot);
}
