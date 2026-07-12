'use client';

import ComicText from '../ComicText';
import type { TimeUnit } from '@/lib/listen-and-answer/types';
import { TIME_UNITS } from '@/lib/listen-and-answer/types';

interface TotalTimeFieldsProps {
  totalQuestions: string;
  timeAmount: string;
  timeUnit: TimeUnit;
  onTotalQuestionsChange: (value: string) => void;
  onTimeAmountChange: (value: string) => void;
  onTimeUnitChange: (value: TimeUnit) => void;
  compact?: boolean;
}

export default function TotalTimeFields({
  totalQuestions,
  timeAmount,
  timeUnit,
  onTotalQuestionsChange,
  onTimeAmountChange,
  onTimeUnitChange,
  compact = false,
}: TotalTimeFieldsProps) {
  const labelClassName = compact
    ? 'block font-bold mb-1 text-xs text-[var(--comic-dark)]'
    : 'font-bold mb-1 text-sm';
  const fieldClassName = compact ? 'text-sm' : '';

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        {compact ? (
          <label className={labelClassName}>Total Questions</label>
        ) : (
          <ComicText className={labelClassName}>Total Questions</ComicText>
        )}
        <input
          className={`w-full comic-input ${fieldClassName}`}
          value={totalQuestions}
          onChange={(event) => onTotalQuestionsChange(event.target.value)}
          placeholder="10"
          inputMode="numeric"
        />
      </div>
      <div>
        {compact ? (
          <label className={labelClassName}>Time</label>
        ) : (
          <ComicText className={labelClassName}>Time</ComicText>
        )}
        <div className="flex gap-2">
          <input
            className={`w-full comic-input ${fieldClassName}`}
            value={timeAmount}
            onChange={(event) => onTimeAmountChange(event.target.value)}
            placeholder="30"
            inputMode="numeric"
          />
          <select
            className={`comic-input shrink-0 ${fieldClassName}`}
            value={timeUnit}
            onChange={(event) => onTimeUnitChange(event.target.value as TimeUnit)}
          >
            {TIME_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit === 'minutes' ? 'Minutes' : 'Hours'}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
