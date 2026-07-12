'use client';

import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import DragHandle from './DragHandle';
import type { QuestionType, SaveQuestionPayload } from '@/lib/listen-and-answer/types';
import { QUESTION_TYPE_LABELS, formatQuestionLabel } from '@/lib/listen-and-answer/types';

const QUESTION_TYPES: QuestionType[] = [
  'multiple_choice',
  'true_false',
  'short_answer',
  'fill_in_blank',
  'matching',
  'ordering',
];

interface QuestionEditorProps {
  question: SaveQuestionPayload & { clientId: string };
  index: number;
  onChange: (clientId: string, updates: Partial<SaveQuestionPayload>) => void;
  onDelete: (clientId: string) => void;
  onDragStart: (clientId: string) => void;
  onDragOver: (event: React.DragEvent, clientId: string) => void;
  onDrop: (clientId: string) => void;
}

function defaultChoicesForType(type: QuestionType): string[] {
  if (type === 'true_false') return ['True', 'False'];
  if (type === 'matching') return ['Item 1 → Match A', 'Item 2 → Match B'];
  if (type === 'ordering') return ['First', 'Second', 'Third'];
  if (type === 'short_answer' || type === 'fill_in_blank') return [];
  return ['', '', '', ''];
}

export default function QuestionEditor({
  question,
  index,
  onChange,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: QuestionEditorProps) {
  const showChoices =
    question.question_type === 'multiple_choice' ||
    question.question_type === 'true_false' ||
    question.question_type === 'matching' ||
    question.question_type === 'ordering';

  return (
    <div
      draggable
      onDragStart={() => onDragStart(question.clientId)}
      onDragOver={(event) => onDragOver(event, question.clientId)}
      onDrop={() => onDrop(question.clientId)}
      className="comic-border rounded-lg bg-white p-4 space-y-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <DragHandle />
          <ComicText className="font-bold text-[var(--comic-primary)]">
            {formatQuestionLabel(index)}
            {question.is_ai_generated ? (
              <span className="text-[var(--comic-secondary)] text-sm ml-2">
                (AI Part {question.ai_part})
              </span>
            ) : null}
          </ComicText>
        </div>
        <ComicButton type="button" variant="danger" size="sm" onClick={() => onDelete(question.clientId)}>
          Delete
        </ComicButton>
      </div>

      {question.is_ai_generated ? (
        <label className="flex items-center gap-2 text-sm font-bold text-[var(--comic-dark)]">
          <input
            type="checkbox"
            checked={question.keep_question}
            onChange={(event) =>
              onChange(question.clientId, { keep_question: event.target.checked })
            }
          />
          Keep this Question
        </label>
      ) : null}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <ComicText className="font-bold text-sm">Question Type</ComicText>
          <label className="flex items-center gap-2 text-sm font-bold text-[var(--comic-dark)]">
            <input
              type="checkbox"
              checked={question.show_question_type}
              onChange={(event) =>
                onChange(question.clientId, { show_question_type: event.target.checked })
              }
            />
            Show type on worksheet
          </label>
        </div>
        <select
          className="w-full comic-input"
          value={question.question_type}
          onChange={(event) => {
            const nextType = event.target.value as QuestionType;
            onChange(question.clientId, {
              question_type: nextType,
              choices: defaultChoicesForType(nextType),
              correct_answer: '',
            });
          }}
        >
          {QUESTION_TYPES.map((type) => (
            <option key={type} value={type}>
              {QUESTION_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <ComicText className="font-bold mb-1 text-sm">Question Text</ComicText>
        <textarea
          className="w-full comic-input min-h-[80px]"
          value={question.question_text}
          onChange={(event) =>
            onChange(question.clientId, { question_text: event.target.value })
          }
          placeholder="Enter the question students will answer after listening"
        />
      </div>

      {showChoices ? (
        <div className="space-y-2">
          <ComicText className="font-bold text-sm">
            {question.question_type === 'ordering'
              ? 'Items (correct order)'
              : question.question_type === 'matching'
                ? 'Matching pairs'
                : 'Answer Choices'}
          </ComicText>
          {question.choices.map((choice, choiceIndex) => (
            <input
              key={`choice-${question.clientId}-${choiceIndex}`}
              className="w-full comic-input"
              value={choice}
              onChange={(event) => {
                const nextChoices = [...question.choices];
                nextChoices[choiceIndex] = event.target.value;
                onChange(question.clientId, { choices: nextChoices });
              }}
              placeholder={`Choice ${choiceIndex + 1}`}
            />
          ))}
          {question.question_type === 'multiple_choice' ||
          question.question_type === 'matching' ||
          question.question_type === 'ordering' ? (
            <ComicButton
              type="button"
              variant="accent"
              size="sm"
              onClick={() =>
                onChange(question.clientId, { choices: [...question.choices, ''] })
              }
            >
              + Add choice
            </ComicButton>
          ) : null}
        </div>
      ) : null}

      <div>
        <ComicText className="font-bold mb-1 text-sm">Correct Answer</ComicText>
        {question.question_type === 'multiple_choice' || question.question_type === 'true_false' ? (
          <select
            className="w-full comic-input"
            value={question.correct_answer}
            onChange={(event) =>
              onChange(question.clientId, { correct_answer: event.target.value })
            }
          >
            <option value="">Select correct answer</option>
            {question.choices
              .filter((choice) => choice.trim())
              .map((choice) => (
                <option key={choice} value={choice}>
                  {choice}
                </option>
              ))}
          </select>
        ) : (
          <input
            className="w-full comic-input"
            value={question.correct_answer}
            onChange={(event) =>
              onChange(question.clientId, { correct_answer: event.target.value })
            }
            placeholder="Enter the correct answer"
          />
        )}
      </div>
    </div>
  );
}
