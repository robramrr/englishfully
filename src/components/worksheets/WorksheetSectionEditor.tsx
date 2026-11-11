'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import { layoutCrossword } from '@/lib/worksheets/normalize';
import { exerciseLabel, type WorksheetSection } from '@/lib/worksheets/types';

interface WorksheetSectionEditorProps {
  sections: WorksheetSection[];
  onChange: (sections: WorksheetSection[]) => void;
}

function safeImageUrl(value: string): string {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : '';
}

function replaceSection(
  sections: WorksheetSection[],
  index: number,
  next: WorksheetSection
): WorksheetSection[] {
  return sections.map((section, sectionIndex) => (sectionIndex === index ? next : section));
}

function EditorInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-[var(--comic-dark)]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="comic-input w-full"
      />
    </label>
  );
}

function DraftTextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-[var(--comic-dark)]">{label}</span>
      <input
        value={draft}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
          setDraft(value);
        }}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          onChange(next);
        }}
        className="comic-input w-full"
      />
    </label>
  );
}

function ImageUrlField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const src = safeImageUrl(value);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [value]);

  return (
    <div>
      <EditorInput
        label="Image URL"
        value={value}
        onChange={onChange}
        placeholder="https://…"
      />
      {src && !failed ? (
        <img
          src={src}
          alt=""
          className="mt-2 max-h-24 max-w-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}

function TinyButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="border-2 border-[var(--comic-black)] bg-white px-2 py-1 text-xs font-black leading-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function moveAt<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const next = [...items];
  const current = next[index];
  next[index] = next[nextIndex];
  next[nextIndex] = current;
  return next;
}

function insertAfter<T>(items: T[], index: number, item: T): T[] {
  const next = [...items];
  next.splice(index + 1, 0, item);
  return next;
}

function nextMatchLetter(used: string[]): string {
  const taken = new Set(used.map((letter) => letter.toUpperCase()));
  for (let code = 65; code <= 90; code += 1) {
    const letter = String.fromCharCode(code);
    if (!taken.has(letter)) return letter;
  }
  return `A${used.length + 1}`;
}

function ItemTools({
  label,
  canUp,
  canDown,
  onUp,
  onDown,
  onAdd,
  onRemove,
  children,
}: {
  label: string;
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
  onAdd: () => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 border-t-2 border-[var(--brand-gray)] pt-3">
      <div className="flex shrink-0 flex-col gap-1">
        <TinyButton label={`Move ${label} earlier`} disabled={!canUp} onClick={onUp}>
          ↑
        </TinyButton>
        <TinyButton label={`Move ${label} later`} disabled={!canDown} onClick={onDown}>
          ↓
        </TinyButton>
        <TinyButton label={`Add ${label} after this one`} onClick={onAdd}>
          Add
        </TinyButton>
        <TinyButton label={`Remove ${label}`} onClick={onRemove}>
          Remove
        </TinyButton>
      </div>
      <div className="min-w-0 flex-1 space-y-2">{children}</div>
    </div>
  );
}

function SectionFrame({
  index,
  section,
  children,
  onChange,
  onMove,
  onRemove,
  canMoveUp,
  canMoveDown,
}: {
  index: number;
  section: WorksheetSection;
  children: ReactNode;
  onChange: (next: WorksheetSection) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <section className="space-y-3 border-4 border-[var(--comic-black)] bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-black uppercase tracking-wide text-[var(--comic-primary)]">
          {index + 1}. {exerciseLabel(section.type)}
        </p>
        <div className="flex gap-1">
          <TinyButton
            label="Move exercise earlier"
            disabled={!canMoveUp}
            onClick={() => onMove(-1)}
          >
            ↑
          </TinyButton>
          <TinyButton
            label="Move exercise later"
            disabled={!canMoveDown}
            onClick={() => onMove(1)}
          >
            ↓
          </TinyButton>
          <TinyButton label="Remove exercise" onClick={onRemove}>
            Remove
          </TinyButton>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <EditorInput
          label="Section title"
          value={section.title}
          onChange={(title) => onChange({ ...section, title })}
        />
        <EditorInput
          label="Directions"
          value={section.instructions}
          onChange={(instructions) => onChange({ ...section, instructions })}
        />
      </div>
      {children}
    </section>
  );
}

function syncWordBank(items: { answer: string }[], previous: string[]): string[] {
  const unique = [...new Set(items.map((item) => item.answer.trim()).filter(Boolean))];
  if (!unique.length) return [];
  const kept = previous.filter((word) =>
    unique.some((answer) => answer.toLowerCase() === word.toLowerCase())
  );
  const added = unique.filter(
    (answer) => !kept.some((word) => word.toLowerCase() === answer.toLowerCase())
  );
  return [...kept, ...added];
}

function CrosswordAnswerInput({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    setDraft(value);
  }, [value]);
  return (
    <input
      value={draft}
      onChange={(event) => setDraft(event.target.value.toUpperCase())}
      onBlur={() => {
        if (draft.trim().toUpperCase() !== value.trim().toUpperCase()) onCommit(draft);
      }}
      className="comic-input w-full uppercase"
      aria-label="Crossword answer"
    />
  );
}

export default function WorksheetSectionEditor({
  sections,
  onChange,
}: WorksheetSectionEditorProps) {
  const [crosswordNote, setCrosswordNote] = useState('');

  function update(index: number, next: WorksheetSection) {
    onChange(replaceSection(sections, index, next));
  }

  function dropSection(index: number) {
    onChange(sections.filter((_, sectionIndex) => sectionIndex !== index));
  }

  function moveSection(index: number, direction: -1 | 1) {
    onChange(moveAt(sections, index, direction));
  }

  return (
    <ComicCard className="space-y-4">
      <ComicTitle level={3} className="comic-title-no-shadow text-[var(--comic-secondary)]">
        Edit the exercises
      </ComicTitle>
      <ComicText className="font-bold text-[var(--comic-dark)]">
        Change, reorder, add, or remove any exercise or question. The sheet below updates as you type.
        For matching, paste an image link on the prompt, the answer, or both.
      </ComicText>
      {crosswordNote ? (
        <ComicText className="font-bold text-[var(--comic-danger)]">{crosswordNote}</ComicText>
      ) : null}
      <div className="space-y-4">
        {sections.map((section, index) => {
          if (section.type === 'fill_blank') {
            return (
              <SectionFrame key={`fill-${index}`} index={index} section={section} onChange={(next) => update(index, next)}
                onMove={(direction) => moveSection(index, direction)}
                onRemove={() => dropSection(index)}
                canMoveUp={index > 0}
                canMoveDown={index < sections.length - 1}>
                {section.items.map((item, itemIndex) => (
                  <ItemTools
                    key={itemIndex}
                    label={`question ${itemIndex + 1}`}
                    canUp={itemIndex > 0}
                    canDown={itemIndex < section.items.length - 1}
                    onUp={() => {
                      const items = moveAt(section.items, itemIndex, -1);
                      update(index, { ...section, items, wordBank: syncWordBank(items, section.wordBank) });
                    }}
                    onDown={() => {
                      const items = moveAt(section.items, itemIndex, 1);
                      update(index, { ...section, items, wordBank: syncWordBank(items, section.wordBank) });
                    }}
                    onAdd={() => {
                      const items = insertAfter(section.items, itemIndex, { prompt: '', answer: '' });
                      update(index, { ...section, items, wordBank: syncWordBank(items, section.wordBank) });
                    }}
                    onRemove={() => {
                      const items = section.items.filter((_, entryIndex) => entryIndex !== itemIndex);
                      if (!items.length) dropSection(index);
                      else update(index, { ...section, items, wordBank: syncWordBank(items, section.wordBank) });
                    }}
                  >
                  <div className="grid gap-3 md:grid-cols-[1fr_12rem]">
                    <EditorInput
                      label={`${itemIndex + 1}. Sentence`}
                      value={item.prompt}
                      onChange={(prompt) => {
                        const items = section.items.map((entry, entryIndex) =>
                          entryIndex === itemIndex ? { ...entry, prompt } : entry
                        );
                        update(index, { ...section, items });
                      }}
                    />
                    <EditorInput
                      label="Answer"
                      value={item.answer}
                      onChange={(answer) => {
                        const items = section.items.map((entry, entryIndex) =>
                          entryIndex === itemIndex ? { ...entry, answer } : entry
                        );
                        update(index, {
                          ...section,
                          items,
                          wordBank: syncWordBank(items, section.wordBank),
                        });
                      }}
                    />
                  </div>
                  </ItemTools>
                ))}
              </SectionFrame>
            );
          }

          if (section.type === 'multiple_choice') {
            return (
              <SectionFrame key={`mc-${index}`} index={index} section={section} onChange={(next) => update(index, next)}
                onMove={(direction) => moveSection(index, direction)}
                onRemove={() => dropSection(index)}
                canMoveUp={index > 0}
                canMoveDown={index < sections.length - 1}>
                {section.items.map((item, itemIndex) => (
                  <ItemTools
                    key={itemIndex}
                    label={`question ${itemIndex + 1}`}
                    canUp={itemIndex > 0}
                    canDown={itemIndex < section.items.length - 1}
                    onUp={() => update(index, { ...section, items: moveAt(section.items, itemIndex, -1) })}
                    onDown={() => update(index, { ...section, items: moveAt(section.items, itemIndex, 1) })}
                    onAdd={() => {
                      const choiceCount = Math.max(item.choices.length, 2);
                      const items = insertAfter(section.items, itemIndex, {
                        prompt: '',
                        choices: Array.from({ length: choiceCount }, () => ''),
                        answer: '',
                      });
                      update(index, { ...section, items });
                    }}
                    onRemove={() => {
                      const items = section.items.filter((_, entryIndex) => entryIndex !== itemIndex);
                      if (!items.length) dropSection(index);
                      else update(index, { ...section, items });
                    }}
                  >
                  <div className="space-y-2">
                    <EditorInput
                      label={`${itemIndex + 1}. Question`}
                      value={item.prompt}
                      onChange={(prompt) => {
                        const items = section.items.map((entry, entryIndex) =>
                          entryIndex === itemIndex ? { ...entry, prompt } : entry
                        );
                        update(index, { ...section, items });
                      }}
                    />
                    <div className="grid gap-2 md:grid-cols-2">
                      {item.choices.map((choice, choiceIndex) => (
                        <label key={choiceIndex} className="block">
                          <span className="mb-1 flex items-center gap-2 text-sm font-bold">
                            <input
                              type="radio"
                              name={`mc-${index}-${itemIndex}`}
                              checked={choice.trim() !== '' && item.answer === choice}
                              onChange={() => {
                                const items = section.items.map((entry, entryIndex) =>
                                  entryIndex === itemIndex ? { ...entry, answer: choice } : entry
                                );
                                update(index, { ...section, items });
                              }}
                            />
                            {String.fromCharCode(65 + choiceIndex)}. Correct
                          </span>
                          <input
                            value={choice}
                            onChange={(event) => {
                              const value = event.target.value;
                              const items = section.items.map((entry, entryIndex) => {
                                if (entryIndex !== itemIndex) return entry;
                                const choices = entry.choices.map((option, optionIndex) =>
                                  optionIndex === choiceIndex ? value : option
                                );
                                const answer = entry.answer === choice ? value : entry.answer;
                                return { ...entry, choices, answer };
                              });
                              update(index, { ...section, items });
                            }}
                            className="comic-input w-full"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                  </ItemTools>
                ))}
              </SectionFrame>
            );
          }

          if (section.type === 'matching') {
            return (
              <SectionFrame key={`match-${index}`} index={index} section={section} onChange={(next) => update(index, next)}
                onMove={(direction) => moveSection(index, direction)}
                onRemove={() => dropSection(index)}
                canMoveUp={index > 0}
                canMoveDown={index < sections.length - 1}>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    <p className="font-black text-[var(--comic-dark)]">Prompts</p>
                    {section.prompts.map((prompt, promptIndex) => (
                      <ItemTools
                        key={promptIndex}
                        label={`pair ${promptIndex + 1}`}
                        canUp={promptIndex > 0}
                        canDown={promptIndex < section.prompts.length - 1}
                        onUp={() =>
                          update(index, {
                            ...section,
                            prompts: moveAt(section.prompts, promptIndex, -1),
                            answers: moveAt(section.answers, promptIndex, -1),
                          })
                        }
                        onDown={() =>
                          update(index, {
                            ...section,
                            prompts: moveAt(section.prompts, promptIndex, 1),
                            answers: moveAt(section.answers, promptIndex, 1),
                          })
                        }
                        onAdd={() => {
                          const letter = nextMatchLetter([
                            ...section.bank.map((entry) => entry.letter),
                            ...section.answers,
                          ]);
                          update(index, {
                            ...section,
                            prompts: insertAfter(section.prompts, promptIndex, { text: '', imageUrl: '' }),
                            answers: insertAfter(section.answers, promptIndex, letter),
                            bank: [...section.bank, { letter, text: '', imageUrl: '' }],
                          });
                        }}
                        onRemove={() => {
                          const letter = section.answers[promptIndex];
                          const prompts = section.prompts.filter((_, entryIndex) => entryIndex !== promptIndex);
                          const answers = section.answers.filter((_, entryIndex) => entryIndex !== promptIndex);
                          const bank = section.bank.filter(
                            (entry) => entry.letter !== letter || answers.includes(entry.letter)
                          );
                          if (!prompts.length) dropSection(index);
                          else update(index, { ...section, prompts, answers, bank });
                        }}
                      >
                      <div className="space-y-2">
                        <EditorInput
                          label={`${promptIndex + 1}.`}
                          value={prompt.text}
                          onChange={(text) => {
                            const prompts = section.prompts.map((entry, entryIndex) =>
                              entryIndex === promptIndex ? { ...entry, text } : entry
                            );
                            update(index, { ...section, prompts });
                          }}
                        />
                        <ImageUrlField
                          value={prompt.imageUrl}
                          onChange={(imageUrl) => {
                            const prompts = section.prompts.map((entry, entryIndex) =>
                              entryIndex === promptIndex ? { ...entry, imageUrl } : entry
                            );
                            update(index, { ...section, prompts });
                          }}
                        />
                      </div>
                      </ItemTools>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <p className="font-black text-[var(--comic-dark)]">Matches</p>
                    {section.bank.map((entry) => (
                      <div key={entry.letter} className="space-y-2">
                        <EditorInput
                          label={`${entry.letter}.`}
                          value={entry.text}
                          onChange={(text) => {
                            const bank = section.bank.map((option) =>
                              option.letter === entry.letter ? { ...option, text } : option
                            );
                            update(index, { ...section, bank });
                          }}
                        />
                        <ImageUrlField
                          value={entry.imageUrl}
                          onChange={(imageUrl) => {
                            const bank = section.bank.map((option) =>
                              option.letter === entry.letter ? { ...option, imageUrl } : option
                            );
                            update(index, { ...section, bank });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </SectionFrame>
            );
          }

          if (section.type === 'unjumble') {
            return (
              <SectionFrame key={`unjumble-${index}`} index={index} section={section} onChange={(next) => update(index, next)}
                onMove={(direction) => moveSection(index, direction)}
                onRemove={() => dropSection(index)}
                canMoveUp={index > 0}
                canMoveDown={index < sections.length - 1}>
                {section.items.map((item, itemIndex) => (
                  <ItemTools
                    key={itemIndex}
                    label={`sentence ${itemIndex + 1}`}
                    canUp={itemIndex > 0}
                    canDown={itemIndex < section.items.length - 1}
                    onUp={() => update(index, { ...section, items: moveAt(section.items, itemIndex, -1) })}
                    onDown={() => update(index, { ...section, items: moveAt(section.items, itemIndex, 1) })}
                    onAdd={() =>
                      update(index, {
                        ...section,
                        items: insertAfter(section.items, itemIndex, { words: [''], answer: '' }),
                      })
                    }
                    onRemove={() => {
                      const items = section.items.filter((_, entryIndex) => entryIndex !== itemIndex);
                      if (!items.length) dropSection(index);
                      else update(index, { ...section, items });
                    }}
                  >
                  <div className="grid gap-3 md:grid-cols-2">
                    <DraftTextInput
                      label={`${itemIndex + 1}. Scrambled words`}
                      value={item.words.join(' ')}
                      onChange={(value) => {
                        const words = value.split(/\s+/).filter(Boolean);
                        if (!words.length) return;
                        const items = section.items.map((entry, entryIndex) =>
                          entryIndex === itemIndex ? { ...entry, words } : entry
                        );
                        update(index, { ...section, items });
                      }}
                    />
                    <EditorInput
                      label="Correct sentence"
                      value={item.answer}
                      onChange={(answer) => {
                        const items = section.items.map((entry, entryIndex) =>
                          entryIndex === itemIndex ? { ...entry, answer } : entry
                        );
                        update(index, { ...section, items });
                      }}
                    />
                  </div>
                  </ItemTools>
                ))}
              </SectionFrame>
            );
          }

          if (section.type === 'anagram') {
            return (
              <SectionFrame key={`anagram-${index}`} index={index} section={section} onChange={(next) => update(index, next)}
                onMove={(direction) => moveSection(index, direction)}
                onRemove={() => dropSection(index)}
                canMoveUp={index > 0}
                canMoveDown={index < sections.length - 1}>
                {section.items.map((item, itemIndex) => (
                  <ItemTools
                    key={itemIndex}
                    label={`word ${itemIndex + 1}`}
                    canUp={itemIndex > 0}
                    canDown={itemIndex < section.items.length - 1}
                    onUp={() => update(index, { ...section, items: moveAt(section.items, itemIndex, -1) })}
                    onDown={() => update(index, { ...section, items: moveAt(section.items, itemIndex, 1) })}
                    onAdd={() =>
                      update(index, {
                        ...section,
                        items: insertAfter(section.items, itemIndex, { clue: '', scrambled: '', answer: '' }),
                      })
                    }
                    onRemove={() => {
                      const items = section.items.filter((_, entryIndex) => entryIndex !== itemIndex);
                      if (!items.length) dropSection(index);
                      else update(index, { ...section, items });
                    }}
                  >
                  <div className="grid gap-3 md:grid-cols-3">
                    <EditorInput
                      label={`${itemIndex + 1}. Clue`}
                      value={item.clue}
                      onChange={(clue) => {
                        const items = section.items.map((entry, entryIndex) =>
                          entryIndex === itemIndex ? { ...entry, clue } : entry
                        );
                        update(index, { ...section, items });
                      }}
                    />
                    <EditorInput
                      label="Letters"
                      value={item.scrambled}
                      onChange={(scrambled) => {
                        const items = section.items.map((entry, entryIndex) =>
                          entryIndex === itemIndex ? { ...entry, scrambled: scrambled.toUpperCase() } : entry
                        );
                        update(index, { ...section, items });
                      }}
                    />
                    <EditorInput
                      label="Answer"
                      value={item.answer}
                      onChange={(answer) => {
                        const items = section.items.map((entry, entryIndex) =>
                          entryIndex === itemIndex ? { ...entry, answer } : entry
                        );
                        update(index, { ...section, items });
                      }}
                    />
                  </div>
                  </ItemTools>
                ))}
              </SectionFrame>
            );
          }

          if (section.type === 'true_false') {
            return (
              <SectionFrame key={`tf-${index}`} index={index} section={section} onChange={(next) => update(index, next)}
                onMove={(direction) => moveSection(index, direction)}
                onRemove={() => dropSection(index)}
                canMoveUp={index > 0}
                canMoveDown={index < sections.length - 1}>
                {section.items.map((item, itemIndex) => (
                  <ItemTools
                    key={itemIndex}
                    label={`statement ${itemIndex + 1}`}
                    canUp={itemIndex > 0}
                    canDown={itemIndex < section.items.length - 1}
                    onUp={() => update(index, { ...section, items: moveAt(section.items, itemIndex, -1) })}
                    onDown={() => update(index, { ...section, items: moveAt(section.items, itemIndex, 1) })}
                    onAdd={() =>
                      update(index, {
                        ...section,
                        items: insertAfter(section.items, itemIndex, { statement: '', answer: true }),
                      })
                    }
                    onRemove={() => {
                      const items = section.items.filter((_, entryIndex) => entryIndex !== itemIndex);
                      if (!items.length) dropSection(index);
                      else update(index, { ...section, items });
                    }}
                  >
                  <div className="grid gap-3 md:grid-cols-[1fr_9rem]">
                    <EditorInput
                      label={`${itemIndex + 1}. Statement`}
                      value={item.statement}
                      onChange={(statement) => {
                        const items = section.items.map((entry, entryIndex) =>
                          entryIndex === itemIndex ? { ...entry, statement } : entry
                        );
                        update(index, { ...section, items });
                      }}
                    />
                    <label className="block">
                      <span className="mb-1 block text-sm font-bold">Answer</span>
                      <select
                        value={item.answer ? 'true' : 'false'}
                        onChange={(event) => {
                          const answer = event.target.value === 'true';
                          const items = section.items.map((entry, entryIndex) =>
                            entryIndex === itemIndex ? { ...entry, answer } : entry
                          );
                          update(index, { ...section, items });
                        }}
                        className="comic-input w-full"
                      >
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    </label>
                  </div>
                  </ItemTools>
                ))}
              </SectionFrame>
            );
          }

          if (section.type === 'short_answer') {
            return (
              <SectionFrame key={`short-${index}`} index={index} section={section} onChange={(next) => update(index, next)}
                onMove={(direction) => moveSection(index, direction)}
                onRemove={() => dropSection(index)}
                canMoveUp={index > 0}
                canMoveDown={index < sections.length - 1}>
                {section.items.map((item, itemIndex) => (
                  <ItemTools
                    key={itemIndex}
                    label={`question ${itemIndex + 1}`}
                    canUp={itemIndex > 0}
                    canDown={itemIndex < section.items.length - 1}
                    onUp={() => update(index, { ...section, items: moveAt(section.items, itemIndex, -1) })}
                    onDown={() => update(index, { ...section, items: moveAt(section.items, itemIndex, 1) })}
                    onAdd={() =>
                      update(index, {
                        ...section,
                        items: insertAfter(section.items, itemIndex, { prompt: '', answer: '' }),
                      })
                    }
                    onRemove={() => {
                      const items = section.items.filter((_, entryIndex) => entryIndex !== itemIndex);
                      if (!items.length) dropSection(index);
                      else update(index, { ...section, items });
                    }}
                  >
                  <div className="grid gap-3 md:grid-cols-2">
                    <EditorInput
                      label={`${itemIndex + 1}. Question`}
                      value={item.prompt}
                      onChange={(prompt) => {
                        const items = section.items.map((entry, entryIndex) =>
                          entryIndex === itemIndex ? { ...entry, prompt } : entry
                        );
                        update(index, { ...section, items });
                      }}
                    />
                    <EditorInput
                      label="Sample answer"
                      value={item.answer}
                      onChange={(answer) => {
                        const items = section.items.map((entry, entryIndex) =>
                          entryIndex === itemIndex ? { ...entry, answer } : entry
                        );
                        update(index, { ...section, items });
                      }}
                    />
                  </div>
                  </ItemTools>
                ))}
              </SectionFrame>
            );
          }

          const ordered = [...section.entries].sort(
            (a, b) => a.number - b.number || (a.direction === 'across' ? -1 : 1)
          );
          return (
            <SectionFrame key={`cross-${index}`} index={index} section={section} onChange={(next) => update(index, next)}
                onMove={(direction) => moveSection(index, direction)}
                onRemove={() => dropSection(index)}
                canMoveUp={index > 0}
                canMoveDown={index < sections.length - 1}>
              {ordered.map((entry, entryIndex) => (
                <ItemTools
                  key={`${entry.direction}-${entry.number}-${entry.row}-${entry.col}`}
                  label={`clue ${entry.number}`}
                  canUp={entryIndex > 0}
                  canDown={entryIndex < ordered.length - 1}
                  onUp={() => {
                    const words = moveAt(ordered, entryIndex, -1).map((current) => ({
                      clue: current.clue,
                      answer: current.answer,
                    }));
                    const entries = layoutCrossword(words);
                    if (entries) update(index, { ...section, entries });
                  }}
                  onDown={() => {
                    const words = moveAt(ordered, entryIndex, 1).map((current) => ({
                      clue: current.clue,
                      answer: current.answer,
                    }));
                    const entries = layoutCrossword(words);
                    if (entries) update(index, { ...section, entries });
                  }}
                  onAdd={() => {
                    const used = new Set(ordered.map((current) => current.answer.toUpperCase()));
                    const starter =
                      ['WORD', 'NOTE', 'ITEM', 'CLUE', 'LINE', 'PAGE', 'TEST', 'QUIZ'].find(
                        (word) => !used.has(word)
                      ) || 'ADDED';
                    const words = insertAfter(
                      ordered.map((current) => ({ clue: current.clue, answer: current.answer })),
                      entryIndex,
                      { clue: '', answer: starter }
                    );
                    const entries = layoutCrossword(words);
                    const placed = entries?.some((current) => current.answer === starter);
                    if (!entries || !placed) {
                      setCrosswordNote(
                        'A new crossword word has to be 3 to 12 letters and share a letter with the others.'
                      );
                      return;
                    }
                    setCrosswordNote('');
                    update(index, { ...section, entries });
                  }}
                  onRemove={() => {
                    const words = ordered
                      .filter((_, currentIndex) => currentIndex !== entryIndex)
                      .map((current) => ({ clue: current.clue, answer: current.answer }));
                    const entries = layoutCrossword(words);
                    if (!entries) dropSection(index);
                    else update(index, { ...section, entries });
                  }}
                >
                <div className="grid gap-3 md:grid-cols-[1fr_10rem]">
                  <EditorInput
                    label={`${entry.number} ${entry.direction === 'across' ? 'Across' : 'Down'}`}
                    value={entry.clue}
                    onChange={(clue) => {
                      const entries = section.entries.map((current) =>
                        current.row === entry.row &&
                        current.col === entry.col &&
                        current.direction === entry.direction
                          ? { ...current, clue }
                          : current
                      );
                      update(index, { ...section, entries });
                    }}
                  />
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold">Answer</span>
                    <CrosswordAnswerInput
                      value={entry.answer}
                      onCommit={(answer) => {
                        const words = section.entries.map((current) => ({
                          clue: current.clue,
                          answer:
                            current.row === entry.row &&
                            current.col === entry.col &&
                            current.direction === entry.direction
                              ? answer
                              : current.answer,
                        }));
                        const entries = layoutCrossword(words);
                        if (!entries) {
                          setCrosswordNote(
                            'That word needs 3 to 12 letters and has to share a letter with the others.'
                          );
                          return;
                        }
                        setCrosswordNote('');
                        update(index, { ...section, entries });
                      }}
                    />
                  </label>
                </div>
                </ItemTools>
              ))}
            </SectionFrame>
          );
        })}
      </div>
    </ComicCard>
  );
}
