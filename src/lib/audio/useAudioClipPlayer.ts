'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clipDurationSeconds,
  isPastClipEnd,
  seekAudioTo,
  seekAudioToVerified,
  withClipMediaFragment,
} from '@/lib/audio/clipPlayback';

interface UseAudioClipPlayerOptions {
  audioUrl: string;
  startSeconds: number;
  endSeconds: number;
}

/**
 * Shared clip player for editor + live present / Listen & Learn.
 * Wall-clock hard stop keeps clip length consistent even when currentTime lags.
 */
export function useAudioClipPlayer({
  audioUrl,
  startSeconds,
  endSeconds,
}: UseAudioClipPlayerOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const clipStart = Math.max(0, Number(startSeconds) || 0);
  const clipEnd = Math.max(clipStart + 0.05, Number(endSeconds) || clipStart + 5);
  const clipDuration = clipDurationSeconds(clipStart, clipEnd);
  const src = withClipMediaFragment(audioUrl, clipStart, clipEnd);

  const startRef = useRef(clipStart);
  const endRef = useRef(clipEnd);
  const durationRef = useRef(clipDuration);
  const deadlineRef = useRef(0);
  const playingRef = useRef(false);

  useEffect(() => {
    startRef.current = clipStart;
    endRef.current = clipEnd;
    durationRef.current = clipDuration;
  }, [clipStart, clipEnd, clipDuration]);

  const stopPlayback = useCallback((opts?: { progress?: number }) => {
    const audio = audioRef.current;
    playingRef.current = false;
    setPlaying(false);
    setProgress(opts?.progress ?? 0);
    deadlineRef.current = 0;
    if (!audio) return;
    audio.pause();
    void seekAudioTo(audio, startRef.current);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => stopPlayback({ progress: 1 });
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [stopPlayback]);

  // Reset when clip bounds / URL change.
  useEffect(() => {
    const audio = audioRef.current;
    playingRef.current = false;
    setPlaying(false);
    setProgress(0);
    setError('');
    deadlineRef.current = 0;
    if (!audio) return;
    audio.pause();
    // Src may include a new media fragment — wait a tick then seek to start.
    const id = window.setTimeout(() => {
      void seekAudioTo(audio, clipStart);
    }, 0);
    return () => window.clearTimeout(id);
  }, [src, clipStart, clipEnd]);

  // rAF clamp + wall-clock hard stop while playing.
  useEffect(() => {
    if (!playing) return;
    const audio = audioRef.current;
    if (!audio) return;

    let raf = 0;
    const tick = () => {
      if (!playingRef.current) return;
      const now = performance.now();
      const t = audio.currentTime;
      const start = startRef.current;
      const end = endRef.current;
      const duration = durationRef.current;
      const pastEnd = isPastClipEnd(t, end);
      const pastDeadline = deadlineRef.current > 0 && now >= deadlineRef.current;

      if (pastEnd || pastDeadline) {
        audio.pause();
        playingRef.current = false;
        setPlaying(false);
        setProgress(1);
        deadlineRef.current = 0;
        void seekAudioTo(audio, start);
        return;
      }

      // Prefer media-clock progress; fall back to wall clock if seek was off.
      const mediaProgress = (t - start) / duration;
      const wallProgress =
        deadlineRef.current > 0
          ? 1 - (deadlineRef.current - now) / (duration * 1000)
          : mediaProgress;
      const next =
        Number.isFinite(mediaProgress) && t >= start - 0.5
          ? mediaProgress
          : wallProgress;
      setProgress(Math.min(1, Math.max(0, next)));
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [playing]);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl.trim()) return false;
    setError('');
    try {
      audio.pause();
      const ok = await seekAudioToVerified(audio, clipStart);
      if (!ok) {
        // Still try — wall-clock stop will keep length honest.
        await seekAudioTo(audio, clipStart);
      }
      deadlineRef.current = performance.now() + clipDuration * 1000;
      playingRef.current = true;
      await audio.play();
      setPlaying(true);
      setProgress(0);
      return true;
    } catch {
      playingRef.current = false;
      deadlineRef.current = 0;
      setPlaying(false);
      setError('Could not play this audio clip.');
      return false;
    }
  }, [audioUrl, clipStart, clipDuration]);

  const stop = useCallback(() => {
    stopPlayback({ progress: 0 });
  }, [stopPlayback]);

  const seekRatio = useCallback(
    (ratio: number) => {
      const audio = audioRef.current;
      if (!audio || !audioUrl.trim()) return;
      const clamped = Math.min(1, Math.max(0, ratio));
      const next = clipStart + clamped * clipDuration;
      void seekAudioTo(audio, next);
      setProgress(clamped);
      if (playingRef.current) {
        deadlineRef.current = performance.now() + (1 - clamped) * clipDuration * 1000;
      }
    },
    [audioUrl, clipStart, clipDuration]
  );

  return {
    audioRef,
    src,
    playing,
    progress,
    error,
    clipStart,
    clipEnd,
    clipDuration,
    play,
    stop,
    seekRatio,
    setError,
  };
}
