import ComicText from '../ComicText';
import type { TimeUnit } from '@/lib/listen-and-answer/types';
import { formatTimeLine, formatTotalQuestionsLine } from '@/lib/listen-and-answer/types';

interface TotalTimeDisplayProps {
  totalQuestions: string;
  timeAmount: string;
  timeUnit: TimeUnit;
  className?: string;
}

export function ListenMetaDivider() {
  return <hr className="border-0 border-t my-1" style={{ borderColor: '#cccccc' }} />;
}

export function hasTotalTimeContent(
  totalQuestions: string,
  timeAmount: string,
  timeUnit: TimeUnit
): boolean {
  return Boolean(formatTotalQuestionsLine(totalQuestions) || formatTimeLine(timeAmount, timeUnit));
}

export default function TotalTimeDisplay({
  totalQuestions,
  timeAmount,
  timeUnit,
  className = 'font-bold mb-4',
}: TotalTimeDisplayProps) {
  const totalLine = formatTotalQuestionsLine(totalQuestions);
  const timeLine = formatTimeLine(timeAmount, timeUnit);
  if (!totalLine && !timeLine) return null;

  return (
    <>
      <ListenMetaDivider />
      <ComicText className={className}>
        <span className="inline-flex flex-wrap gap-x-4 gap-y-1">
          {totalLine ? <span>{totalLine}</span> : null}
          {timeLine ? <span>{timeLine}</span> : null}
        </span>
      </ComicText>
    </>
  );
}
