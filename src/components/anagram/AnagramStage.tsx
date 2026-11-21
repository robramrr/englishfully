'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faCompress,
  faExpand,
  faLightbulb,
  faRotateRight,
  faVolumeHigh,
} from '@fortawesome/free-solid-svg-icons';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import {
  anagramWordsReady,
  httpUrl,
  puzzleWord,
  type AnagramActivity,
  type AnagramWord,
} from '@/lib/anagram/types';

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type SlotMark = 'empty' | 'check' | 'wrong' | 'revealed';

interface LetterTile {
  id: string;
  letter: string;
  placed: boolean;
}

interface LetterSlot {
  tileId: string | null;
  letter: string;
  mark: SlotMark;
}

interface Round {
  wordId: string;
  answer: string;
  tiles: LetterTile[];
  slots: LetterSlot[];
  solved: boolean;
  timedOut: boolean;
}

interface DragState {
  tileId: string;
  letter: string;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  moved: boolean;
}

type WordResult = 'solved' | 'timeout';
type RevealStep = 0 | 1 | 2;

function currentFullscreenElement(): Element | null {
  const doc = document as FullscreenDocument;
  return document.fullscreenElement || doc.webkitFullscreenElement || null;
}

function presentationOverlayRoot(self: HTMLElement | null): HTMLElement {
  const fullscreen = currentFullscreenElement();
  if (fullscreen instanceof HTMLElement && fullscreen !== self) return fullscreen;
  return document.body;
}

let sharedAudio: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudio) sharedAudio = new Ctx();
  if (sharedAudio.state === 'suspended') void sharedAudio.resume();
  return sharedAudio;
}

function tone(
  ctx: AudioContext,
  type: OscillatorType,
  from: number,
  to: number,
  start: number,
  duration: number,
  volume: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, to), start + duration);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function playGood() {
  const ctx = audioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, 'sine', 523, 523, now, 0.12, 0.16);
  tone(ctx, 'sine', 659, 659, now + 0.1, 0.12, 0.16);
  tone(ctx, 'sine', 784, 784, now + 0.2, 0.22, 0.18);
}

function playBad() {
  const ctx = audioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, 'sawtooth', 196, 90, now, 0.18, 0.14);
  tone(ctx, 'square', 140, 70, now + 0.16, 0.28, 0.1);
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

function scrambleLetters(answer: string): string[] {
  const letters = answer.split('');
  if (letters.length < 2) return letters;
  const unique = new Set(letters);
  if (unique.size < 2) return letters;
  let next = letters.slice();
  for (let guard = 0; guard < 8 && next.join('') === answer; guard += 1) {
    next = letters.slice();
    for (let index = next.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      const current = next[index];
      next[index] = next[swap];
      next[swap] = current;
    }
  }
  if (next.join('') === answer) {
    const first = next[0];
    next[0] = next[1];
    next[1] = first;
  }
  return next;
}

function buildRound(item: AnagramWord): Round {
  const answer = puzzleWord(item.word);
  return {
    wordId: item.id,
    answer,
    tiles: scrambleLetters(answer).map((letter, index) => ({
      id: `${item.id}-${index}-${letter}`,
      letter,
      placed: false,
    })),
    slots: answer.split('').map(() => ({ tileId: null, letter: '', mark: 'empty' as const })),
    solved: false,
    timedOut: false,
  };
}

function hasClue(item: AnagramWord): boolean {
  return Boolean(item.clue.trim());
}

function hasImage(item: AnagramWord): boolean {
  return Boolean(httpUrl(item.imageUrl));
}

function nextReveal(step: RevealStep, item: AnagramWord): RevealStep {
  const clue = hasClue(item);
  const image = hasImage(item);
  if (step === 0) {
    if (clue) return 1;
    if (image) return 2;
    return 0;
  }
  if (step === 1) return image ? 2 : 0;
  return 0;
}

export default function AnagramStage({
  activityId,
  onClose,
  overlay = false,
}: {
  activityId: string;
  onClose?: () => void;
  overlay?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const roundRef = useRef<Round | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutFired = useRef(false);
  const [activity, setActivity] = useState<AnagramActivity | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [round, setRound] = useState<Round | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [dragSize, setDragSize] = useState(120);
  const [reveal, setReveal] = useState<RevealStep>(0);
  const [remaining, setRemaining] = useState(0);
  const [results, setResults] = useState<Record<string, WordResult>>({});
  const [finished, setFinished] = useState(false);
  const [overlayRoot, setOverlayRoot] = useState<HTMLElement | null>(null);
  const [fullscreenOwner, setFullscreenOwner] = useState<'self' | 'other' | 'none'>('none');

  const words = useMemo(
    () => (activity ? anagramWordsReady(activity.words) : []),
    [activity]
  );
  const word = words[cursor] ?? null;

  const commitRound = useCallback((next: Round | null) => {
    roundRef.current = next;
    setRound(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    void (async () => {
      try {
        const response = await fetch(`/api/anagram/activities/${activityId}`, { cache: 'no-store' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Failed to load activity');
        if (!cancelled) setActivity(data.activity as AnagramActivity);
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

  useEffect(() => {
    setCursor(0);
    setAttempt(0);
    setResults({});
    setFinished(false);
    setReveal(0);
  }, [activity?.id]);

  useEffect(() => {
    if (!word) {
      commitRound(null);
      return;
    }
    timeoutFired.current = false;
    setReveal(0);
    commitRound(buildRound(word));
  }, [word, attempt, commitRound]);

  useEffect(() => {
    if (!activity?.timerEnabled || !word || !round) return;
    if (round.wordId !== word.id || round.solved || round.timedOut) return;
    const total = activity.secondsPerWord;
    setRemaining(total);
    const started = Date.now();
    const id = window.setInterval(() => {
      const leftMs = total * 1000 - (Date.now() - started);
      setRemaining(Math.max(0, Math.ceil(leftMs / 1000)));
      if (leftMs <= 0) {
        window.clearInterval(id);
        if (timeoutFired.current) return;
        timeoutFired.current = true;
        const current = roundRef.current;
        if (!current || current.wordId !== word.id || current.solved || current.timedOut) return;
        playBad();
        commitRound({
          ...current,
          timedOut: true,
          slots: current.answer.split('').map((letter) => ({
            tileId: null,
            letter,
            mark: 'revealed' as const,
          })),
        });
        setResults((prev) =>
          prev[word.id] === 'solved' ? prev : { ...prev, [word.id]: 'timeout' }
        );
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [
    activity?.timerEnabled,
    activity?.secondsPerWord,
    word,
    round?.wordId,
    round?.solved,
    round?.timedOut,
    attempt,
    commitRound,
  ]);

  useEffect(() => {
    if (!overlay) return;
    const update = () => setOverlayRoot(presentationOverlayRoot(rootRef.current));
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

  const exitOwnFullscreen = useCallback(async () => {
    if (currentFullscreenElement() !== rootRef.current) return;
    const doc = document as FullscreenDocument;
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
    } catch {
      // The browser may already be leaving fullscreen.
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = rootRef.current as FullscreenElement | null;
    if (!el || (currentFullscreenElement() && currentFullscreenElement() !== el)) return;
    const doc = document as FullscreenDocument;
    try {
      if (currentFullscreenElement() === el) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
        return;
      }
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    } catch {
      // The browser may deny fullscreen without a user gesture.
    }
  }, []);

  const close = useCallback(() => {
    if (!onClose) return;
    void exitOwnFullscreen().finally(onClose);
  }, [exitOwnFullscreen, onClose]);

  const placeAt = useCallback(
    (tileId: string, slotIndex: number) => {
      const current = roundRef.current;
      if (!current || current.solved || current.timedOut || !word) return;
      const tile = current.tiles.find((item) => item.id === tileId);
      const slot = current.slots[slotIndex];
      if (!tile || tile.placed || !slot || slot.mark === 'check' || slot.mark === 'wrong') return;
      audioContext();
      const correct = tile.letter === current.answer[slotIndex];
      if (correct) {
        playGood();
        const slots = current.slots.map((item, index) =>
          index === slotIndex
            ? { tileId, letter: tile.letter, mark: 'check' as const }
            : item
        );
        const tiles = current.tiles.map((item) =>
          item.id === tileId ? { ...item, placed: true } : item
        );
        const solved = slots.every((item) => item.mark === 'check');
        commitRound({ ...current, slots, tiles, solved });
        if (solved) {
          setResults((prev) => ({ ...prev, [word.id]: 'solved' }));
        }
        return;
      }
      playBad();
      const slots = current.slots.map((item, index) =>
        index === slotIndex ? { tileId, letter: tile.letter, mark: 'wrong' as const } : item
      );
      const tiles = current.tiles.map((item) =>
        item.id === tileId ? { ...item, placed: true } : item
      );
      commitRound({ ...current, slots, tiles });
      window.setTimeout(() => {
        const latest = roundRef.current;
        if (!latest || latest.wordId !== current.wordId) return;
        const stuck = latest.slots[slotIndex];
        if (!stuck || stuck.mark !== 'wrong' || stuck.tileId !== tileId) return;
        commitRound({
          ...latest,
          slots: latest.slots.map((item, index) =>
            index === slotIndex ? { tileId: null, letter: '', mark: 'empty' as const } : item
          ),
          tiles: latest.tiles.map((item) =>
            item.id === tileId ? { ...item, placed: false } : item
          ),
        });
      }, 720);
    },
    [commitRound, word]
  );

  const placeInFirstEmpty = useCallback(
    (tileId: string) => {
      const current = roundRef.current;
      if (!current) return;
      const slotIndex = current.slots.findIndex((slot) => slot.mark === 'empty');
      if (slotIndex < 0) return;
      placeAt(tileId, slotIndex);
    },
    [placeAt]
  );

  function setDragBoth(next: DragState | null) {
    dragRef.current = next;
    setDrag(next);
  }

  function onTilePointerDown(event: React.PointerEvent<HTMLButtonElement>, tile: LetterTile) {
    if (event.button !== 0 || tile.placed || !round || round.solved || round.timedOut) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragSize(event.currentTarget.getBoundingClientRect().width);
    setDragBoth({
      tileId: tile.id,
      letter: tile.letter,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    });
  }

  function onTilePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const moved =
      current.moved || Math.hypot(event.clientX - current.startX, event.clientY - current.startY) > 8;
    setDragBoth({ ...current, x: event.clientX, y: event.clientY, moved });
  }

  function onTilePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    setDragBoth(null);
    if (!current.moved) {
      placeInFirstEmpty(current.tileId);
      return;
    }
    const ghost = document.getElementById('anagram-drag-ghost');
    if (ghost) ghost.style.display = 'none';
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    const slotEl = hit instanceof Element ? hit.closest('[data-slot]') : null;
    if (!(slotEl instanceof HTMLElement)) return;
    const slotIndex = Number(slotEl.dataset.slot);
    if (!Number.isFinite(slotIndex)) return;
    placeAt(current.tileId, slotIndex);
  }

  function playWordAudio(item: AnagramWord) {
    audioContext();
    if (item.audioMode === 'url') {
      const src = httpUrl(item.audioUrl);
      if (!src) return;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const audio = new Audio(src);
      audioRef.current = audio;
      void audio.play().catch(() => {
        audioRef.current = null;
      });
      return;
    }
    if (item.audioMode === 'tts') speakWord(puzzleWord(item.word));
  }

  const goPrevious = useCallback(() => {
    setFinished(false);
    setCursor((current) => Math.max(0, current - 1));
  }, []);

  const goNext = useCallback(() => {
    setCursor((current) => {
      if (current >= words.length - 1) {
        setFinished(true);
        return current;
      }
      return current + 1;
    });
  }, [words.length]);

  function formatClock(total: number) {
    const safe = Math.max(0, total);
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  function restartWord() {
    if (!word) return;
    setResults((prev) => {
      if (!prev[word.id]) return prev;
      const next = { ...prev };
      delete next[word.id];
      return next;
    });
    setAttempt((value) => value + 1);
  }

  function playAgain() {
    setFinished(false);
    setResults({});
    setCursor(0);
    setAttempt((value) => value + 1);
  }

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
      if (onClose && (event.key === ' ' || event.key === 'PageDown' || event.key === 'PageUp')) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (event.key === 'f' || event.key === 'F') {
        if (onClose) {
          event.preventDefault();
          event.stopPropagation();
        }
        if (fullscreenOwner === 'other') return;
        event.preventDefault();
        void toggleFullscreen();
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        event.stopPropagation();
        if (finished) return;
        goNext();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        event.stopPropagation();
        if (finished) {
          setFinished(false);
          setCursor(Math.max(0, words.length - 1));
          return;
        }
        goPrevious();
      }
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [finished, fullscreenOwner, goNext, goPrevious, onClose, toggleFullscreen, words.length]);

  const title = activity?.title?.trim() || activity?.topic?.trim() || 'Anagram';
  const solvedCount = Object.values(results).filter((result) => result === 'solved').length;
  const clueOn = Boolean(activity?.cluesEnabled && word && (hasClue(word) || hasImage(word)));
  const canListen = Boolean(
    word &&
      ((word.audioMode === 'tts' && puzzleWord(word.word)) ||
        (word.audioMode === 'url' && httpUrl(word.audioUrl)))
  );
  const roundSettled = Boolean(round?.solved || round?.timedOut);

  const body = (
    <div
      ref={rootRef}
      className={[
        'anagram-stage flex flex-col overflow-hidden bg-[var(--comic-light)] text-[var(--comic-dark)]',
        overlay ? 'fixed inset-0 z-[120]' : 'fixed inset-0 z-[40]',
      ].join(' ')}
    >
      <style>{`
        @keyframes anagram-mark-x {
          0% { transform: scale(0.05) rotate(-32deg); opacity: 0; }
          55% { transform: scale(1.55) rotate(12deg); opacity: 1; }
          100% { transform: scale(1.18) rotate(-8deg); opacity: 1; }
        }
        @keyframes anagram-mark-check {
          0% { transform: scale(0.2) rotate(-12deg); }
          55% { transform: scale(1.35) rotate(6deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes anagram-slot-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px) rotate(-3deg); }
          40% { transform: translateX(8px) rotate(3deg); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        .anagram-mark-x {
          animation: anagram-mark-x 0.42s cubic-bezier(.2,1.6,.3,1) both;
          -webkit-text-stroke: 0.06em #111;
          paint-order: stroke fill;
        }
        .anagram-mark-check { animation: anagram-mark-check 0.38s cubic-bezier(.2,1.5,.3,1) both; }
        .anagram-slot-shake { animation: anagram-slot-shake 0.42s linear; }
        .anagram-letter-box {
          --anagram-tile: min(
            calc((68vw - (var(--anagram-letters) - 1) * 0.7rem) / var(--anagram-letters)),
            13vmin
          );
          width: var(--anagram-tile);
          height: var(--anagram-tile);
          font-size: calc(var(--anagram-tile) * 0.52);
          border-width: max(4px, calc(var(--anagram-tile) * 0.045));
        }
      `}</style>
      <header
        className={[
          'flex shrink-0 flex-wrap items-center gap-2 border-b-4 border-[var(--comic-black)] bg-white px-3 py-2 md:gap-3 md:px-5',
          fullscreenOwner === 'self' ? 'hidden' : '',
        ].join(' ')}
      >
        <h1 className="min-w-0 flex-1 truncate font-bungee text-xl text-[var(--comic-secondary)] md:text-3xl">
          {title}
        </h1>
        {words.length > 0 && !finished ? (
          <p className="shrink-0 text-sm font-black md:text-lg">
            {cursor + 1} / {words.length}
          </p>
        ) : null}
        {fullscreenOwner !== 'other' ? (
          <ComicButton
            type="button"
            variant="success"
            size="sm"
            className="!px-3 sm:!px-4"
            onClick={() => void toggleFullscreen()}
          >
            <FontAwesomeIcon
              icon={fullscreenOwner === 'self' ? faCompress : faExpand}
              className="h-4 w-4 sm:mr-2"
            />
            <span className="hidden sm:inline">
              {fullscreenOwner === 'self' ? 'Exit full screen' : 'Full screen'}
            </span>
            <span className="sr-only sm:hidden">
              {fullscreenOwner === 'self' ? 'Exit full screen' : 'Full screen'}
            </span>
          </ComicButton>
        ) : null}
        {onClose ? (
          <ComicButton type="button" variant="warning" size="sm" onClick={close}>
            Back
          </ComicButton>
        ) : null}
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {fullscreenOwner === 'self' ? (
          <div className="absolute right-3 top-3 z-20">
            <ComicButton
              type="button"
              variant="success"
              size="sm"
              className="!px-3"
              onClick={() => void toggleFullscreen()}
            >
              <FontAwesomeIcon icon={faCompress} className="h-4 w-4" />
              <span className="sr-only">Exit full screen</span>
            </ComicButton>
          </div>
        ) : null}

        {loading ? (
          <div className="flex flex-1 items-center justify-center px-6">
            <ComicText className="font-bold">Loading anagram…</ComicText>
          </div>
        ) : null}
        {error ? (
          <div className="flex flex-1 items-center justify-center px-6">
            <ComicText className="text-center font-bold text-[var(--comic-danger)]">{error}</ComicText>
          </div>
        ) : null}
        {!loading && !error && words.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-6">
            <ComicText className="max-w-md text-center font-bold">
              This activity has no words yet. Add a word with at least two letters, then come back.
            </ComicText>
          </div>
        ) : null}

        {!loading && !error && finished ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="font-bungee text-4xl text-[var(--comic-success)] md:text-6xl">All done</p>
            <ComicText className="text-xl font-black">
              {solvedCount} of {words.length} unscrambled
              {activity?.timerEnabled
                ? ` · ${words.length - solvedCount} ran out of time`
                : ''}
            </ComicText>
            <ComicButton type="button" variant="primary" size="md" onClick={playAgain}>
              Play again
            </ComicButton>
          </div>
        ) : null}

        {!loading && !error && word && round && !finished ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[2.5vh] overflow-auto px-[3vw] py-[2vh]">
            <div className="flex shrink-0 flex-wrap items-center justify-center gap-3">
              <p className="font-black md:text-2xl">
                Word {cursor + 1} of {words.length}
              </p>
              {activity?.timerEnabled ? (
                <p
                  className={[
                    'border-4 border-[var(--comic-black)] bg-white px-3 py-1 font-bungee text-2xl',
                    remaining <= 5 ? 'text-[var(--comic-danger)]' : 'text-[var(--comic-secondary)]',
                  ].join(' ')}
                  aria-live="polite"
                >
                  {formatClock(remaining)}
                </p>
              ) : null}
            </div>

            {reveal > 0 ? (
              <div className="flex w-full max-w-5xl shrink-0 flex-col items-center gap-4 border-4 border-[var(--comic-black)] bg-white px-6 py-5 text-center">
                {reveal >= 1 && hasClue(word) ? (
                  <p className="font-black leading-snug text-[clamp(1.75rem,3.4vmin,3.25rem)]">{word.clue}</p>
                ) : null}
                {reveal === 2 && hasImage(word) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={httpUrl(word.imageUrl)}
                    alt=""
                    className="max-h-[32vh] w-auto max-w-full object-contain"
                  />
                ) : null}
              </div>
            ) : null}

            {round.solved ? (
              <p className="font-bungee text-2xl text-[var(--comic-success)]">Correct</p>
            ) : null}
            {round.timedOut ? (
              <p className="font-bungee text-2xl text-[var(--comic-danger)]">Time&apos;s up</p>
            ) : null}

            <div
              className="anagram-board flex w-full shrink-0 flex-col items-center justify-center gap-[2.5vh]"
              style={{ ['--anagram-letters' as string]: String(Math.max(round.slots.length, 1)) }}
            >
              <div className="flex max-w-full flex-wrap items-center justify-center gap-[1.2vw]">
                {round.slots.map((slot, index) => (
                  <div
                    key={`${round.wordId}-slot-${index}`}
                    data-slot={index}
                    className={[
                      'anagram-letter-box relative flex items-center justify-center border-[var(--comic-black)] font-bungee uppercase leading-none',
                      slot.mark === 'check' ? 'bg-[var(--comic-success)] text-white' : '',
                      slot.mark === 'wrong' ? 'anagram-slot-shake bg-[var(--comic-danger)] text-white' : '',
                      slot.mark === 'revealed' ? 'bg-[var(--comic-yellow)] text-[var(--comic-dark)]' : '',
                      slot.mark === 'empty' ? 'bg-white text-[var(--comic-dark)]' : '',
                    ].join(' ')}
                  >
                    {slot.letter}
                    {slot.mark === 'wrong' ? (
                      <span className="anagram-mark-x pointer-events-none absolute inset-[-30%] flex items-center justify-center font-black leading-none text-white drop-shadow-[0.08em_0.08em_0_#111] text-[1.35em]">
                        ✕
                      </span>
                    ) : null}
                    {slot.mark === 'check' ? (
                      <span className="anagram-mark-check pointer-events-none absolute -right-[8%] -top-[8%] flex aspect-square w-[36%] items-center justify-center rounded-full border-[0.12em] border-[var(--comic-black)] bg-white text-[0.42em] text-[var(--comic-success)]">
                        ✓
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="flex max-w-full flex-wrap items-center justify-center gap-[1.2vw]">
                {round.tiles.map((tile) => (
                  <button
                    key={tile.id}
                    type="button"
                    disabled={tile.placed || roundSettled}
                    onPointerDown={(event) => onTilePointerDown(event, tile)}
                    onPointerMove={onTilePointerMove}
                    onPointerUp={onTilePointerUp}
                    onPointerCancel={() => setDragBoth(null)}
                    className={[
                      'anagram-letter-box flex items-center justify-center border-[var(--comic-black)] bg-[var(--comic-secondary)] font-bungee uppercase leading-none text-white shadow-[0.08em_0.08em_0_#111] touch-none select-none',
                      tile.placed ? 'hidden' : 'cursor-grab active:cursor-grabbing',
                      drag?.tileId === tile.id ? 'opacity-40' : '',
                    ].join(' ')}
                    aria-label={`Letter ${tile.letter}`}
                  >
                    {tile.letter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {word && round && !finished ? (
        <footer className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t-4 border-[var(--comic-black)] bg-white px-3 py-2 md:px-5 md:py-3">
          <ComicButton
            type="button"
            variant="secondary"
            size="md"
            disabled={cursor <= 0}
            onClick={goPrevious}
            className="!px-3 sm:!px-5"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sr-only sm:hidden">Previous</span>
          </ComicButton>
          {canListen ? (
            <ComicButton type="button" variant="accent" size="md" onClick={() => playWordAudio(word)}>
              <FontAwesomeIcon icon={faVolumeHigh} className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">Listen</span>
              <span className="sr-only sm:hidden">Listen</span>
            </ComicButton>
          ) : null}
          {clueOn ? (
            <ComicButton
              type="button"
              variant="warning"
              size="md"
              onClick={() => setReveal((step) => nextReveal(step, word))}
            >
              <FontAwesomeIcon icon={faLightbulb} className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">
                {reveal === 0 ? 'Clue' : reveal === 1 && hasImage(word) ? 'Picture' : 'Hide'}
              </span>
              <span className="sr-only sm:hidden">
                {reveal === 0 ? 'Clue' : reveal === 1 && hasImage(word) ? 'Picture' : 'Hide'}
              </span>
            </ComicButton>
          ) : null}
          {!round.solved ? (
            <ComicButton
              type="button"
              variant="secondary"
              size="md"
              onClick={restartWord}
            >
              <FontAwesomeIcon icon={faRotateRight} className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">Restart word</span>
              <span className="sr-only sm:hidden">Restart word</span>
            </ComicButton>
          ) : null}
          <ComicButton type="button" variant="primary" size="md" onClick={goNext} className="!px-3 sm:!px-5">
            <span className="hidden sm:inline">{cursor >= words.length - 1 ? 'Finish' : 'Next'}</span>
            <span className="sr-only sm:hidden">{cursor >= words.length - 1 ? 'Finish' : 'Next'}</span>
            <FontAwesomeIcon icon={faArrowRight} className="h-5 w-5 sm:ml-2" />
          </ComicButton>
        </footer>
      ) : null}

      {drag ? (
        <div
          id="anagram-drag-ghost"
          className="pointer-events-none fixed z-[200] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center border-[var(--comic-black)] bg-[var(--comic-primary)] font-bungee uppercase leading-none text-white shadow-[0.08em_0.08em_0_#111]"
          style={{
            left: drag.x,
            top: drag.y,
            width: dragSize,
            height: dragSize,
            fontSize: dragSize * 0.52,
            borderWidth: Math.max(4, dragSize * 0.045),
          }}
        >
          {drag.letter}
        </div>
      ) : null}
    </div>
  );

  if (!overlay) return body;
  if (!overlayRoot) return null;
  return createPortal(body, overlayRoot);
}
