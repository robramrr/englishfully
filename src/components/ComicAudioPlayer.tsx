'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface ComicAudioPlayerProps {
  src: string;
  className?: string;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function ComicAudioPlayer({ src, className = '' }: ComicAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setReady(false);

    const onLoaded = () => {
      setDuration(audio.duration || 0);
      setReady(true);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [src]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }, []);

  const handleSeek = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
      audio.currentTime = ratio * duration;
      setCurrentTime(audio.currentTime);
    },
    [duration]
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`comic-audio-player comic-border-thick comic-shadow-md bg-white rounded-lg p-3 ${className}`}
    >
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" aria-hidden />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          disabled={!ready && !src}
          aria-label={isPlaying ? 'Pause recording' : 'Play recording'}
          className="comic-audio-player__play flex-shrink-0 w-12 h-12 comic-border rounded-lg comic-bg-secondary comic-text-white font-bungee text-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>

        <div className="flex-grow min-w-0 space-y-1">
          <div
            role="slider"
            aria-label="Playback progress"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={currentTime}
            tabIndex={0}
            onClick={handleSeek}
            onKeyDown={(event) => {
              const audio = audioRef.current;
              if (!audio || !duration) return;
              if (event.key === 'ArrowRight') {
                audio.currentTime = Math.min(audio.currentTime + 5, duration);
              } else if (event.key === 'ArrowLeft') {
                audio.currentTime = Math.max(audio.currentTime - 5, 0);
              }
            }}
            className="comic-audio-player__track comic-border h-4 rounded-md bg-[var(--comic-light)] cursor-pointer overflow-hidden"
          >
            <div
              className="comic-audio-player__fill h-full comic-bg-primary transition-[width] duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-bold text-[var(--comic-dark)] font-bungee">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
