'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import type { PresentationChoiceLetter, PresentationSlide } from '@/lib/presentation/types';
import { PRESENTATION_CHOICE_LETTERS } from '@/lib/presentation/types';

interface PresentationAudioMatchProps {
  slide: PresentationSlide;
  present?: boolean;
  compact?: boolean;
}

/**
 * Present-mode Audio + image quiz: clip player with progress track + A–D image choices.
 */
export default function PresentationAudioMatch({
  slide,
  present = false,
  compact = false,
}: PresentationAudioMatchProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<PresentationChoiceLetter | null>(null);
  const [error, setError] = useState('');

  const start = Math.max(0, Number(slide.audioStartSeconds) || 0);
  const end = Math.max(start + 0.25, Number(slide.audioEndSeconds) || start + 5);
  const duration = Math.max(0.25, end - start);
  const images = PRESENTATION_CHOICE_LETTERS.map((letter, index) => ({
    letter,
    url: String(slide.choiceImages[index] ?? '').trim(),
  })).filter((item) => item.url);

  useEffect(() => {
    setSelected(null);
    setProgress(0);
    setPlaying(false);
    setError('');
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = start;
    }
  }, [slide.id, start, end, slide.audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      const t = audio.currentTime;
      if (t >= end - 0.05) {
        audio.pause();
        audio.currentTime = start;
        setPlaying(false);
        setProgress(1);
        return;
      }
      setProgress(Math.min(1, Math.max(0, (t - start) / duration)));
    };

    const onEnded = () => {
      setPlaying(false);
      audio.currentTime = start;
      setProgress(1);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [start, end, duration]);

  async function handlePlay() {
    if (!slide.audioUrl.trim() || !audioRef.current) return;
    setError('');
    try {
      const audio = audioRef.current;
      audio.currentTime = start;
      await audio.play();
      setPlaying(true);
      setProgress(0);
    } catch {
      setError('Could not play this audio clip.');
      setPlaying(false);
    }
  }

  function handleStop() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = start;
    setPlaying(false);
    setProgress(0);
  }

  function handleSeek(event: MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !slide.audioUrl.trim()) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const next = start + ratio * duration;
    audio.currentTime = next;
    setProgress(ratio);
  }

  return (
    <div className={['flex h-full min-h-0 flex-col gap-3', compact ? 'gap-2' : ''].join(' ')}>
      <audio ref={audioRef} src={slide.audioUrl || undefined} preload="metadata" />

      <div
        className={[
          'rounded-lg border-4 border-[var(--comic-black)] bg-white/90 p-3 comic-shadow-sm',
          compact ? 'p-2' : '',
        ].join(' ')}
      >
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <ComicButton
            type="button"
            variant="secondary"
            size="sm"
            disabled={!slide.audioUrl.trim() || playing}
            onClick={() => void handlePlay()}
          >
            {playing ? 'Playing…' : 'Play'}
          </ComicButton>
          {playing ? (
            <ComicButton type="button" variant="accent" size="sm" onClick={handleStop}>
              Stop
            </ComicButton>
          ) : null}
          {!slide.audioUrl.trim() ? (
            <ComicText className="text-sm font-bold text-[var(--comic-dark)]/60">
              Add an audio URL on this slide
            </ComicText>
          ) : null}
        </div>
        <div
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label="Audio clip progress"
          className="h-3 w-full cursor-pointer rounded-full border-2 border-[var(--comic-black)] bg-[var(--comic-light)]"
          onClick={handleSeek}
        >
          <div
            className="h-full rounded-full bg-[var(--comic-primary)]"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        {error ? (
          <ComicText className="mt-1 text-sm font-bold text-[var(--comic-danger)]">{error}</ComicText>
        ) : null}
      </div>

      {images.length === 0 ? (
        <ComicText className="font-bold text-[var(--comic-dark)]/60">
          Add choice images A–D in the editor.
        </ComicText>
      ) : (
        <div
          className={[
            'grid flex-1 min-h-0 gap-3',
            images.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4',
          ].join(' ')}
        >
          {images.map((item) => {
            const isSelected = selected === item.letter;
            const isCorrect = item.letter === slide.correctChoice;
            let borderClass = 'border-[var(--comic-black)]';
            if (isSelected && isCorrect) {
              borderClass = 'border-[var(--comic-success)] ring-4 ring-[var(--comic-success)]/40';
            } else if (isSelected && !isCorrect) {
              borderClass = 'border-[var(--comic-danger)] ring-4 ring-[var(--comic-danger)]/40';
            } else if (selected && isCorrect && present) {
              // After a wrong guess, softly reveal the right one
              borderClass = 'border-[var(--comic-success)]';
            }

            return (
              <button
                key={item.letter}
                type="button"
                onClick={() => setSelected(item.letter)}
                className={[
                  'relative flex min-h-0 flex-col overflow-hidden rounded-lg border-4 bg-white text-left comic-shadow-sm transition-transform',
                  borderClass,
                  present ? 'hover:-translate-y-0.5' : '',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute left-2 top-2 z-[1] flex h-8 w-8 items-center justify-center border-2 border-[var(--comic-black)] font-bungee text-sm',
                    isSelected && isCorrect
                      ? 'bg-[var(--comic-success)] text-white'
                      : isSelected && !isCorrect
                        ? 'bg-[var(--comic-danger)] text-white'
                        : 'bg-[var(--comic-secondary)] text-white',
                  ].join(' ')}
                >
                  {item.letter}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={`Choice ${item.letter}`}
                  className="h-full min-h-[6rem] w-full flex-1 object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
