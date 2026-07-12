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
}

export default function TotalTimeFields({
  totalQuestions,
  timeAmount,
  timeUnit,
  onTotalQuestionsChange,
  onTimeAmountChange,
  onTimeUnitChange,
}: TotalTimeFieldsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <ComicText className="font-bold mb-1 text-sm">Total Questions</ComicText>
        <input
          className="w-full comic-input"
          value={totalQuestions}
          onChange={(event) => onTotalQuestionsChange(event.target.value)}
          placeholder="10"
          inputMode="numeric"
        />
      </div>
      <div>
        <ComicText className="font-bold mb-1 text-sm">Time</ComicText>
        <div className="flex gap-2">
          <input
            className="w-full comic-input"
            value={timeAmount}
            onChange={(event) => onTimeAmountChange(event.target.value)}
            placeholder="30"
            inputMode="numeric"
          />
          <select
            className="comic-input shrink-0"
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
