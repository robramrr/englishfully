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
}

export default function PrintHandout({ task, items, studentUrl, qrCode }: PrintHandoutProps) {
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
            <ComicText className="font-bold text-xl text-left">{task.title}</ComicText>
            <ComicTitle level={2} className="text-[var(--comic-secondary)] text-center mb-0">
              🎙️ Speak &amp; Submit
            </ComicTitle>
            <ComicText className="font-bold text-xl text-right">
              Class: {task.class_name}
            </ComicText>
          </div>

          <section className="mb-8">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
              Your speaking task
            </ComicTitle>
            <ol className="space-y-4">
              {sections.map((section) => (
                <li key={`section-${section.sectionIndex}`} className="space-y-4">
                  {hasMultipleParts ? (
                    <ComicText className="font-bold text-lg text-[var(--comic-secondary)]">
                      Part {section.sectionIndex + 1}: {TASK_TYPE_LABELS[section.itemType]}
                    </ComicText>
                  ) : null}
                  <ol className="space-y-4">
                    {section.items.map((item, index) => (
                      <li
                        key={item.id}
                        className="border-4 border-[var(--comic-black)] p-4 font-bold text-lg leading-relaxed"
                      >
                        {section.items.length > 1 ? `${index + 1}. ` : ''}
                        {item.content}
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
          </section>

          <section className="border-4 border-[var(--comic-black)] p-6 text-center">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
              Scan once to record &amp; submit
            </ComicTitle>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="QR code" className="mx-auto mb-4" width={240} height={240} />
            <ComicText className="font-bold break-all text-sm">{studentUrl}</ComicText>
            <ComicText className="mt-4 text-sm">
              1. Scan the QR code with your phone camera
              <br />
              2. Enter your name, student number, and class number
              <br />
              3. Record each item and submit
            </ComicText>
          </section>
        </main>
      </div>
    </>
  );
}
