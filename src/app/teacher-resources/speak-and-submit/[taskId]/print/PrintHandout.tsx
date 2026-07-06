'use client';

import ComicText from '../../../../../components/ComicText';
import ComicTitle from '../../../../../components/ComicTitle';
import type { SpeakTask, SpeakTaskItem } from '@/lib/speak-and-submit/types';
import { TASK_TYPE_LABELS, groupTaskItemsBySection } from '@/lib/speak-and-submit/types';

interface PrintHandoutProps {
  task: SpeakTask;
  items: SpeakTaskItem[];
  studentUrl: string;
  qrCode: string;
  teacherName: string;
}

export default function PrintHandout({
  task,
  items,
  studentUrl,
  qrCode,
  teacherName,
}: PrintHandoutProps) {
  const sections = groupTaskItemsBySection(items);
  const hasMultipleParts = sections.length > 1;

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
          .print-prompt-option {
            font-size: 11px !important;
            line-height: 1.35 !important;
            padding: 6px 8px !important;
          }
          .print-prompt-section {
            gap: 6px !important;
          }
        }
      `}</style>

      <div className="speak-and-submit-page">
        <div className="no-print bg-[var(--comic-light)] px-4 py-6 text-center">
          <button
            type="button"
            onClick={() => window.print()}
            className="comic-button comic-bg-secondary text-white px-6 py-3"
          >
            Print handout
          </button>
        </div>

        <main className="print-page max-w-3xl mx-auto px-8 py-10 bg-white text-[var(--comic-dark)]">
          <div className="grid grid-cols-3 items-center gap-3 mb-8 border-b-4 border-[var(--comic-black)] pb-4">
            <ComicText className="font-bold text-xl text-left">{teacherName}</ComicText>
            <ComicText className="font-bold text-xl text-center">{task.title}</ComicText>
            <ComicText className="font-bold text-xl text-right">
              Class: {task.class_name}
            </ComicText>
          </div>

          <section className="mb-8">
            <ComicTitle
              level={6}
              className="!text-xl text-[var(--comic-primary)] mb-4"
            >
              🎙️ Speaking Task
            </ComicTitle>
            <ol className="space-y-4">
              {sections.map((section) => (
                <li key={`section-${section.sectionIndex}`} className="space-y-4">
                  {hasMultipleParts ? (
                    <ComicText className="font-bold text-xl text-[var(--comic-secondary)]">
                      Part {section.sectionIndex + 1}: {TASK_TYPE_LABELS[section.itemType]}
                    </ComicText>
                  ) : null}
                  <ol className="space-y-4">
                    {section.itemType === 'vocab_list' ? (
                      <li className="border-4 border-[var(--comic-black)] p-4 font-bold text-lg leading-relaxed">
                        <span className="flex flex-wrap justify-between gap-x-6 gap-y-2">
                          {section.items.map((item, index) => (
                            <span key={item.id}>
                              {index + 1}. {item.content}
                            </span>
                          ))}
                        </span>
                      </li>
                    ) : section.itemType === 'prompt' ? (
                      <li className="print-prompt-section space-y-2">
                        {section.items.length > 1 ? (
                          <p className="font-bold text-xs text-[var(--comic-secondary)]">
                            Choose one prompt:
                          </p>
                        ) : null}
                        {section.items.map((item, index) => (
                          <div
                            key={item.id}
                            className="print-prompt-option border-4 border-[var(--comic-black)] p-2 font-bold text-sm leading-snug space-y-1"
                          >
                            <p className="text-[var(--comic-dark)]">
                              {section.items.length > 1 ? (
                                <span className="text-[var(--comic-secondary)]">
                                  Option {index + 1}:{' '}
                                </span>
                              ) : null}
                              {item.content}
                            </p>
                            {item.prompt_rules ? (
                              <p className="text-xs leading-snug">
                                <span className="text-[var(--comic-secondary)]">Rules: </span>
                                {item.prompt_rules}
                              </p>
                            ) : null}
                            {item.prompt_example ? (
                              <p className="text-xs leading-snug italic">
                                <span className="text-[var(--comic-secondary)] not-italic">Example: </span>
                                {item.prompt_example}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </li>
                    ) : (
                      section.items.map((item, index) => (
                        <li
                          key={item.id}
                          className="border-4 border-[var(--comic-black)] p-4 font-bold text-lg leading-relaxed"
                        >
                          {section.items.length > 1 ? `${index + 1}. ` : ''}
                          {item.content}
                        </li>
                      ))
                    )}
                  </ol>
                </li>
              ))}
            </ol>
          </section>

          <section className="border-4 border-[var(--comic-black)] p-6">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="text-left min-w-0">
                <ComicTitle
                  level={6}
                  className="!text-xl text-[var(--comic-secondary)] mb-2 whitespace-nowrap"
                >
                  Scan to record &amp; submit
                </ComicTitle>
                <ComicText className="text-sm">
                  1. Scan QR code with your phone camera
                  <br />
                  2. Enter student name, number, and class
                  <br />
                  3. Record each item and submit
                </ComicText>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCode}
                alt="QR code"
                className="shrink-0"
                width={200}
                height={200}
              />
            </div>

            <hr className="border-0 border-t-4 border-[var(--comic-black)] mb-4" />

            <ComicText className="font-bold text-[10px] whitespace-nowrap text-center">
              {studentUrl}
            </ComicText>
          </section>
        </main>
      </div>
    </>
  );
}
