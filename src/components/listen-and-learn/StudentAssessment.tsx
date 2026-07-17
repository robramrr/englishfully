'use client';

import { useEffect, useMemo, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import SegmentAudioPlayer from './SegmentAudioPlayer';
import type { PublicLearnAssignment, LearnSubmission } from '@/lib/listen-and-learn/types';

interface StudentAssessmentProps {
  assignmentId: string;
}

type Step = 'loading' | 'identity' | 'assessment' | 'result' | 'error';

export default function StudentAssessment({ assignmentId }: StudentAssessmentProps) {
  const [step, setStep] = useState<Step>('loading');
  const [assignment, setAssignment] = useState<PublicLearnAssignment | null>(null);
  const [error, setError] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [classNumber, setClassNumber] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
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
        setAssignment(data.assignment);
        setClassNumber(data.assignment.class_name || '');
        setAttemptsRemaining(data.attempts_remaining ?? data.assignment.attempts_allowed);
        setStep('identity');
      })
      .catch(() => {
        setError('Failed to load assessment.');
        setStep('error');
      });
  }, [assignmentId]);

  const questions = useMemo(() => assignment?.questions ?? [], [assignment]);

  async function refreshAttempts() {
    if (!assignment || !studentNumber.trim() || !classNumber.trim()) return;
    const params = new URLSearchParams({
      student_number: studentNumber.trim(),
      class_number: classNumber.trim(),
    });
    const response = await fetch(
      `/api/listen-and-learn/public/${assignmentId}?${params.toString()}`,
      { cache: 'no-store' }
    );
    const data = await response.json();
    if (response.ok) {
      setAttemptsRemaining(data.attempts_remaining ?? 0);
    }
  }

  async function handleStart() {
    setError('');
    if (!studentName.trim() || !studentNumber.trim() || !classNumber.trim()) {
      setError('Enter your name, student number, and class to continue.');
      return;
    }
    await refreshAttempts();
    const params = new URLSearchParams({
      student_number: studentNumber.trim(),
      class_number: classNumber.trim(),
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
    setAssignment(data.assignment);
    setAttemptsRemaining(data.attempts_remaining);
    setAnswers({});
    setStartedAt(Date.now());
    setStep('assessment');
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
          student_name: studentName.trim(),
          student_number: studentNumber.trim(),
          class_number: classNumber.trim(),
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
      <ComicCard className="comic-shadow-xl text-center">
        <ComicText className="text-[var(--comic-dark)] font-bold">Loading assessment…</ComicText>
      </ComicCard>
    );
  }

  if (step === 'error' || !assignment) {
    return (
      <ComicCard className="comic-shadow-xl text-center">
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
      <ComicCard className="comic-shadow-xl text-center space-y-4">
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
      <ComicCard className="comic-shadow-xl space-y-4 max-w-xl mx-auto">
        <ComicTitle level={3} className="text-[var(--comic-primary)]">
          {assignment.title}
        </ComicTitle>
        <ComicText className="text-[var(--comic-dark)] font-bold">
          {assignment.teacher_name ? `Teacher: ${assignment.teacher_name}` : null}
          {assignment.class_name ? ` · Class: ${assignment.class_name}` : null}
        </ComicText>
        <ComicText className="text-[var(--comic-dark)] font-bold">
          {questions.length} question{questions.length === 1 ? '' : 's'} ·{' '}
          {assignment.attempts_allowed} attempt
          {assignment.attempts_allowed === 1 ? '' : 's'} allowed
        </ComicText>

        <label className="space-y-1 block">
          <ComicText className="font-black">Your name</ComicText>
          <input
            value={studentName}
            onChange={(event) => setStudentName(event.target.value)}
            className="w-full comic-border-thick rounded-md p-3 font-bold"
          />
        </label>
        <label className="space-y-1 block">
          <ComicText className="font-black">Student number</ComicText>
          <input
            value={studentNumber}
            onChange={(event) => setStudentNumber(event.target.value)}
            className="w-full comic-border-thick rounded-md p-3 font-bold"
          />
        </label>
        <label className="space-y-1 block">
          <ComicText className="font-black">Class</ComicText>
          <input
            value={classNumber}
            onChange={(event) => setClassNumber(event.target.value)}
            className="w-full comic-border-thick rounded-md p-3 font-bold"
          />
        </label>

        {error ? (
          <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText>
        ) : null}

        <ComicButton variant="secondary" size="md" onClick={() => void handleStart()}>
          Start assessment
        </ComicButton>
      </ComicCard>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <ComicCard className="comic-shadow-xl">
        <ComicTitle level={3} className="mb-2 text-[var(--comic-primary)]">
          {assignment.title}
        </ComicTitle>
        <ComicText className="text-[var(--comic-dark)] font-bold">
          Listen to each short audio clip, then choose the best answer. Transcripts are not shown.
        </ComicText>
      </ComicCard>

      {questions.map((question, index) => (
        <ComicCard key={question.id} className="comic-shadow-xl space-y-4">
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
                      ? 'bg-[var(--comic-primary)] text-white'
                      : 'bg-white text-[var(--comic-dark)] hover:bg-[var(--comic-light)]'
                  }`}
                >
                  {letter}. {choice}
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
