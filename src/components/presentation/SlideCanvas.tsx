'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import {
  presentationFontColorCss,
  presentationFontSizePx,
  getContentSlideImages,
  type PresentationDeck,
  type PresentationSlide,
} from '@/lib/presentation/types';
import { GrammarLiveTextBox } from './GrammarHighlight';
import PresentationAudioMatch from './PresentationAudioMatch';
import PresentationDescribeImage from './PresentationDescribeImage';
import PresentationMatchTextImage from './PresentationMatchTextImage';
import PresentationSlideTimer, { type SlideTimerState } from './PresentationSlideTimer';

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
}: {
  image: ContentFigureImage;
  title: string;
  subtitle: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
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
            {title ? <div className="font-bungee text-3xl leading-tight md:text-5xl">{title}</div> : null}
            {subtitle ? (
              <div className="mt-2 text-xl font-bold leading-snug md:text-3xl">{subtitle}</div>
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

function ContentSlideFigure({
  image,
  className = '',
  compact,
  present,
  onOpen,
}: {
  image: ContentFigureImage;
  className?: string;
  compact: boolean;
  present: boolean;
  onOpen?: () => void;
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
          <div className={`font-black text-[var(--comic-secondary)] ${titleClass}`}>{title}</div>
        ) : null}
        {subtitle ? (
          <div className={`font-bold text-[var(--comic-dark)] ${subtitleClass}`}>{subtitle}</div>
        ) : null}
      </div>
    ) : null;

  const picture = <SlideImage url={image.url} alt={image.alt} className="min-h-0 w-full flex-1" />;

  if (!canFocus) {
    return (
      <figure className={`flex h-full min-h-0 flex-col gap-1 ${className}`}>
        {picture}
        {caption}
      </figure>
    );
  }

  return (
    <button
      type="button"
      className={`flex h-full min-h-0 w-full cursor-zoom-in flex-col gap-1 border-0 bg-transparent p-0 text-center font-[inherit] ${className}`}
      aria-label={title ? `Show ${title} larger` : 'Show this image larger'}
      onClick={(event) => {
        event.stopPropagation();
        onOpen?.();
      }}
    >
      {picture}
      {caption}
    </button>
  );
}

function SlideImage({ url, alt, className = '' }: { url: string; alt: string; className?: string }) {
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
      className={`object-cover border-4 border-[var(--comic-black)] comic-shadow-md bg-white ${className}`}
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
                {cell.trim() || (compact ? '…' : 'Heading')}
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
                  {row[colIndex]?.trim() || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContentBody({
  slide,
  body,
  compact,
  present,
  liveEditable,
  onGrammarTextChange,
}: {
  slide: PresentationSlide;
  body: string;
  compact: boolean;
  present: boolean;
  liveEditable: boolean;
  onGrammarTextChange?: (grammarText: string) => void;
}) {
  const grammarOn =
    slide.layout === 'content' && slide.grammarHighlighterEnabled;
  const mode = sizeMode(compact, present);
  const bodyPx = presentationFontSizePx(slide.bodyFontSize, mode);
  const showBody = slide.showBody !== false;
  const bodyText = body.trim();
  const hasBullets = slide.bullets.filter((item) => item.trim()).length > 0;
  const showTable = Boolean(slide.tableEnabled);

  if ((!showBody || !bodyText) && !hasBullets && !grammarOn && !showTable) {
    return null;
  }

  return (
    <div className="space-y-3">
      {showBody && bodyText ? (
        <p className="font-bold whitespace-pre-wrap" style={textStyle(slide.bodyFontSize, slide.bodyColor, mode)}>
          {body}
        </p>
      ) : null}

      {showTable ? (
        <SlideTable slide={slide} compact={compact} present={present} />
      ) : null}

      {hasBullets ? (
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
                <span className="min-w-0 flex-1 leading-[1.35]">{item}</span>
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

      {grammarOn ? (
        <GrammarLiveTextBox
          key={slide.id}
          value={slide.grammarText}
          grammarTarget={slide.grammarTarget}
          editable={liveEditable && Boolean(onGrammarTextChange)}
          onChange={onGrammarTextChange}
          className="font-bold leading-relaxed"
          style={{ fontSize: `${bodyPx}px`, lineHeight: 1.35 }}
          placeholder={
            slide.grammarCustomPlaceholderEnabled && slide.grammarPlaceholder.trim()
              ? slide.grammarPlaceholder
              : 'Example...'
          }
        />
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
}: SlideCanvasProps) {
  const title = slide.title || (slide.layout === 'title' ? deck.title : 'Untitled slide');
  const body =
    slide.layout === 'title'
      ? slide.body || deck.subtitle
      : slide.body;
  const showTitle = slide.showTitle !== false;
  const showBody = slide.showBody !== false;
  const contentImages =
    slide.layout === 'content' ? getContentSlideImages(slide, title) : [];
  const multiContentImages = contentImages.length >= 2;
  const showContentImageColumn =
    slide.layout === 'content' &&
    !multiContentImages &&
    (contentImages.length === 1 ||
      (showImageSlot && contentImages.length === 0));
  const showRightColumn = showContentImageColumn;
  const mode = sizeMode(compact, present);
  const timerOn = Boolean(slide.timerEnabled);
  const [timerState, setTimerState] = useState<SlideTimerState>({
    started: false,
    secondsLeft: slide.timerSeconds || 60,
    timeUp: false,
  });
  const [localResetKey, setLocalResetKey] = useState(0);
  const [focusedImageIndex, setFocusedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    setFocusedImageIndex(null);
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

      {timerOn ? (
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
                {title || 'Presentation title'}
              </h2>
            ) : null}
            {showBody && body ? (
              <p
                className="max-w-4xl font-bold whitespace-pre-wrap"
                style={textStyle(slide.bodyFontSize, slide.bodyColor, mode)}
              >
                {body}
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
                {title}
              </h2>
            ) : null}
            {multiContentImages ? (
              <>
                <div className="min-h-0 overflow-auto">
                  <ContentBody
                    slide={slide}
                    body={body}
                    compact={compact}
                    present={present}
                    liveEditable={liveEditable}
                    onGrammarTextChange={onGrammarTextChange}
                  />
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
                      key={`${slide.id}-${index}-${image.url}`}
                      image={image}
                      compact={compact}
                      present={present}
                      onOpen={() => setFocusedImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div
                className={[
                  'grid min-h-0 gap-4',
                  showRightColumn ? 'flex-1 md:grid-cols-2' : 'grid-cols-1',
                ].join(' ')}
              >
                <div className="min-h-0 overflow-auto">
                  <ContentBody
                    slide={slide}
                    body={body}
                    compact={compact}
                    present={present}
                    liveEditable={liveEditable}
                    onGrammarTextChange={onGrammarTextChange}
                  />
                </div>
                {showRightColumn ? (
                  <ContentSlideFigure
                    key={`${slide.id}-side`}
                    onOpen={
                      contentImages[0]?.url
                        ? () => setFocusedImageIndex(0)
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
                    }}
                    compact={compact}
                    present={present}
                    className={compact ? 'max-h-40' : 'h-full max-h-full'}
                  />
                ) : null}
              </div>
            )}
            {focusedImageIndex !== null && contentImages[focusedImageIndex] ? (
              <ContentImageLightbox
                image={contentImages[focusedImageIndex]}
                {...contentImageCaption(contentImages[focusedImageIndex])}
                onClose={() => setFocusedImageIndex(null)}
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

        {slide.layout === 'bullets' ? (
          <div className="flex flex-1 min-h-0 flex-col gap-4">
            {showTitle ? (
              <h2
                className={[
                  'font-bungee text-[var(--comic-secondary)] leading-tight border-b-4 border-[var(--comic-black)] pb-2',
                  compact ? 'text-base' : present ? 'text-3xl md:text-5xl' : 'text-2xl md:text-4xl',
                ].join(' ')}
              >
                {title}
              </h2>
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
                      <span>{item}</span>
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
                {title}
              </h2>
            ) : null}
            <SlideImage
              url={slide.imageUrl}
              alt={slide.imageAlt || title}
              className="min-h-0 flex-1 w-full"
            />
            {showBody && body ? (
              <p
                className="font-bold whitespace-pre-wrap"
                style={textStyle(slide.bodyFontSize, slide.bodyColor, mode)}
              >
                {body}
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
                      <span className="min-w-0 flex-1 leading-[1.35]">{item}</span>
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

        {slide.layout === 'audio_image' ? (
          <div className="flex flex-1 min-h-0 flex-col gap-3">
            {showTitle ? (
              <h2
                className={[
                  'font-bungee text-[var(--comic-secondary)] leading-tight border-b-4 border-[var(--comic-black)] pb-2',
                  compact ? 'text-base' : present ? 'text-2xl md:text-4xl' : 'text-xl md:text-3xl',
                ].join(' ')}
              >
                {title || 'Listen and choose'}
              </h2>
            ) : null}
            {showBody && body ? (
              <p
                className="font-bold whitespace-pre-wrap"
                style={textStyle(slide.bodyFontSize, slide.bodyColor, mode)}
              >
                {body}
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
                {title || 'Describe the image'}
              </h2>
            ) : null}
            {showBody && body ? (
              <p
                className="font-bold whitespace-pre-wrap"
                style={textStyle(slide.bodyFontSize, slide.bodyColor, mode)}
              >
                {body}
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
                {title || 'Match the words'}
              </h2>
            ) : null}
            {showBody && body ? (
              <p
                className="font-bold whitespace-pre-wrap"
                style={textStyle(slide.bodyFontSize, slide.bodyColor, mode)}
              >
                {body}
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

        <div
          className={[
            'relative z-[2] mt-2 flex shrink-0 items-center justify-between border-t-2 border-[var(--comic-black)]/30 pt-2 font-bold text-[var(--comic-dark)]/70',
            compact ? 'text-[10px]' : present ? 'text-base md:text-lg' : 'text-sm',
          ].join(' ')}
        >
          <span>{deck.title || 'Presentation'}</span>
          <span>
            {slideNumber} / {totalSlides}
          </span>
        </div>
      </div>
    </article>
  );
}
