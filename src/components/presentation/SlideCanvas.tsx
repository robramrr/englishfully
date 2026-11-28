'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import {
  grammarBoxModeOf,
  presentationFontColorCss,
  presentationFontSizePx,
  getContentSlideImages,
  visibleGrammarText,
  type PresentationDeck,
  type PresentationSlide,
} from '@/lib/presentation/types';
import { GrammarLiveTextBox } from './GrammarHighlight';
import PresentationAudioMatch from './PresentationAudioMatch';
import { PresentationListenQuestions } from './PresentationListenQuestions';
import PresentationDescribeImage from './PresentationDescribeImage';
import PresentationMatchTextImage from './PresentationMatchTextImage';
import { PresentationFillBlank } from './PresentationFillBlank';
import SentenceContestStage from '../sentence-contest/SentenceContestStage';
import { PresentationPieTimer } from './PresentationPieTimer';
import { PresentationQuiz } from './PresentationQuiz';
import VocabBingoCaller from '../vocab-bingo/VocabBingoCaller';
import { SlideRichText } from './SlideRichText';
import PresentationSlideTimer, { type SlideTimerState } from './PresentationSlideTimer';
import VocabFlashcardStage from '../vocabulary/VocabFlashcardStage';
import AnagramStage from '../anagram/AnagramStage';

interface SlideCanvasProps {
  slide: PresentationSlide;
  deck: PresentationDeck;
  slideNumber: number;
  totalSlides: number;
  className?: string;
  compact?: boolean;
  /** Larger type for projecting / presenting. */
  present?: boolean;
  /** Show empty image placeholder (editor). Hidden in present mode when no URL. */
  showImageSlot?: boolean;
  /** Allow live typing into the grammar practice box during present/preview. */
  liveEditable?: boolean;
  onGrammarTextChange?: (grammarText: string) => void;
  /** Bump to remount/reset the on-slide timer. */
  timerResetKey?: number;
  /** Editor only: listening slide follows the question being edited. */
  listenFocusId?: string;
  onTimerStateChange?: (state: SlideTimerState) => void;
}

function sizeMode(
  compact: boolean,
  present: boolean
): 'compact' | 'default' | 'present' {
  if (compact) return 'compact';
  if (present) return 'present';
  return 'default';
}

function textStyle(
  size: PresentationSlide['bodyFontSize'],
  color: PresentationSlide['bodyColor'],
  mode: 'compact' | 'default' | 'present'
): CSSProperties {
  return {
    fontSize: `${presentationFontSizePx(size, mode)}px`,
    color: presentationFontColorCss(color),
    lineHeight: 1.35,
  };
}

type ContentFigureImage = {
  url: string;
  alt: string;
  title: string;
  showTitle: boolean;
  subtitle: string;
  showSubtitle: boolean;
  vocabDeckId?: string;
};

/** Fullscreen only shows the element that was expanded, so the popup must mount inside it. */
function presentationOverlayRoot(): HTMLElement {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  const fullscreen = document.fullscreenElement || doc.webkitFullscreenElement || null;
  if (fullscreen instanceof HTMLElement) return fullscreen;
  return document.body;
}

function ContentImageLightbox({
  image,
  title,
  subtitle,
  onClose,
  onPrev,
  onNext,
  onOpenVocab,
}: {
  image: ContentFigureImage;
  title: string;
  subtitle: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onOpenVocab?: () => void;
}) {
  const [overlayRoot, setOverlayRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const update = () => setOverlayRoot(presentationOverlayRoot());
    update();
    document.addEventListener('fullscreenchange', update);
    document.addEventListener('webkitfullscreenchange', update as EventListener);
    return () => {
      document.removeEventListener('fullscreenchange', update);
      document.removeEventListener('webkitfullscreenchange', update as EventListener);
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (
        event.key === 'Escape' ||
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight' ||
        event.key === 'PageUp' ||
        event.key === 'PageDown' ||
        event.key === ' '
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight' && onNext) onNext();
      if (event.key === 'ArrowLeft' && onPrev) onPrev();
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose, onNext, onPrev]);

  if (!overlayRoot) return null;

  const arrowClass =
    'flex h-16 w-16 shrink-0 items-center justify-center border-4 border-[var(--comic-black)] bg-white text-4xl font-black leading-none text-[var(--comic-secondary)] comic-shadow-md md:h-20 md:w-20 md:text-5xl';

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--comic-secondary)]/90 p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={title || image.alt || 'Image'}
      onClick={onClose}
    >
      {onPrev ? (
        <button
          type="button"
          className={`absolute left-3 top-1/2 z-[101] -translate-y-1/2 md:left-6 ${arrowClass}`}
          aria-label="Previous image"
          onClick={(event) => {
            event.stopPropagation();
            onPrev();
          }}
        >
          ←
        </button>
      ) : null}
      {onNext ? (
        <button
          type="button"
          className={`absolute right-3 top-1/2 z-[101] -translate-y-1/2 md:right-6 ${arrowClass}`}
          aria-label="Next image"
          onClick={(event) => {
            event.stopPropagation();
            onNext();
          }}
        >
          →
        </button>
      ) : null}
      {onOpenVocab ? (
        <button
          type="button"
          className="absolute left-4 top-4 z-[102] border-4 border-[var(--comic-black)] bg-[var(--comic-yellow)] px-4 py-2 font-bungee text-sm uppercase text-[var(--comic-secondary)]"
          onClick={(event) => {
            event.stopPropagation();
            onOpenVocab();
          }}
        >
          Pre-teach vocab
        </button>
      ) : null}
      <button
        type="button"
        className="absolute right-4 top-4 z-[102] flex h-9 w-9 items-center justify-center text-3xl font-bold leading-none text-white/70 hover:text-white"
        aria-label="Close image"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
      >
        ×
      </button>
      <div
        className="flex max-h-full w-full max-w-6xl flex-col items-center gap-4 px-16 md:px-24"
        onClick={(event) => event.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.alt || title || 'Slide image'}
          className="max-h-[72vh] w-auto max-w-full border-4 border-[var(--comic-black)] bg-white object-contain comic-shadow-xl"
        />
        {title || subtitle ? (
          <div className="max-w-4xl text-center text-white">
            {title ? (
            <div className="font-bungee text-3xl leading-tight md:text-5xl">
              <SlideRichText text={title} />
            </div>
          ) : null}
            {subtitle ? (
              <div className="mt-2 text-xl font-bold leading-snug md:text-3xl">
                <SlideRichText text={subtitle} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>,
    overlayRoot
  );
}

function contentImageCaption(image: ContentFigureImage): { title: string; subtitle: string } {
  return {
    title: image.showTitle ? image.title.trim() : '',
    subtitle: image.showSubtitle ? image.subtitle.trim() : '',
  };
}

function VocabChip({
  present,
  onClick,
}: {
  present: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={[
        'absolute right-2 top-2 z-10 border-4 border-[var(--comic-black)] bg-[var(--comic-yellow)] font-bungee uppercase leading-none text-[var(--comic-secondary)]',
        present ? 'px-3 py-2 text-sm md:text-base' : 'px-2.5 py-1.5 text-xs',
      ].join(' ')}
      aria-label="Pre-teach vocabulary"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
    >
      Vocab
    </button>
  );
}

function ContentSlideFigure({
  image,
  className = '',
  compact,
  present,
  alignTop = false,
  onOpen,
  onOpenVocab,
}: {
  image: ContentFigureImage;
  className?: string;
  compact: boolean;
  present: boolean;
  /** Single text+image photo: keep the top of the picture visible. */
  alignTop?: boolean;
  onOpen?: () => void;
  onOpenVocab?: () => void;
}) {
  const title = image.showTitle ? image.title.trim() : '';
  const subtitle = image.showSubtitle ? image.subtitle.trim() : '';
  const canFocus = Boolean(onOpen) && !compact && Boolean(image.url.trim());
  const titleClass = compact
    ? 'text-xs'
    : present
      ? 'text-lg md:text-2xl'
      : 'text-sm md:text-base';
  const subtitleClass = compact
    ? 'text-[10px]'
    : present
      ? 'text-base md:text-xl'
      : 'text-xs md:text-sm';

  const caption =
    title || subtitle ? (
      <div className="shrink-0 text-center leading-tight">
        {title ? (
          <div className={`font-black text-[var(--comic-secondary)] ${titleClass}`}>
            <SlideRichText text={title} />
          </div>
        ) : null}
        {subtitle ? (
          <div className={`font-bold text-[var(--comic-dark)] ${subtitleClass}`}>
            <SlideRichText text={subtitle} />
          </div>
        ) : null}
      </div>
    ) : null;

  const showVocab = Boolean(onOpenVocab) && Boolean(image.vocabDeckId?.trim()) && !compact;
  const picture = image.url.trim() ? (
    <SlideImage
      url={image.url}
      alt={image.alt}
      alignTop={alignTop}
      className="h-full min-h-0 w-full flex-1"
    />
  ) : showVocab ? (
    <button
      type="button"
      className={[
        'flex h-full min-h-0 w-full flex-col items-center justify-center gap-2 border-4 border-[var(--comic-black)] bg-[var(--comic-yellow)] font-bungee uppercase text-[var(--comic-secondary)]',
        present ? 'text-2xl md:text-4xl' : 'text-lg',
      ].join(' ')}
      onClick={(event) => {
        event.stopPropagation();
        onOpenVocab?.();
      }}
    >
      <span>Vocab</span>
      <span className="text-sm font-bold normal-case tracking-normal">Pre-teach</span>
    </button>
  ) : (
    <SlideImage url="" alt={image.alt} alignTop={alignTop} className="h-full min-h-0 w-full flex-1" />
  );

  return (
    <figure className={`flex h-full min-h-0 flex-col gap-1 ${className}`}>
      <div className="relative min-h-0 flex-1">
        {canFocus ? (
          <button
            type="button"
            className="flex h-full min-h-0 w-full cursor-zoom-in flex-col border-0 bg-transparent p-0 text-center font-[inherit]"
            aria-label={title ? `Show ${title} larger` : 'Show this image larger'}
            onClick={(event) => {
              event.stopPropagation();
              onOpen?.();
            }}
          >
            {picture}
          </button>
        ) : (
          picture
        )}
        {showVocab && image.url.trim() ? <VocabChip present={present} onClick={() => onOpenVocab?.()} /> : null}
      </div>
      {caption}
    </figure>
  );
}

function SlideImage({
  url,
  alt,
  className = '',
  alignTop = false,
}: {
  url: string;
  alt: string;
  className?: string;
  alignTop?: boolean;
}) {
  if (!url.trim()) {
    return (
      <div
        className={`flex items-center justify-center border-4 border-dashed border-[var(--comic-black)]/40 bg-[var(--comic-light)] text-[var(--comic-dark)] font-bold ${className}`}
      >
        Add an image URL
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt || 'Slide image'}
      className={`absolute inset-0 h-full w-full border-4 border-[var(--comic-black)] comic-shadow-md bg-white object-cover ${
        alignTop ? 'object-top' : 'object-center'
      } ${className}`}
      style={alignTop ? { objectPosition: 'center top' } : undefined}
    />
  );
}

function SlideTable({
  slide,
  compact,
  present,
}: {
  slide: PresentationSlide;
  compact: boolean;
  present: boolean;
}) {
  const mode = sizeMode(compact, present);
  const style = textStyle(slide.tableFontSize, slide.tableColor, mode);
  const headers =
    slide.tableHeaders.length > 0 ? slide.tableHeaders : ['', ''];
  const rows =
    slide.tableRows.length > 0
      ? slide.tableRows
      : [headers.map(() => ''), headers.map(() => '')];

  return (
    <div className="flex w-full shrink-0 justify-start overflow-auto">
      <table
        className={[
          'border-collapse border-4 border-[var(--comic-black)] bg-white comic-shadow-md',
          compact ? 'w-full max-w-full' : 'w-auto max-w-full min-w-[50%]',
        ].join(' ')}
        style={style}
      >
        <thead>
          <tr className="bg-[#d0d0d0]">
            {headers.map((cell, index) => (
              <th
                key={`h-${index}`}
                className="border-2 border-[var(--comic-black)] px-2 py-1.5 text-left font-black"
              >
                {cell.trim() ? <SlideRichText text={cell} /> : compact ? '…' : 'Heading'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`r-${rowIndex}`}>
              {headers.map((_, colIndex) => (
                <td
                  key={`c-${rowIndex}-${colIndex}`}
                  className="border-2 border-[var(--comic-black)] px-2 py-1.5 font-bold align-top"
                >
                  {row[colIndex]?.trim() ? <SlideRichText text={row[colIndex]} /> : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AnagramLaunchButton({
  activityId,
  present,
  onClick,
}: {
  activityId: string;
  present: boolean;
  onClick: () => void;
}) {
  const [title, setTitle] = useState('');

  useEffect(() => {
    let cancelled = false;
    setTitle('');
    void fetch(`/api/anagram/activities/${activityId}`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((data) => {
        if (cancelled || !data?.activity) return;
        const activity = data.activity as { title?: string; topic?: string };
        const name = activity.title?.trim() || activity.topic?.trim() || 'Anagram';
        setTitle(name);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activityId]);

  return (
    <button
      type="button"
      className={[
        'flex w-full shrink-0 flex-col items-center justify-center gap-1 border-4 border-[var(--comic-black)] bg-[var(--comic-yellow)] px-6 text-center leading-tight text-[var(--comic-secondary)] comic-shadow-md',
        present ? 'min-h-[9rem] py-5' : 'min-h-[7.5rem] py-4',
      ].join(' ')}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
    >
      <span className={present ? 'font-bungee text-3xl uppercase md:text-4xl' : 'font-bungee text-2xl uppercase md:text-3xl'}>
        Play Anagram
      </span>
      <span
        className={
          present
            ? 'max-w-full font-bold normal-case text-[var(--comic-dark)] text-lg leading-snug md:text-xl'
            : 'max-w-full font-bold normal-case text-[var(--comic-dark)] text-base leading-snug'
        }
      >
        {title || 'Anagram'}
      </span>
    </button>
  );
}

function SentenceContestLaunchButton({
  activityId,
  present,
  onClick,
}: {
  activityId: string;
  present: boolean;
  onClick: () => void;
}) {
  const [title, setTitle] = useState('');

  useEffect(() => {
    let cancelled = false;
    setTitle('');
    void fetch(`/api/sentence-contest/activities/${activityId}`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((data) => {
        if (cancelled || !data?.activity) return;
        const activity = data.activity as { title?: string; prompt?: string };
        setTitle(activity.title?.trim() || activity.prompt?.trim() || 'Sentence contest');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activityId]);

  return (
    <button
      type="button"
      className={[
        'flex w-full shrink-0 flex-col items-center justify-center gap-1 border-4 border-[var(--comic-black)] bg-[var(--comic-yellow)] px-6 text-center leading-tight text-[var(--comic-secondary)] comic-shadow-md',
        present ? 'min-h-[9rem] py-5' : 'min-h-[7.5rem] py-4',
      ].join(' ')}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
    >
      <span className={present ? 'font-bungee text-3xl uppercase md:text-4xl' : 'font-bungee text-2xl uppercase md:text-3xl'}>
        Play Sentence contest
      </span>
      <span
        className={
          present
            ? 'max-w-full font-bold normal-case text-[var(--comic-dark)] text-lg leading-snug md:text-xl'
            : 'max-w-full font-bold normal-case text-[var(--comic-dark)] text-base leading-snug'
        }
      >
        {title || 'Sentence contest'}
      </span>
    </button>
  );
}

function BingoLaunchButton({
  activityId,
  present,
  onClick,
}: {
  activityId: string;
  present: boolean;
  onClick: () => void;
}) {
  const [title, setTitle] = useState('');

  useEffect(() => {
    let cancelled = false;
    setTitle('');
    void fetch(`/api/vocab-bingo/activities/${activityId}`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((data) => {
        if (cancelled || !data?.activity) return;
        const activity = data.activity as { title?: string; topic?: string };
        setTitle(activity.title?.trim() || activity.topic?.trim() || 'Vocabulary Bingo');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activityId]);

  return (
    <button
      type="button"
      className={[
        'flex w-full shrink-0 flex-col items-center justify-center gap-1 border-4 border-[var(--comic-black)] bg-[var(--comic-yellow)] px-6 text-center leading-tight text-[var(--comic-secondary)] comic-shadow-md',
        present ? 'min-h-[9rem] py-5' : 'min-h-[7.5rem] py-4',
      ].join(' ')}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
    >
      <span className={present ? 'font-bungee text-3xl uppercase md:text-4xl' : 'font-bungee text-2xl uppercase md:text-3xl'}>
        Play Bingo
      </span>
      <span
        className={
          present
            ? 'max-w-full font-bold normal-case text-[var(--comic-dark)] text-lg leading-snug md:text-xl'
            : 'max-w-full font-bold normal-case text-[var(--comic-dark)] text-base leading-snug'
        }
      >
        {title || 'Vocabulary Bingo'}
      </span>
    </button>
  );
}

function ContentBody({
  slide,
  body,
  column,
  compact,
  present,
  liveEditable,
  onGrammarTextChange,
  selectedAnagramId = '',
  onOpenAnagram,
  selectedBingoId = '',
  onOpenBingo,
  selectedContestId = '',
  onOpenContest,
}: {
  slide: PresentationSlide;
  body: string;
  column: 'left' | 'right';
  compact: boolean;
  present: boolean;
  liveEditable: boolean;
  onGrammarTextChange?: (grammarText: string) => void;
  selectedAnagramId?: string;
  onOpenAnagram?: (activityId: string) => void;
  selectedBingoId?: string;
  onOpenBingo?: (activityId: string) => void;
  selectedContestId?: string;
  onOpenContest?: (activityId: string) => void;
}) {
  const grammarOn =
    slide.layout === 'content' && slide.grammarHighlighterEnabled;
  const mode = sizeMode(compact, present);
  const bodyPx = presentationFontSizePx(slide.bodyFontSize, mode);
  const showBody = slide.showBody !== false;
  const bodyText = body.trim();
  const hasBullets = slide.bullets.filter((item) => item.trim()).length > 0;
  const showTable = Boolean(slide.tableEnabled);
  const onThisSide = (placement: 'left' | 'right' | undefined) =>
    (placement === 'right' ? 'right' : 'left') === column;
  const showDefinition = onThisSide(slide.bodyPlacement) && showBody && Boolean(bodyText);
  const showTableHere = showTable && onThisSide(slide.tablePlacement);
  const showBulletsHere = hasBullets && onThisSide(slide.bulletsPlacement);
  const showGrammarHere = grammarOn && onThisSide(slide.grammarPlacement);
  const showQuizHere = onThisSide(slide.quizPlacement);
  const showAnagramHere = column === 'left' && !compact && Boolean(selectedAnagramId);
  const showBingoHere = column === 'left' && !compact && Boolean(selectedBingoId);
  const showContestHere = column === 'left' && !compact && Boolean(selectedContestId);

  if (
    !showDefinition &&
    !showTableHere &&
    !showBulletsHere &&
    !showGrammarHere &&
    !showQuizHere &&
    !showAnagramHere &&
    !showBingoHere &&
    !showContestHere
  ) {
    return null;
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-3">
      {showDefinition ? (
        <p className="font-bold whitespace-pre-wrap" style={textStyle(slide.bodyFontSize, slide.bodyColor, mode)}>
          <SlideRichText text={body} />
        </p>
      ) : null}

      {showTableHere ? (
        <SlideTable slide={slide} compact={compact} present={present} />
      ) : null}

      {showBulletsHere ? (
        <ul className="space-y-2 font-bold">
          {slide.bullets.map((item, index) =>
            item.trim() ? (
              <li
                key={`b-${index}-${item}`}
                className="flex items-start gap-[0.55em]"
                style={textStyle(slide.bulletsFontSize, slide.bulletsColor, mode)}
              >
                <span className="shrink-0 leading-[1.35]" aria-hidden>
                  ●
                </span>
                <span className="min-w-0 flex-1 leading-[1.35]">
                  <SlideRichText text={item} />
                </span>
              </li>
            ) : (
              <li
                key={`gap-${index}`}
                className="list-none"
                style={{ height: `${Math.round(presentationFontSizePx(slide.bulletsFontSize, mode) * 0.7)}px` }}
                aria-hidden
              />
            )
          )}
        </ul>
      ) : null}

      {showGrammarHere ? (
        <div className="flex min-w-0 flex-col gap-2">
          {slide.grammarTitleEnabled && slide.grammarTitle.trim() ? (
            <p
              className="font-bungee leading-tight text-[var(--comic-secondary)]"
              style={{ fontSize: `${Math.max(bodyPx, 18)}px` }}
            >
              {slide.grammarTitle.trim()}
            </p>
          ) : null}
          <GrammarLiveTextBox
            key={slide.id}
            value={visibleGrammarText(slide)}
            grammarTarget={slide.grammarTarget}
            editable={liveEditable && Boolean(onGrammarTextChange)}
            onChange={onGrammarTextChange}
            className="font-bold leading-relaxed"
            style={{ fontSize: `${bodyPx}px`, lineHeight: 1.35 }}
            placeholder={
              grammarBoxModeOf(slide) === 'placeholder' && slide.grammarPlaceholder.trim()
                ? slide.grammarPlaceholder
                : 'Example...'
            }
          />
        </div>
      ) : null}

      {showAnagramHere ? (
        <AnagramLaunchButton
          activityId={selectedAnagramId}
          present={present}
          onClick={() => onOpenAnagram?.(selectedAnagramId)}
        />
      ) : null}

      {showBingoHere ? (
        <BingoLaunchButton
          activityId={selectedBingoId}
          present={present}
          onClick={() => onOpenBingo?.(selectedBingoId)}
        />
      ) : null}

      {showContestHere ? (
        <SentenceContestLaunchButton
          activityId={selectedContestId}
          present={present}
          onClick={() => onOpenContest?.(selectedContestId)}
        />
      ) : null}

      {showQuizHere ? (
        <PresentationQuiz slide={slide} compact={compact} present={present} />
      ) : null}
    </div>
  );
}

export default function SlideCanvas({
  slide,
  deck,
  slideNumber,
  totalSlides,
  className = '',
  compact = false,
  present = false,
  showImageSlot = false,
  liveEditable = false,
  onGrammarTextChange,
  timerResetKey = 0,
  onTimerStateChange,
  listenFocusId = '',
}: SlideCanvasProps) {
  const title = slide.title || (slide.layout === 'title' ? deck.title : 'Untitled slide');
  const body =
    slide.layout === 'title'
      ? slide.body || deck.subtitle
      : slide.body;
  const showTitle = slide.showTitle !== false;
  const showBody = slide.showBody !== false;
  const contentImages =
    slide.layout === 'content'
      ? getContentSlideImages(slide, title, { includeDeckOnly: true })
      : [];
  const multiContentImages = contentImages.length >= 2;
  const showContentImageColumn =
    slide.layout === 'content' &&
    !multiContentImages &&
    (contentImages.length === 1 ||
      (showImageSlot && contentImages.length === 0));
  const showRightColumn = showContentImageColumn;
  const contentOnRight =
    slide.layout === 'content' &&
    ((showBody && Boolean(body.trim()) && slide.bodyPlacement === 'right') ||
      (Boolean(slide.tableEnabled) && slide.tablePlacement === 'right') ||
      (slide.bullets.some((item) => item.trim()) && slide.bulletsPlacement === 'right') ||
      (Boolean(slide.grammarHighlighterEnabled) && slide.grammarPlacement === 'right') ||
      (Boolean(slide.quizEnabled) && slide.quizPlacement === 'right'));
  const mode = sizeMode(compact, present);
  const timerOn = Boolean(slide.timerEnabled);
  const [timerState, setTimerState] = useState<SlideTimerState>({
    started: false,
    secondsLeft: slide.timerSeconds || 60,
    timeUp: false,
  });
  const [localResetKey, setLocalResetKey] = useState(0);
  const [focusedImageIndex, setFocusedImageIndex] = useState<number | null>(null);
  const [openVocabDeckId, setOpenVocabDeckId] = useState<string | null>(null);
  const [openAnagramId, setOpenAnagramId] = useState<string | null>(null);
  const [openBingoId, setOpenBingoId] = useState<string | null>(null);
  const [openContestId, setOpenContestId] = useState<string | null>(null);
  const selectedAnagramId = slide.anagramActivityId.trim();
  const selectedBingoId = slide.bingoActivityId.trim();
  const selectedContestId = slide.sentenceContestActivityId.trim();

  function openAnagram(activityId: string) {
    const next = activityId.trim();
    if (!next) return;
    setFocusedImageIndex(null);
    setOpenVocabDeckId(null);
    setOpenBingoId(null);
    setOpenContestId(null);
    setOpenAnagramId(next);
  }

  function openBingo(activityId: string) {
    const next = activityId.trim();
    if (!next) return;
    setFocusedImageIndex(null);
    setOpenVocabDeckId(null);
    setOpenAnagramId(null);
    setOpenContestId(null);
    setOpenBingoId(next);
  }

  function openContest(activityId: string) {
    const next = activityId.trim();
    if (!next) return;
    setFocusedImageIndex(null);
    setOpenVocabDeckId(null);
    setOpenAnagramId(null);
    setOpenBingoId(null);
    setOpenContestId(next);
  }

  useEffect(() => {
    setFocusedImageIndex(null);
    setOpenVocabDeckId(null);
    setOpenAnagramId(null);
    setOpenBingoId(null);
    setOpenContestId(null);
  }, [slide.id]);

  useEffect(() => {
    onTimerStateChange?.(timerState);
  }, [timerState, onTimerStateChange]);

  function handleRequestTimerReset() {
    setLocalResetKey((value) => value + 1);
  }

  return (
    <article
      className={[
        'presentation-slide relative overflow-hidden',
        'bg-[var(--comic-white)] text-[var(--comic-dark)]',
        present
          ? 'h-full w-full'
          : 'aspect-[16/9] w-full border-4 border-[var(--comic-black)] comic-shadow-xl',
        className,
      ].join(' ')}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--brand-gray)_0%,var(--brand-white)_45%,color-mix(in_srgb,var(--brand-navy)_8%,white)_100%)]" />
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--comic-primary)]/15 border-4 border-[var(--comic-black)]/20" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-[var(--comic-secondary)]/10 border-4 border-[var(--comic-black)]/15" />

      {timerOn && slide.layout !== 'pie_timer' ? (
        <div
          className={[
            'absolute z-20',
            compact ? 'right-3 top-3' : present ? 'right-6 top-6 md:right-8 md:top-8' : 'right-5 top-5',
          ].join(' ')}
        >
          <PresentationSlideTimer
            key={`${slide.id}-${timerResetKey}-${localResetKey}`}
            enabled={timerOn}
            seconds={slide.timerSeconds || 60}
            slideId={slide.id}
            compact={compact}
            present={present}
            onStateChange={setTimerState}
          />
        </div>
      ) : null}

      <div
        className={[
          'relative z-[1] flex h-full flex-col',
          compact
            ? 'p-4 gap-2'
            : present
              ? 'p-10 md:p-14 gap-5'
              : 'p-8 md:p-10 gap-4',
        ].join(' ')}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {slide.layout === 'title' ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center gap-4">
            <p
              className={[
                'font-bungee uppercase tracking-wide text-[var(--comic-primary)]',
                compact ? 'text-xs' : present ? 'text-base md:text-xl' : 'text-sm md:text-base',
              ].join(' ')}
            >
              {deck.brandLabel?.trim() || 'Englishfully'}
            </p>
            {showTitle ? (
              <h2
                className={[
                  'font-bungee leading-tight text-[var(--comic-secondary)]',
                  compact ? 'text-xl' : present ? 'text-4xl md:text-6xl' : 'text-3xl md:text-5xl',
                ].join(' ')}
              >
                <SlideRichText text={title || 'Presentation title'} />
              </h2>
            ) : null}
            {showBody && body ? (
              <p
                className="max-w-4xl font-bold whitespace-pre-wrap"
                style={textStyle(slide.bodyFontSize, slide.bodyColor, mode)}
              >
                <SlideRichText text={body} />
              </p>
            ) : null}
          </div>
        ) : null}

        {slide.layout === 'content' ? (
          <div className="flex flex-1 min-h-0 flex-col gap-4">
            {showTitle ? (
              <h2
                className={[
                  'font-bungee text-[var(--comic-secondary)] leading-tight border-b-4 border-[var(--comic-black)] pb-2',
                  compact ? 'text-base' : present ? 'text-3xl md:text-5xl' : 'text-2xl md:text-4xl',
                ].join(' ')}
              >
                <SlideRichText text={title} />
              </h2>
            ) : null}
            {multiContentImages ? (
              <>
                <div
                  className={
                    contentOnRight
                      ? 'grid min-h-0 grid-cols-2 items-start gap-4'
                      : 'flex min-h-0 flex-col gap-3 overflow-auto'
                  }
                >
                  <ContentBody
                    slide={slide}
                    body={body}
                    column="left"
                    compact={compact}
                    present={present}
                    liveEditable={liveEditable}
                    onGrammarTextChange={onGrammarTextChange}
                    selectedAnagramId={selectedAnagramId}
                    onOpenAnagram={openAnagram}
                    selectedBingoId={selectedBingoId}
                    onOpenBingo={openBingo}
                    selectedContestId={selectedContestId}
                    onOpenContest={openContest}
                  />
                  {contentOnRight ? (
                    <ContentBody
                      slide={slide}
                      body={body}
                      column="right"
                      compact={compact}
                      present={present}
                      liveEditable={liveEditable}
                      onGrammarTextChange={onGrammarTextChange}
                    />
                  ) : null}
                </div>
                <div
                  className={[
                    'grid min-h-0 gap-3',
                    contentImages.length >= 4
                      ? 'grid-cols-2 auto-rows-fr'
                      : contentImages.length === 3
                        ? 'grid-cols-3'
                        : 'grid-cols-2',
                    compact
                      ? contentImages.length >= 4
                        ? 'max-h-48'
                        : 'max-h-32'
                      : present
                        ? 'flex-1'
                        : contentImages.length >= 4
                          ? 'max-h-[28rem] flex-1'
                          : 'max-h-56 md:max-h-72',
                  ].join(' ')}
                >
                  {contentImages.map((image, index) => (
                    <ContentSlideFigure
                      key={`${slide.id}-${index}-${image.url}-${image.vocabDeckId || ''}`}
                      image={image}
                      compact={compact}
                      present={present}
                      onOpen={() => setFocusedImageIndex(index)}
                      onOpenVocab={
                        image.vocabDeckId
                          ? () => setOpenVocabDeckId(image.vocabDeckId || null)
                          : undefined
                      }
                    />
                  ))}
                </div>
              </>
            ) : (
              <div
                className={[
                  'grid min-h-0 items-stretch gap-4',
                  showRightColumn || contentOnRight ? 'flex-1 grid-cols-2' : 'grid-cols-1',
                ].join(' ')}
              >
                <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-auto">
                  <ContentBody
                    slide={slide}
                    body={body}
                    column="left"
                    compact={compact}
                    present={present}
                    liveEditable={liveEditable}
                    onGrammarTextChange={onGrammarTextChange}
                    selectedAnagramId={selectedAnagramId}
                    onOpenAnagram={openAnagram}
                    selectedBingoId={selectedBingoId}
                    onOpenBingo={openBingo}
                    selectedContestId={selectedContestId}
                    onOpenContest={openContest}
                  />
                </div>
                {showRightColumn || contentOnRight ? (
                  <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-auto">
                    <ContentBody
                      slide={slide}
                      body={body}
                      column="right"
                      compact={compact}
                      present={present}
                      liveEditable={liveEditable}
                      onGrammarTextChange={onGrammarTextChange}
                    />
                    {showRightColumn ? (
                  <ContentSlideFigure
                    key={`${slide.id}-side`}
                    onOpen={
                      contentImages[0]?.url
                        ? () => setFocusedImageIndex(0)
                        : undefined
                    }
                    onOpenVocab={
                      contentImages[0]?.vocabDeckId
                        ? () => setOpenVocabDeckId(contentImages[0]?.vocabDeckId || null)
                        : undefined
                    }
                    image={{
                      url: contentImages[0]?.url || slide.imageUrl,
                      alt: contentImages[0]?.alt || slide.imageAlt || title,
                      title: contentImages[0]?.title || slide.imageAlt,
                      showTitle: contentImages[0]?.showTitle ?? slide.showImageTitle !== false,
                      subtitle: contentImages[0]?.subtitle || slide.imageSubtitle,
                      showSubtitle:
                        contentImages[0]?.showSubtitle ?? slide.showImageSubtitle !== false,
                      vocabDeckId: contentImages[0]?.vocabDeckId || slide.vocabDeckId,
                    }}
                    compact={compact}
                    present={present}
                    alignTop
                    className={
                      compact
                        ? 'max-h-40 min-h-0 min-w-0'
                        : contentOnRight
                          ? 'min-h-0 min-w-0 flex-1'
                          : 'h-full max-h-full min-h-0 min-w-0'
                    }
                  />
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
            {focusedImageIndex !== null && contentImages[focusedImageIndex] ? (
              <ContentImageLightbox
                image={contentImages[focusedImageIndex]}
                {...contentImageCaption(contentImages[focusedImageIndex])}
                onClose={() => setFocusedImageIndex(null)}
                onOpenVocab={
                  contentImages[focusedImageIndex].vocabDeckId
                    ? () => {
                        setOpenVocabDeckId(contentImages[focusedImageIndex].vocabDeckId || null);
                        setFocusedImageIndex(null);
                      }
                    : undefined
                }
                onPrev={
                  focusedImageIndex > 0
                    ? () => setFocusedImageIndex(focusedImageIndex - 1)
                    : undefined
                }
                onNext={
                  focusedImageIndex < contentImages.length - 1
                    ? () => setFocusedImageIndex(focusedImageIndex + 1)
                    : undefined
                }
              />
            ) : null}
          </div>
        ) : null}

        {slide.layout === 'pie_timer' ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            {showTitle && slide.title.trim() ? (
              <h2
                className={[
                  'shrink-0 font-bungee text-[var(--comic-secondary)] leading-tight border-b-4 border-[var(--comic-black)] pb-2',
                  compact ? 'text-base' : present ? 'text-3xl md:text-5xl' : 'text-2xl md:text-4xl',
                ].join(' ')}
              >
                <SlideRichText text={slide.title} />
              </h2>
            ) : null}
            <div className="min-h-0 flex-1">
              <PresentationPieTimer slide={slide} present={present} compact={compact} />
            </div>
          </div>
        ) : null}

        {slide.layout === 'fill_blank' ? (
          <PresentationFillBlank
            slide={slide}
            title={title}
            compact={compact}
            present={present}
          />
        ) : null}

        {slide.layout === 'bullets' ? (
          <div className="flex flex-1 min-h-0 flex-col gap-4">
            {showTitle ? (
              <h2
                className={[
                  'font-bungee text-[var(--comic-secondary)] leading-tight border-b-4 border-[var(--comic-black)] pb-2',
                  compact ? 'text-base' : present ? 'text-3xl md:text-5xl' : 'text-2xl md:text-4xl',
                ].join(' ')}
              >
                <SlideRichText text={title} />
              </h2>
            ) : null}
            {!compact && selectedAnagramId ? (
              <AnagramLaunchButton
                activityId={selectedAnagramId}
                present={present}
                onClick={() => openAnagram(selectedAnagramId)}
              />
            ) : null}
            {!compact && selectedBingoId ? (
              <BingoLaunchButton
                activityId={selectedBingoId}
                present={present}
                onClick={() => openBingo(selectedBingoId)}
              />
            ) : null}
            {!compact && selectedContestId ? (
              <SentenceContestLaunchButton
                activityId={selectedContestId}
                present={present}
                onClick={() => openContest(selectedContestId)}
              />
            ) : null}
            <ul className="flex-1 space-y-2 overflow-auto font-bold">
              {(slide.bullets.length > 0 ? slide.bullets : ['Add bullet points…']).map(
                (item, index) =>
                  item.trim() ? (
                    <li
                      key={`b-${index}-${item}`}
                      className="flex gap-3 border-4 border-[var(--comic-black)] bg-white/80 px-3 py-2 comic-shadow-sm"
                      style={textStyle(slide.bulletsFontSize, slide.bulletsColor, mode)}
                    >
                      <span className="text-[var(--comic-primary)]">●</span>
                      <span>
                        <SlideRichText text={item} />
                      </span>
                    </li>
                  ) : (
                    <li
                      key={`gap-${index}`}
                      className="list-none"
                      style={{
                        height: `${Math.round(presentationFontSizePx(slide.bulletsFontSize, mode) * 0.7)}px`,
                      }}
                      aria-hidden
                    />
                  )
              )}
            </ul>
          </div>
        ) : null}

        {slide.layout === 'image' ? (
          <div className="flex flex-1 min-h-0 flex-col gap-3">
            {showTitle ? (
              <h2
                className={[
                  'font-bungee text-[var(--comic-secondary)] leading-tight',
                  compact ? 'text-base' : present ? 'text-3xl md:text-5xl' : 'text-2xl md:text-4xl',
                ].join(' ')}
              >
                <SlideRichText text={title} />
              </h2>
            ) : null}
            <div className="relative min-h-0 flex-1">
              {!slide.imageUrl.trim() && slide.vocabDeckId.trim() && !compact ? (
                <button
                  type="button"
                  className="flex h-full min-h-[8rem] w-full flex-col items-center justify-center gap-2 border-4 border-[var(--comic-black)] bg-[var(--comic-yellow)] font-bungee text-2xl uppercase text-[var(--comic-secondary)] md:text-4xl"
                  onClick={() => setOpenVocabDeckId(slide.vocabDeckId)}
                >
                  <span>Vocab</span>
                  <span className="text-sm font-bold normal-case tracking-normal">Pre-teach</span>
                </button>
              ) : (
                <>
                  <SlideImage
                    url={slide.imageUrl}
                    alt={slide.imageAlt || title}
                    className="h-full min-h-0 w-full"
                  />
                  {!compact && slide.vocabDeckId.trim() ? (
                    <VocabChip present={present} onClick={() => setOpenVocabDeckId(slide.vocabDeckId)} />
                  ) : null}
                </>
              )}
            </div>
            {showBody && body ? (
              <p
                className="font-bold whitespace-pre-wrap"
                style={textStyle(slide.bodyFontSize, slide.bodyColor, mode)}
              >
                <SlideRichText text={body} />
              </p>
            ) : null}
            {slide.bullets.filter((item) => item.trim()).length > 0 ? (
              <ul className="space-y-2 font-bold">
                {slide.bullets.map((item, index) =>
                  item.trim() ? (
                    <li
                      key={`b-${index}-${item}`}
                      className="flex items-start gap-[0.55em]"
                      style={textStyle(slide.bulletsFontSize, slide.bulletsColor, mode)}
                    >
                      <span className="shrink-0 leading-[1.35]" aria-hidden>
                        ●
                      </span>
                      <span className="min-w-0 flex-1 leading-[1.35]">
                  <SlideRichText text={item} />
                </span>
                    </li>
                  ) : (
                    <li
                      key={`gap-${index}`}
                      className="list-none"
                      style={{
                        height: `${Math.round(presentationFontSizePx(slide.bulletsFontSize, mode) * 0.7)}px`,
                      }}
                      aria-hidden
                    />
                  )
                )}
              </ul>
            ) : null}
          </div>
        ) : null}

        {slide.layout === 'listen_question' ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            {showTitle && slide.title.trim() ? (
              <h2
                className={[
                  'shrink-0 font-bungee text-[var(--comic-secondary)] leading-tight border-b-4 border-[var(--comic-black)] pb-2',
                  compact ? 'text-base' : present ? 'text-2xl md:text-4xl' : 'text-xl md:text-3xl',
                ].join(' ')}
              >
                <SlideRichText text={slide.title} />
              </h2>
            ) : null}
            <div className="min-h-0 flex-1">
              <PresentationListenQuestions
                slide={slide}
                present={present}
                compact={compact}
                focusQuestionId={listenFocusId}
              />
            </div>
          </div>
        ) : null}

        {slide.layout === 'audio_image' ? (
          <div className="flex flex-1 min-h-0 flex-col gap-3">
            {showTitle ? (
              <h2
                className={[
                  'font-bungee text-[var(--comic-secondary)] leading-tight border-b-4 border-[var(--comic-black)] pb-2',
                  compact ? 'text-base' : present ? 'text-2xl md:text-4xl' : 'text-xl md:text-3xl',
                ].join(' ')}
              >
                <SlideRichText text={title || 'Listen and choose'} />
              </h2>
            ) : null}
            {showBody && body ? (
              <p
                className="font-bold whitespace-pre-wrap"
                style={textStyle(slide.bodyFontSize, slide.bodyColor, mode)}
              >
                <SlideRichText text={body} />
              </p>
            ) : null}
            <div className="min-h-0 flex-1">
              <PresentationAudioMatch slide={slide} present={present} compact={compact} />
            </div>
          </div>
        ) : null}

        {slide.layout === 'describe_image' ? (
          <div className="flex flex-1 min-h-0 flex-col gap-3">
            {showTitle ? (
              <h2
                className={[
                  'font-bungee text-[var(--comic-secondary)] leading-tight border-b-4 border-[var(--comic-black)] pb-2',
                  compact ? 'text-base' : present ? 'text-2xl md:text-4xl' : 'text-xl md:text-3xl',
                ].join(' ')}
              >
                <SlideRichText text={title || 'Describe the image'} />
              </h2>
            ) : null}
            {showBody && body ? (
              <p
                className="font-bold whitespace-pre-wrap"
                style={textStyle(slide.bodyFontSize, slide.bodyColor, mode)}
              >
                <SlideRichText text={body} />
              </p>
            ) : null}
            <div className="min-h-0 flex-1">
              <PresentationDescribeImage
                slide={slide}
                present={present}
                compact={compact}
                timerState={timerOn ? timerState : null}
                onRequestTimerReset={timerOn ? handleRequestTimerReset : undefined}
              />
            </div>
          </div>
        ) : null}

        {slide.layout === 'match_text_image' ? (
          <div className="flex flex-1 min-h-0 flex-col gap-3">
            {showTitle ? (
              <h2
                className={[
                  'font-bungee text-[var(--comic-secondary)] leading-tight border-b-4 border-[var(--comic-black)] pb-2',
                  compact ? 'text-base' : present ? 'text-2xl md:text-4xl' : 'text-xl md:text-3xl',
                ].join(' ')}
              >
                <SlideRichText text={title || 'Match the words'} />
              </h2>
            ) : null}
            {showBody && body ? (
              <p
                className="font-bold whitespace-pre-wrap"
                style={textStyle(slide.bodyFontSize, slide.bodyColor, mode)}
              >
                <SlideRichText text={body} />
              </p>
            ) : null}
            <div className="min-h-0 flex-1">
              <PresentationMatchTextImage
                slide={slide}
                present={present}
                compact={compact}
                timerState={timerOn ? timerState : null}
                onRequestTimerReset={timerOn ? handleRequestTimerReset : undefined}
              />
            </div>
          </div>
        ) : null}
        </div>

        {slide.layout === 'content' || slide.layout === 'listen_question' ? null : (
          <PresentationQuiz slide={slide} compact={compact} present={present} />
        )}

        <div
          className={[
            'relative z-[2] mt-2 flex shrink-0 items-center justify-between border-t-2 border-[var(--comic-black)]/30 pt-2 font-bold text-[var(--comic-dark)]/70',
            compact ? 'text-[10px]' : present ? 'text-base md:text-lg' : 'text-sm',
          ].join(' ')}
        >
          <span className="min-w-0 truncate">{deck.title || 'Presentation'}</span>
          <span className="shrink-0">
            {slideNumber} / {totalSlides}
          </span>
        </div>
      </div>
      {openVocabDeckId ? (
        <VocabFlashcardStage
          deckId={openVocabDeckId}
          overlay
          onClose={() => setOpenVocabDeckId(null)}
        />
      ) : null}
      {openAnagramId ? (
        <AnagramStage
          activityId={openAnagramId}
          overlay
          onClose={() => setOpenAnagramId(null)}
        />
      ) : null}
      {openBingoId ? (
        <VocabBingoCaller
          activityId={openBingoId}
          overlay
          onClose={() => setOpenBingoId(null)}
        />
      ) : null}
      {openContestId ? (
        <SentenceContestStage
          activityId={openContestId}
          overlay
          onClose={() => setOpenContestId(null)}
        />
      ) : null}
    </article>
  );
}
