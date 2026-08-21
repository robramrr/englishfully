'use client';

import { useEffect, useRef, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import { isPastClipEnd, seekAudioTo } from '@/lib/audio/clipPlayback';

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
  const startRef = useRef(startSeconds);
  const endRef = useRef(endSeconds);

  const unlimited = maxReplays === null || maxReplays < 0;
  const remaining = unlimited ? null : Math.max(0, maxReplays - playCount);
  const canPlay = Boolean(audioUrl.trim()) && (unlimited || (remaining ?? 0) > 0);
  const clipStart = Math.max(0, Number(startSeconds) || 0);
  const clipEnd = Math.max(clipStart + 0.25, Number(endSeconds) || clipStart + 5);

  useEffect(() => {
    startRef.current = clipStart;
    endRef.current = clipEnd;
  }, [clipStart, clipEnd]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setPlaying(false);
      void seekAudioTo(audio, startRef.current);
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Precise end clamp — timeupdate alone overshoots by ~250ms+ intermittently.
  useEffect(() => {
    if (!playing) return;
    const audio = audioRef.current;
    if (!audio) return;

    let raf = 0;
    const tick = () => {
      if (isPastClipEnd(audio.currentTime, endRef.current)) {
        audio.pause();
        void seekAudioTo(audio, startRef.current);
        setPlaying(false);
        return;
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [playing]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setPlaying(false);
    void seekAudioTo(audio, clipStart);
  }, [audioUrl, clipStart, clipEnd]);

  async function handlePlay() {
    if (!canPlay || !audioRef.current) return;
    setError('');
    try {
      const audio = audioRef.current;
      await seekAudioTo(audio, clipStart);
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
    void seekAudioTo(audio, clipStart);
    setPlaying(false);
  }

  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      <audio ref={audioRef} src={audioUrl || undefined} preload="auto" />
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
