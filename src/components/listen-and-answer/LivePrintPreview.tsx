'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeHigh } from '@fortawesome/free-solid-svg-icons';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import TotalTimeDisplay, {
  ListenMetaDivider,
  hasTotalTimeContent,
} from './TotalTimeDisplay';
import ScantronAnswerSheet from './ScantronAnswerSheet';
import PartThumbnailBlock from './PartThumbnailBlock';
import PrintQuestionBlock from './PrintQuestionBlock';
import type { ListenAssignmentWithParts } from '@/lib/listen-and-answer/types';
import {
  formatAnswerKeyAnswer,
  formatQuestionLabel,
  getPrintableQuestions,
  getQuestionSequenceStart,
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
          .listen-and-answer-page .print-part-header-block,
          .listen-and-answer-page .print-part-thumbnail-block,
          .listen-and-answer-page .print-qr-block {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .listen-and-answer-page .print-thumbnail-img,
          .listen-and-answer-page .print-qr-img {
            object-fit: contain !important;
          }
          .listen-and-answer-page .print-question-block .listen-print-choices,
          .listen-and-answer-page .print-question-block .listen-print-choices > div {
            font-size: 0.875rem !important;
            font-weight: 400 !important;
            line-height: 1.625 !important;
          }
          .listen-and-answer-page .print-question-block .listen-print-question-type {
            font-size: 0.75rem !important;
            font-weight: 400 !important;
            line-height: 1.5 !important;
          }
          .listen-and-answer-page .print-question-write-in {
            padding-top: 0.35rem;
            padding-bottom: 0.4rem;
          }
          .listen-and-answer-page .listen-print-inline-blank {
            display: inline-block;
            border-bottom: 1.5px solid var(--comic-black);
            min-height: 1.4em;
            margin: 0 0.2em;
            vertical-align: baseline;
            box-sizing: border-box;
          }
          .listen-and-answer-page .listen-print-write-in-line {
            border-bottom: 1.5px solid var(--comic-black);
            min-height: 2.35rem;
            max-width: 28rem;
            margin-left: 0.15rem;
          }
          .listen-and-answer-page .listen-print-write-in-line-tall {
            min-height: 2.85rem;
          }
          .listen-and-answer-page .listen-print-instructions {
            background: #e1e1e1;
            padding: 0.5rem 0.75rem 1rem;
            margin-bottom: 0.75rem;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
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
            <span className="inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faVolumeHigh} aria-hidden className="h-[0.85em] w-[0.85em]" />
              Listen &amp; Answer
            </span>
          </ComicTitle>
          {assignment.instructions.trim() ? (
            <>
              <div className="listen-print-instructions">
                <p className="text-sm font-bold leading-relaxed text-[var(--comic-dark)]">
                  Instructions: {assignment.instructions.trim()}
                </p>
              </div>
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
          const sequenceStart = getQuestionSequenceStart(assignment.parts, partIndex);
          return (
            <section key={part.id} className="mb-6 print-part-section">
              <div className="print-part-header-block flex flex-wrap gap-4 items-start mb-4">
                <PartThumbnailBlock
                  part={part}
                  partIndex={partIndex}
                  imageHeightClass="max-h-28"
                  titleComponent="title"
                />
                {part.qr_enabled && qrCodes[part.id] ? (
                  <div className="print-qr-block shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrCodes[part.id]}
                      alt="Audio QR code"
                      className="print-qr-img block h-28 w-28 object-contain"
                    />
                    <ComicText className="text-xs font-bold mt-1 text-center">
                      Scan to listen
                    </ComicText>
                  </div>
                ) : null}
              </div>

              {part.instructions.trim() ? (
                <>
                  <div className="listen-print-instructions">
                    <p className="text-sm font-medium leading-relaxed text-[var(--comic-dark)]">
                      {part.instructions.trim()}
                    </p>
                  </div>
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

              <ol className="space-y-4">
                {printableQuestions.map((question, questionIndex) => (
                  <PrintQuestionBlock
                    key={question.id}
                    question={question}
                    questionIndex={questionIndex}
                    sequenceStart={sequenceStart}
                  />
                ))}
              </ol>
            </section>
          );
        })}

        {assignment.include_scantron_sheet ? (
          <section className="mt-10 pt-8 border-t-4 border-dashed border-[var(--comic-black)]">
            <ScantronAnswerSheet assignment={assignment} interactive />
          </section>
        ) : null}

        {assignment.include_answer_key ? (
          <section className="mt-10 pt-8 border-t-4 border-dashed border-[var(--comic-black)]">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-danger)]">
              Answer Key
            </ComicTitle>
            {assignment.parts.map((part, partIndex) => {
              const printableQuestions = getPrintableQuestions(part);
              if (printableQuestions.length === 0) return null;
              const sequenceStart = getQuestionSequenceStart(assignment.parts, partIndex);
              return (
                <div key={`answer-${part.id}`} className="mb-4">
                  <ComicText className="text-base font-semibold text-[var(--comic-secondary)] mb-2">
                    {part.title || `Part ${partIndex + 1}`}
                  </ComicText>
                  <ol className="space-y-1 text-sm leading-relaxed">
                    {printableQuestions.map((question, questionIndex) => (
                      <li key={question.id}>
                        {formatQuestionLabel(questionIndex, sequenceStart)}: {formatAnswerKeyAnswer(question)}
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
