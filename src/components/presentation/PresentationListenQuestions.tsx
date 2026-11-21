'use client';

import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import SegmentAudioPlayer from '../listen-and-learn/SegmentAudioPlayer';
import { useAudioClipPlayer } from '@/lib/audio/useAudioClipPlayer';
import {
  formatTimestamp,
  parseTimestamp,
  type TranscriptSegmentDraft,
} from '@/lib/listen-and-learn/types';
import SyncedCaptions, { CaptionSwitch } from '../audio/SyncedCaptions';
import { SlideRichText } from './SlideRichText';
import SlideTextStyleControls from './SlideTextStyleControls';
import {
  MAX_LISTEN_QUESTIONS,
  QUIZ_CHOICE_LETTERS,
  createEmptyListenQuestion,
  createEmptyQuizChoice,
  presentationFontColorCss,
  presentationFontSizePx,
  type PresentationFontColor,
  type PresentationFontSize,
  type PresentationListenQuestion,
  type PresentationListenQuestionKind,
  type PresentationSlide,
} from '@/lib/presentation/types';

const REVEAL_GREEN = '#15803d';

function sizeMode(compact: boolean, present: boolean): 'compact' | 'default' | 'present' {
  if (compact) return 'compact';
  if (present) return 'present';
  return 'default';
}

function clipKey(startSeconds: number, endSeconds: number): string {
  const start = Number(Number(startSeconds || 0).toFixed(2));
  const end = Number(Number(endSeconds || 0).toFixed(2));
  return `${start}-${end}`;
}

export function PresentationListenQuestions({
  slide,
  compact = false,
  present = false,
  focusQuestionId = '',
}: {
  slide: PresentationSlide;
  compact?: boolean;
  present?: boolean;
  /** Editor only: show this question while it is being written. */
  focusQuestionId?: string;
}) {
  const questions =
    slide.listenQuestions?.length > 0
      ? slide.listenQuestions
      : [createEmptyListenQuestion()];
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(true);
  const safeIndex = Math.min(Math.max(index, 0), Math.max(questions.length - 1, 0));
  const question = questions[safeIndex] || questions[0];
  const hasClip = Boolean(question.clipEnabled && slide.audioUrl.trim());
  const captionText = question.captionsEnabled ? question.clipText.trim() : '';
  const start = Math.max(0, Number(question.startSeconds) || 0);
  const end = Math.max(start + 0.05, Number(question.endSeconds) || start + 5);
  const mode = sizeMode(compact, present);
  const fontSize = presentationFontSizePx(slide.bodyFontSize, mode);
  const color = presentationFontColorCss(slide.bodyColor);
  const choices = question.choices
    .map((choice, choiceIndex) => ({ ...choice, choiceIndex }))
    .filter((choice) => choice.text.trim());

  const { audioRef, src, playing, progress, currentTime, error, play, stop, seekRatio } = useAudioClipPlayer({
    audioUrl: hasClip ? slide.audioUrl : '',
    startSeconds: start,
    endSeconds: end,
  });

  useEffect(() => {
    setIndex(0);
    setRevealed(false);
    setCaptionsOn(true);
  }, [slide.id]);

  const questionIds = questions.map((item) => item.id).join('|');
  const questionsRef = useRef(questions);
  questionsRef.current = questions;

  useEffect(() => {
    if (!focusQuestionId) return;
    const next = questionsRef.current.findIndex((item) => item.id === focusQuestionId);
    if (next < 0) return;
    setIndex(next);
    setRevealed(false);
  }, [focusQuestionId, questionIds]);

  useEffect(() => {
    setRevealed(false);
  }, [question.id]);

  function goTo(nextIndex: number) {
    stop();
    setRevealed(false);
    setIndex(nextIndex);
  }

  function handleSeek(event: MouseEvent<HTMLDivElement>) {
    if (!hasClip) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    seekRatio(ratio);
  }

  return (
    <div className={['flex h-full min-h-0 flex-col gap-3', compact ? 'gap-2' : ''].join(' ')}>
      <audio ref={audioRef} src={src || undefined} preload="auto" />

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <ComicText
          className={[
            'font-black text-[var(--comic-dark)]',
            compact ? 'text-xs' : present ? 'text-xl' : 'text-base',
          ].join(' ')}
        >
          Question {safeIndex + 1} / {questions.length}
        </ComicText>
        {questions.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            <ComicButton
              type="button"
              variant="accent"
              size="sm"
              disabled={safeIndex <= 0}
              onClick={() => goTo(Math.max(0, safeIndex - 1))}
            >
              ← Prev
            </ComicButton>
            <ComicButton
              type="button"
              variant="accent"
              size="sm"
              disabled={safeIndex >= questions.length - 1}
              onClick={() => goTo(Math.min(questions.length - 1, safeIndex + 1))}
            >
              Next →
            </ComicButton>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-auto">
        <p className="text-left font-black leading-snug" style={{ fontSize: `${fontSize}px`, color }}>
          {question.prompt.trim() ? (
            <SlideRichText text={question.prompt.trim()} />
          ) : (
            <span className="opacity-60">Write the question in the editor</span>
          )}
        </p>

        {question.kind === 'choices' ? (
          choices.length > 0 ? (
            <div className="flex w-full flex-col items-stretch gap-2">
              {choices.map((choice) => {
                const letter = QUIZ_CHOICE_LETTERS[choice.choiceIndex] || '';
                const isCorrect = revealed && choice.choiceIndex === question.correctIndex;
                return (
                  <div
                    key={choice.id}
                    className="flex w-full items-start gap-[0.55em] text-left font-bold"
                    style={{
                      fontSize: `${fontSize}px`,
                      color,
                      lineHeight: 1.25,
                      boxSizing: 'border-box',
                      borderStyle: 'solid',
                      borderWidth: isCorrect ? (compact ? 4 : present ? 8 : 6) : 0,
                      borderColor: REVEAL_GREEN,
                      backgroundColor: isCorrect ? 'color-mix(in srgb, #15803d 12%, white)' : 'transparent',
                      padding: isCorrect ? (compact ? '2px 6px' : '6px 12px') : 0,
                    }}
                  >
                    <span className="shrink-0 font-black leading-[1.25]" style={{ color: isCorrect ? REVEAL_GREEN : color }}>
                      {letter}
                    </span>
                    <span className="min-w-0 flex-1 leading-[1.25]">
                      <SlideRichText text={choice.text.trim()} />
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <ComicText className="font-bold text-[var(--comic-dark)]/60">Add choices in the editor.</ComicText>
          )
        ) : revealed ? (
          <div
            className="border-4 px-4 py-3 font-black leading-snug"
            style={{
              borderColor: REVEAL_GREEN,
              color: REVEAL_GREEN,
              fontSize: `${fontSize}px`,
              backgroundColor: 'color-mix(in srgb, #15803d 12%, white)',
            }}
          >
            {question.answer.trim() ? (
              <SlideRichText text={question.answer.trim()} />
            ) : (
              <span className="opacity-70">No answer written yet</span>
            )}
          </div>
        ) : null}
      </div>

      <div
        className={[
          'shrink-0 space-y-2 rounded-lg border-4 border-[var(--comic-black)] bg-white/90 comic-shadow-sm',
          compact ? 'p-2' : 'p-3',
        ].join(' ')}
      >
        <div className="flex flex-wrap items-center gap-2">
          {question.clipEnabled ? (
            <ComicButton
              type="button"
              variant="secondary"
              size="sm"
              disabled={!hasClip || playing}
              onClick={() => void play()}
            >
              {playing ? 'Playing…' : 'Play'}
            </ComicButton>
          ) : null}
          {playing ? (
            <ComicButton type="button" variant="accent" size="sm" onClick={stop}>
              Stop
            </ComicButton>
          ) : null}
          {captionText ? (
            <CaptionSwitch checked={captionsOn} onChange={setCaptionsOn} />
          ) : null}
          <ComicButton
            type="button"
            variant={revealed ? 'warning' : 'success'}
            size="sm"
            onClick={() => setRevealed((current) => !current)}
          >
            {revealed ? 'Hide answer' : 'Reveal answer'}
          </ComicButton>
          {question.clipEnabled && !slide.audioUrl.trim() ? (
            <ComicText className="text-sm font-bold text-[var(--comic-dark)]/60">
              Add an audio URL for this clip
            </ComicText>
          ) : null}
        </div>
        {captionsOn && playing && captionText ? (
          <SyncedCaptions
            text={captionText}
            start={start}
            end={end}
            currentTime={currentTime}
            words={question.captionWords}
            present={present}
          />
        ) : null}
        {hasClip ? (
          <div
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            aria-label="Audio clip progress"
            className="h-3 w-full cursor-pointer rounded-full border-2 border-[var(--comic-black)] bg-[var(--comic-light)]"
            onClick={handleSeek}
          >
            <div
              className="h-full rounded-full bg-[var(--comic-primary)]"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        ) : null}
        {error ? (
          <ComicText className="text-sm font-bold text-[var(--comic-danger)]">{error}</ComicText>
        ) : null}
      </div>
    </div>
  );
}

export function ListenQuestionEditor({
  slide,
  onChange,
  onActiveQuestionId,
}: {
  slide: PresentationSlide;
  onChange: (patch: Partial<PresentationSlide>) => void;
  onActiveQuestionId?: (questionId: string) => void;
}) {
  const questions = useMemo(
    () =>
      slide.listenQuestions?.length > 0
        ? slide.listenQuestions
        : [createEmptyListenQuestion()],
    [slide.listenQuestions]
  );
  const [activeId, setActiveId] = useState(questions[0]?.id || '');
  const [segments, setSegments] = useState<TranscriptSegmentDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const active =
    questions.find((question) => question.id === activeId) || questions[0] || createEmptyListenQuestion();

  useEffect(() => {
    if (questions.some((question) => question.id === activeId)) return;
    setActiveId(questions[0]?.id || '');
  }, [activeId, questions]);

  useEffect(() => {
    if (active.id) onActiveQuestionId?.(active.id);
  }, [active.id, onActiveQuestionId]);

  function commit(next: PresentationListenQuestion[]) {
    onChange({ listenQuestions: next });
  }

  function updateActive(patch: Partial<PresentationListenQuestion>) {
    commit(
      questions.map((question) =>
        question.id === active.id
          ? createEmptyListenQuestion({ ...question, ...patch, id: question.id })
          : question
      )
    );
  }

  function updateChoices(nextChoices: PresentationListenQuestion['choices'], correctIndex = active.correctIndex) {
    updateActive({
      choices: nextChoices,
      correctIndex: Math.min(Math.max(0, correctIndex), Math.max(0, nextChoices.length - 1)),
    });
  }

  function handleAddQuestion() {
    if (questions.length >= MAX_LISTEN_QUESTIONS) return;
    const nextQuestion = createEmptyListenQuestion();
    commit([...questions, nextQuestion]);
    setActiveId(nextQuestion.id);
  }

  function handleRemoveQuestion(questionId: string) {
    if (questions.length <= 1) return;
    const next = questions.filter((question) => question.id !== questionId);
    commit(next);
    setActiveId(next[0]?.id || '');
  }

  async function handleTranscribe() {
    if (!slide.audioUrl.trim()) {
      setError('Enter an audio URL before auto-transcribing.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/listen-and-learn/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_url: slide.audioUrl.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to process transcript');
      const nextSegments = (data.segments || []) as TranscriptSegmentDraft[];
      setSegments(nextSegments);
      onChange({ audioTranscript: String(data.transcript || '') });
      setMessage(
        `Created ${nextSegments.length} clip${nextSegments.length === 1 ? '' : 's'}. Assign one to a question, or leave it with no clip.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process transcript');
    } finally {
      setBusy(false);
    }
  }

  function selectSegment(segment: TranscriptSegmentDraft) {
    updateActive({
      clipEnabled: true,
      startSeconds: Number(segment.start_seconds) || 0,
      endSeconds: Number(segment.end_seconds) || 5,
      clipText: String(segment.sentence_text || ''),
      captionWords: segment.words || [],
    });
  }

  const selectedKey = clipKey(active.startSeconds, active.endSeconds);

  return (
    <div className="space-y-3 border-4 border-[var(--comic-black)] bg-[var(--comic-light)]/40 p-4">
      <div>
        <ComicText className="font-black">Listening questions</ComicText>
        <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
          One audio file for every question on this slide. Each question is either choices or a
          single answer, and it can play one clip. Turn on captions when students should be able
          to read that clip. While presenting, ask it, play the clip if you want, open captions,
          then reveal the answer.
        </ComicText>
      </div>

      <label className="block space-y-1">
        <ComicText className="text-sm font-bold">Audio URL</ComicText>
        <input
          className="comic-input w-full"
          value={slide.audioUrl}
          onChange={(event) => onChange({ audioUrl: event.target.value.trim() })}
          placeholder="https://…"
        />
      </label>

      <ComicButton
        type="button"
        variant="secondary"
        size="sm"
        disabled={busy || !slide.audioUrl.trim()}
        onClick={() => void handleTranscribe()}
      >
        {busy ? 'Transcribing…' : 'Auto-transcribe & make clips'}
      </ComicButton>

      {error ? (
        <ComicText className="text-sm font-bold text-[var(--comic-danger)]">{error}</ComicText>
      ) : null}
      {message ? (
        <ComicText className="text-sm font-bold text-[var(--comic-success)]">{message}</ComicText>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {questions.map((question, questionIndex) => {
          const selected = question.id === active.id;
          return (
            <button
              key={question.id}
              type="button"
              onClick={() => setActiveId(question.id)}
              className={[
                'border-2 border-[var(--comic-black)] px-3 py-1 text-sm font-black',
                selected
                  ? 'bg-[var(--comic-secondary)] text-white'
                  : 'bg-white text-[var(--comic-dark)]',
              ].join(' ')}
            >
              Q{questionIndex + 1}
              {question.clipEnabled ? ' · clip' : ''}
            </button>
          );
        })}
        {questions.length < MAX_LISTEN_QUESTIONS ? (
          <ComicButton type="button" variant="accent" size="sm" onClick={handleAddQuestion}>
            + Add question
          </ComicButton>
        ) : null}
      </div>

      <div className="space-y-3 rounded-md border-2 border-[var(--comic-black)] bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ComicText className="font-black">
            Editing question {Math.max(1, questions.findIndex((item) => item.id === active.id) + 1)}
          </ComicText>
          {questions.length > 1 ? (
            <ComicButton
              type="button"
              variant="danger"
              size="sm"
              onClick={() => handleRemoveQuestion(active.id)}
            >
              Remove question
            </ComicButton>
          ) : null}
        </div>

        <label className="block space-y-1">
          <ComicText className="text-sm font-bold">Question</ComicText>
          <textarea
            className="comic-textarea w-full min-h-[80px]"
            value={active.prompt}
            onChange={(event) => updateActive({ prompt: event.target.value })}
            placeholder="What did the speaker buy?"
          />
        </label>

        <div className="space-y-2">
          <ComicText className="text-sm font-bold">Answer type</ComicText>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['choices', 'Choices'],
                ['answer', 'Answer'],
              ] as const
            ).map(([kind, label]) => {
              const selected = active.kind === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  className="border-4 border-[var(--comic-black)] px-3 py-1 text-sm font-black"
                  style={
                    selected
                      ? { backgroundColor: 'var(--comic-secondary)', color: '#ffffff' }
                      : { backgroundColor: '#ffffff', color: 'var(--comic-dark)' }
                  }
                  onClick={() => updateActive({ kind: kind as PresentationListenQuestionKind })}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
            {active.kind === 'choices'
              ? 'The class sees the question and the choices, with nothing marked. Reveal highlights the correct letter.'
              : 'The class sees only the question. Reveal shows the answer.'}
          </ComicText>
        </div>

        {active.kind === 'choices' ? (
          <div className="space-y-2">
            {active.choices.map((choice, choiceIndex) => {
              const letter = QUIZ_CHOICE_LETTERS[choiceIndex] || '';
              const correct = choiceIndex === active.correctIndex;
              return (
                <div key={choice.id} className="flex items-center gap-2">
                  <span className="w-6 shrink-0 font-bungee text-[var(--comic-primary)]">{letter}</span>
                  <input
                    className="comic-input min-w-0 flex-1"
                    value={choice.text}
                    onChange={(event) => {
                      const text = event.target.value;
                      updateChoices(
                        active.choices.map((item) =>
                          item.id === choice.id ? { ...item, text } : item
                        )
                      );
                    }}
                    placeholder="Choice text"
                  />
                  <button
                    type="button"
                    className="shrink-0 border-4 border-[var(--comic-black)] px-2 py-1 text-sm font-black"
                    style={
                      correct
                        ? { backgroundColor: REVEAL_GREEN, color: '#ffffff' }
                        : { backgroundColor: '#ffffff', color: 'var(--comic-dark)' }
                    }
                    onClick={() => updateActive({ correctIndex: choiceIndex })}
                  >
                    {correct ? 'Correct' : 'Mark correct'}
                  </button>
                  {active.choices.length > 2 ? (
                    <button
                      type="button"
                      className="shrink-0 text-sm font-bold text-[var(--comic-primary)] underline-offset-2 hover:underline"
                      onClick={() => {
                        const next = active.choices.filter((item) => item.id !== choice.id);
                        let correctIndex = active.correctIndex;
                        if (correctIndex === choiceIndex) correctIndex = 0;
                        else if (correctIndex > choiceIndex) correctIndex -= 1;
                        updateChoices(next, correctIndex);
                      }}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              );
            })}
            {active.choices.length < QUIZ_CHOICE_LETTERS.length ? (
              <ComicButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => updateChoices([...active.choices, createEmptyQuizChoice()])}
              >
                + Add choice
              </ComicButton>
            ) : null}
          </div>
        ) : (
          <label className="block space-y-1">
            <ComicText className="text-sm font-bold">Answer</ComicText>
            <input
              className="comic-input w-full"
              value={active.answer}
              onChange={(event) => updateActive({ answer: event.target.value })}
              placeholder="The answer you will reveal"
            />
          </label>
        )}

        <label className="flex cursor-pointer items-start gap-2 font-bold">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 accent-[var(--comic-primary)]"
            checked={active.clipEnabled}
            onChange={(event) => updateActive({ clipEnabled: event.target.checked })}
          />
          <span>
            <span className="block">Play a clip with this question</span>
            <span className="block text-sm font-bold text-[var(--comic-dark)]">
              Leave this off when the question does not need audio. Playing the clip does not
              reveal the answer.
            </span>
          </span>
        </label>

        {active.clipEnabled ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <ComicText className="text-sm font-bold">Clip start</ComicText>
                <input
                  className="comic-input w-full"
                  value={formatTimestamp(active.startSeconds)}
                  onChange={(event) =>
                    updateActive({ startSeconds: parseTimestamp(event.target.value) })
                  }
                  placeholder="0:00.0"
                />
              </label>
              <label className="block space-y-1">
                <ComicText className="text-sm font-bold">Clip end</ComicText>
                <input
                  className="comic-input w-full"
                  value={formatTimestamp(active.endSeconds)}
                  onChange={(event) =>
                    updateActive({ endSeconds: parseTimestamp(event.target.value) })
                  }
                  placeholder="0:05.0"
                />
              </label>
            </div>
            <label className="flex cursor-pointer items-start gap-2 font-bold">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 accent-[var(--comic-primary)]"
                checked={active.captionsEnabled}
                onChange={(event) => updateActive({ captionsEnabled: event.target.checked })}
              />
              <span>
                <span className="block">Captions</span>
                <span className="block text-sm font-bold text-[var(--comic-dark)]">
                  Switch Captions on, then press Play. The words follow the audio and stay hidden until the clip is playing.
                </span>
              </span>
            </label>
            {active.captionsEnabled ? (
              <label className="block space-y-1">
                <ComicText className="text-sm font-bold">Caption</ComicText>
                <textarea
                  className="comic-textarea w-full min-h-[72px]"
                  value={active.clipText}
                  onChange={(event) => updateActive({ clipText: event.target.value })}
                  placeholder="The words students read when they open captions"
                />
              </label>
            ) : active.clipText ? (
              <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                Selected clip: {active.clipText}
              </ComicText>
            ) : null}
            {slide.audioUrl.trim() ? (
              <SegmentAudioPlayer
                audioUrl={slide.audioUrl}
                startSeconds={active.startSeconds}
                endSeconds={active.endSeconds}
                compact
                label="Preview clip"
              />
            ) : null}
          </>
        ) : null}
      </div>

      {segments.length > 0 ? (
        <div className="space-y-2">
          <ComicText className="text-sm font-black">
            Clip for question {Math.max(1, questions.findIndex((item) => item.id === active.id) + 1)}
          </ComicText>
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border-2 border-[var(--comic-black)] bg-white p-2">
            <label
              className={[
                'flex cursor-pointer items-start gap-2 rounded-md border-2 p-2',
                !active.clipEnabled
                  ? 'border-[var(--comic-primary)] bg-[var(--comic-primary)]/10'
                  : 'border-[var(--comic-black)]/30',
              ].join(' ')}
            >
              <input
                type="radio"
                name={`listen-clip-${slide.id}-${active.id}`}
                className="mt-1"
                checked={!active.clipEnabled}
                onChange={() => updateActive({ clipEnabled: false })}
              />
              <span className="font-bold text-[var(--comic-dark)]">No clip</span>
            </label>
            {segments.map((segment, segmentIndex) => {
              const key = clipKey(Number(segment.start_seconds) || 0, Number(segment.end_seconds) || 0);
              const selected = active.clipEnabled && key === selectedKey;
              return (
                <label
                  key={`${segmentIndex}-${key}`}
                  className={[
                    'flex cursor-pointer items-start gap-2 rounded-md border-2 p-2',
                    selected
                      ? 'border-[var(--comic-primary)] bg-[var(--comic-primary)]/10'
                      : 'border-[var(--comic-black)]/30',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name={`listen-clip-${slide.id}-${active.id}`}
                    className="mt-1"
                    checked={selected}
                    onChange={() => selectSegment(segment)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-[var(--comic-dark)]">
                      {segment.sentence_text || `Clip ${segmentIndex + 1}`}
                    </span>
                    <span className="block text-xs font-bold text-[var(--comic-dark)]/70">
                      {formatTimestamp(segment.start_seconds)} → {formatTimestamp(segment.end_seconds)}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

      {slide.audioTranscript.trim() ? (
        <label className="block space-y-1">
          <ComicText className="text-sm font-bold">Transcript (reference)</ComicText>
          <textarea
            className="comic-textarea w-full min-h-[80px]"
            value={slide.audioTranscript}
            onChange={(event) => onChange({ audioTranscript: event.target.value })}
          />
        </label>
      ) : null}

      <SlideTextStyleControls
        fontSize={slide.bodyFontSize}
        color={slide.bodyColor}
        onFontSizeChange={(bodyFontSize: PresentationFontSize) => onChange({ bodyFontSize })}
        onColorChange={(bodyColor: PresentationFontColor) => onChange({ bodyColor })}
      />
    </div>
  );
}
