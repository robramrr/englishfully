'use client';

import { useMemo, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import {
  DEFAULT_CHALLENGE_COPIES,
  MAX_CHALLENGE_COPIES,
  challengeActivityTitle,
  challengeColumns,
  challengeGridWords,
  type DefinitionChallengeActivity,
} from '@/lib/definition-challenge/types';

const STUDENT_INSTRUCTIONS =
  'Listen to each definition. Find the word and cross it out. The first person to cross out every word the teacher reads is the winner.';

function fontSize(count: number): string {
  if (count <= 20) return '22pt';
  if (count <= 30) return '18pt';
  if (count <= 40) return '15pt';
  return '13pt';
}

export default function DefinitionChallengeSheets({
  activity,
}: {
  activity: DefinitionChallengeActivity;
}) {
  const [copies, setCopies] = useState(DEFAULT_CHALLENGE_COPIES);
  const words = useMemo(() => challengeGridWords(activity), [activity]);
  const columns = challengeColumns(words.length);
  const title = challengeActivityTitle(activity);
  const pages = Math.max(1, Math.min(MAX_CHALLENGE_COPIES, copies));

  return (
    <div className="challenge-print-root">
      <style jsx global>{`
        .challenge-sheet {
          background: white;
          color: black;
          border: 1px solid black;
        }
        .challenge-grid {
          display: grid;
          gap: 0;
          border-top: 1px solid black;
          border-left: 1px solid black;
        }
        .challenge-cell {
          border-right: 1px solid black;
          border-bottom: 1px solid black;
          min-height: 0.95in;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 0.25rem;
          font-weight: 700;
          line-height: 1.15;
          word-break: break-word;
        }
        @media print {
          footer,
          nav,
          header,
          .challenge-print-toolbar {
            display: none !important;
          }
          .challenge-sheet {
            break-after: page;
            page-break-after: always;
          }
          .challenge-sheet:last-child {
            break-after: auto;
            page-break-after: auto;
          }
        }
      `}</style>

      <div className="challenge-print-toolbar mb-6 flex flex-wrap items-end gap-3 border-4 border-[var(--comic-black)] bg-white p-4">
        <label className="space-y-1">
          <ComicText className="text-sm font-black">Identical copies</ComicText>
          <input
            type="number"
            min={1}
            max={MAX_CHALLENGE_COPIES}
            className="comic-input w-28 font-bold"
            value={copies}
            onChange={(event) =>
              setCopies(Math.max(1, Math.min(MAX_CHALLENGE_COPIES, Number(event.target.value) || 1)))
            }
          />
        </label>
        <ComicText className="max-w-xl text-sm font-bold text-[var(--comic-dark)]">
          Every page is the same {words.length}-word grid. Print, or choose Save as PDF in the print
          window.
        </ComicText>
        <ComicButton type="button" variant="primary" size="sm" onClick={() => window.print()}>
          Print / Save PDF
        </ComicButton>
      </div>

      <div className="space-y-8">
        {Array.from({ length: pages }, (_, copy) => (
          <section key={copy} className="challenge-sheet p-4">
            <h1 className="text-center text-2xl font-black">{title}</h1>
            <p className="mt-1 text-center text-sm">{STUDENT_INSTRUCTIONS}</p>
            <p className="mt-3 text-base font-bold">Name: ______________________________</p>
            {words.length === 0 ? (
              <p className="mt-6 text-center font-bold">Add words to the grid before printing.</p>
            ) : (
              <div
                className="challenge-grid mt-3"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
              >
                {words.map((word) => (
                  <div key={word.id} className="challenge-cell" style={{ fontSize: fontSize(words.length) }}>
                    {word.word}
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
