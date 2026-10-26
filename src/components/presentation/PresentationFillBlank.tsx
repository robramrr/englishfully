'use client';

import { useEffect, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import SlideTextStyleControls from './SlideTextStyleControls';
import { SlideRichText } from './SlideRichText';
import {
  blankSentenceParts,
  blankTokens,
  createEmptyBlankGroup,
  createEmptyBlankItem,
  MAX_BLANK_GROUPS,
  MAX_BLANK_ITEMS,
  presentationFontColorCss,
  presentationFontSizePx,
  retargetBlankIndex,
  type PresentationBlankGroup,
  type PresentationBlankItem,
  type PresentationSlide,
} from '@/lib/presentation/types';

function sizeMode(compact: boolean, present: boolean): 'compact' | 'default' | 'present' {
  if (compact) return 'compact';
  if (present) return 'present';
  return 'default';
}

function groupsFromSlide(slide: PresentationSlide): PresentationBlankGroup[] {
  if (slide.blankGroups?.length) return slide.blankGroups;
  return [
    createEmptyBlankGroup({
      items: slide.blankItems?.length ? slide.blankItems : [createEmptyBlankItem()],
    }),
  ];
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
  const ink = presentationFontColorCss(color);
  const style = {
    fontSize: `${presentationFontSizePx(fontSize, mode)}px`,
    color: ink,
    lineHeight: 1.45,
  };

  return (
    <p className="font-bold" style={style}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return (
            <span key={`${item.id}-t-${index}`}>
              {index > 0 ? ' ' : ''}
              <SlideRichText text={part.value} />
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
              className="m-0 inline border-0 bg-transparent p-0 align-baseline"
              style={{
                color: revealed ? 'var(--comic-primary)' : 'transparent',
                fontSize: 'inherit',
                lineHeight: 'inherit',
                fontFamily: 'inherit',
                fontWeight: 'inherit',
                textDecorationLine: revealed ? 'none' : 'underline',
                textDecorationColor: ink,
                textDecorationThickness: '0.08em',
                textUnderlineOffset: '0.06em',
              }}
              aria-label={revealed ? `Hide ${part.word}` : 'Show answer'}
              onClick={(event) => {
                event.stopPropagation();
                onToggle();
              }}
            >
              {part.word}
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
  const bulletsOn = Boolean(slide.blankBullets);
  const groups = groupsFromSlide(slide)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.text.trim()),
    }))
    .filter((group) => group.heading.trim() || group.items.length > 0);

  useEffect(() => {
    setRevealed({});
  }, [slide.id]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      {showTitle ? (
        <h2
          className={[
            'border-b-4 border-[var(--comic-black)] pb-2 font-bungee leading-tight text-[var(--comic-secondary)]',
            compact ? 'text-base' : present ? 'text-3xl md:text-5xl' : 'text-2xl md:text-4xl',
          ].join(' ')}
        >
          {title}
        </h2>
      ) : null}
      {groups.length > 0 ? (
        <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-auto">
          {groups.map((group, groupIndex) => (
            <section key={group.id} className="flex flex-col gap-4">
              {groupIndex > 0 ? (
                <div
                  role="separator"
                  aria-hidden
                  className="w-full shrink-0"
                  style={{ height: 2, backgroundColor: '#c8c8c8' }}
                />
              ) : null}
              {group.heading.trim() ? (
                <h3
                  className={[
                    'font-black leading-tight text-[var(--comic-secondary)]',
                    compact ? 'text-sm' : present ? 'text-2xl md:text-4xl' : 'text-xl md:text-2xl',
                  ].join(' ')}
                >
                  <SlideRichText text={group.heading.trim()} />
                </h3>
              ) : null}
              {group.items.length > 0 ? (
                <ul className="space-y-5">
                  {group.items.map((item) => (
                    <li key={item.id} className="flex items-baseline gap-[0.55em]">
                      {bulletsOn ? (
                        <span
                          className="shrink-0 font-black leading-[1.45] text-[var(--comic-primary)]"
                          aria-hidden
                        >
                          ●
                        </span>
                      ) : null}
                      <FillBlankSentence
                        item={item}
                        revealed={Boolean(revealed[item.id])}
                        onToggle={() =>
                          setRevealed((current) => ({
                            ...current,
                            [item.id]: !current[item.id],
                          }))
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
            </section>
          ))}
        </div>
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
  const groups = groupsFromSlide(slide);

  function updateGroups(next: PresentationBlankGroup[]) {
    onChange({ blankGroups: next });
  }

  function updateGroup(groupId: string, patch: Partial<PresentationBlankGroup>) {
    updateGroups(groups.map((group) => (group.id === groupId ? { ...group, ...patch } : group)));
  }

  function updateItems(groupId: string, items: PresentationBlankItem[]) {
    updateGroup(groupId, { items });
  }

  return (
    <div className="space-y-4 border-4 border-[var(--comic-black)] bg-[var(--comic-light)]/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <ComicText className="font-black">Examples</ComicText>
          <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
            Each example has its own lead-in, then the sentences under it. Click the word that
            should be the blank. On the live slide, click the blank to show the answer.
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

      {groups.map((group, groupIndex) => (
        <div
          key={group.id}
          className="space-y-3 border-4 border-[var(--comic-black)] bg-white p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <ComicText className="text-sm font-black">Example {groupIndex + 1}</ComicText>
            {groups.length > 1 ? (
              <button
                type="button"
                className="text-sm font-bold text-[var(--comic-primary)] underline-offset-2 hover:underline"
                onClick={() => updateGroups(groups.filter((entry) => entry.id !== group.id))}
              >
                Remove example
              </button>
            ) : null}
          </div>
          <label className="block space-y-1">
            <ComicText className="text-sm font-bold">Lead-in</ComicText>
            <input
              className="comic-input w-full"
              value={group.heading}
              onChange={(event) => updateGroup(group.id, { heading: event.target.value })}
              placeholder="Past tense of be"
            />
          </label>

          {group.items.map((item, itemIndex) => {
            const tokens = blankTokens(item.text);
            return (
              <div
                key={item.id}
                className="space-y-2 border-4 border-[var(--comic-black)]/20 bg-[var(--comic-light)]/40 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <ComicText className="text-sm font-black">Sentence {itemIndex + 1}</ComicText>
                  {group.items.length > 1 ? (
                    <button
                      type="button"
                      className="text-sm font-bold text-[var(--comic-primary)] underline-offset-2 hover:underline"
                      onClick={() =>
                        updateItems(
                          group.id,
                          group.items.filter((entry) => entry.id !== item.id)
                        )
                      }
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
                      group.id,
                      group.items.map((entry) =>
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
                  <>
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
                                : 'border-[var(--comic-black)]/30 bg-white text-[var(--comic-dark)]',
                            ].join(' ')}
                            onClick={() =>
                              updateItems(
                                group.id,
                                group.items.map((entry) =>
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
                    <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                      Click the word that should be the blank.
                    </ComicText>
                  </>
                ) : null}
              </div>
            );
          })}

          {group.items.length < MAX_BLANK_ITEMS ? (
            <ComicButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => updateItems(group.id, [...group.items, createEmptyBlankItem()])}
            >
              + Add sentence
            </ComicButton>
          ) : null}
        </div>
      ))}

      {groups.length < MAX_BLANK_GROUPS ? (
        <ComicButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => updateGroups([...groups, createEmptyBlankGroup()])}
        >
          + Add example
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
