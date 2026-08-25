'use client';

import { useEffect, useMemo, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import {
  getFilledMatchPairs,
  type PresentationSlide,
} from '@/lib/presentation/types';
import type { SlideTimerState } from './PresentationSlideTimer';

const QUIZ_CORRECT = '#15803d';
const QUIZ_WRONG = '#ea1225';

interface PresentationMatchTextImageProps {
  slide: PresentationSlide;
  present?: boolean;
  compact?: boolean;
  timerState?: SlideTimerState | null;
  onRequestTimerReset?: () => void;
}

function playQuizTone(kind: 'correct' | 'wrong' | 'complete') {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (kind === 'correct' || kind === 'complete') {
      const notes =
        kind === 'complete' ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25, 783.99];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02 + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22 + index * 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + index * 0.08);
        osc.stop(now + 0.28 + index * 0.08);
      });
      window.setTimeout(() => void ctx.close(), 900);
      return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.28);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
    window.setTimeout(() => void ctx.close(), 600);
  } catch {
    // ignore
  }
}

function shuffleIds(ids: string[]): string[] {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function imageGridClass(count: number, compact: boolean): string {
  if (count <= 1) return 'grid-cols-1 max-w-[40%] mx-auto';
  if (count === 2) return 'grid-cols-2';
  if (count === 3) return 'grid-cols-3';
  if (count === 4) return 'grid-cols-2 sm:grid-cols-4';
  if (count === 5) return compact ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-5';
  return 'grid-cols-3';
}

/**
 * Match vocabulary words (top) to images (below). Tap a word, then its picture.
 * Words and images are shuffled independently in present/preview.
 */
export default function PresentationMatchTextImage({
  slide,
  present = false,
  compact = false,
  timerState = null,
  onRequestTimerReset,
}: PresentationMatchTextImageProps) {
  const pairs = useMemo(() => getFilledMatchPairs(slide), [slide]);
  const timerEnabled = Boolean(slide.timerEnabled);
  const timerStarted = !timerEnabled || timerState == null || timerState.started;
  const timeUp = Boolean(timerEnabled && timerState?.timeUp);

  const [wordOrder, setWordOrder] = useState<string[]>([]);
  const [imageOrder, setImageOrder] = useState<string[]>([]);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, true>>({});
  const [wrongImageId, setWrongImageId] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);

  const matchedCount = Object.keys(matched).length;
  const completed = pairs.length > 0 && matchedCount >= pairs.length;
  const locked = completed || timeUp;

  const pairsKey = pairs.map((pair) => `${pair.id}:${pair.word}:${pair.imageUrl}`).join('|');

  useEffect(() => {
    const ids = pairs.map((pair) => pair.id);
    setWordOrder(shuffleIds(ids));
    setImageOrder(shuffleIds(ids));
    setSelectedWordId(null);
    setMatched({});
    setWrongImageId(null);
    setJustCompleted(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pairs derived via pairsKey
  }, [slide.id, pairsKey]);

  useEffect(() => {
    if (!completed || justCompleted) return;
    setJustCompleted(true);
    playQuizTone('complete');
  }, [completed, justCompleted]);

  function handleReset() {
    const ids = pairs.map((pair) => pair.id);
    setWordOrder(shuffleIds(ids));
    setImageOrder(shuffleIds(ids));
    setSelectedWordId(null);
    setMatched({});
    setWrongImageId(null);
    setJustCompleted(false);
    onRequestTimerReset?.();
  }

  function handleSelectWord(wordId: string) {
    if (locked || !timerStarted) return;
    if (matched[wordId]) return;
    setSelectedWordId(wordId);
    setWrongImageId(null);
  }

  function handleSelectImage(imageId: string) {
    if (locked || !timerStarted) return;
    if (matched[imageId]) return;
    if (!selectedWordId) return;

    if (selectedWordId === imageId) {
      setMatched((prev) => ({ ...prev, [imageId]: true }));
      setSelectedWordId(null);
      setWrongImageId(null);
      const nextCount = matchedCount + 1;
      if (nextCount < pairs.length) playQuizTone('correct');
      return;
    }

    setWrongImageId(imageId);
    playQuizTone('wrong');
    window.setTimeout(() => {
      setWrongImageId((current) => (current === imageId ? null : current));
      setSelectedWordId(null);
    }, 450);
  }

  const orderedWords = wordOrder
    .map((id) => pairs.find((pair) => pair.id === id))
    .filter((pair): pair is (typeof pairs)[number] => Boolean(pair));

  const orderedImages = imageOrder
    .map((id) => pairs.find((pair) => pair.id === id))
    .filter((pair): pair is (typeof pairs)[number] => Boolean(pair));

  if (pairs.length === 0) {
    return (
      <div className="flex h-full min-h-[120px] items-center justify-center border-4 border-dashed border-[var(--comic-black)]/40 bg-white/60 p-4">
        <ComicText className="text-center font-bold text-[var(--comic-dark)]">
          Add vocabulary words and image URLs in the editor (up to 6 pairs).
        </ComicText>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ComicText
          className={[
            'font-black',
            compact ? 'text-xs' : present ? 'text-lg md:text-xl' : 'text-sm',
          ].join(' ')}
        >
          {matchedCount} / {pairs.length} matched
          {completed ? ' · Done!' : ''}
          {timeUp && !completed ? ' · Time’s up' : ''}
          {timerEnabled && !timerStarted ? ' · Start the timer to play' : ''}
        </ComicText>
        <ComicButton type="button" variant="secondary" size="sm" onClick={handleReset}>
          Shuffle & reset
        </ComicButton>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {orderedWords.map((pair) => {
          const isMatched = Boolean(matched[pair.id]);
          const isSelected = selectedWordId === pair.id;
          return (
            <button
              key={`word-${pair.id}`}
              type="button"
              disabled={locked || !timerStarted || isMatched}
              onClick={() => handleSelectWord(pair.id)}
              className={[
                'border-4 border-[var(--comic-black)] font-black transition comic-shadow-sm',
                compact ? 'px-2 py-1 text-xs' : present ? 'px-4 py-2 text-xl md:text-2xl' : 'px-3 py-1.5 text-base',
                isMatched
                  ? 'bg-white text-[var(--comic-dark)] opacity-50'
                  : isSelected
                    ? 'bg-[var(--comic-secondary)] text-white scale-[1.03]'
                    : 'bg-white text-[var(--comic-secondary)] hover:brightness-95',
              ].join(' ')}
              style={
                isMatched
                  ? { outline: `3px solid ${QUIZ_CORRECT}`, outlineOffset: 2 }
                  : undefined
              }
            >
              {pair.word}
            </button>
          );
        })}
      </div>

      <div
        className={[
          'grid min-h-0 flex-1 gap-2',
          imageGridClass(pairs.length, compact),
        ].join(' ')}
      >
        {orderedImages.map((pair) => {
          const isMatched = Boolean(matched[pair.id]);
          const isWrong = wrongImageId === pair.id;
          return (
            <button
              key={`image-${pair.id}`}
              type="button"
              disabled={locked || !timerStarted || isMatched || !selectedWordId}
              onClick={() => handleSelectImage(pair.id)}
              className={[
                'relative overflow-hidden border-4 border-[var(--comic-black)] bg-white comic-shadow-sm transition',
                isMatched ? 'opacity-90' : '',
                !selectedWordId && !isMatched ? 'cursor-default' : '',
              ].join(' ')}
              style={{
                outline: isMatched
                  ? `3px solid ${QUIZ_CORRECT}`
                  : isWrong
                    ? `3px solid ${QUIZ_WRONG}`
                    : undefined,
                outlineOffset: 2,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pair.imageUrl}
                alt={pair.word}
                className={[
                  'h-full w-full object-cover',
                  compact ? 'min-h-[64px] max-h-[100px]' : present ? 'min-h-[140px]' : 'min-h-[100px] max-h-[180px]',
                ].join(' ')}
              />
              {isMatched ? (
                <span
                  className={[
                    'absolute inset-x-0 bottom-0 bg-white/90 font-black text-center',
                    compact ? 'text-[10px] py-0.5' : present ? 'text-base py-1' : 'text-sm py-1',
                  ].join(' ')}
                  style={{ color: QUIZ_CORRECT }}
                >
                  {pair.word}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {!compact && selectedWordId && !locked ? (
        <ComicText className="text-center text-sm font-bold text-[var(--comic-dark)]">
          Now tap the matching picture
        </ComicText>
      ) : null}
    </div>
  );
}
