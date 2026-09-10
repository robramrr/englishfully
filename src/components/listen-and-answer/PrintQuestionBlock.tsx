'use client';

import type { ListenQuestion } from '@/lib/listen-and-answer/types';
import {
  QUESTION_TYPE_LABELS,
  formatPrintChoiceLine,
  formatQuestionLabel,
  isWriteInQuestionType,
  questionTextHasBlankMarker,
  shouldPrintChoiceList,
  splitQuestionTextWithBlanks,
} from '@/lib/listen-and-answer/types';
import { ListenMetaDivider } from './TotalTimeDisplay';

interface PrintQuestionBlockProps {
  question: ListenQuestion;
  questionIndex: number;
  sequenceStart: number;
}

function PrintQuestionText({
  text,
  expandBlanks,
}: {
  text: string;
  expandBlanks: boolean;
}) {
  if (!expandBlanks || !questionTextHasBlankMarker(text)) {
    return <>{text}</>;
  }

  return (
    <>
      {splitQuestionTextWithBlanks(text).map((part, index) =>
        part.type === 'blank' ? (
          <span
            key={`blank-${index}`}
            className="listen-print-inline-blank"
            style={{ minWidth: `${part.widthCh}ch` }}
            aria-hidden="true"
          >
            &nbsp;
          </span>
        ) : (
          <span key={`text-${index}`}>{part.value}</span>
        )
      )}
    </>
  );
}

export default function PrintQuestionBlock({
  question,
  questionIndex,
  sequenceStart,
}: PrintQuestionBlockProps) {
  const isFillInBlank = question.question_type === 'fill_in_blank';
  const isWriteIn = isWriteInQuestionType(question.question_type);
  const showChoices = shouldPrintChoiceList(question);
  const showAnswerLine =
    question.question_type === 'short_answer' ||
    (isFillInBlank && !questionTextHasBlankMarker(question.question_text));

  return (
    <li
      className={`print-question-block ${
        isWriteIn ? 'print-question-write-in space-y-2' : 'space-y-1.5'
      }`}
    >
      <p
        className={`text-sm font-semibold text-[var(--comic-dark)] ${
          isFillInBlank ? 'leading-[2.15]' : 'leading-snug'
        }`}
      >
        {formatQuestionLabel(questionIndex, sequenceStart)}.{' '}
        <PrintQuestionText text={question.question_text} expandBlanks={isFillInBlank} />
      </p>
      {question.show_question_type ? (
        <p className="listen-print-question-type text-xs text-[var(--comic-secondary)]">
          {QUESTION_TYPE_LABELS[question.question_type]}
        </p>
      ) : null}
      {showChoices ? (
        <div className="listen-print-choices space-y-0.5 text-sm font-normal leading-relaxed pl-1 text-[var(--comic-dark)]">
          {question.choices
            .map((choice, choiceIndex) =>
              formatPrintChoiceLine(question.question_type, choiceIndex, choice)
            )
            .filter((choice) => choice)
            .map((choice) => (
              <div key={choice}>{choice}</div>
            ))}
        </div>
      ) : null}
      {showAnswerLine ? (
        <div
          className={`listen-print-write-in-line${
            question.question_type === 'short_answer' ? ' listen-print-write-in-line-tall' : ''
          }`}
        />
      ) : null}
      <ListenMetaDivider className="mt-3 mb-4" />
    </li>
  );
}
