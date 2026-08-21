'use client';

import { useState } from 'react';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import { useAudioClipPlayer } from '@/lib/audio/useAudioClipPlayer';

interface SegmentAudioPlayerProps {
  audioUrl: string;
  startSeconds: number;
  endSeconds: number;
  maxReplays?: number | null;
  label?: string;
  compact?: boolean;
}

export default function SegmentAudioPlayer({
  audioUrl,
  startSeconds,
  endSeconds,
  maxReplays = null,
  label = 'Play Audio',
  compact = false,
}: SegmentAudioPlayerProps) {
  const { audioRef, src, playing, error, play, stop } = useAudioClipPlayer({
    audioUrl,
    startSeconds,
    endSeconds,
  });
  const [playCount, setPlayCount] = useState(0);

  const unlimited = maxReplays === null || maxReplays < 0;
  const remaining = unlimited ? null : Math.max(0, maxReplays - playCount);
  const canPlay = Boolean(audioUrl.trim()) && (unlimited || (remaining ?? 0) > 0);

  async function handlePlay() {
    if (!canPlay) return;
    const ok = await play();
    if (ok) setPlayCount((count) => count + 1);
  }

  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      <audio ref={audioRef} src={src || undefined} preload="auto" />
      <div className="flex flex-wrap items-center gap-2">
        <ComicButton
          variant="secondary"
          size="sm"
          disabled={!canPlay || playing}
          onClick={() => void handlePlay()}
        >
          {playing ? 'Playing…' : label}
        </ComicButton>
        {playing ? (
          <ComicButton variant="accent" size="sm" onClick={stop}>
            Stop
          </ComicButton>
        ) : null}
        {!unlimited ? (
          <ComicText className="text-[var(--comic-dark)] text-sm font-bold">
            Replays left: {remaining}
          </ComicText>
        ) : null}
      </div>
      {error ? (
        <ComicText className="text-[var(--comic-danger)] text-sm font-bold">{error}</ComicText>
      ) : null}
    </div>
  );
}
