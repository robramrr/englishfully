'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import {
  MAX_PIE_SLICES,
  MAX_PIE_SLICE_SECONDS,
  createEmptyPieSlice,
  formatPieDuration,
  type PresentationPieSlice,
  type PresentationSlide,
} from '@/lib/presentation/types';

const NAVY = '#001a48';
const RED = '#ea1225';

const SLICE_STYLES = [
  { from: '#001a48', to: '#2a5cb8', text: '#ffffff' },
  { from: '#ea1225', to: '#ff6b78', text: '#ffffff' },
  { from: '#ffffff', to: '#d5e2f5', text: '#001a48' },
  { from: '#12336f', to: '#ea1225', text: '#ffffff' },
  { from: '#e5e5e4', to: '#ffffff', text: '#001a48' },
  { from: '#8d1828', to: '#001a48', text: '#ffffff' },
  { from: '#4d74b8', to: '#f4f7fb', text: '#001a48' },
  { from: '#ea1225', to: '#001a48', text: '#ffffff' },
] as const;

let sharedAudio: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!sharedAudio || sharedAudio.state === 'closed') sharedAudio = new AudioCtor();
  if (sharedAudio.state === 'suspended') void sharedAudio.resume();
  return sharedAudio;
}

function playTone(options: {
  frequency: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  toFrequency?: number;
  delay?: number;
}) {
  const ctx = audioContext();
  if (!ctx) return;
  const now = ctx.currentTime + (options.delay || 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = options.type || 'square';
  osc.frequency.setValueAtTime(Math.max(40, options.frequency), now);
  if (options.toFrequency) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(40, options.toFrequency),
      now + options.duration
    );
  }
  const peak = options.gain ?? 0.2;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.03, options.duration));
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + options.duration + 0.03);
}

/** Steady clock tick while a slice still has more than 10 seconds left. */
function playClockTick(secondsLeft: number) {
  const tock = secondsLeft % 2 === 0;
  playTone({
    frequency: tock ? 740 : 1180,
    duration: 0.045,
    type: 'triangle',
    gain: tock ? 0.12 : 0.16,
  });
}

/** Loud game-show countdown used while a slice is running out. */
function playDwindleBeep(secondsLeft: number) {
  const urgent = secondsLeft <= 3;
  const hot = secondsLeft <= 5;
  playTone({
    frequency: urgent ? 620 : 880,
    duration: urgent ? 0.14 : 0.1,
    type: 'square',
    gain: urgent ? 0.38 : hot ? 0.3 : 0.22,
  });
  playTone({
    frequency: urgent ? 310 : 1175,
    duration: urgent ? 0.16 : 0.08,
    type: 'square',
    gain: urgent ? 0.32 : 0.16,
    delay: 0.08,
  });
  if (urgent) {
    playTone({
      frequency: 196,
      duration: 0.28,
      type: 'sawtooth',
      gain: 0.34,
      toFrequency: 70,
      delay: 0.02,
    });
  }
}

function playSliceAdvance() {
  playTone({ frequency: 523, duration: 0.12, type: 'square', gain: 0.24 });
  playTone({ frequency: 784, duration: 0.18, type: 'square', gain: 0.26, delay: 0.11 });
}

function playAllDone() {
  playTone({
    frequency: 240,
    duration: 0.85,
    type: 'sawtooth',
    gain: 0.42,
    toFrequency: 55,
  });
  playTone({
    frequency: 120,
    duration: 0.85,
    type: 'square',
    gain: 0.3,
    toFrequency: 42,
    delay: 0.02,
  });
  playTone({ frequency: 880, duration: 0.14, type: 'square', gain: 0.24, delay: 0.78 });
  playTone({ frequency: 659, duration: 0.22, type: 'square', gain: 0.26, delay: 0.94 });
}

function playStartChime() {
  playTone({ frequency: 659, duration: 0.1, type: 'square', gain: 0.2 });
  playTone({ frequency: 880, duration: 0.14, type: 'square', gain: 0.22, delay: 0.09 });
}

function polar(cx: number, cy: number, radius: number, angleFromTop: number) {
  const theta = angleFromTop - Math.PI / 2;
  return {
    x: cx + radius * Math.cos(theta),
    y: cy + radius * Math.sin(theta),
  };
}

function wedgePath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const sweep = endAngle - startAngle;
  if (sweep <= 0.001) return '';
  if (sweep >= Math.PI * 2 - 0.001) {
    const mid = startAngle + Math.PI;
    const a = polar(cx, cy, radius, startAngle);
    const b = polar(cx, cy, radius, mid);
    return `M ${cx} ${cy} L ${a.x} ${a.y} A ${radius} ${radius} 0 1 1 ${b.x} ${b.y} A ${radius} ${radius} 0 1 1 ${a.x} ${a.y} Z`;
  }
  const start = polar(cx, cy, radius, startAngle);
  const end = polar(cx, cy, radius, endAngle);
  const large = sweep > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y} Z`;
}

function wrapLabel(label: string, maxChars: number, maxLines: number): string[] {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && next.length > maxChars) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    } else {
      current = next;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length === maxLines) {
    const used = lines.join(' ').split(/\s+/).length;
    if (used < words.length) {
      const last = lines[lines.length - 1];
      lines[lines.length - 1] = last.length > 3 ? `${last.slice(0, Math.max(1, maxChars - 1))}…` : `${last}…`;
    }
  }
  return lines;
}

function sliceLabel(slice: PresentationPieSlice, index: number): string {
  return slice.label.trim() || `Slice ${index + 1}`;
}

interface SlicePosition {
  index: number;
  remainingMs: number;
}

function positionAt(elapsedMs: number, slices: PresentationPieSlice[]): SlicePosition {
  let cursor = 0;
  for (let index = 0; index < slices.length; index += 1) {
    const duration = slices[index].seconds * 1000;
    if (elapsedMs < cursor + duration) {
      return { index, remainingMs: cursor + duration - elapsedMs };
    }
    cursor += duration;
  }
  const last = Math.max(0, slices.length - 1);
  return { index: last, remainingMs: 0 };
}

function clockFromMs(remainingMs: number): string {
  return formatPieDuration(Math.max(0, Math.ceil(remainingMs / 1000)));
}

export function PresentationPieTimer({
  slide,
  compact = false,
  present = false,
}: {
  slide: PresentationSlide;
  compact?: boolean;
  present?: boolean;
}) {
  const gradientPrefix = useId().replace(/:/g, '');
  const slices = useMemo(
    () => (slide.pieSlices?.length ? slide.pieSlices : [createEmptyPieSlice()]),
    [slide.pieSlices]
  );
  const totalMs = slices.reduce((sum, slice) => sum + slice.seconds * 1000, 0);
  const timingKey = slices.map((slice) => slice.seconds).join(',');

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const elapsedRef = useRef(0);
  const lastIndexRef = useRef<number | null>(null);
  const lastWholeRef = useRef<number | null>(null);
  const slicesRef = useRef(slices);
  const totalRef = useRef(totalMs);
  slicesRef.current = slices;
  totalRef.current = totalMs;

  useEffect(() => {
    elapsedRef.current = 0;
    lastIndexRef.current = null;
    lastWholeRef.current = null;
    setElapsed(0);
    setRunning(false);
    setDone(false);
  }, [slide.id, timingKey]);

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const delta = Math.min(250, now - last);
      last = now;
      const total = totalRef.current;
      const next = Math.min(total, elapsedRef.current + delta);
      elapsedRef.current = next;
      if (next >= total) {
        setElapsed(total);
        setRunning(false);
        setDone(true);
        playAllDone();
        return;
      }
      const pos = positionAt(next, slicesRef.current);
      const whole = Math.ceil(pos.remainingMs / 1000);
      if (pos.index !== lastIndexRef.current) {
        if (lastIndexRef.current !== null) playSliceAdvance();
        lastIndexRef.current = pos.index;
        lastWholeRef.current = whole;
        if (whole >= 1 && whole <= 10) playDwindleBeep(whole);
      } else if (whole >= 1 && whole !== lastWholeRef.current) {
        lastWholeRef.current = whole;
        if (whole <= 10) playDwindleBeep(whole);
        else playClockTick(whole);
      }
      setElapsed(next);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  const safeElapsed = Math.min(elapsed, totalMs);
  const position = positionAt(safeElapsed, slices);
  const active = slices[position.index];
  const remainingMs = done ? 0 : running || safeElapsed > 0 ? position.remainingMs : (active?.seconds || 0) * 1000;
  const clock = clockFromMs(done ? 0 : remainingMs);
  const urgent = done || (running && position.remainingMs <= 10_000);
  const clockColor = urgent ? RED : NAVY;

  const wedges = useMemo(() => {
    let cursor = 0;
    return slices
      .map((slice, index) => {
        const duration = slice.seconds * 1000;
        const startMs = cursor;
        const endMs = cursor + duration;
        cursor = endMs;
        const visibleStart = Math.max(startMs, safeElapsed);
        if (visibleStart >= endMs || totalMs <= 0) return null;
        return {
          index,
          slice,
          startAngle: (visibleStart / totalMs) * Math.PI * 2,
          endAngle: (endMs / totalMs) * Math.PI * 2,
        };
      })
      .filter((wedge): wedge is NonNullable<typeof wedge> => Boolean(wedge));
  }, [safeElapsed, slices, totalMs]);

  function handleStart() {
    if (done || totalMs <= 0) return;
    audioContext();
    if (safeElapsed <= 0) {
      lastIndexRef.current = null;
      lastWholeRef.current = null;
      playStartChime();
    }
    setRunning(true);
  }

  function handlePause() {
    setRunning(false);
  }

  function handleReset() {
    elapsedRef.current = 0;
    lastIndexRef.current = null;
    lastWholeRef.current = null;
    setElapsed(0);
    setRunning(false);
    setDone(false);
  }

  const clockSize = compact ? 28 : present ? 104 : 68;
  const centerSize = compact ? 16 : present ? 42 : 28;

  return (
    <div className="grid h-full min-h-0 w-full grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] items-center gap-4 md:gap-8">
      <div className="flex h-full min-h-0 min-w-0 items-center justify-center [container-type:size]">
      <button
        type="button"
        className="relative aspect-square max-h-full max-w-full border-0 bg-transparent p-0"
        style={{ width: 'min(100cqw, 100cqh)', height: 'min(100cqw, 100cqh)' }}
        aria-label={running ? 'Pause pie timer' : done ? 'Pie timer finished' : 'Start pie timer'}
        onClick={(event) => {
          event.stopPropagation();
          if (done) return;
          if (running) handlePause();
          else handleStart();
        }}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
          <defs>
            {SLICE_STYLES.map((style, index) => (
              <linearGradient
                key={`pie-grad-${index}`}
                id={`pie-grad-${gradientPrefix}-${index}`}
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor={style.from} />
                <stop offset="100%" stopColor={style.to} />
              </linearGradient>
            ))}
          </defs>
          <circle cx="50" cy="50" r="47" fill="#ffffff" stroke={NAVY} strokeWidth="1.6" />
          {wedges.map((wedge) => {
            const style = SLICE_STYLES[wedge.index % SLICE_STYLES.length];
            const sweep = wedge.endAngle - wedge.startAngle;
            const mid = wedge.startAngle + sweep / 2;
            const labelAt = polar(50, 50, 33, mid);
            const lines =
              sweep > 0.42
                ? wrapLabel(sliceLabel(wedge.slice, wedge.index), sweep > 1.4 ? 14 : 11, sweep > 1.2 ? 3 : 2)
                : [];
            const fontSize = sweep > 1.5 ? 3.5 : sweep > 0.9 ? 3 : 2.5;
            return (
              <g key={wedge.slice.id}>
                <path
                  d={wedgePath(50, 50, 46.2, wedge.startAngle, wedge.endAngle)}
                  fill={`url(#pie-grad-${gradientPrefix}-${wedge.index % SLICE_STYLES.length})`}
                  stroke={NAVY}
                  strokeWidth={wedge.index === position.index && !done ? 1.3 : 0.7}
                />
                {lines.length > 0 ? (
                  <text
                    x={labelAt.x}
                    y={labelAt.y}
                    textAnchor="middle"
                    fill={style.text}
                    fontWeight={800}
                    fontSize={fontSize}
                  >
                    {lines.map((line, lineIndex) => (
                      <tspan
                        key={`${wedge.slice.id}-line-${lineIndex}`}
                        x={labelAt.x}
                        dy={lineIndex === 0 ? -((lines.length - 1) * fontSize) / 2 : fontSize}
                      >
                        {line}
                      </tspan>
                    ))}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="flex aspect-square w-[34%] items-center justify-center rounded-full border-4 border-[var(--comic-black)] bg-white"
            style={{ boxShadow: urgent ? `0 0 0 4px ${RED}` : undefined }}
          >
            <span
              className="font-bungee tabular-nums leading-none"
              style={{ fontSize: centerSize, color: clockColor }}
            >
              {clock}
            </span>
          </div>
        </div>
      </button>
      </div>

      <div className="flex min-h-0 min-w-0 flex-col justify-center gap-3 overflow-auto">
        <div
          role="timer"
          aria-live="polite"
          aria-atomic="true"
          className={[
            'inline-flex w-fit items-center border-4 border-[var(--comic-black)] bg-white px-4 py-2 comic-shadow-md',
            urgent && running ? 'animate-pulse' : '',
          ].join(' ')}
        >
          <span
            className="font-bungee tabular-nums leading-none"
            style={{ fontSize: clockSize, color: clockColor }}
          >
            {clock}
          </span>
        </div>
        <p className="text-sm font-bold text-[var(--comic-dark)] md:text-base">
          {done
            ? 'Time’s up'
            : running
              ? `Slice ${position.index + 1} of ${slices.length}`
              : safeElapsed > 0
                ? 'Paused'
                : `${slices.length} slice${slices.length === 1 ? '' : 's'} · ${formatPieDuration(totalMs / 1000)} total`}
        </p>
        {compact ? null : (
          <div className="flex flex-wrap gap-2">
            {done ? null : running ? (
              <ComicButton type="button" variant="secondary" size="sm" onClick={handlePause}>
                Pause
              </ComicButton>
            ) : (
              <ComicButton type="button" variant="secondary" size="sm" onClick={handleStart}>
                {safeElapsed > 0 ? 'Resume' : 'Start'}
              </ComicButton>
            )}
            {safeElapsed > 0 || done ? (
              <ComicButton type="button" variant="accent" size="sm" onClick={handleReset}>
                Reset
              </ComicButton>
            ) : null}
          </div>
        )}
        <ul className="min-h-0 space-y-1 overflow-auto">
          {slices.map((slice, index) => {
            const finished = done || index < position.index;
            const current = !done && index === position.index;
            const style = SLICE_STYLES[index % SLICE_STYLES.length];
            return (
              <li
                key={slice.id}
                className={[
                  'flex items-start gap-2 font-bold leading-snug',
                  finished ? 'opacity-45 line-through' : '',
                  current ? 'text-[var(--comic-secondary)]' : 'text-[var(--comic-dark)]',
                ].join(' ')}
                style={{ fontSize: compact ? 11 : present ? 22 : 16 }}
              >
                <span
                  className="mt-[0.3em] inline-block h-[0.75em] w-[0.75em] shrink-0 border-2 border-[var(--comic-black)]"
                  style={{ background: `linear-gradient(135deg, ${style.from}, ${style.to})` }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  {sliceLabel(slice, index)}
                  <span className="ml-2 tabular-nums opacity-80">
                    {current && (running || safeElapsed > 0)
                      ? clockFromMs(position.remainingMs)
                      : formatPieDuration(slice.seconds)}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function PieTimerEditor({
  slide,
  onChange,
}: {
  slide: PresentationSlide;
  onChange: (patch: Partial<PresentationSlide>) => void;
}) {
  const slices = slide.pieSlices?.length ? slide.pieSlices : [createEmptyPieSlice()];

  function updateSlice(id: string, patch: Partial<PresentationPieSlice>) {
    onChange({
      pieSlices: slices.map((slice) =>
        slice.id === id ? createEmptyPieSlice({ ...slice, ...patch }) : slice
      ),
    });
  }

  return (
    <div className="space-y-3 border-4 border-[var(--comic-black)] bg-[var(--comic-light)]/40 p-4">
      <div>
        <ComicText className="font-black">Pie timer</ComicText>
        <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
          Each slice is one timed step. Write what it is for, then set minutes and seconds.
          Press Start while presenting. Slices shrink clockwise until the pie is done. The clock
          ticks each second, then the last 10 seconds of each slice play a louder game-show countdown.
        </ComicText>
      </div>
      <div className="space-y-3">
        {slices.map((slice, index) => {
          const minutes = Math.floor(slice.seconds / 60);
          const seconds = slice.seconds % 60;
          return (
            <div
              key={slice.id}
              className="space-y-2 border-4 border-[var(--comic-black)]/20 bg-white/70 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <ComicText className="text-sm font-black">Slice {index + 1}</ComicText>
                {slices.length > 1 ? (
                  <button
                    type="button"
                    className="text-sm font-bold text-[var(--comic-primary)] underline-offset-2 hover:underline"
                    onClick={() =>
                      onChange({
                        pieSlices: slices.filter((item) => item.id !== slice.id),
                      })
                    }
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <label className="block space-y-1">
                <ComicText className="text-sm font-bold">What’s this slice for?</ComicText>
                <input
                  className="comic-input w-full"
                  value={slice.label}
                  onChange={(event) => updateSlice(slice.id, { label: event.target.value })}
                  onKeyDown={(event) => event.stopPropagation()}
                  placeholder="Partner A talks to Partner B"
                />
              </label>
              <div className="flex flex-wrap items-end gap-3">
                <label className="space-y-1">
                  <ComicText className="text-sm font-bold">Minutes</ComicText>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    className="comic-input w-24"
                    value={minutes}
                    onChange={(event) => {
                      const nextMinutes = Math.max(0, Math.min(60, Number(event.target.value) || 0));
                      const total = nextMinutes * 60 + seconds;
                      updateSlice(slice.id, {
                        seconds: Math.max(1, Math.min(MAX_PIE_SLICE_SECONDS, total)),
                      });
                    }}
                    onKeyDown={(event) => event.stopPropagation()}
                  />
                </label>
                <label className="space-y-1">
                  <ComicText className="text-sm font-bold">Seconds</ComicText>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    className="comic-input w-24"
                    value={seconds}
                    onChange={(event) => {
                      const nextSeconds = Math.max(0, Math.min(59, Number(event.target.value) || 0));
                      const total = minutes * 60 + nextSeconds;
                      updateSlice(slice.id, {
                        seconds: Math.max(1, Math.min(MAX_PIE_SLICE_SECONDS, total)),
                      });
                    }}
                    onKeyDown={(event) => event.stopPropagation()}
                  />
                </label>
                <ComicText className="pb-2 text-sm font-bold text-[var(--comic-dark)]">
                  {formatPieDuration(slice.seconds)}
                </ComicText>
              </div>
            </div>
          );
        })}
      </div>
      {slices.length < MAX_PIE_SLICES ? (
        <ComicButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            onChange({
              pieSlices: [...slices, createEmptyPieSlice({ label: '', seconds: 60 })],
            })
          }
        >
          + Add slice
        </ComicButton>
      ) : null}
    </div>
  );
}
