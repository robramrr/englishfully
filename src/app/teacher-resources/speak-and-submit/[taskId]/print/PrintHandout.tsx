'use client';

import ComicText from '../../../../../components/ComicText';
import ComicTitle from '../../../../../components/ComicTitle';
import type { ItemTaskType, SpeakTask, SpeakTaskItem } from '@/lib/speak-and-submit/types';
import { TASK_TYPE_LABELS, groupTaskItemsBySection } from '@/lib/speak-and-submit/types';

interface PrintHandoutProps {
  task: SpeakTask;
  items: SpeakTaskItem[];
  studentUrl: string;
  qrCode: string;
}

function renderSectionItems(itemType: ItemTaskType, sectionItems: SpeakTaskItem[]) {
  if (itemType === 'vocab_list') {
    return (
      <ul className="print-vocab-list">
        {sectionItems.map((item, index) => (
          <li key={item.id} className="print-vocab-item">
            <span className="print-vocab-number">{index + 1}.</span>
            {item.content}
          </li>
        ))}
      </ul>
    );
  }

  if (sectionItems.length === 1) {
    return (
      <div className="print-task-item print-task-item-single">{sectionItems[0].content}</div>
    );
  }

  return (
    <ol className="print-task-list">
      {sectionItems.map((item, index) => (
        <li key={item.id} className="print-task-item">
          <span className="print-item-number">{index + 1}.</span>
          {item.content}
        </li>
      ))}
    </ol>
  );
}

export default function PrintHandout({ task, items, studentUrl, qrCode }: PrintHandoutProps) {
  const sections = groupTaskItemsBySection(items);
  const hasMultipleParts = sections.length > 1;

  return (
    <>
      <style jsx global>{`
        @page {
          size: letter;
          margin: 0.45in 0.5in 0.4in;
        }

        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print {
            display: none !important;
          }

          .print-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
          }

          .print-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            padding: 0.12in 0.5in 0.1in;
            background: white;
            border-bottom: 2px solid var(--comic-black);
            z-index: 1000;
          }

          .print-body {
            padding-top: 0.55in;
          }
        }

        .print-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
          border-bottom: 3px solid var(--comic-black);
          padding-bottom: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .print-header-title {
          font-family: var(--font-bungee), sans-serif;
          font-size: 1rem;
          line-height: 1.25;
          color: var(--comic-primary);
          text-align: left;
          flex: 1;
          min-width: 0;
          word-break: break-word;
        }

        .print-header-class {
          font-weight: 700;
          font-size: 0.95rem;
          white-space: nowrap;
          color: var(--comic-dark);
        }

        .print-layout {
          display: grid;
          grid-template-columns: 1fr 11rem;
          gap: 0.75rem;
          align-items: start;
        }

        @media (max-width: 640px) {
          .print-layout {
            grid-template-columns: 1fr;
          }
        }

        .print-brand {
          font-family: var(--font-bungee), sans-serif;
          font-size: 0.85rem;
          color: var(--comic-secondary);
          margin-bottom: 0.35rem;
        }

        .print-section-title {
          font-family: var(--font-bungee), sans-serif;
          font-size: 0.8rem;
          color: var(--comic-primary);
          margin-bottom: 0.35rem;
        }

        .print-part-label {
          font-weight: 700;
          font-size: 0.78rem;
          color: var(--comic-secondary);
          margin: 0.35rem 0 0.2rem;
        }

        .print-sections {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .print-task-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .print-task-item {
          border: 2px solid var(--comic-black);
          padding: 0.3rem 0.45rem;
          font-weight: 700;
          font-size: 0.82rem;
          line-height: 1.35;
        }

        .print-task-item-single {
          margin: 0;
        }

        .print-item-number {
          color: var(--comic-secondary);
          margin-right: 0.2rem;
        }

        .print-vocab-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem 0.35rem;
        }

        .print-vocab-item {
          border: 2px solid var(--comic-black);
          padding: 0.2rem 0.4rem;
          font-weight: 700;
          font-size: 0.78rem;
          line-height: 1.2;
          display: inline-flex;
          align-items: baseline;
          gap: 0.15rem;
        }

        .print-vocab-number {
          color: var(--comic-secondary);
          font-size: 0.72rem;
        }

        .print-qr-panel {
          border: 3px solid var(--comic-black);
          padding: 0.45rem;
          text-align: center;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .print-qr-title {
          font-family: var(--font-bungee), sans-serif;
          font-size: 0.65rem;
          color: var(--comic-secondary);
          margin-bottom: 0.3rem;
          line-height: 1.2;
        }

        .print-qr-image {
          display: block;
          margin: 0 auto 0.3rem;
          width: 7.5rem;
          height: 7.5rem;
        }

        .print-qr-url {
          font-weight: 700;
          font-size: 0.45rem;
          line-height: 1.25;
          word-break: break-all;
          margin-bottom: 0.35rem;
        }

        .print-qr-steps {
          font-size: 0.58rem;
          line-height: 1.35;
          text-align: left;
        }

        @media print {
          .print-brand {
            font-size: 0.72rem;
            margin-bottom: 0.2rem;
          }

          .print-section-title {
            font-size: 0.72rem;
            margin-bottom: 0.2rem;
          }

          .print-part-label {
            font-size: 0.68rem;
            margin: 0.2rem 0 0.12rem;
          }

          .print-sections {
            gap: 0.2rem;
          }

          .print-task-item {
            padding: 0.18rem 0.35rem;
            font-size: 0.72rem;
            line-height: 1.25;
          }

          .print-vocab-item {
            padding: 0.12rem 0.3rem;
            font-size: 0.68rem;
          }

          .print-qr-panel {
            padding: 0.3rem;
          }

          .print-qr-image {
            width: 6.5rem;
            height: 6.5rem;
          }

          .print-qr-url {
            font-size: 0.42rem;
          }

          .print-qr-steps {
            font-size: 0.52rem;
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

        <header className="print-header">
          <div className="print-header-title">{task.title}</div>
          <div className="print-header-class">Class: {task.class_name}</div>
        </header>

        <main className="print-page max-w-3xl mx-auto px-6 py-6 bg-white text-[var(--comic-dark)] print-body">
          <div className="print-brand">🎙️ Speak &amp; Submit</div>

          <div className="print-layout">
            <section>
              <div className="print-section-title">Your speaking task</div>
              <div className="print-sections">
                {sections.map((section) => (
                  <div key={`section-${section.sectionIndex}`}>
                    {hasMultipleParts ? (
                      <div className="print-part-label">
                        Part {section.sectionIndex + 1}: {TASK_TYPE_LABELS[section.itemType]}
                      </div>
                    ) : null}
                    {renderSectionItems(section.itemType, section.items)}
                  </div>
                ))}
              </div>
            </section>

            <aside className="print-qr-panel">
              <div className="print-qr-title">Scan once to record &amp; submit</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="QR code" className="print-qr-image" width={120} height={120} />
              <div className="print-qr-url">{studentUrl}</div>
              <div className="print-qr-steps">
                1. Scan the QR code with your phone camera
                <br />
                2. Enter your name, student number, and class number
                <br />
                3. Record each item and submit
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
