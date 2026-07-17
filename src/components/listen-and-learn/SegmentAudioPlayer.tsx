'use client';

import { useEffect, useRef, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [error, setError] = useState('');

  const unlimited = maxReplays === null || maxReplays < 0;
  const remaining = unlimited ? null : Math.max(0, maxReplays - playCount);
  const canPlay = Boolean(audioUrl.trim()) && (unlimited || (remaining ?? 0) > 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.currentTime >= endSeconds - 0.05) {
        audio.pause();
        audio.currentTime = startSeconds;
        setPlaying(false);
      }
    };

    const handleEnded = () => {
      setPlaying(false);
      audio.currentTime = startSeconds;
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [startSeconds, endSeconds]);

  async function handlePlay() {
    if (!canPlay || !audioRef.current) return;
    setError('');
    try {
      const audio = audioRef.current;
      audio.currentTime = Math.max(0, startSeconds);
      await audio.play();
      setPlaying(true);
      setPlayCount((count) => count + 1);
    } catch {
      setError('Could not play this audio segment.');
      setPlaying(false);
    }
  }

  function handleStop() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = startSeconds;
    setPlaying(false);
  }

  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      <audio ref={audioRef} src={audioUrl || undefined} preload="metadata" />
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
          <ComicButton variant="accent" size="sm" onClick={handleStop}>
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
