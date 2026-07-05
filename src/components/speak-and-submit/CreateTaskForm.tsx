'use client';

import { useMemo, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import type { TaskType } from '@/lib/speak-and-submit/types';

const TASK_TYPE_OPTIONS: Array<{ value: TaskType; label: string; emoji: string }> = [
  { value: 'single_sentence', label: 'Single Sentence', emoji: '💬' },
  { value: 'sentence_set', label: 'Multiple Sentences', emoji: '📝' },
  { value: 'vocab_list', label: 'Vocabulary List', emoji: '📚' },
  { value: 'prompt', label: 'Open Prompt', emoji: '🎤' },
];

interface CreateTaskFormProps {
  onCreated: () => void;
}

export default function CreateTaskForm({ onCreated }: CreateTaskFormProps) {
  const [title, setTitle] = useState('');
  const [className, setClassName] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('single_sentence');
  const [items, setItems] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isMultiItem = taskType === 'sentence_set' || taskType === 'vocab_list';
  const isPrompt = taskType === 'prompt';

  const visibleItems = useMemo(() => {
    if (taskType === 'single_sentence') return [items[0] ?? ''];
    return items;
  }, [items, taskType]);

  function handleTaskTypeChange(nextType: TaskType) {
    setTaskType(nextType);
    if (nextType === 'single_sentence' || nextType === 'prompt') {
      setItems([items[0] ?? '']);
    } else if (items.length < 2) {
      setItems([items[0] ?? '', '']);
    }
  }

  function updateItem(index: number, value: string) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function addItem() {
    setItems((current) => [...current, '']);
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
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
          task_type: taskType,
          items: visibleItems,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to create task.');
        return;
      }

      setTitle('');
      setClassName('');
      setTaskType('single_sentence');
      setItems(['']);
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
        Build one QR-code homework task. Students scan once and complete every item on a single page.
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

        <div>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-3">Task type</ComicText>
          <div className="grid sm:grid-cols-2 gap-3">
            {TASK_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleTaskTypeChange(option.value)}
                className={`comic-border rounded-lg px-4 py-3 text-left font-bold transition-transform hover:scale-[1.02] ${
                  taskType === option.value
                    ? 'comic-bg-secondary comic-text-white comic-shadow-md'
                    : 'bg-white text-[var(--comic-dark)]'
                }`}
              >
                {option.emoji} {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <ComicText className="text-[var(--comic-dark)] font-bold">
            {isPrompt ? 'Speaking prompt' : isMultiItem ? 'Items' : 'Target sentence'}
          </ComicText>

          {visibleItems.map((item, index) => (
            <div key={`item-${index}`} className="flex gap-3 items-start">
              {isMultiItem ? (
                <span className="font-bungee text-[var(--comic-secondary)] pt-3 min-w-[2rem]">
                  {index + 1}.
                </span>
              ) : null}
              {isPrompt ? (
                <textarea
                  className="w-full comic-textarea min-h-28"
                  value={item}
                  onChange={(event) => updateItem(index, event.target.value)}
                  placeholder="Describe your weekend using past tense verbs."
                  required
                />
              ) : (
                <input
                  className="w-full comic-input"
                  value={item}
                  onChange={(event) => updateItem(index, event.target.value)}
                  placeholder={
                    taskType === 'vocab_list'
                      ? 'adventure'
                      : 'I went to the market yesterday.'
                  }
                  required
                />
              )}
              {isMultiItem && visibleItems.length > 1 ? (
                <ComicButton
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => removeItem(index)}
                >
                  Remove
                </ComicButton>
              ) : null}
            </div>
          ))}

          {isMultiItem ? (
            <ComicButton type="button" variant="secondary" size="sm" onClick={addItem}>
              + Add item
            </ComicButton>
          ) : null}
        </div>

        {error ? <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText> : null}

        <ComicButton type="submit" variant="primary" size="md" disabled={loading}>
          {loading ? 'Creating task…' : 'Create Task & Generate QR'}
        </ComicButton>
      </form>
    </ComicCard>
  );
}
