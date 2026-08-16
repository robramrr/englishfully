'use client';

import type { PresentationDeck, PresentationSlide } from '@/lib/presentation/types';
import { GrammarLiveTextBox } from './GrammarHighlight';

interface SlideCanvasProps {
  slide: PresentationSlide;
  deck: PresentationDeck;
  slideNumber: number;
  totalSlides: number;
  className?: string;
  compact?: boolean;
  /** Show empty image placeholder (editor). Hidden in present mode when no URL. */
  showImageSlot?: boolean;
  /** Allow live typing into the text box during present/preview. */
  liveEditable?: boolean;
  onBodyChange?: (body: string) => void;
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

function ContentBody({
  slide,
  body,
  compact,
  liveEditable,
  onBodyChange,
}: {
  slide: PresentationSlide;
  body: string;
  compact: boolean;
  liveEditable: boolean;
  onBodyChange?: (body: string) => void;
}) {
  const grammarOn =
    slide.layout === 'content' && slide.grammarHighlighterEnabled;

  const textClass = [
    'font-bold leading-relaxed',
    compact ? 'text-xs' : 'text-base md:text-xl',
  ].join(' ');

  // One box only — type here; highlights appear in-place after a full stop.
  if (grammarOn) {
    return (
      <GrammarLiveTextBox
        value={body}
        grammarTarget={slide.grammarTarget}
        editable={liveEditable && Boolean(onBodyChange)}
        onChange={onBodyChange}
        className={textClass}
        placeholder={
          liveEditable
            ? 'Type live — grammar highlights in this box after a full stop'
            : 'Add text in the editor — grammar highlights after a full stop'
        }
      />
    );
  }

  if (body) {
    return <p className={`whitespace-pre-wrap ${textClass}`}>{body}</p>;
  }

  return <p className={`font-bold text-[var(--comic-dark)]/50 ${textClass}`}>Add slide text…</p>;
}

export default function SlideCanvas({
  slide,
  deck,
  slideNumber,
  totalSlides,
  className = '',
  compact = false,
  showImageSlot = false,
  liveEditable = false,
  onBodyChange,
}: SlideCanvasProps) {
  const title = slide.title || (slide.layout === 'title' ? deck.title : 'Untitled slide');
  const body =
    slide.layout === 'title'
      ? slide.body || deck.subtitle
      : slide.body;
  const showImage =
    Boolean(slide.imageUrl.trim()) ||
    (showImageSlot && (slide.layout === 'content' || slide.layout === 'image'));

  return (
    <article
      className={[
        'presentation-slide relative overflow-hidden border-4 border-[var(--comic-black)] comic-shadow-xl',
        'bg-[var(--comic-white)] text-[var(--comic-dark)]',
        'aspect-[16/9] w-full',
        className,
      ].join(' ')}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--brand-gray)_0%,var(--brand-white)_45%,color-mix(in_srgb,var(--brand-navy)_8%,white)_100%)]" />
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--comic-primary)]/15 border-4 border-[var(--comic-black)]/20" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-[var(--comic-secondary)]/10 border-4 border-[var(--comic-black)]/15" />

      <div
        className={[
          'relative z-[1] flex h-full flex-col',
          compact ? 'p-4 gap-2' : 'p-8 md:p-10 gap-4',
        ].join(' ')}
      >
        {slide.layout === 'title' ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center gap-4">
            <p
              className={[
                'font-bungee uppercase tracking-wide text-[var(--comic-primary)]',
                compact ? 'text-xs' : 'text-sm md:text-base',
              ].join(' ')}
            >
              Englishfully
            </p>
            <h2
              className={[
                'font-bungee leading-tight text-[var(--comic-secondary)]',
                compact ? 'text-xl' : 'text-3xl md:text-5xl',
              ].join(' ')}
            >
              {title || 'Presentation title'}
            </h2>
            {body ? (
              <p
                className={[
                  'max-w-3xl font-bold text-[var(--comic-dark)]',
                  compact ? 'text-sm' : 'text-lg md:text-2xl',
                ].join(' ')}
              >
                {body}
              </p>
            ) : null}
          </div>
        ) : null}

        {slide.layout === 'content' ? (
          <div className="flex flex-1 min-h-0 flex-col gap-4">
            <h2
              className={[
                'font-bungee text-[var(--comic-secondary)] leading-tight border-b-4 border-[var(--comic-black)] pb-2',
                compact ? 'text-base' : 'text-2xl md:text-4xl',
              ].join(' ')}
            >
              {title}
            </h2>
            <div
              className={[
                'grid flex-1 min-h-0 gap-4',
                showImage ? 'md:grid-cols-2' : 'grid-cols-1',
              ].join(' ')}
            >
              <div className="min-h-0 overflow-auto">
                <ContentBody
                  slide={slide}
                  body={body}
                  compact={compact}
                  liveEditable={liveEditable}
                  onBodyChange={onBodyChange}
                />
                {slide.bullets.length > 0 ? (
                  <ul
                    className={[
                      'mt-3 list-disc space-y-1 pl-5 font-bold',
                      compact ? 'text-xs' : 'text-base md:text-xl',
                    ].join(' ')}
                  >
                    {slide.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {showImage ? (
                <SlideImage
                  url={slide.imageUrl}
                  alt={slide.imageAlt || title}
                  className={compact ? 'h-full max-h-40 w-full' : 'h-full max-h-full w-full'}
                />
              ) : null}
            </div>
          </div>
        ) : null}

        {slide.layout === 'bullets' ? (
          <div className="flex flex-1 min-h-0 flex-col gap-4">
            <h2
              className={[
                'font-bungee text-[var(--comic-secondary)] leading-tight border-b-4 border-[var(--comic-black)] pb-2',
                compact ? 'text-base' : 'text-2xl md:text-4xl',
              ].join(' ')}
            >
              {title}
            </h2>
            <ul
              className={[
                'flex-1 space-y-2 overflow-auto font-bold',
                compact ? 'text-xs' : 'text-lg md:text-2xl',
              ].join(' ')}
            >
              {(slide.bullets.length > 0 ? slide.bullets : ['Add bullet points…']).map((item) => (
                <li
                  key={item}
                  className="flex gap-3 border-4 border-[var(--comic-black)] bg-white/80 px-3 py-2 comic-shadow-sm"
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
            <h2
              className={[
                'font-bungee text-[var(--comic-secondary)] leading-tight',
                compact ? 'text-base' : 'text-2xl md:text-4xl',
              ].join(' ')}
            >
              {title}
            </h2>
            <SlideImage
              url={slide.imageUrl}
              alt={slide.imageAlt || title}
              className="min-h-0 flex-1 w-full"
            />
            {body ? (
              <p className={compact ? 'text-xs font-bold' : 'text-lg font-bold'}>{body}</p>
            ) : null}
          </div>
        ) : null}

        <div
          className={[
            'mt-auto flex items-center justify-between border-t-2 border-[var(--comic-black)]/30 pt-2 font-bold text-[var(--comic-dark)]/70',
            compact ? 'text-[10px]' : 'text-sm',
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
