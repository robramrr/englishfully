'use client';

import { useEffect, useMemo, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import SegmentAudioPlayer from './SegmentAudioPlayer';
import type { PublicLearnAssignment, LearnSubmission } from '@/lib/listen-and-learn/types';
import { stripChoiceLetterPrefix } from '@/lib/listen-and-learn/types';
import {
  STUDENT_LETTER_OPTIONS,
  getDefaultEntryConfig,
  sortSpeakClassOptions,
} from '@/lib/speak-and-submit/types';

interface StudentAssessmentProps {
  assignmentId: string;
}

type Step = 'loading' | 'identity' | 'assessment' | 'result' | 'error';

function formatStudentNumber(number: string, letter: string): string {
  return letter ? `${number}${letter.toUpperCase()}` : number;
}

export default function StudentAssessment({ assignmentId }: StudentAssessmentProps) {
  const [step, setStep] = useState<Step>('loading');
  const [assignment, setAssignment] = useState<PublicLearnAssignment | null>(null);
  const [error, setError] = useState('');
  const [nickname, setNickname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [studentLetter, setStudentLetter] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [manualClassNumber, setManualClassNumber] = useState('');
  const [resolvedStudentName, setResolvedStudentName] = useState('');
  const [resolvedStudentNumber, setResolvedStudentNumber] = useState('');
  const [resolvedClassNumber, setResolvedClassNumber] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [checkingIdentity, setCheckingIdentity] = useState(false);
  const [result, setResult] = useState<LearnSubmission | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/listen-and-learn/public/${assignmentId}`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        if (!data.assignment) {
          setError(data.error || 'This assessment could not be found.');
          setStep('error');
          return;
        }
        const nextAssignment = {
          ...data.assignment,
          entry_config: data.assignment.entry_config ?? getDefaultEntryConfig(),
        } as PublicLearnAssignment;
        setAssignment(nextAssignment);
        const classes = sortSpeakClassOptions(nextAssignment.entry_config.classes);
        if (classes.length > 0) {
          setSelectedClassId(classes[0].id);
        } else if (nextAssignment.class_name) {
          setManualClassNumber(nextAssignment.class_name);
        }
        setAttemptsRemaining(data.attempts_remaining ?? nextAssignment.attempts_allowed);
        setStep('identity');
      })
      .catch(() => {
        setError('Failed to load assessment.');
        setStep('error');
      });
  }, [assignmentId]);

  const questions = useMemo(() => assignment?.questions ?? [], [assignment]);
  const entryConfig = assignment?.entry_config ?? getDefaultEntryConfig();
  const sortedClasses = useMemo(
    () => sortSpeakClassOptions(entryConfig.classes),
    [entryConfig.classes]
  );
  const usesClassDropdown = sortedClasses.length > 0;
  const usesStudentLetter = entryConfig.student_letter_enabled;
  const selectedClass = useMemo(
    () => sortedClasses.find((item) => item.id === selectedClassId) ?? null,
    [sortedClasses, selectedClassId]
  );
  const maxStudentNumber = selectedClass?.max_student_number ?? 35;
  const studentNumberOptions = useMemo(
    () => Array.from({ length: maxStudentNumber }, (_, index) => String(index + 1)),
    [maxStudentNumber]
  );

  async function handleStart() {
    if (!assignment) return;
    setError('');

    const resolvedName =
      entryConfig.name_mode === 'first_last'
        ? `${firstName.trim()} ${lastName.trim()}`.trim()
        : nickname.trim();

    const resolvedClass = usesClassDropdown
      ? selectedClass?.label ?? ''
      : manualClassNumber.trim();

    if (entryConfig.name_mode === 'first_last') {
      if (!firstName.trim() || !lastName.trim()) {
        setError('Please enter your first and last name.');
        return;
      }
    } else if (!nickname.trim()) {
      setError('Please enter your nickname.');
      return;
    }

    if (!studentNumber) {
      setError('Please select your student number.');
      return;
    }

    if (usesStudentLetter && !studentLetter) {
      setError('Please select your student ID (A or B).');
      return;
    }

    if (!resolvedClass) {
      setError(usesClassDropdown ? 'Please select your class.' : 'Please enter your class.');
      return;
    }

    const formattedNumber = formatStudentNumber(studentNumber, studentLetter);
    setCheckingIdentity(true);

    try {
      const params = new URLSearchParams({
        student_number: formattedNumber,
        class_number: resolvedClass,
      });
      const response = await fetch(
        `/api/listen-and-learn/public/${assignmentId}?${params.toString()}`,
        { cache: 'no-store' }
      );
      const data = await response.json();
      if (!response.ok || !data.assignment) {
        setError(data.error || 'Could not start assessment.');
        return;
      }
      if ((data.attempts_remaining ?? 0) <= 0) {
        setError('No attempts remaining for this assessment.');
        return;
      }

      setAssignment({
        ...data.assignment,
        entry_config: data.assignment.entry_config ?? entryConfig,
      });
      setResolvedStudentName(resolvedName);
      setResolvedStudentNumber(formattedNumber);
      setResolvedClassNumber(resolvedClass);
      setAttemptsRemaining(data.attempts_remaining);
      setAnswers({});
      setStartedAt(Date.now());
      setStep('assessment');
    } catch {
      setError('Could not start assessment.');
    } finally {
      setCheckingIdentity(false);
    }
  }

  async function handleSubmit() {
    if (!assignment) return;
    setSubmitting(true);
    setError('');
    try {
      const durationSeconds =
        startedAt !== null ? Math.round((Date.now() - startedAt) / 1000) : undefined;
      const response = await fetch(`/api/listen-and-learn/public/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: resolvedStudentName,
          student_number: resolvedStudentNumber,
          class_number: resolvedClassNumber,
          duration_seconds: durationSeconds,
          answers: questions.map((question) => ({
            question_id: question.id,
            selected_answer: answers[question.id] || '',
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit');
      setResult(data.submission);
      setAttemptsRemaining((current) => Math.max(0, current - 1));
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 'loading') {
    return (
      <ComicCard className="text-center">
        <ComicText className="text-[var(--comic-dark)] font-bold">Loading assessment…</ComicText>
      </ComicCard>
    );
  }

  if (step === 'error' || !assignment) {
    return (
      <ComicCard className="text-center">
        <ComicTitle level={3} className="mb-4 text-[var(--comic-danger)]">
          Assessment unavailable
        </ComicTitle>
        <ComicText className="text-[var(--comic-dark)] font-bold">{error}</ComicText>
      </ComicCard>
    );
  }

  if (step === 'result' && result) {
    const passed = result.percent >= assignment.passing_score;
    return (
      <ComicCard className="text-center space-y-4">
        <ComicTitle level={2} className="text-[var(--comic-primary)]">
          Assessment complete
        </ComicTitle>
        <ComicText className="text-[var(--comic-dark)] font-bold text-xl">
          Score: {result.score}/{result.max_score} ({result.percent.toFixed(0)}%)
        </ComicText>
        <ComicText
          className={`font-black text-lg ${
            passed ? 'text-[var(--comic-success)]' : 'text-[var(--comic-danger)]'
          }`}
        >
          {passed ? 'Passed' : 'Not passed'} · Passing score {assignment.passing_score}%
        </ComicText>
        <ComicText className="text-[var(--comic-dark)] font-bold">
          Attempt {result.attempt_number} ·{' '}
          {attemptsRemaining > 0
            ? `${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining`
            : 'No attempts remaining'}
        </ComicText>
        {attemptsRemaining > 0 ? (
          <ComicButton variant="secondary" size="sm" onClick={() => setStep('identity')}>
            Try again
          </ComicButton>
        ) : null}
      </ComicCard>
    );
  }

  if (step === 'identity') {
    return (
      <ComicCard className="space-y-4 max-w-xl mx-auto">
        <ComicTitle level={3} className="text-[var(--comic-primary)] text-center">
          {assignment.title}
        </ComicTitle>
        {assignment.thumbnail_url?.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={assignment.thumbnail_url.trim()}
            alt=""
            className="w-full max-h-56 object-cover comic-border rounded-lg"
          />
        ) : null}
        <ComicText className="text-[var(--comic-dark)] font-bold text-center">
          {assignment.teacher_name ? `Teacher: ${assignment.teacher_name}` : null}
          {assignment.class_name ? ` · ${assignment.class_name}` : null}
        </ComicText>
        <ComicText className="text-[var(--comic-dark)] font-bold text-sm text-center">
          {questions.length} question{questions.length === 1 ? '' : 's'} ·{' '}
          {assignment.attempts_allowed} attempt
          {assignment.attempts_allowed === 1 ? '' : 's'} allowed
        </ComicText>

        <ComicTitle level={6} className="speak-identity-title text-[var(--comic-primary)] text-center">
          👋 Who are you?
        </ComicTitle>

        <div className="space-y-4">
          {entryConfig.name_mode === 'first_last' ? (
            <>
              <input
                className="w-full comic-input text-lg py-4"
                placeholder="First name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                autoComplete="given-name"
                required
              />
              <input
                className="w-full comic-input text-lg py-4"
                placeholder="Last name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                autoComplete="family-name"
                required
              />
            </>
          ) : (
            <input
              className="w-full comic-input text-lg py-4"
              placeholder="Nickname"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              autoComplete="nickname"
              required
            />
          )}

          {usesClassDropdown ? (
            <select
              className="w-full comic-input text-lg py-4"
              value={selectedClassId}
              onChange={(event) => setSelectedClassId(event.target.value)}
              required
            >
              <option value="">Select class</option>
              {sortedClasses.map((classOption) => (
                <option key={classOption.id} value={classOption.id}>
                  {classOption.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="w-full comic-input text-lg py-4"
              placeholder="Class"
              value={manualClassNumber}
              onChange={(event) => setManualClassNumber(event.target.value)}
              required
            />
          )}

          <div className={`grid gap-3 ${usesStudentLetter ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <select
              className="w-full comic-input text-lg py-4"
              value={studentNumber}
              onChange={(event) => setStudentNumber(event.target.value)}
              required
            >
              <option value="">#</option>
              {studentNumberOptions.map((number) => (
                <option key={number} value={number}>
                  {number}
                </option>
              ))}
            </select>

            {usesStudentLetter ? (
              <select
                className="w-full comic-input text-lg py-4"
                value={studentLetter}
                onChange={(event) => setStudentLetter(event.target.value.toUpperCase())}
                required
              >
                <option value="">ID</option>
                {STUDENT_LETTER_OPTIONS.map((letter) => (
                  <option key={letter} value={letter}>
                    {letter}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          {error ? (
            <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText>
          ) : null}

          <ComicButton
            variant="primary"
            size="lg"
            className="w-full"
            disabled={checkingIdentity}
            onClick={() => void handleStart()}
          >
            {checkingIdentity ? 'Checking…' : 'Start assessment'}
          </ComicButton>
        </div>
      </ComicCard>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <ComicCard className="space-y-3">
        <ComicTitle level={3} className="text-[var(--comic-primary)]">
          {assignment.title}
        </ComicTitle>
        {assignment.thumbnail_url?.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={assignment.thumbnail_url.trim()}
            alt=""
            className="w-full max-h-48 object-cover comic-border rounded-lg"
          />
        ) : null}
        <ComicText className="text-[var(--comic-dark)] font-bold">
          Listen to each short audio clip, then choose the best answer. Transcripts are not shown.
        </ComicText>
      </ComicCard>

      {questions.map((question, index) => (
        <ComicCard key={question.id} className="space-y-4">
          <ComicTitle level={4} className="text-[var(--comic-secondary)]">
            Question {index + 1}
          </ComicTitle>
          <SegmentAudioPlayer
            audioUrl={assignment.audio_url}
            startSeconds={question.start_seconds}
            endSeconds={question.end_seconds}
            maxReplays={assignment.max_replays === 0 ? null : assignment.max_replays}
            label="Play Audio"
          />
          <ComicText className="text-[var(--comic-dark)] font-black text-lg">
            {question.question_text}
          </ComicText>
          <div className="space-y-2">
            {question.choices.map((choice, choiceIndex) => {
              if (!choice.trim()) return null;
              const letter = String.fromCharCode(65 + choiceIndex);
              const label = stripChoiceLetterPrefix(choice);
              const selected = answers[question.id] === choice;
              return (
                <button
                  key={`${question.id}-${choiceIndex}`}
                  type="button"
                  onClick={() =>
                    setAnswers((current) => ({ ...current, [question.id]: choice }))
                  }
                  className={`w-full text-left comic-border-thick rounded-md p-3 font-bold transition-colors ${
                    selected
                      ? 'comic-bg-selection-stripes text-[var(--comic-dark)]'
                      : 'bg-white text-[var(--comic-dark)] hover:bg-[var(--comic-light)]'
                  }`}
                >
                  {letter}. {label}
                </button>
              );
            })}
          </div>
        </ComicCard>
      ))}

      {error ? (
        <ComicText className="text-[var(--comic-danger)] font-bold text-center">{error}</ComicText>
      ) : null}

      <div className="text-center pb-8">
        <ComicButton
          variant="success"
          size="md"
          disabled={submitting}
          onClick={() => void handleSubmit()}
        >
          {submitting ? 'Submitting…' : 'Submit answers'}
        </ComicButton>
      </div>
    </div>
  );
}
