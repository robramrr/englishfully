'use client';

import { useEffect, useState } from 'react';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import TotalTimeDisplay, {
  ListenMetaDivider,
  hasTotalTimeContent,
} from './TotalTimeDisplay';
import type { ListenAssignmentWithParts } from '@/lib/listen-and-answer/types';
import {
  QUESTION_TYPE_LABELS,
  formatQuestionLabel,
  getPrintableQuestions,
} from '@/lib/listen-and-answer/types';

interface LivePrintPreviewProps {
  assignment: ListenAssignmentWithParts;
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

export default function LivePrintPreview({ assignment }: LivePrintPreviewProps) {
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    async function loadQrCodes() {
      const QRCode = await import('qrcode');
      const entries = await Promise.all(
        assignment.parts
          .filter((part) => part.qr_enabled && part.audio_url.trim())
          .map(async (part) => {
            const dataUrl = await QRCode.toDataURL(part.audio_url.trim(), {
              errorCorrectionLevel: 'M',
              margin: 0,
              width: 112,
              color: { dark: '#001a48', light: '#ffffff' },
            });
            return [part.id, dataUrl] as const;
          })
      );
      if (!cancelled) {
        setQrCodes(Object.fromEntries(entries));
      }
    }
    void loadQrCodes();
    return () => {
      cancelled = true;
    };
  }, [assignment.parts]);

  return (
    <ComicCard className="comic-shadow-xl overflow-x-auto">
      <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
        Live Print Preview
      </ComicTitle>

      <div className="listen-and-answer-page print-page min-w-[720px] bg-white text-[var(--comic-dark)] border-4 border-[var(--comic-black)] p-8">
        <style jsx global>{`
          .listen-and-answer-page .print-question-block .listen-print-choices,
          .listen-and-answer-page .print-question-block .listen-print-choices li {
            font-size: 0.875rem;
            font-weight: 400;
            line-height: 1.625;
          }
          .listen-and-answer-page .print-question-block .listen-print-question-type {
            font-size: 0.75rem;
            font-weight: 400;
            line-height: 1.5;
          }
        `}</style>
        <div className="grid grid-cols-3 items-center gap-3 mb-6 border-b-4 border-[var(--comic-black)] pb-4">
          <ComicText className="font-bold text-lg text-left">{assignment.teacher_name || 'Teacher'}</ComicText>
          <ComicText className="font-bold text-lg text-center">{assignment.title || 'Listening Assignment'}</ComicText>
          <ComicText className="font-bold text-lg text-right">
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

        <div className="mb-4">
          {assignment.include_student_info_line ? (
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 items-end font-bold mb-4 text-center">
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
          ) : null}
          <ComicTitle level={6} className="!text-xl text-[var(--comic-primary)] py-2">
            🔊 Listen &amp; Answer
          </ComicTitle>
          {assignment.instructions.trim() ? (
            <>
              <ComicText className="font-bold mb-1">
                Instructions: {assignment.instructions.trim()}
              </ComicText>
              {!hasTotalTimeContent(
                assignment.total_questions,
                assignment.time_amount,
                assignment.time_unit
              ) ? (
                <ListenMetaDivider />
              ) : null}
            </>
          ) : null}
          <TotalTimeDisplay
            totalQuestions={assignment.total_questions}
            timeAmount={assignment.time_amount}
            timeUnit={assignment.time_unit}
          />
        </div>

        {assignment.parts.map((part, partIndex) => {
          const printableQuestions = getPrintableQuestions(part);
          return (
            <section key={part.id} className="mb-6">
              <div className="flex flex-wrap gap-4 items-start mb-4">
                {part.thumbnail_url.trim() ? (
                  <div className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={part.thumbnail_url}
                      alt=""
                      className="block h-28 w-auto comic-border object-cover"
                    />
                    <ComicTitle level={4} className="!text-xl !mb-0 mt-1 text-[var(--comic-primary)]">
                      {part.title || `Part ${partIndex + 1}`}
                    </ComicTitle>
                  </div>
                ) : (
                  <ComicTitle level={4} className="!text-xl !mb-0 text-[var(--comic-primary)]">
                    {part.title || `Part ${partIndex + 1}`}
                  </ComicTitle>
                )}
                {part.qr_enabled && qrCodes[part.id] ? (
                  <div className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrCodes[part.id]}
                      alt="Audio QR code"
                      className="block h-28 w-28"
                    />
                    <ComicText className="text-xs font-bold mt-1 text-center">
                      Scan to listen
                    </ComicText>
                  </div>
                ) : null}
              </div>

              {part.instructions.trim() ? (
                <>
                  <p className="text-sm font-medium leading-relaxed text-[var(--comic-dark)] mb-1">
                    {part.instructions.trim()}
                  </p>
                  {!hasTotalTimeContent(part.total_questions, part.time_amount, part.time_unit) ? (
                    <ListenMetaDivider />
                  ) : null}
                </>
              ) : null}

              <TotalTimeDisplay
                totalQuestions={part.total_questions}
                timeAmount={part.time_amount}
                timeUnit={part.time_unit}
                variant="part"
              />

              <ol className="space-y-2">
                {printableQuestions.map((question, questionIndex) => (
                  <li
                    key={question.id}
                    className="print-question-block space-y-1.5"
                  >
                    <p className="text-sm font-semibold leading-snug text-[var(--comic-dark)]">
                      {formatQuestionLabel(questionIndex)}. {question.question_text}
                    </p>
                    {question.show_question_type ? (
                      <p className="listen-print-question-type text-xs text-[var(--comic-secondary)]">
                        {QUESTION_TYPE_LABELS[question.question_type]}
                      </p>
                    ) : null}
                    {question.choices.length > 0 ? (
                      question.question_type === 'multiple_choice' ? (
                        <div className="listen-print-choices space-y-0.5 text-sm font-normal leading-relaxed pl-1 text-[var(--comic-dark)]">
                          {question.choices
                            .filter((choice) => choice.trim())
                            .map((choice) => (
                              <div key={choice}>{choice}</div>
                            ))}
                        </div>
                      ) : (
                        <ul className="listen-print-choices list-disc pl-5 space-y-0.5 text-sm font-normal leading-relaxed text-[var(--comic-dark)]">
                          {question.choices
                            .filter((choice) => choice.trim())
                            .map((choice) => (
                              <li key={choice}>{choice}</li>
                            ))}
                        </ul>
                      )
                    ) : (
                      <div
                        className="h-8"
                        style={{ borderBottom: '1px solid #cccccc' }}
                      />
                    )}
                    <ListenMetaDivider className="mt-3 mb-4" />
                  </li>
                ))}
              </ol>
            </section>
          );
        })}

        {assignment.include_answer_key ? (
          <section className="mt-10 pt-8 border-t-4 border-dashed border-[var(--comic-black)]">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-danger)]">
              Answer Key
            </ComicTitle>
            {assignment.parts.map((part, partIndex) => {
              const printableQuestions = getPrintableQuestions(part);
              if (printableQuestions.length === 0) return null;
              return (
                <div key={`answer-${part.id}`} className="mb-4">
                  <ComicText className="text-base font-semibold text-[var(--comic-secondary)] mb-2">
                    {part.title || `Part ${partIndex + 1}`}
                  </ComicText>
                  <ol className="space-y-1 text-sm leading-relaxed">
                    {printableQuestions.map((question, questionIndex) => (
                      <li key={question.id}>
                        {formatQuestionLabel(questionIndex)}: {question.correct_answer || '—'}
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </section>
        ) : null}
      </div>
    </ComicCard>
  );
}
