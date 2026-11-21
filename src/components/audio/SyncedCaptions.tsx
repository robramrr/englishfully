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
  const line = captionLineAround(captionWords, active);
  if (line.length === 0) return null;

  return (
    <p
      className={[
        'flex min-h-[3.25rem] flex-wrap items-center justify-center gap-x-2 gap-y-1 border-4 border-[var(--comic-black)] bg-black/90 px-4 py-3 text-center font-black leading-none text-white',
        present ? 'text-2xl md:text-4xl' : 'text-xl md:text-2xl',
      ].join(' ')}
      aria-live="polite"
    >
      {line.map((word, lineIndex) => {
        const wordIndex = Math.floor(active / 5) * 5 + lineIndex;
        const spoken = wordIndex === active;
        return (
          <span
            key={`${word.start}-${word.text}-${lineIndex}`}
            className={
              spoken
                ? 'rounded-md bg-[var(--comic-yellow)] px-1.5 py-0.5 text-[var(--comic-black)]'
                : 'opacity-55'
            }
          >
            {word.text}
          </span>
        );
      })}
    </p>
  );
}
