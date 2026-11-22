'use client';

import { useMemo, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import { buildBingoGrids } from '@/lib/vocab-bingo/grid';
import {
  MAX_BINGO_PRINT_COPIES,
  bingoActivityTitle,
  type VocabBingoActivity,
} from '@/lib/vocab-bingo/types';

export default function VocabBingoGrids({ activity }: { activity: VocabBingoActivity }) {
  const [copies, setCopies] = useState(8);
  const grids = useMemo(
    () => buildBingoGrids(activity, copies),
    [activity, copies]
  );
  const title = bingoActivityTitle(activity);

  return (
    <div className="bingo-print-root">
      <style jsx global>{`
        @media print {
          footer,
          nav,
          header,
          .bingo-print-toolbar {
            display: none !important;
          }
          .bingo-sheet {
            break-after: page;
            page-break-after: always;
            border-width: 2px;
          }
          .bingo-sheet:last-child {
            break-after: auto;
            page-break-after: auto;
          }
          .bingo-cell {
            min-height: 1.35in;
            font-size: 22pt !important;
          }
        }
      `}</style>

      <div className="bingo-print-toolbar mb-6 flex flex-wrap items-end gap-3 border-4 border-[var(--comic-black)] bg-white p-4">
        <label className="space-y-1">
          <ComicText className="text-sm font-black">Student grids</ComicText>
          <input
            type="number"
            min={1}
            max={MAX_BINGO_PRINT_COPIES}
            className="comic-input w-28 font-bold"
            value={copies}
            onChange={(event) =>
              setCopies(
                Math.max(1, Math.min(MAX_BINGO_PRINT_COPIES, Number(event.target.value) || 1))
              )
            }
          />
        </label>
        <ComicText className="max-w-xl text-sm font-bold text-[var(--comic-dark)]">
          Each page is a different shuffle. Every target word is on every page. Print, or choose
          Save as PDF in the print window.
        </ComicText>
        <ComicButton type="button" variant="primary" size="sm" onClick={() => window.print()}>
          Print / Save PDF
        </ComicButton>
      </div>

      <div className="space-y-8">
        {grids.map((grid) => (
          <section
            key={grid.copy}
            className="bingo-sheet border-4 border-[var(--comic-black)] bg-white p-4"
          >
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="font-bungee text-3xl leading-none text-[var(--comic-secondary)]">
                  Vocabulary Bingo
                </p>
                <p className="mt-1 text-lg font-black">{title}</p>
              </div>
              <p className="text-lg font-black">Name: ______________</p>
            </div>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${grid.size}, minmax(0, 1fr))` }}
            >
              {grid.cells.map((cell, index) => (
                <div
                  key={`${grid.copy}-${index}`}
                  className="bingo-cell flex min-h-[4.5rem] items-center justify-center border-4 border-[var(--comic-black)] px-2 py-3 text-center font-black leading-tight text-[var(--comic-dark)]"
                  style={{ fontSize: grid.size === 5 ? '1.15rem' : '1.45rem' }}
                >
                  {cell}
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm font-bold">
              {activity.topic ? `${activity.topic} · ` : ''}
              {activity.level} · Grid {grid.copy}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
