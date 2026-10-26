'use client';

import { useEffect, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import SlideTextStyleControls from './SlideTextStyleControls';
import {
  blankSentenceParts,
  blankTokens,
  createEmptyBlankItem,
  MAX_BLANK_ITEMS,
  presentationFontColorCss,
  presentationFontSizePx,
  retargetBlankIndex,
  type PresentationBlankItem,
  type PresentationSlide,
} from '@/lib/presentation/types';

function sizeMode(compact: boolean, present: boolean): 'compact' | 'default' | 'present' {
  if (compact) return 'compact';
  if (present) return 'present';
  return 'default';
}

function FillBlankSentence({
  item,
  revealed,
  onToggle,
  compact,
  present,
  fontSize,
  color,
}: {
  item: PresentationBlankItem;
  revealed: boolean;
  onToggle: () => void;
  compact: boolean;
  present: boolean;
  fontSize: PresentationSlide['bulletsFontSize'];
  color: PresentationSlide['bulletsColor'];
}) {
  const mode = sizeMode(compact, present);
  const parts = blankSentenceParts(item.text, item.blankIndex);
  const style = {
    fontSize: `${presentationFontSizePx(fontSize, mode)}px`,
    color: presentationFontColorCss(color),
    lineHeight: 1.45,
  };

  return (
    <p className="font-bold" style={style}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return (
            <span key={`${item.id}-t-${index}`}>
              {index > 0 ? ' ' : ''}
              {part.value}
            </span>
          );
        }
        const gap = index > 0 ? ' ' : '';
        return (
          <span key={`${item.id}-b-${index}`}>
            {gap}
            {part.leading}
            <button
              type="button"
              className={
                revealed
                  ? 'mx-[0.15em] font-black text-[var(--comic-primary)]'
                  : 'mx-[0.2em] inline-block border-b-4 border-current align-baseline'
              }
              style={revealed ? undefined : { minWidth: `${Math.max(part.word.length, 3)}ch` }}
              aria-label={revealed ? `Hide ${part.word}` : 'Show answer'}
              onClick={(event) => {
                event.stopPropagation();
                onToggle();
              }}
            >
              {revealed ? part.word : '\u00a0'}
            </button>
            {part.trailing}
          </span>
        );
      })}
    </p>
  );
}

export function PresentationFillBlank({
  slide,
  title,
  compact = false,
  present = false,
}: {
  slide: PresentationSlide;
  title: string;
  compact?: boolean;
  present?: boolean;
}) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const showTitle = slide.showTitle !== false;
  const items = (slide.blankItems || []).filter((item) => item.text.trim());
  const bulletsOn = Boolean(slide.blankBullets);

  useEffect(() => {
    setRevealed({});
  }, [slide.id]);

  return (
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
      {items.length > 0 ? (
        <ul className="flex-1 space-y-3 overflow-auto">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-[0.55em]">
              {bulletsOn ? (
                <span className="shrink-0 font-black leading-[1.45] text-[var(--comic-primary)]" aria-hidden>
                  ●
                </span>
              ) : null}
              <FillBlankSentence
                item={item}
                revealed={Boolean(revealed[item.id])}
                onToggle={() =>
                  setRevealed((current) => ({ ...current, [item.id]: !current[item.id] }))
                }
                compact={compact}
                present={present}
                fontSize={slide.bulletsFontSize}
                color={slide.bulletsColor}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function FillBlankEditor({
  slide,
  onChange,
}: {
  slide: PresentationSlide;
  onChange: (patch: Partial<PresentationSlide>) => void;
}) {
  const items = slide.blankItems?.length ? slide.blankItems : [createEmptyBlankItem()];

  function updateItems(next: PresentationBlankItem[]) {
    onChange({ blankItems: next });
  }

  return (
    <div className="space-y-3 border-4 border-[var(--comic-black)] bg-[var(--comic-light)]/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <ComicText className="font-black">Sentences</ComicText>
          <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
            Type a sentence, then click the word students should fill in. On the live slide, click
            the blank to show the answer.
          </ComicText>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 font-bold">
          <span className="text-sm">Bullets {slide.blankBullets ? 'On' : 'Off'}</span>
          <input
            type="checkbox"
            className="h-5 w-9 accent-[var(--comic-primary)]"
            checked={Boolean(slide.blankBullets)}
            onChange={(event) => onChange({ blankBullets: event.target.checked })}
          />
        </label>
      </div>

      {items.map((item, itemIndex) => {
        const tokens = blankTokens(item.text);
        return (
          <div
            key={item.id}
            className="space-y-2 border-4 border-[var(--comic-black)]/20 bg-white p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <ComicText className="text-sm font-black">Sentence {itemIndex + 1}</ComicText>
              {items.length > 1 ? (
                <button
                  type="button"
                  className="text-sm font-bold text-[var(--comic-primary)] underline-offset-2 hover:underline"
                  onClick={() => updateItems(items.filter((entry) => entry.id !== item.id))}
                >
                  Remove
                </button>
              ) : null}
            </div>
            <input
              className="comic-input w-full"
              value={item.text}
              onChange={(event) => {
                const text = event.target.value;
                updateItems(
                  items.map((entry) =>
                    entry.id === item.id
                      ? {
                          ...entry,
                          text,
                          blankIndex: retargetBlankIndex(entry.text, text, entry.blankIndex),
                        }
                      : entry
                  )
                );
              }}
              placeholder="The weather was terrible."
            />
            {tokens.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tokens.map((token, index) => {
                  const selected = index === item.blankIndex;
                  return (
                    <button
                      key={`${item.id}-${index}`}
                      type="button"
                      className={[
                        'border-4 px-2 py-1 font-bold',
                        selected
                          ? 'border-[var(--comic-black)] bg-[var(--comic-primary)] text-white'
                          : 'border-[var(--comic-black)]/30 bg-[var(--comic-light)] text-[var(--comic-dark)]',
                      ].join(' ')}
                      onClick={() =>
                        updateItems(
                          items.map((entry) =>
                            entry.id === item.id
                              ? { ...entry, blankIndex: selected ? -1 : index }
                              : entry
                          )
                        )
                      }
                    >
                      {token}
                    </button>
                  );
                })}
              </div>
            ) : (
              <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                Click a word after you type the sentence.
              </ComicText>
            )}
            {tokens.length > 0 ? (
              <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                Click the word that should be the blank.
              </ComicText>
            ) : null}
          </div>
        );
      })}

      {items.length < MAX_BLANK_ITEMS ? (
        <ComicButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => updateItems([...items, createEmptyBlankItem()])}
        >
          + Add sentence
        </ComicButton>
      ) : null}

      <SlideTextStyleControls
        fontSize={slide.bulletsFontSize}
        color={slide.bulletsColor}
        onFontSizeChange={(bulletsFontSize) => onChange({ bulletsFontSize })}
        onColorChange={(bulletsColor) => onChange({ bulletsColor })}
      />
    </div>
  );
}
