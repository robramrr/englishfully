'use client';

import { useEffect, useState } from 'react';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
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
              width: 120,
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

      <div className="print-page min-w-[720px] bg-white text-[var(--comic-dark)] border-4 border-[var(--comic-black)] p-8">
        <div className="grid grid-cols-3 items-center gap-3 mb-6 border-b-4 border-[var(--comic-black)] pb-4">
          <ComicText className="font-bold text-lg text-left">{assignment.teacher_name || 'Teacher'}</ComicText>
          <ComicText className="font-bold text-lg text-center">{assignment.title || 'Listening Assignment'}</ComicText>
          <ComicText className="font-bold text-lg text-right">
            <span className="inline-flex flex-wrap justify-end gap-x-4 gap-y-1">
              <span>Class: {assignment.class_name || '—'}</span>
              {assignment.due_date ? (
                <span>Due: {formatDueDate(assignment.due_date)}</span>
              ) : null}
            </span>
          </ComicText>
        </div>

        <div className="mb-4">
          <div className="flex flex-wrap gap-6 items-end font-bold mb-4">
            <span>
              Nickname: <span className="inline-block border-b-2 border-[var(--comic-black)] w-40 align-bottom" />
            </span>
            <span>
              Student # / ID: <span className="inline-block border-b-2 border-[var(--comic-black)] w-10 align-bottom" /> /{' '}
              <span className="inline-block border-b-2 border-[var(--comic-black)] w-10 align-bottom" />
            </span>
            <span>
              Date: <span className="inline-block border-b-2 border-[var(--comic-black)] w-8 align-bottom" /> /{' '}
              <span className="inline-block border-b-2 border-[var(--comic-black)] w-8 align-bottom" /> /{' '}
              <span className="inline-block border-b-2 border-[var(--comic-black)] w-10 align-bottom" />
            </span>
          </div>
          <ComicTitle level={4} className="!text-xl !mb-0 text-[var(--comic-primary)]">
            👂 Listen &amp; Answer
          </ComicTitle>
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
                      className="block max-h-28 comic-border object-cover"
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
                      width={120}
                      height={120}
                      className="block"
                    />
                    <ComicText className="text-xs font-bold mt-1 text-center">
                      Scan to listen
                    </ComicText>
                  </div>
                ) : null}
              </div>

              <ComicText className="font-bold mb-4">
                Listen carefully. Then answer the questions below.
              </ComicText>

              <ol className="space-y-3">
                {printableQuestions.map((question, questionIndex) => (
                  <li
                    key={question.id}
                    className="print-question-block border-b-4 border-[var(--comic-black)] pb-4 space-y-2"
                  >
                    <ComicText className="font-bold text-base">
                      {formatQuestionLabel(questionIndex)}. {question.question_text}
                    </ComicText>
                    <ComicText className="text-xs text-[var(--comic-secondary)]">
                      {QUESTION_TYPE_LABELS[question.question_type]}
                    </ComicText>
                    {question.choices.length > 0 ? (
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        {question.choices
                          .filter((choice) => choice.trim())
                          .map((choice) => (
                            <li key={choice}>{choice}</li>
                          ))}
                      </ul>
                    ) : (
                      <div className="border-b-4 border-[var(--comic-black)] h-8" />
                    )}
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
                  <ComicText className="font-bold text-[var(--comic-secondary)] mb-2">
                    {part.title || `Part ${partIndex + 1}`}
                  </ComicText>
                  <ol className="space-y-1">
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
