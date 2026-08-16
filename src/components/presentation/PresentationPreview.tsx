'use client';

import { useEffect, useCallback } from 'react';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import SlideCanvas from './SlideCanvas';
import type { PresentationDeck } from '@/lib/presentation/types';

interface PresentationPreviewProps {
  deck: PresentationDeck;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  fullscreen?: boolean;
  onGrammarTextChange?: (slideId: string, grammarText: string) => void;
}

export default function PresentationPreview({
  deck,
  index,
  onIndexChange,
  onClose,
  fullscreen = false,
  onGrammarTextChange,
}: PresentationPreviewProps) {
  const total = deck.slides.length;
  const safeIndex = Math.min(Math.max(index, 0), Math.max(total - 1, 0));
  const slide = deck.slides[safeIndex];
  const liveGrammar =
    Boolean(slide) &&
    slide.layout === 'content' &&
    slide.grammarHighlighterEnabled;

  const goPrev = useCallback(() => {
    onIndexChange(Math.max(0, safeIndex - 1));
  }, [onIndexChange, safeIndex]);

  const goNext = useCallback(() => {
    onIndexChange(Math.min(total - 1, safeIndex + 1));
  }, [onIndexChange, safeIndex, total]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'TEXTAREA' ||
          target.tagName === 'INPUT' ||
          target.isContentEditable);
      if (typing) return;

      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        goPrev();
      }
      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault();
        goNext();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev, onClose]);

  if (!slide) {
    return (
      <div className="p-8 text-center">
        <ComicText className="font-bold">No slides to preview.</ComicText>
      </div>
    );
  }

  return (
    <div
      className={[
        'flex flex-col gap-4',
        fullscreen ? 'fixed inset-0 z-50 bg-[var(--comic-secondary)] p-4 md:p-8' : '',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ComicText className={`font-bold ${fullscreen ? 'text-white' : ''}`}>
          Preview · {safeIndex + 1} / {total}
          {liveGrammar ? ' · Grammar highlighter live' : ''}
        </ComicText>
        <div className="flex flex-wrap gap-2">
          <ComicButton type="button" variant="accent" size="sm" onClick={goPrev} disabled={safeIndex === 0}>
            ← Prev
          </ComicButton>
          <ComicButton
            type="button"
            variant="accent"
            size="sm"
            onClick={goNext}
            disabled={safeIndex >= total - 1}
          >
            Next →
          </ComicButton>
          <ComicButton type="button" variant="warning" size="sm" onClick={onClose}>
            {fullscreen ? 'Exit' : 'Close preview'}
          </ComicButton>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 flex items-center">
        <SlideCanvas
          slide={slide}
          deck={deck}
          slideNumber={safeIndex + 1}
          totalSlides={total}
          liveEditable={liveGrammar}
          onGrammarTextChange={
            liveGrammar && onGrammarTextChange
              ? (grammarText) => onGrammarTextChange(slide.id, grammarText)
              : undefined
          }
        />
      </div>

      {fullscreen ? (
        <ComicText className="text-center text-sm font-bold text-white/80">
          Arrow keys / space to navigate · Esc to exit
          {liveGrammar ? ' · Type in the grammar box — highlights after a full stop' : ''}
        </ComicText>
      ) : null}
    </div>
  );
}
