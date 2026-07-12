import ComicText from '../ComicText';
import type { TimeUnit } from '@/lib/listen-and-answer/types';
import { formatTimeLine, formatTotalQuestionsLine } from '@/lib/listen-and-answer/types';

interface TotalTimeDisplayProps {
  totalQuestions: string;
  timeAmount: string;
  timeUnit: TimeUnit;
  className?: string;
}

export function ListenMetaDivider({ className = 'my-1' }: { className?: string }) {
  return <hr className={`border-0 border-t ${className}`} style={{ borderColor: '#cccccc' }} />;
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
  className = 'font-bold',
}: TotalTimeDisplayProps) {
  const totalLine = formatTotalQuestionsLine(totalQuestions);
  const timeLine = formatTimeLine(timeAmount, timeUnit);
  if (!totalLine && !timeLine) return null;

  return (
    <div className="mb-4">
      <ComicText className={className}>
        <span className="inline-flex flex-wrap gap-x-4 gap-y-1">
          {totalLine ? <span>{totalLine}</span> : null}
          {timeLine ? <span>{timeLine}</span> : null}
        </span>
      </ComicText>
      <ListenMetaDivider className="mt-1 mb-0" />
    </div>
  );
}
