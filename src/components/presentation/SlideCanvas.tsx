'use client';

import { useEffect, useState, type CSSProperties } from 'react';
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
    <div className="flex w-full shrink-0 justify-center overflow-auto">
      <table
        className={[
          'border-collapse border-4 border-[var(--comic-black)] bg-white comic-shadow-md',
          compact ? 'w-full max-w-full' : 'w-auto max-w-full min-w-[50%]',
        ].join(' ')}
        style={style}
      >
        <thead>
          <tr className="bg-[var(--comic-light)]">
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
  const hasBullets = slide.bullets.filter((item) => item.trim()).length > 0;

  if (!showBody && !hasBullets && !grammarOn) {
    return null;
  }

  return (
    <div className="space-y-3">
      {showBody ? (
        body ? (
          <p className="font-bold whitespace-pre-wrap" style={textStyle(slide.bodyFontSize, slide.bodyColor, mode)}>
            {body}
          </p>
        ) : (
          <p
            className="font-bold whitespace-pre-wrap text-[var(--comic-dark)]/50"
            style={{ fontSize: `${bodyPx}px`, lineHeight: 1.35 }}
          >
            Add a definition or explanation…
          </p>
        )
      ) : null}

      {hasBullets ? (
        <ul className="space-y-1 font-bold">
          {slide.bullets
            .filter((item) => item.trim())
            .map((item) => (
              <li
                key={item}
                className="flex items-start gap-[0.55em]"
                style={textStyle(slide.bulletsFontSize, slide.bulletsColor, mode)}
              >
                <span className="shrink-0 leading-[1.35]" aria-hidden>
                  ●
                </span>
                <span className="min-w-0 flex-1 leading-[1.35]">{item}</span>
              </li>
            ))}
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
  const showTable =
    slide.layout === 'content' && Boolean(slide.tableEnabled);
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
                {showTable ? (
                  <SlideTable slide={slide} compact={compact} present={present} />
                ) : null}
                <div
                  className={[
                    'grid min-h-0 gap-3',
                    contentImages.length >= 3 ? 'grid-cols-3' : 'grid-cols-2',
                    compact
                      ? 'max-h-32'
                      : present
                        ? 'flex-1'
                        : 'max-h-56 md:max-h-72',
                  ].join(' ')}
                >
                  {contentImages.map((image) => (
                    <SlideImage
                      key={image.url}
                      url={image.url}
                      alt={image.alt}
                      className="h-full max-h-full w-full min-h-0"
                    />
                  ))}
                </div>
              </>
            ) : (
              <>
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
                    <SlideImage
                      url={contentImages[0]?.url || slide.imageUrl}
                      alt={contentImages[0]?.alt || slide.imageAlt || title}
                      className={compact ? 'h-full max-h-40 w-full' : 'h-full max-h-full w-full'}
                    />
                  ) : null}
                </div>
                {showTable ? (
                  <SlideTable slide={slide} compact={compact} present={present} />
                ) : null}
              </>
            )}
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
              {(slide.bullets.length > 0 ? slide.bullets : ['Add bullet points…']).map((item) => (
                <li
                  key={item}
                  className="flex gap-3 border-4 border-[var(--comic-black)] bg-white/80 px-3 py-2 comic-shadow-sm"
                  style={textStyle(slide.bulletsFontSize, slide.bulletsColor, mode)}
                >
                  <span className="text-[var(--comic-primary)]">●</span>
                  <span>{item}</span>
                </li>
              ))}
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
              <ul className="space-y-1 font-bold">
                {slide.bullets
                  .filter((item) => item.trim())
                  .map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-[0.55em]"
                      style={textStyle(slide.bulletsFontSize, slide.bulletsColor, mode)}
                    >
                      <span className="shrink-0 leading-[1.35]" aria-hidden>
                        ●
                      </span>
                      <span className="min-w-0 flex-1 leading-[1.35]">{item}</span>
                    </li>
                  ))}
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

        <div
          className={[
            'mt-auto flex items-center justify-between border-t-2 border-[var(--comic-black)]/30 pt-2 font-bold text-[var(--comic-dark)]/70',
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
