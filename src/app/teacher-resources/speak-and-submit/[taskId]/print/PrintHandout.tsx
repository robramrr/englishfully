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
  const hasMultiPromptSection = sections.some(
    (section) => section.itemType === 'prompt' && section.items.length > 1
  );

  return (
    <>
      <style jsx global>{`
        .speak-and-submit-page .print-prompt-option {
          line-height: 1.35;
          padding: 8px;
        }
        .speak-and-submit-page .print-prompt-title,
        .speak-and-submit-page .print-prompt-option-label {
          font-size: 17px;
          font-weight: bold;
        }
        .speak-and-submit-page .print-prompt-rules {
          font-size: 15px;
          font-weight: normal;
        }
        .speak-and-submit-page .print-prompt-example {
          font-size: 15px;
          font-weight: normal;
        }
        .speak-and-submit-page .print-choose-prompt {
          font-size: 17px;
          font-weight: bold;
          margin-top: 10px;
        }

        @media print {
          @page {
            margin: 0.5in;
          }

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
            padding: 0.4rem 0.75rem !important;
            max-width: none !important;
          }
          .speak-and-submit-page .print-header {
            margin-bottom: 1.25rem !important;
            padding-bottom: 0.75rem !important;
          }
          .speak-and-submit-page .print-task-section {
            margin-bottom: 6px !important;
          }
          .speak-and-submit-page .print-task-heading {
            margin-bottom: 0.75rem !important;
          }
          .speak-and-submit-page .print-sections {
            gap: 0.85rem !important;
          }
          .speak-and-submit-page .print-sections > li,
          .speak-and-submit-page .print-items {
            gap: 0.85rem !important;
          }
          .speak-and-submit-page .print-item-card {
            padding: 0.85rem !important;
          }
          .speak-and-submit-page .print-prompt-option {
            padding: 6px 8px !important;
            font-size: inherit !important;
          }
          .speak-and-submit-page .print-prompt-title,
          .speak-and-submit-page .print-prompt-option-label {
            font-size: 17px !important;
            line-height: 1.35 !important;
          }
          .speak-and-submit-page .print-prompt-rules {
            font-size: 15px !important;
            line-height: 1.35 !important;
            font-weight: normal !important;
          }
          .speak-and-submit-page .print-prompt-example {
            font-size: 15px !important;
            line-height: 1.35 !important;
            font-weight: normal !important;
          }
          .speak-and-submit-page .print-prompt-section {
            gap: 6px !important;
          }
          .speak-and-submit-page .print-choose-prompt {
            font-size: 17px !important;
            margin-top: 8px !important;
          }
          .speak-and-submit-page .print-qr-section {
            padding: 1.1rem !important;
            margin-top: 0 !important;
          }
          .speak-and-submit-page .print-qr-row {
            margin-bottom: 0.75rem !important;
          }
          .speak-and-submit-page .print-qr-img {
            width: 180px !important;
            height: 180px !important;
          }
          .speak-and-submit-page .print-qr-divider {
            margin-bottom: 0.75rem !important;
          }
          .speak-and-submit-page .print-student-url {
            font-family: Arial, Helvetica, sans-serif !important;
            font-size: 14pt !important;
            font-weight: 700 !important;
            line-height: 1.35 !important;
            letter-spacing: 0.01em !important;
            color: #000 !important;
            white-space: normal !important;
            overflow-wrap: anywhere !important;
            word-break: break-all !important;
            -webkit-font-smoothing: auto !important;
            -moz-osx-font-smoothing: auto !important;
          }
        }

        /* Screen preview — match print size/crispness */
        .speak-and-submit-page .print-student-url {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 14pt;
          font-weight: 700;
          line-height: 1.35;
          letter-spacing: 0.01em;
          color: #000;
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: break-all;
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
          <div className="print-header grid grid-cols-3 items-center gap-3 mb-8 border-b-4 border-[var(--comic-black)] pb-4">
            <ComicText className="font-bold text-xl text-left">{teacherName}</ComicText>
            <ComicText className="font-bold text-xl text-center">{task.title}</ComicText>
            <ComicText className="font-bold text-xl text-right">
              Class: {task.class_name}
            </ComicText>
          </div>

          <section className="print-task-section mb-2">
            <div className="print-task-heading mb-4">
              <ComicTitle
                level={6}
                className="!text-xl text-[var(--comic-primary)]"
              >
                🎙️ Speaking Task
              </ComicTitle>
              {hasMultiPromptSection ? (
                <p className="print-choose-prompt text-[var(--comic-secondary)]">
                  Choose one prompt:
                </p>
              ) : null}
            </div>
            <ol className="print-sections space-y-4">
              {sections.map((section) => (
                <li key={`section-${section.sectionIndex}`} className="space-y-4">
                  {hasMultipleParts ? (
                    <ComicText className="font-bold text-xl text-[var(--comic-secondary)]">
                      Part {section.sectionIndex + 1}: {TASK_TYPE_LABELS[section.itemType]}
                    </ComicText>
                  ) : null}
                  <ol className="print-items space-y-4">
                    {section.itemType === 'vocab_list' ? (
                      <li className="print-item-card border-4 border-[var(--comic-black)] p-4 font-bold text-lg leading-relaxed">
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
                        {section.items.map((item, index) => (
                          <div
                            key={item.id}
                            className="print-prompt-option border-4 border-[var(--comic-black)] p-2 leading-snug space-y-1"
                          >
                            <p className="flex items-baseline justify-between gap-3 text-[var(--comic-dark)]">
                              <span className="print-prompt-title">{item.content}</span>
                              {section.items.length > 1 ? (
                                <span className="print-prompt-option-label shrink-0 text-[var(--comic-secondary)] whitespace-nowrap">
                                  Option {index + 1}
                                </span>
                              ) : null}
                            </p>
                            {item.prompt_rules ? (
                              <p className="print-prompt-rules leading-snug">
                                <span className="text-[var(--comic-secondary)] font-bold">Rules: </span>
                                {item.prompt_rules}
                              </p>
                            ) : null}
                            {item.prompt_example ? (
                              <p className="print-prompt-example leading-snug italic">
                                <span className="text-[var(--comic-secondary)] not-italic font-bold">Example: </span>
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
                          className="print-item-card border-4 border-[var(--comic-black)] p-4 font-bold text-lg leading-relaxed"
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

          <section className="print-qr-section border-4 border-[var(--comic-black)] p-6">
            <div className="print-qr-row flex items-start justify-between gap-2 mb-4">
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
                  3. Record one item and submit
                </ComicText>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCode}
                alt="QR code"
                className="print-qr-img shrink-0"
                width={200}
                height={200}
              />
            </div>

            <hr className="print-qr-divider border-0 border-t-4 border-[var(--comic-black)] mb-4" />

            <p className="print-student-url text-center">
              {studentUrl}
            </p>
          </section>
        </main>
      </div>
    </>
  );
}
