'use client';

import { useCallback, useEffect, useState } from 'react';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import type { ListenAssignmentWithParts, ScantronAnswers } from '@/lib/listen-and-answer/types';
import {
  formatQuestionLabel,
  getScantronPartSections,
  hasScantronQuestions,
} from '@/lib/listen-and-answer/types';

interface ScantronAnswerSheetProps {
  assignment: ListenAssignmentWithParts;
  interactive?: boolean;
  pageClassName?: string;
  onAnswersChange?: (answers: ScantronAnswers) => void;
}

function formatDueDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

export default function ScantronAnswerSheet({
  assignment,
  interactive = false,
  pageClassName = '',
  onAnswersChange,
}: ScantronAnswerSheetProps) {
  const [answers, setAnswers] = useState<ScantronAnswers>({});
  const sections = getScantronPartSections(assignment);

  const selectAnswer = useCallback(
    (questionId: string, letter: string) => {
      if (!interactive) return;
      setAnswers((current) => {
        const next =
          current[questionId] === letter
            ? { ...current, [questionId]: '' }
            : { ...current, [questionId]: letter };
        return next;
      });
    },
    [interactive]
  );

  useEffect(() => {
    onAnswersChange?.(answers);
  }, [answers, onAnswersChange]);

  if (!hasScantronQuestions(assignment)) {
    return null;
  }

  const maxBubbleCount = Math.max(
    ...sections.flatMap((section) => section.rows.map((row) => row.letters.length)),
    4
  );
  const columnLetters = Array.from({ length: maxBubbleCount }, (_, index) =>
    String.fromCharCode(65 + index)
  );

  return (
    <section className={`scantron-answer-sheet ${pageClassName}`.trim()}>
      <style jsx>{`
        .scantron-answer-sheet {
          color: var(--comic-dark);
        }
        .scantron-grid {
          display: grid;
          grid-template-columns: 6.25rem repeat(var(--scantron-columns), 1.25rem);
          column-gap: 0.125rem;
          row-gap: 0.2rem;
          align-items: center;
          width: max-content;
          max-width: 100%;
        }
        .scantron-grid-header {
          font-size: 0.7rem;
          font-weight: 700;
          text-align: center;
          color: var(--comic-secondary);
          line-height: 1;
        }
        .scantron-grid-row {
          display: contents;
        }
        .scantron-question-label {
          font-size: 0.8125rem;
          font-weight: 600;
          white-space: nowrap;
          padding-right: 0.25rem;
        }
        .scantron-bubble-cell {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 1.25rem;
        }
        .scantron-bubble-button {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          padding: 0;
          margin: 0;
          cursor: default;
          line-height: 0;
        }
        .scantron-bubble-button.interactive {
          cursor: pointer;
        }
        .scantron-bubble {
          width: 0.9rem;
          height: 0.9rem;
          border: 1.5px solid var(--comic-black);
          border-radius: 50%;
          background: #fff;
          transition: background-color 0.15s ease;
          flex-shrink: 0;
        }
        .scantron-bubble.selected {
          background: var(--comic-black);
        }
        .scantron-bubble-letter {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--comic-secondary);
          line-height: 1;
        }
        @media print {
          .scantron-grid {
            column-gap: 0.1rem;
            row-gap: 0.15rem;
          }
          .scantron-bubble {
            width: 0.8rem;
            height: 0.8rem;
            border-width: 1px;
          }
          .scantron-bubble.selected {
            background: #fff !important;
          }
        }
      `}</style>

      <div className="grid grid-cols-3 items-center gap-3 mb-8 border-b-4 border-[var(--comic-black)] pb-4">
        <ComicText className="font-bold text-xl text-left">
          {assignment.teacher_name || 'Teacher'}
        </ComicText>
        <ComicText className="font-bold text-xl text-center">
          {assignment.title || 'Listening Assignment'}
        </ComicText>
        <ComicText className="font-bold text-xl text-right">
          <span className="inline-flex flex-wrap justify-end gap-x-4 gap-y-1">
            <span>Class: {assignment.class_name || '—'}</span>
            {assignment.due_date ? (
              <span>Due: {formatDueDate(assignment.due_date)}</span>
            ) : null}
            {assignment.points.trim() ? (
              <span>Points: {assignment.points.trim()}</span>
            ) : null}
          </span>
        </ComicText>
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 items-end font-bold mb-6 text-center">
        <span>
          Name:{' '}
          <span className="inline-block border-b-2 border-[var(--comic-black)] w-40 align-bottom" />
        </span>
        <span>
          Student # / ID:{' '}
          <span className="inline-block border-b-2 border-[var(--comic-black)] w-6 align-bottom" /> /{' '}
          <span className="inline-block border-b-2 border-[var(--comic-black)] w-6 align-bottom" />
        </span>
        <span>
          Date:{' '}
          <span className="inline-block border-b-2 border-[var(--comic-black)] w-24 align-bottom" />
        </span>
      </div>

      <ComicTitle level={3} className="mb-2 text-[var(--comic-primary)]">
        Answer Sheet
      </ComicTitle>
      <p className="text-sm text-[var(--comic-dark)] mb-6">
        Fill in one bubble per question. For true/false questions, use A for True and B for False.
      </p>

      {sections.map((section) => (
        <div key={`scantron-${section.part.id}`} className="mb-8">
          {sections.length > 1 ? (
            <ComicText className="text-base font-semibold text-[var(--comic-secondary)] mb-3">
              {section.part.title || `Part ${section.partIndex + 1}`}
            </ComicText>
          ) : null}

          <div
            className="scantron-grid"
            style={{ ['--scantron-columns' as string]: String(maxBubbleCount) }}
          >
            <div />
            {columnLetters.map((letter) => (
              <div key={`header-${section.part.id}-${letter}`} className="scantron-grid-header">
                {letter}
              </div>
            ))}

            {section.rows.map((row) => (
              <div key={row.question.id} className="scantron-grid-row">
                <div className="scantron-question-label">
                  {formatQuestionLabel(row.questionIndex)}
                </div>
                {columnLetters.map((letter, columnIndex) => {
                  const isActive = columnIndex < row.letters.length;
                  const isSelected = answers[row.question.id] === letter;

                  if (!isActive) {
                    return <div key={`${row.question.id}-${letter}`} />;
                  }

                  return (
                    <div key={`${row.question.id}-${letter}`} className="scantron-bubble-cell">
                      {interactive ? (
                        <button
                          type="button"
                          className="scantron-bubble-button interactive"
                          aria-label={`${formatQuestionLabel(row.questionIndex)} answer ${letter}`}
                          aria-pressed={isSelected}
                          onClick={() => selectAnswer(row.question.id, letter)}
                        >
                          <span
                            className={`scantron-bubble${isSelected ? ' selected' : ''}`}
                          />
                        </button>
                      ) : (
                        <span className="scantron-bubble-button" aria-hidden="true">
                          <span className="scantron-bubble" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
