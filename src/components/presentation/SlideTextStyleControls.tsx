'use client';

import ComicText from '../ComicText';
import {
  PRESENTATION_FONT_COLORS,
  PRESENTATION_FONT_SIZES,
  type PresentationFontColor,
  type PresentationFontSize,
} from '@/lib/presentation/types';

interface SlideTextStyleControlsProps {
  fontSize: PresentationFontSize;
  color: PresentationFontColor;
  onFontSizeChange: (size: PresentationFontSize) => void;
  onColorChange: (color: PresentationFontColor) => void;
  sizeLabel?: string;
}

export default function SlideTextStyleControls({
  fontSize,
  color,
  onFontSizeChange,
  onColorChange,
  sizeLabel = 'Font size',
}: SlideTextStyleControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-1">
      <div className="flex flex-wrap items-center gap-2">
        <ComicText className="text-xs font-bold">{sizeLabel}</ComicText>
        <div className="flex gap-1">
          {PRESENTATION_FONT_SIZES.map((option) => {
            const active = fontSize === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onFontSizeChange(option.value)}
                className={[
                  'min-w-[2rem] border-2 border-[var(--comic-black)] px-2 py-0.5 text-xs font-black',
                  active
                    ? 'bg-[var(--comic-secondary)] text-white comic-shadow-sm'
                    : 'bg-white text-[var(--comic-dark)] hover:bg-[var(--comic-light)]',
                ].join(' ')}
                aria-pressed={active}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ComicText className="text-xs font-bold">Color</ComicText>
        <div className="flex gap-1.5">
          {PRESENTATION_FONT_COLORS.map((option) => {
            const active = color === option.value;
            return (
              <button
                key={option.value}
                type="button"
                title={option.label}
                aria-label={option.label}
                aria-pressed={active}
                onClick={() => onColorChange(option.value)}
                className={[
                  'h-7 w-7 border-2 border-[var(--comic-black)]',
                  active ? 'comic-shadow-sm ring-2 ring-[var(--comic-primary)] ring-offset-1' : '',
                ].join(' ')}
                style={{ backgroundColor: option.cssVar }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
