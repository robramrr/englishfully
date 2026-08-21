'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import type { PresentationChoiceLetter, PresentationSlide } from '@/lib/presentation/types';
import {
  getPresentationAudioTracks,
  PRESENTATION_CHOICE_LETTERS,
} from '@/lib/presentation/types';
import { useAudioClipPlayer } from '@/lib/audio/useAudioClipPlayer';

/** Brand has no green token — use a clear quiz green for correct feedback. */
const QUIZ_CORRECT = '#15803d';
const QUIZ_WRONG = '#ea1225';

interface PresentationAudioMatchProps {
  slide: PresentationSlide;
  present?: boolean;
  compact?: boolean;
}

function playQuizTone(kind: 'correct' | 'wrong') {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (kind === 'correct') {
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02 + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22 + index * 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + index * 0.08);
        osc.stop(now + 0.28 + index * 0.08);
      });
      window.setTimeout(() => void ctx.close(), 800);
      return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.28);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
    window.setTimeout(() => void ctx.close(), 600);
  } catch {
    // ignore
  }
}

/**
 * Present-mode Audio + image quiz: shared images, multiple tracks with next/prev.
 * Uses the same clip engine as the editor / Listen & Learn for consistent lengths.
 */
export default function PresentationAudioMatch({
  slide,
  present = false,
  compact = false,
}: PresentationAudioMatchProps) {
  const tracks = getPresentationAudioTracks(slide);
  const [trackIndex, setTrackIndex] = useState(0);
  const [selected, setSelected] = useState<PresentationChoiceLetter | null>(null);

  const safeIndex = Math.min(Math.max(trackIndex, 0), Math.max(tracks.length - 1, 0));
  const track = tracks[safeIndex] || tracks[0];
  const start = Math.max(0, Number(track?.startSeconds) || 0);
  const end = Math.max(start + 0.05, Number(track?.endSeconds) || start + 5);
  const correctChoice = track?.correctChoice || 'A';
  const images = PRESENTATION_CHOICE_LETTERS.map((letter, index) => ({
    letter,
    url: String(slide.choiceImages[index] ?? '').trim(),
  })).filter((item) => item.url);

  const { audioRef, src, playing, progress, error, play, stop, seekRatio } = useAudioClipPlayer({
    audioUrl: slide.audioUrl,
    startSeconds: start,
    endSeconds: end,
  });

  useEffect(() => {
    setTrackIndex(0);
  }, [slide.id]);

  useEffect(() => {
    setSelected(null);
  }, [slide.id, safeIndex, start, end, slide.audioUrl]);

  function handleSeek(event: MouseEvent<HTMLDivElement>) {
    if (!slide.audioUrl.trim()) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    seekRatio(ratio);
  }

  function handleSelect(letter: PresentationChoiceLetter) {
    setSelected(letter);
    playQuizTone(letter === correctChoice ? 'correct' : 'wrong');
  }

  function goPrevTrack() {
    stop();
    setTrackIndex((index) => Math.max(0, index - 1));
  }

  function goNextTrack() {
    stop();
    setTrackIndex((index) => Math.min(tracks.length - 1, index + 1));
  }

  return (
    <div className={['flex h-full min-h-0 flex-col gap-3', compact ? 'gap-2' : ''].join(' ')}>
      <audio ref={audioRef} src={src || undefined} preload="auto" />

      <div
        className={[
          'rounded-lg border-4 border-[var(--comic-black)] bg-white/90 p-3 comic-shadow-sm',
          compact ? 'p-2' : '',
        ].join(' ')}
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <ComicButton
              type="button"
              variant="secondary"
              size="sm"
              disabled={!slide.audioUrl.trim() || playing}
              onClick={() => void play()}
            >
              {playing ? 'Playing…' : 'Play'}
            </ComicButton>
            {playing ? (
              <ComicButton type="button" variant="accent" size="sm" onClick={stop}>
                Stop
              </ComicButton>
            ) : null}
            {!slide.audioUrl.trim() ? (
              <ComicText className="text-sm font-bold text-[var(--comic-dark)]/60">
                Add an audio URL on this slide
              </ComicText>
            ) : null}
          </div>

          {tracks.length > 1 ? (
            <div className="flex flex-wrap items-center gap-2">
              <ComicButton
                type="button"
                variant="accent"
                size="sm"
                disabled={safeIndex <= 0}
                onClick={goPrevTrack}
              >
                ← Prev
              </ComicButton>
              <ComicText className="text-sm font-black text-[var(--comic-dark)]">
                Track {safeIndex + 1} / {tracks.length}
              </ComicText>
              <ComicButton
                type="button"
                variant="accent"
                size="sm"
                disabled={safeIndex >= tracks.length - 1}
                onClick={goNextTrack}
              >
                Next →
              </ComicButton>
            </div>
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
            const isCorrect = item.letter === correctChoice;
            const showCorrect = isSelected && isCorrect;
            const showWrong = isSelected && !isCorrect;
            const revealCorrect = Boolean(selected) && isCorrect && !isSelected;

            return (
              <button
                key={item.letter}
                type="button"
                onClick={() => handleSelect(item.letter)}
                className={[
                  'relative flex min-h-0 flex-col overflow-hidden rounded-lg border-4 bg-white text-left comic-shadow-sm transition-transform',
                  present ? 'hover:-translate-y-0.5' : '',
                ].join(' ')}
                style={{
                  borderColor: showCorrect
                    ? QUIZ_CORRECT
                    : showWrong
                      ? QUIZ_WRONG
                      : revealCorrect
                        ? QUIZ_CORRECT
                        : 'var(--comic-black)',
                  boxShadow: showCorrect
                    ? `0 0 0 4px color-mix(in srgb, ${QUIZ_CORRECT} 35%, transparent)`
                    : showWrong
                      ? `0 0 0 4px color-mix(in srgb, ${QUIZ_WRONG} 35%, transparent)`
                      : undefined,
                }}
              >
                <span
                  className="absolute left-2 top-2 z-[1] flex h-8 w-8 items-center justify-center border-2 border-[var(--comic-black)] font-bungee text-sm text-white"
                  style={{
                    backgroundColor: showCorrect
                      ? QUIZ_CORRECT
                      : showWrong
                        ? QUIZ_WRONG
                        : revealCorrect
                          ? QUIZ_CORRECT
                          : 'var(--comic-secondary)',
                  }}
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
