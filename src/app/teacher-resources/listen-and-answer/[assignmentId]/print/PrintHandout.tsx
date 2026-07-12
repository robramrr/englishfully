'use client';

import { useEffect, useState } from 'react';
import ComicText from '../../../../../components/ComicText';
import ComicTitle from '../../../../../components/ComicTitle';
import type { ListenAssignmentWithParts } from '@/lib/listen-and-answer/types';
import {
  QUESTION_TYPE_LABELS,
  formatQuestionLabel,
  getPrintableQuestions,
} from '@/lib/listen-and-answer/types';

interface PrintHandoutProps {
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

export default function PrintHandout({ assignment }: PrintHandoutProps) {
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
              width: 128,
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
    <>
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .answer-key-page {
            break-before: page;
            page-break-before: always;
          }
          .listen-and-answer-page .print-question-block {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="listen-and-answer-page">
        <div className="no-print bg-[var(--comic-light)] px-4 py-6 text-center">
          <button
            type="button"
            onClick={() => window.print()}
            className="comic-button comic-bg-secondary text-white px-6 py-3"
          >
            Print worksheet
          </button>
        </div>

        <main className="print-page max-w-3xl mx-auto px-8 py-10 bg-white text-[var(--comic-dark)]">
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

          <section className="mb-4">
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
              <ComicText className="font-bold mb-4">
                Instructions: {assignment.instructions.trim()}
              </ComicText>
            ) : null}
          </section>

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
                        className="block h-32 w-auto comic-border object-cover"
                      />
                      <ComicText className="font-bold text-xl text-[var(--comic-secondary)] mt-1">
                        {part.title || `Part ${partIndex + 1}`}
                      </ComicText>
                    </div>
                  ) : (
                    <ComicText className="font-bold text-xl text-[var(--comic-secondary)]">
                      {part.title || `Part ${partIndex + 1}`}
                    </ComicText>
                  )}
                  {part.qr_enabled && qrCodes[part.id] ? (
                    <div className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrCodes[part.id]}
                        alt="Audio QR code"
                        className="block h-32 w-32"
                      />
                      <ComicText className="text-xs font-bold mt-1 text-center">
                        Scan to listen
                      </ComicText>
                    </div>
                  ) : null}
                </div>

                {part.instructions.trim() ? (
                  <ComicText className="font-bold mb-4">{part.instructions.trim()}</ComicText>
                ) : null}

                <ol className="space-y-3">
                  {printableQuestions.map((question, questionIndex) => (
                    <li
                      key={question.id}
                      className="print-question-block border-b-4 border-[var(--comic-black)] pb-4 space-y-2"
                    >
                      <ComicText className="font-bold text-base leading-relaxed">
                        {formatQuestionLabel(questionIndex)}. {question.question_text}
                      </ComicText>
                      <ComicText className="text-xs text-[var(--comic-secondary)] font-bold">
                        {QUESTION_TYPE_LABELS[question.question_type]}
                      </ComicText>
                      {question.choices.length > 0 ? (
                        question.question_type === 'multiple_choice' ? (
                          <div className="space-y-1 text-sm font-bold">
                            {question.choices
                              .filter((choice) => choice.trim())
                              .map((choice) => (
                                <div key={choice}>{choice}</div>
                              ))}
                          </div>
                        ) : (
                          <ul className="list-disc pl-6 space-y-1 text-sm font-bold">
                            {question.choices
                              .filter((choice) => choice.trim())
                              .map((choice) => (
                                <li key={choice}>{choice}</li>
                              ))}
                          </ul>
                        )
                      ) : (
                        <div className="border-b-4 border-[var(--comic-black)] h-10" />
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </main>

        {assignment.include_answer_key ? (
          <main className="answer-key-page print-page max-w-3xl mx-auto px-8 py-10 bg-white text-[var(--comic-dark)]">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-danger)]">
              Answer Key
            </ComicTitle>
            {assignment.parts.map((part, partIndex) => {
              const printableQuestions = getPrintableQuestions(part);
              if (printableQuestions.length === 0) return null;
              return (
                <section key={`answers-${part.id}`} className="mb-6">
                  <ComicText className="font-bold text-xl text-[var(--comic-secondary)] mb-3">
                    {part.title || `Part ${partIndex + 1}`}
                  </ComicText>
                  <ol className="space-y-2 font-bold text-lg">
                    {printableQuestions.map((question, questionIndex) => (
                      <li key={question.id}>
                        {formatQuestionLabel(questionIndex)}: {question.correct_answer || '—'}
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })}
          </main>
        ) : null}
      </div>
    </>
  );
}
