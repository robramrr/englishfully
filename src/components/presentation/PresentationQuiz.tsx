'use client';

import { useEffect, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import SlideTextStyleControls from './SlideTextStyleControls';
import {
  QUIZ_CHOICE_LETTERS,
  createEmptyQuizChoice,
  presentationFontColorCss,
  presentationFontSizePx,
  type PresentationSlide,
} from '@/lib/presentation/types';

function sizeMode(compact: boolean, present: boolean): 'compact' | 'default' | 'present' {
  if (compact) return 'compact';
  if (present) return 'present';
  return 'default';
}

export function PresentationQuiz({
  slide,
  compact = false,
  present = false,
}: {
  slide: PresentationSlide;
  compact?: boolean;
  present?: boolean;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const choices = (slide.quizChoices || [])
    .map((choice, index) => ({ ...choice, index }))
    .filter((choice) => choice.text.trim());

  useEffect(() => {
    setPicked(null);
  }, [slide.id]);

  if (!slide.quizEnabled || choices.length === 0) return null;

  const mode = sizeMode(compact, present);
  const fontSize = presentationFontSizePx(slide.quizFontSize, mode);
  const color = presentationFontColorCss(slide.quizColor);
  const prompt = slide.quizPrompt.trim();
  const pickedBorder = compact ? 6 : present ? 16 : 12;

  return (
    <div className="relative z-[2] flex w-full shrink-0 flex-col items-stretch gap-1.5">
      {prompt ? (
        <p className="text-left font-black leading-snug" style={{ fontSize: `${fontSize}px`, color }}>
          {prompt}
        </p>
      ) : null}
      <div className="flex w-full flex-col items-stretch gap-2">
        {choices.map((choice) => {
          const letter = QUIZ_CHOICE_LETTERS[choice.index] || '';
          const isCorrect = choice.index === slide.quizCorrectIndex;
          const isPicked = picked === choice.index;
          return (
            <button
              key={choice.id}
              type="button"
              className="flex w-full items-start gap-[0.55em] bg-transparent text-left font-bold"
              style={{
                fontSize: `${fontSize}px`,
                color,
                lineHeight: 1.25,
                boxSizing: 'border-box',
                borderStyle: 'solid',
                borderWidth: isPicked ? pickedBorder : 0,
                borderColor: isCorrect ? '#1f8a4c' : '#ea1225',
                padding: isPicked ? (compact ? '2px 6px' : present ? '6px 12px' : '4px 10px') : 0,
              }}
              aria-label={`${letter}. ${choice.text}`}
              onClick={(event) => {
                event.stopPropagation();
                setPicked((current) => (current === choice.index ? null : choice.index));
              }}
            >
              <span className="shrink-0 font-black leading-[1.25]">{letter}</span>
              <span className="min-w-0 flex-1 leading-[1.25]">{choice.text.trim()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function QuizEditor({
  slide,
  onChange,
}: {
  slide: PresentationSlide;
  onChange: (patch: Partial<PresentationSlide>) => void;
}) {
  const choices = slide.quizChoices?.length
    ? slide.quizChoices
    : [createEmptyQuizChoice(), createEmptyQuizChoice()];

  function updateChoices(next: PresentationSlide['quizChoices'], correctIndex = slide.quizCorrectIndex) {
    onChange({
      quizChoices: next,
      quizCorrectIndex: Math.min(Math.max(0, correctIndex), Math.max(0, next.length - 1)),
    });
  }

  return (
    <div className="space-y-3 border-4 border-[var(--comic-black)] bg-[var(--comic-light)]/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <ComicText className="font-black">Multiple choice</ComicText>
          <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
            Add choices to this slide. Mark the correct one. While presenting, click a choice to
            check it.
          </ComicText>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 font-bold">
          <span className="text-sm">{slide.quizEnabled ? 'On' : 'Off'}</span>
          <input
            type="checkbox"
            className="h-5 w-9 accent-[var(--comic-primary)]"
            checked={Boolean(slide.quizEnabled)}
            onChange={(event) => onChange({ quizEnabled: event.target.checked })}
          />
        </label>
      </div>

      {slide.quizEnabled ? (
        <>
          <label className="block space-y-1">
            <ComicText className="text-sm font-bold">Question (optional)</ComicText>
            <input
              className="comic-input w-full"
              value={slide.quizPrompt}
              onChange={(event) => onChange({ quizPrompt: event.target.value })}
              placeholder="Leave blank if the slide already asks the question"
            />
          </label>
          <div className="space-y-2">
            {choices.map((choice, index) => {
              const letter = QUIZ_CHOICE_LETTERS[index] || '';
              const correct = index === slide.quizCorrectIndex;
              return (
                <div key={choice.id} className="flex items-center gap-2">
                  <span className="w-6 shrink-0 font-bungee text-[var(--comic-primary)]">{letter}</span>
                  <input
                    className="comic-input min-w-0 flex-1"
                    value={choice.text}
                    onChange={(event) => {
                      const text = event.target.value;
                      updateChoices(
                        choices.map((item) => (item.id === choice.id ? { ...item, text } : item))
                      );
                    }}
                    placeholder={index === 0 ? 'was' : 'were'}
                  />
                  <button
                    type="button"
                    className="shrink-0 border-4 border-[var(--comic-black)] px-2 py-1 text-sm font-black"
                    style={
                      correct
                        ? { backgroundColor: '#1f8a4c', color: '#ffffff' }
                        : { backgroundColor: '#ffffff', color: 'var(--comic-dark)' }
                    }
                    onClick={() => onChange({ quizCorrectIndex: index })}
                  >
                    {correct ? 'Correct' : 'Mark correct'}
                  </button>
                  {choices.length > 2 ? (
                    <button
                      type="button"
                      className="shrink-0 text-sm font-bold text-[var(--comic-primary)] underline-offset-2 hover:underline"
                      onClick={() => {
                        const next = choices.filter((item) => item.id !== choice.id);
                        let correctIndex = slide.quizCorrectIndex;
                        if (correctIndex === index) correctIndex = 0;
                        else if (correctIndex > index) correctIndex -= 1;
                        updateChoices(next, correctIndex);
                      }}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
          {choices.length < QUIZ_CHOICE_LETTERS.length ? (
            <ComicButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => updateChoices([...choices, createEmptyQuizChoice()])}
            >
              + Add choice
            </ComicButton>
          ) : null}
          <SlideTextStyleControls
            fontSize={slide.quizFontSize}
            color={slide.quizColor}
            onFontSizeChange={(quizFontSize) => onChange({ quizFontSize })}
            onColorChange={(quizColor) => onChange({ quizColor })}
          />
        </>
      ) : null}
    </div>
  );
}
