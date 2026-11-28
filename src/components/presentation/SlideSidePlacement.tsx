'use client';

import ComicText from '../ComicText';
import EditorInfo from './EditorInfo';

export default function SlideSidePlacement({
  value,
  onChange,
}: {
  value: 'left' | 'right' | undefined;
  onChange: (side: 'left' | 'right') => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <span className="inline-flex items-center gap-2">
        <ComicText className="text-sm font-bold">Placement</ComicText>
        <EditorInfo text="Right puts this in the other column so the left side stays higher." />
      </span>
      {(['left', 'right'] as const).map((side) => {
        const active = (value === 'right' ? 'right' : 'left') === side;
        return (
          <button
            key={side}
            type="button"
            className="border-4 border-[var(--comic-black)] px-3 py-1 text-sm font-black"
            style={
              active
                ? { backgroundColor: 'var(--comic-secondary)', color: '#ffffff' }
                : { backgroundColor: '#ffffff', color: 'var(--comic-dark)' }
            }
            onClick={() => onChange(side)}
          >
            {side === 'left' ? 'Left' : 'Right'}
          </button>
        );
      })}
    </div>
  );
}
