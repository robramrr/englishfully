'use client';

import { useMemo } from 'react';
import {
  activeCaptionIndex,
  captionLineAround,
  captionWordsForClip,
  type CaptionWord,
} from '@/lib/audio/syncedCaptions';

export default function SyncedCaptions({
  text,
  start,
  end,
  currentTime,
  words,
  present = false,
}: {
  text: string;
  start: number;
  end: number;
  currentTime: number;
  words?: CaptionWord[] | null;
  present?: boolean;
}) {
  const captionWords = useMemo(
    () => captionWordsForClip(text, start, end, words),
    [text, start, end, words]
  );
  const active = activeCaptionIndex(captionWords, currentTime);
  const line = captionLineAround(captionWords, active).filter((word) => word.start <= currentTime + 0.02);
  if (line.length === 0) return null;

  return (
    <p
      className={[
        'flex min-h-[3.25rem] flex-wrap items-center justify-center gap-x-2 gap-y-1 border-4 border-[var(--comic-black)] bg-white px-4 py-3 text-center font-black leading-none text-[var(--comic-dark)]',
        present ? 'text-2xl md:text-4xl' : 'text-xl md:text-2xl',
      ].join(' ')}
      aria-live="polite"
    >
      {line.map((word, lineIndex) => {
        const spoken = lineIndex === line.length - 1;
        return (
          <span
            key={`${word.start}-${word.text}-${lineIndex}`}
            className={
              spoken
                ? 'rounded-md bg-[var(--comic-yellow)] px-1.5 py-0.5 text-[var(--comic-black)]'
                : ''
            }
          >
            {word.text}
          </span>
        );
      })}
    </p>
  );
}

export function CaptionSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 border-4 border-[var(--comic-black)] bg-white px-3 py-1.5 font-black text-[var(--comic-dark)]">
      <input
        type="checkbox"
        className="h-5 w-5 accent-[var(--comic-primary)]"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      Captions
    </label>
  );
}
