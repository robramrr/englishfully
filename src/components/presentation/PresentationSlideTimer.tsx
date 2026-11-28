'use client';

import { useEffect, useState } from 'react';
import ComicButton from '../ComicButton';
import { formatPieDuration } from '@/lib/presentation/types';

const NAVY = '#001a48';
const WARN = '#ea1225';
const TRACK = '#e7eef8';

function polar(cx: number, cy: number, radius: number, angleFromTop: number) {
  const theta = angleFromTop - Math.PI / 2;
  return {
    x: cx + radius * Math.cos(theta),
    y: cy + radius * Math.sin(theta),
  };
}

/** Remaining-time wedge. 1 = full pie, 0 = empty. Starts at 12 o'clock and shrinks clockwise. */
function remainingPiePath(fraction: number): string {
  const cx = 50;
  const cy = 50;
  const radius = 46;
  const clamped = Math.max(0, Math.min(1, fraction));
  if (clamped <= 0.001) return '';
  if (clamped >= 0.999) {
    const start = polar(cx, cy, radius, 0);
    const mid = polar(cx, cy, radius, Math.PI);
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 1 1 ${mid.x} ${mid.y} A ${radius} ${radius} 0 1 1 ${start.x} ${start.y} Z`;
  }
  const endAngle = clamped * Math.PI * 2;
  const start = polar(cx, cy, radius, 0);
  const end = polar(cx, cy, radius, endAngle);
  const large = endAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y} Z`;
}

export interface SlideTimerState {
  started: boolean;
  secondsLeft: number;
  timeUp: boolean;
}

interface PresentationSlideTimerProps {
  enabled: boolean;
  seconds: number;
  /** Reset key when the slide changes. */
  slideId: string;
  compact?: boolean;
  present?: boolean;
  onStateChange?: (state: SlideTimerState) => void;
}

function playTickTone(urgent = false) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = urgent ? 980 : 720;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(urgent ? 0.09 : 0.05, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (urgent ? 0.07 : 0.05));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
    window.setTimeout(() => void ctx.close(), 200);
  } catch {
    // ignore
  }
}

function playTimeUpTone() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.45);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);
    window.setTimeout(() => void ctx.close(), 700);
  } catch {
    // ignore
  }
}

/**
 * Optional per-slide countdown. One pie that shrinks clockwise until time is up.
 */
export default function PresentationSlideTimer({
  enabled,
  seconds,
  slideId,
  compact = false,
  present = false,
  onStateChange,
}: PresentationSlideTimerProps) {
  const duration = Math.max(1, Math.min(600, seconds || 60));
  const [started, setStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(duration);
  const [timeUp, setTimeUp] = useState(false);

  useEffect(() => {
    setStarted(false);
    setSecondsLeft(duration);
    setTimeUp(false);
  }, [slideId, duration, enabled]);

  useEffect(() => {
    onStateChange?.({ started, secondsLeft, timeUp });
  }, [started, secondsLeft, timeUp, onStateChange]);

  useEffect(() => {
    if (!enabled || !started || timeUp) return;
    if (secondsLeft <= 0) {
      setTimeUp(true);
      playTimeUpTone();
      return;
    }
    playTickTone(secondsLeft <= 5);
    const id = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(id);
  }, [enabled, started, timeUp, secondsLeft]);

  if (!enabled) return null;

  function handleStart() {
    setStarted(true);
    setSecondsLeft(duration);
    setTimeUp(false);
  }

  function handleReset() {
    setStarted(false);
    setSecondsLeft(duration);
    setTimeUp(false);
  }

  const urgent = timeUp || (started && secondsLeft <= 5);
  const shown = timeUp ? 0 : started ? secondsLeft : duration;
  const clock = formatPieDuration(shown);
  const fraction = timeUp ? 0 : started ? secondsLeft / duration : 1;
  const piePx = compact ? 52 : present ? 132 : 96;
  const digitPx = compact ? 9 : present ? (clock.length > 4 ? 14 : 18) : clock.length > 4 ? 11 : 13;
  const fill = urgent ? WARN : NAVY;

  return (
    <div className="flex flex-col items-end gap-1" role="timer" aria-live="polite">
      <button
        type="button"
        className="relative border-0 bg-transparent p-0"
        style={{ width: piePx, height: piePx }}
        aria-label={
          timeUp ? "Time's up" : started ? clock : `Start timer, ${clock}`
        }
        onClick={(event) => {
          event.stopPropagation();
          if (!started && !timeUp) handleStart();
        }}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
          <circle cx="50" cy="50" r="47" fill="#ffffff" stroke={NAVY} strokeWidth="3" />
          <circle cx="50" cy="50" r="46" fill={TRACK} />
          <path d={remainingPiePath(fraction)} fill={fill} />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={[
              'flex aspect-square w-[38%] items-center justify-center rounded-full border-4 border-[var(--comic-black)] bg-white',
              urgent && started ? 'animate-pulse' : '',
            ].join(' ')}
          >
            <span
              className="font-bungee tabular-nums leading-none"
              style={{ fontSize: digitPx, color: fill }}
            >
              {clock}
            </span>
          </div>
        </div>
      </button>
      {timeUp && !compact ? (
        <span className="font-black" style={{ color: WARN }}>
          Time&apos;s up
        </span>
      ) : null}
      {compact ? null : (
        <div className="flex flex-wrap justify-end gap-1">
          {!started ? (
            <ComicButton type="button" variant="secondary" size="sm" onClick={handleStart}>
              Start
            </ComicButton>
          ) : null}
          <ComicButton type="button" variant="accent" size="sm" onClick={handleReset}>
            Reset
          </ComicButton>
        </div>
      )}
    </div>
  );
}
