'use client';

import { useState } from 'react';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import type { ItemTaskType } from '@/lib/speak-and-submit/types';
import { getDefaultMaxRecordingSeconds } from '@/lib/speak-and-submit/types';

const TASK_TYPE_OPTIONS: Array<{ value: ItemTaskType; label: string; emoji: string }> = [
  { value: 'single_sentence', label: 'Single Sentence', emoji: '💬' },
  { value: 'sentence_set', label: 'Multiple Sentences', emoji: '📝' },
  { value: 'vocab_list', label: 'Vocabulary List', emoji: '📚' },
  { value: 'prompt', label: 'Open Prompt', emoji: '🎤' },
];

interface SectionState {
  id: string;
  item_type: ItemTaskType;
  max_recording_seconds: number;
  items: string[];
}

function createSection(itemType: ItemTaskType = 'single_sentence'): SectionState {
  return {
    id: crypto.randomUUID(),
    item_type: itemType,
    max_recording_seconds: getDefaultMaxRecordingSeconds(itemType),
    items: [''],
  };
}

interface CreateTaskFormProps {
  onCreated: () => void;
}

export default function CreateTaskForm({ onCreated }: CreateTaskFormProps) {
  const [title, setTitle] = useState('');
  const [className, setClassName] = useState('');
  const [sections, setSections] = useState<SectionState[]>([createSection()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function updateSection(sectionId: string, updater: (section: SectionState) => SectionState) {
    setSections((current) =>
      current.map((section) => (section.id === sectionId ? updater(section) : section))
    );
  }

  function handleSectionTypeChange(sectionId: string, nextType: ItemTaskType) {
    updateSection(sectionId, (section) => ({
      ...section,
      item_type: nextType,
      max_recording_seconds: getDefaultMaxRecordingSeconds(nextType),
      items:
        nextType === 'single_sentence' || nextType === 'prompt'
          ? [section.items[0] ?? '']
          : section.items.length >= 2
            ? section.items
            : [section.items[0] ?? '', ''],
    }));
  }

  function updateSectionItem(sectionId: string, index: number, value: string) {
    updateSection(sectionId, (section) => ({
      ...section,
      items: section.items.map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  }

  function addSectionItem(sectionId: string) {
    updateSection(sectionId, (section) => ({
      ...section,
      items: [...section.items, ''],
    }));
  }

  function removeSectionItem(sectionId: string, index: number) {
    updateSection(sectionId, (section) => ({
      ...section,
      items: section.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function addSection() {
    setSections((current) => [...current, createSection()]);
  }

  function removeSection(sectionId: string) {
    setSections((current) =>
      current.length <= 1 ? current : current.filter((section) => section.id !== sectionId)
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/speak-and-submit/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          class_name: className,
          sections: sections.map((section) => ({
            item_type: section.item_type,
            max_recording_seconds: section.max_recording_seconds,
            items: section.items,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to create task.');
        return;
      }

      setTitle('');
      setClassName('');
      setSections([createSection()]);
      onCreated();
    } catch {
      setError('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ComicCard className="comic-shadow-xl">
      <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
        🎙️ Create Speaking Task
      </ComicTitle>
      <ComicText className="text-[var(--comic-dark)] font-bold mb-6">
        Build one QR-code homework task. Add multiple parts if you want — for example, a single
        sentence plus a vocabulary list.
      </ComicText>

      <form onSubmit={handleSubmit} className="space-y-6 text-left">
        <div>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-2">Task title</ComicText>
          <input
            className="w-full comic-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Week 3 — Past tense practice"
            required
          />
        </div>

        <div>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-2">Class name / number</ComicText>
          <input
            className="w-full comic-input"
            value={className}
            onChange={(event) => setClassName(event.target.value)}
            placeholder="Grade 7B"
            required
          />
        </div>

        <div className="space-y-6">
          <ComicText className="text-[var(--comic-dark)] font-bold">Task parts</ComicText>

          {sections.map((section, sectionIndex) => {
            const isMultiItem =
              section.item_type === 'sentence_set' || section.item_type === 'vocab_list';
            const isPrompt = section.item_type === 'prompt';

            return (
              <div
                key={section.id}
                className="comic-border bg-white rounded-lg p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <ComicText className="text-[var(--comic-secondary)] font-bold">
                    Part {sectionIndex + 1}
                  </ComicText>
                  {sections.length > 1 ? (
                    <ComicButton
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeSection(section.id)}
                    >
                      Remove part
                    </ComicButton>
                  ) : null}
                </div>

                <div>
                  <ComicText className="text-[var(--comic-dark)] font-bold mb-3">Task type</ComicText>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {TASK_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSectionTypeChange(section.id, option.value)}
                        className={`comic-border rounded-lg px-4 py-3 text-left font-bold transition-transform hover:scale-[1.02] ${
                          section.item_type === option.value
                            ? 'comic-bg-secondary comic-text-white comic-shadow-md'
                            : 'bg-white text-[var(--comic-dark)]'
                        }`}
                      >
                        {option.emoji} {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <ComicText className="text-[var(--comic-dark)] font-bold mb-2">
                    Max recording time (seconds)
                  </ComicText>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    className="w-full comic-input"
                    value={section.max_recording_seconds}
                    onChange={(event) =>
                      updateSection(section.id, (current) => ({
                        ...current,
                        max_recording_seconds:
                          Number.parseInt(event.target.value, 10) ||
                          getDefaultMaxRecordingSeconds(current.item_type),
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-3">
                  <ComicText className="text-[var(--comic-dark)] font-bold">
                    {isPrompt ? 'Speaking prompt' : isMultiItem ? 'Items' : 'Target sentence'}
                  </ComicText>

                  {section.items.map((item, index) => (
                    <div key={`${section.id}-item-${index}`} className="flex gap-3 items-start">
                      {isMultiItem ? (
                        <span className="font-bungee text-[var(--comic-secondary)] pt-3 min-w-[2rem]">
                          {index + 1}.
                        </span>
                      ) : null}
                      {isPrompt ? (
                        <textarea
                          className="w-full comic-textarea min-h-28"
                          value={item}
                          onChange={(event) =>
                            updateSectionItem(section.id, index, event.target.value)
                          }
                          placeholder="Describe your weekend using past tense verbs."
                          required
                        />
                      ) : (
                        <input
                          className="w-full comic-input"
                          value={item}
                          onChange={(event) =>
                            updateSectionItem(section.id, index, event.target.value)
                          }
                          placeholder={
                            section.item_type === 'vocab_list'
                              ? 'adventure'
                              : 'I went to the market yesterday.'
                          }
                          required
                        />
                      )}
                      {isMultiItem && section.items.length > 1 ? (
                        <ComicButton
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => removeSectionItem(section.id, index)}
                        >
                          Remove
                        </ComicButton>
                      ) : null}
                    </div>
                  ))}

                  {isMultiItem ? (
                    <ComicButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => addSectionItem(section.id)}
                    >
                      + Add item
                    </ComicButton>
                  ) : null}
                </div>
              </div>
            );
          })}

          <ComicButton type="button" variant="secondary" size="sm" onClick={addSection}>
            + Add another part
          </ComicButton>
        </div>

        {error ? <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText> : null}

        <ComicButton type="submit" variant="primary" size="md" disabled={loading}>
          {loading ? 'Creating task…' : 'Create Task & Generate QR'}
        </ComicButton>
      </form>
    </ComicCard>
  );
}
