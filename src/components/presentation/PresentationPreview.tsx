'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  const rootRef = useRef<HTMLDivElement>(null);
  const [browserFullscreen, setBrowserFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = deck.slides.length;
  const safeIndex = Math.min(Math.max(index, 0), Math.max(total - 1, 0));
  const slide = deck.slides[safeIndex];
  const liveGrammar =
    Boolean(slide) &&
    slide.layout === 'content' &&
    slide.grammarHighlighterEnabled;
  const presentMode = fullscreen || browserFullscreen;
  /** True browser fullscreen: no chrome — arrows/space only. */
  const showChrome = !browserFullscreen;

  const goPrev = useCallback(() => {
    onIndexChange(Math.max(0, safeIndex - 1));
  }, [onIndexChange, safeIndex]);

  const goNext = useCallback(() => {
    onIndexChange(Math.min(total - 1, safeIndex + 1));
  }, [onIndexChange, safeIndex, total]);

  const exitBrowserFullscreen = useCallback(async () => {
    const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void };
    if (
      !document.fullscreenElement &&
      !(doc as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement
    ) {
      return;
    }
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
    } catch {
      // ignore
    }
  }, []);

  const toggleBrowserFullscreen = useCallback(async () => {
    const el = rootRef.current as
      | (HTMLDivElement & {
          webkitRequestFullscreen?: () => Promise<void> | void;
        })
      | null;
    if (!el) return;
    const doc = document as Document & {
      webkitFullscreenElement?: Element;
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    try {
      if (document.fullscreenElement || doc.webkitFullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      } else if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      }
    } catch {
      // Browser may deny fullscreen without a user gesture / permission
    }
  }, []);

  const handleClose = useCallback(async () => {
    await exitBrowserFullscreen();
    onClose();
  }, [exitBrowserFullscreen, onClose]);

  const revealControls = useCallback(() => {
    if (browserFullscreen) return;
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (!presentMode) return;
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 2500);
  }, [browserFullscreen, presentMode]);

  useEffect(() => {
    function onFullscreenChange() {
      const doc = document as Document & { webkitFullscreenElement?: Element };
      setBrowserFullscreen(Boolean(document.fullscreenElement || doc.webkitFullscreenElement));
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange as EventListener);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (browserFullscreen) {
      setControlsVisible(false);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      return;
    }
    if (!presentMode) {
      setControlsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      return;
    }
    revealControls();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [browserFullscreen, presentMode, revealControls]);

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
        // Let the browser exit OS fullscreen first; don't close the deck yet.
        const doc = document as Document & { webkitFullscreenElement?: Element };
        if (document.fullscreenElement || doc.webkitFullscreenElement) return;
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
      if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        void toggleBrowserFullscreen();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev, onClose, toggleBrowserFullscreen]);

  if (!slide) {
    return (
      <div className="p-8 text-center">
        <ComicText className="font-bold">No slides to preview.</ComicText>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      onMouseMove={showChrome ? revealControls : undefined}
      onClick={showChrome ? revealControls : undefined}
      className={[
        'relative flex flex-col',
        fullscreen || browserFullscreen
          ? 'fixed inset-0 z-50 bg-[var(--comic-secondary)]'
          : 'gap-4',
      ].join(' ')}
    >
      {showChrome ? (
        <div
          className={[
            presentMode
              ? [
                  'absolute inset-x-0 top-0 z-20 flex justify-end p-3 transition-opacity duration-300',
                  controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
                ].join(' ')
              : 'flex flex-wrap items-center justify-end gap-3',
          ].join(' ')}
        >
          <div
            className={[
              'flex flex-wrap gap-2',
              presentMode
                ? 'rounded-lg border-2 border-[var(--comic-black)] bg-[var(--comic-secondary)]/90 p-2 comic-shadow-md backdrop-blur-sm'
                : '',
            ].join(' ')}
          >
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
            <ComicButton type="button" variant="success" size="sm" onClick={() => void toggleBrowserFullscreen()}>
              Full screen
            </ComicButton>
            <ComicButton type="button" variant="warning" size="sm" onClick={() => void handleClose()}>
              {fullscreen ? 'Exit' : 'Close preview'}
            </ComicButton>
          </div>
        </div>
      ) : null}

      <div
        className={[
          'mx-auto flex w-full flex-1 items-center justify-center',
          presentMode ? 'h-full min-h-0 p-2 md:p-4' : '',
        ].join(' ')}
      >
        <div
          className={[
            'w-full',
            presentMode
              ? 'flex h-full max-h-full items-center justify-center'
              : 'max-w-6xl',
          ].join(' ')}
        >
          <SlideCanvas
            slide={slide}
            deck={deck}
            slideNumber={safeIndex + 1}
            totalSlides={total}
            present={presentMode}
            className={
              presentMode
                ? 'h-auto max-h-full w-auto max-w-full !aspect-[16/9] [width:min(100%,calc(100vh*16/9))]'
                : undefined
            }
            liveEditable={liveGrammar}
            onGrammarTextChange={
              liveGrammar && onGrammarTextChange
                ? (grammarText) => onGrammarTextChange(slide.id, grammarText)
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
