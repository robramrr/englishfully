'use client';

import { useEffect, useState } from 'react';
import ComicButton from '../ComicButton';

const WARN = '#ea1225';

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
 * Optional per-slide countdown for any layout (classroom think / speak time).
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

  return (
    <div
      className={[
        'flex flex-wrap items-center gap-2 rounded-lg border-4 border-[var(--comic-black)] bg-white/95 comic-shadow-md',
        compact ? 'px-2 py-1' : present ? 'px-4 py-2' : 'px-3 py-2',
      ].join(' ')}
    >
      <span
        className={[
          'font-bungee tabular-nums',
          compact ? 'text-base' : present ? 'text-2xl md:text-3xl' : 'text-xl',
        ].join(' ')}
        style={{ color: urgent ? WARN : 'var(--comic-secondary)' }}
      >
        {started ? `${secondsLeft}s` : `${duration}s`}
      </span>
      {timeUp ? (
        <span className="font-black" style={{ color: WARN }}>
          Time's up
        </span>
      ) : null}
      {!started ? (
        <ComicButton type="button" variant="secondary" size="sm" onClick={handleStart}>
          Start
        </ComicButton>
      ) : null}
      <ComicButton type="button" variant="accent" size="sm" onClick={handleReset}>
        Reset
      </ComicButton>
    </div>
  );
}
