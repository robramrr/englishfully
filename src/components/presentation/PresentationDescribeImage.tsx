'use client';

import { useEffect, useMemo, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import type { PresentationSlide } from '@/lib/presentation/types';

const QUIZ_CORRECT = '#15803d';
const QUIZ_WRONG = '#ea1225';

interface PresentationDescribeImageProps {
  slide: PresentationSlide;
  present?: boolean;
  compact?: boolean;
}

function playQuizTone(kind: 'correct' | 'wrong' | 'complete' | 'timeup') {
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
    osc.frequency.setValueAtTime(kind === 'timeup' ? 160 : 180, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + (kind === 'timeup' ? 0.45 : 0.28));
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === 'timeup' ? 0.5 : 0.32));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + (kind === 'timeup' ? 0.55 : 0.35));
    window.setTimeout(() => void ctx.close(), 700);
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

/**
 * Present-mode Describe + image: tap word tags — green if they match the picture,
 * red if not. Optional countdown. Completes when enough matching words are found.
 */
export default function PresentationDescribeImage({
  slide,
  present = false,
  compact = false,
}: PresentationDescribeImageProps) {
  const words = useMemo(
    () =>
      (slide.describeWords || [])
        .map((word) => ({
          id: word.id,
          text: word.text.trim(),
          matches: word.matches !== false,
        }))
        .filter((word) => word.text),
    [slide.describeWords]
  );

  const matchCount = words.filter((word) => word.matches).length;
  const wordsNeeded = Math.max(
    1,
    Math.min(slide.describeWordsNeeded || 10, Math.max(matchCount, 1))
  );
  const timerEnabled = Boolean(slide.describeTimerEnabled);
  const timerSeconds = Math.max(1, Math.min(600, slide.describeTimerSeconds || 60));

  const [order, setOrder] = useState<string[]>([]);
  const [picked, setPicked] = useState<Record<string, 'correct' | 'wrong'>>({});
  const [started, setStarted] = useState(!timerEnabled);
  const [secondsLeft, setSecondsLeft] = useState(timerSeconds);
  const [timeUp, setTimeUp] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const correctFound = Object.values(picked).filter((value) => value === 'correct').length;
  const completed = correctFound >= wordsNeeded;
  const locked = completed || timeUp;

  const wordsKey = words.map((word) => `${word.id}:${word.text}:${word.matches}`).join('|');

  useEffect(() => {
    setOrder(shuffleIds(words.map((word) => word.id)));
    setPicked({});
    setStarted(!timerEnabled);
    setSecondsLeft(timerSeconds);
    setTimeUp(false);
    setJustCompleted(false);
    // Reset when slide identity or word bank / timer settings change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- words derived via wordsKey
  }, [slide.id, wordsKey, timerEnabled, timerSeconds]);

  useEffect(() => {
    if (!timerEnabled || !started || locked) return;
    if (secondsLeft <= 0) {
      setTimeUp(true);
      playQuizTone('timeup');
      return;
    }
    const id = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(id);
  }, [timerEnabled, started, locked, secondsLeft]);

  useEffect(() => {
    if (!completed || justCompleted) return;
    setJustCompleted(true);
    playQuizTone('complete');
  }, [completed, justCompleted]);

  function handleStart() {
    setStarted(true);
    setSecondsLeft(timerSeconds);
    setTimeUp(false);
    setPicked({});
    setJustCompleted(false);
    setOrder(shuffleIds(words.map((word) => word.id)));
  }

  function handleReset() {
    setPicked({});
    setStarted(!timerEnabled);
    setSecondsLeft(timerSeconds);
    setTimeUp(false);
    setJustCompleted(false);
    setOrder(shuffleIds(words.map((word) => word.id)));
  }

  function handlePick(wordId: string) {
    if (locked || (timerEnabled && !started)) return;
    if (picked[wordId]) return;
    const word = words.find((item) => item.id === wordId);
    if (!word) return;
    const result = word.matches ? 'correct' : 'wrong';
    setPicked((prev) => ({ ...prev, [wordId]: result }));
    if (result === 'correct') {
      const nextCount = correctFound + 1;
      if (nextCount < wordsNeeded) playQuizTone('correct');
    } else {
      playQuizTone('wrong');
    }
  }

  const orderedWords = order
    .map((id) => words.find((word) => word.id === id))
    .filter((word): word is (typeof words)[number] => Boolean(word));

  const imageUrl = slide.imageUrl.trim();

  return (
    <div className={['flex h-full min-h-0 flex-col gap-3', compact ? 'gap-2' : ''].join(' ')}>
      <div
        className={[
          'flex flex-wrap items-center justify-between gap-2 rounded-lg border-4 border-[var(--comic-black)] bg-white/90 p-3 comic-shadow-sm',
          compact ? 'p-2' : '',
        ].join(' ')}
      >
        <div className="flex flex-wrap items-center gap-3">
          <ComicText className="font-black text-[var(--comic-dark)]">
            {correctFound} / {wordsNeeded} words
          </ComicText>
          {timerEnabled ? (
            <span
              className="font-black"
              style={{
                color: timeUp || secondsLeft <= 5 ? QUIZ_WRONG : 'var(--comic-dark)',
              }}
            >
              {started ? `${secondsLeft}s` : `${timerSeconds}s timer`}
            </span>
          ) : null}
          {completed ? (
            <span className="font-black" style={{ color: QUIZ_CORRECT }}>
              Complete!
            </span>
          ) : null}
          {timeUp && !completed ? (
            <span className="font-black" style={{ color: QUIZ_WRONG }}>
              Time's up
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {timerEnabled && !started ? (
            <ComicButton type="button" variant="secondary" size="sm" onClick={handleStart}>
              Start
            </ComicButton>
          ) : null}
          <ComicButton type="button" variant="accent" size="sm" onClick={handleReset}>
            Reset
          </ComicButton>
        </div>
      </div>

      <div
        className={[
          'grid min-h-0 flex-1 gap-3',
          compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2',
        ].join(' ')}
      >
        <div className="min-h-0 overflow-hidden">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={slide.imageAlt || 'Describe this image'}
              className={[
                'h-full max-h-full w-full border-4 border-[var(--comic-black)] object-cover comic-shadow-md bg-white',
                compact ? 'max-h-40' : present ? 'max-h-[52vh]' : 'max-h-72',
              ].join(' ')}
            />
          ) : (
            <div className="flex h-full min-h-[8rem] items-center justify-center border-4 border-dashed border-[var(--comic-black)]/40 bg-[var(--comic-light)] font-bold text-[var(--comic-dark)]">
              Add an image URL
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-col gap-2 overflow-auto">
          {words.length === 0 ? (
            <ComicText className="font-bold text-[var(--comic-dark)]/60">
              Add words in the editor (or Analyze the image).
            </ComicText>
          ) : (
            <div className="flex flex-wrap content-start gap-2">
              {orderedWords.map((word) => {
                const state = picked[word.id];
                const bg =
                  state === 'correct'
                    ? QUIZ_CORRECT
                    : state === 'wrong'
                      ? QUIZ_WRONG
                      : 'var(--comic-light)';
                const color = state ? '#fff' : 'var(--comic-dark)';
                return (
                  <button
                    key={word.id}
                    type="button"
                    disabled={locked || Boolean(state) || (timerEnabled && !started)}
                    onClick={() => handlePick(word.id)}
                    className={[
                      'rounded-md border-2 border-[var(--comic-black)] px-3 py-1.5 font-bold transition-transform comic-shadow-sm',
                      present && !state ? 'hover:-translate-y-0.5' : '',
                      compact ? 'text-sm' : present ? 'text-lg md:text-xl' : 'text-base',
                    ].join(' ')}
                    style={{ backgroundColor: bg, color }}
                  >
                    {word.text}
                  </button>
                );
              })}
            </div>
          )}
          {timerEnabled && !started ? (
            <ComicText className="text-sm font-bold text-[var(--comic-dark)]/70">
              Press Start when the class is ready.
            </ComicText>
          ) : null}
        </div>
      </div>
    </div>
  );
}
