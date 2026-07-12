import type { TimeUnit } from '@/lib/listen-and-answer/types';
import { formatTimeLine, formatTotalQuestionsLine } from '@/lib/listen-and-answer/types';

interface TotalTimeDisplayProps {
  totalQuestions: string;
  timeAmount: string;
  timeUnit: TimeUnit;
  className?: string;
  variant?: 'assignment' | 'part';
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
  className,
  variant = 'assignment',
}: TotalTimeDisplayProps) {
  const totalLine = formatTotalQuestionsLine(totalQuestions);
  const timeLine = formatTimeLine(timeAmount, timeUnit);
  if (!totalLine && !timeLine) return null;

  const textClassName =
    className ??
    (variant === 'part' ? 'text-sm leading-relaxed' : 'text-sm font-bold leading-relaxed');

  const content = (
    <span className="inline-flex flex-wrap gap-x-4 gap-y-1">
      {totalLine ? <span>{totalLine}</span> : null}
      {timeLine ? <span>{timeLine}</span> : null}
    </span>
  );

  return (
    <div className={variant === 'part' ? 'mb-3' : 'mb-4'}>
      {variant === 'part' ? (
        <p className="text-sm leading-relaxed text-[var(--comic-dark)]">{content}</p>
      ) : (
        <p className={`${textClassName} text-[var(--comic-dark)]`}>{content}</p>
      )}
      <ListenMetaDivider className="mt-1 mb-0" />
    </div>
  );
}
