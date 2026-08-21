'use client';

import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faLock } from '@fortawesome/free-solid-svg-icons';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import type {
  EscapeProgressRecord,
  EscapeRoomChallenge,
  EscapeRoomWithChallenges,
} from '@/lib/escape-room/types';
import { ESCAPE_CHALLENGE_TYPE_LABELS } from '@/lib/escape-room/types';
import {
  checkChallengeAnswer,
  getPrimaryMedia,
  getQuestionFromContent,
  parseVocabPairs,
  youtubeEmbedUrl,
} from '@/lib/escape-room/challenge-content';

type Step = 'home' | 'challenge' | 'success' | 'escaped';

interface StudentEscapePlayerProps {
  room: EscapeRoomWithChallenges;
  /** live = public APIs; preview = client-side checking (teacher) */
  mode?: 'live' | 'preview';
}

export default function StudentEscapePlayer({
  room,
  mode = 'live',
}: StudentEscapePlayerProps) {
  const [step, setStep] = useState<Step>('home');
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [progress, setProgress] = useState<EscapeProgressRecord | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [rewards, setRewards] = useState<string[]>([]);
  const [answer, setAnswer] = useState('');
  const [matching, setMatching] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState('');
  const [rewardFlash, setRewardFlash] = useState('');
  const [hintLevel, setHintLevel] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [escapedMessage, setEscapedMessage] = useState('');

  const challenge: EscapeRoomChallenge | null = room.challenges[challengeIndex] || null;
  const pairs = useMemo(
    () => (challenge ? parseVocabPairs(challenge.content) : []),
    [challenge]
  );
  const shuffledRights = useMemo(() => {
    const rights = pairs.map((pair) => pair.right);
    const unique = Array.from(new Set(rights));
    for (let i = unique.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = unique[i];
      unique[i] = unique[j];
      unique[j] = tmp;
    }
    return unique;
  }, [challenge?.id, pairs]);

  async function startMission() {
    setStarting(true);
    setError('');
    try {
      if (mode === 'preview') {
        setProgress({
          id: 'preview',
          escape_room_id: room.id,
          student_label: 'Preview',
          student_number: '',
          class_number: '',
          current_challenge_id: room.challenges[0]?.id || null,
          completed_challenge_ids: [],
          collected_rewards: [],
          completed: false,
          started_at: new Date().toISOString(),
          completed_at: null,
        });
        setCompletedIds([]);
        setRewards([]);
        setChallengeIndex(0);
        setStep('challenge');
        return;
      }
      const response = await fetch(`/api/escape-room/public/${room.id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not start');
      setProgress(data.progress);
      setCompletedIds(data.progress.completed_challenge_ids || []);
      setRewards(data.progress.collected_rewards || []);
      setChallengeIndex(0);
      setStep('challenge');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start mission');
    } finally {
      setStarting(false);
    }
  }

  function showHint() {
    if (!challenge) return;
    setHintLevel((level) => Math.min(3, level + 1));
  }

  const visibleHint =
    !challenge
      ? ''
      : hintLevel >= 3
        ? challenge.hints.final_hint || challenge.hints.hint_2 || challenge.hints.hint_1
        : hintLevel === 2
          ? challenge.hints.hint_2 || challenge.hints.hint_1
          : hintLevel === 1
            ? challenge.hints.hint_1
            : '';

  async function submitAnswer() {
    if (!challenge) return;
    setSubmitting(true);
    setFeedback('');
    setError('');
    try {
      if (mode === 'preview') {
        const result = checkChallengeAnswer({
          challenge,
          finalCode: room.final_code,
          answer,
          matchingAnswers: matching,
        });
        if (!result.correct) {
          setFeedback(result.message);
          return;
        }
        const reward = challenge.reward_configuration?.value || '';
        if (reward) {
          setRewards((prev) => (prev.includes(reward) ? prev : [...prev, reward]));
          setRewardFlash(reward);
        }
        setCompletedIds((prev) =>
          prev.includes(challenge.id) ? prev : [...prev, challenge.id]
        );
        const isFinal =
          challenge.type === 'code_lock' || challengeIndex >= room.challenges.length - 1;
        if (isFinal) {
          setEscapedMessage(room.final_success_message || 'You escaped!');
          setStep('escaped');
        } else {
          setStep('success');
        }
        return;
      }

      if (!progress) throw new Error('Start the mission first.');
      const response = await fetch(`/api/escape-room/public/${room.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress_id: progress.id,
          challenge_id: challenge.id,
          answer,
          matching_answers: matching,
          hint_level: hintLevel,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Submit failed');
      setProgress(data.progress);
      setCompletedIds(data.progress.completed_challenge_ids || []);
      setRewards(data.progress.collected_rewards || []);
      if (!data.correct) {
        setFeedback(data.message || 'Not quite. Try again.');
        return;
      }
      if (data.reward?.value) setRewardFlash(String(data.reward.value));
      if (data.escaped) {
        setEscapedMessage(data.message || room.final_success_message || 'You escaped!');
        setStep('escaped');
      } else {
        setFeedback(data.message || 'Correct!');
        setStep('success');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  function continueNext() {
    setAnswer('');
    setMatching({});
    setFeedback('');
    setRewardFlash('');
    setHintLevel(0);
    if (challengeIndex < room.challenges.length - 1) {
      setChallengeIndex((index) => index + 1);
      setStep('challenge');
    } else {
      setEscapedMessage(room.final_success_message || 'You escaped!');
      setStep('escaped');
    }
  }

  if (step === 'home') {
    return (
      <div className="min-h-screen px-4 py-10 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-white">
        <div className="max-w-3xl mx-auto space-y-8">
          {mode === 'preview' ? (
            <ComicText className="text-amber-300 font-bold text-center">Teacher preview mode</ComicText>
          ) : null}
          <div className="text-center space-y-3">
            <p className="uppercase tracking-[0.2em] text-sm text-slate-300">Mission Control</p>
            <h1 className="text-4xl sm:text-5xl font-black">{room.title || 'Escape Room'}</h1>
            <p className="text-lg text-slate-200 whitespace-pre-wrap">{room.mission}</p>
          </div>
          {room.instructions ? (
            <ComicCard className="bg-white/95 text-[var(--comic-dark)]">
              <ComicText className="font-bold whitespace-pre-wrap">{room.instructions}</ComicText>
            </ComicCard>
          ) : null}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {room.challenges.map((item, index) => {
              const done = completedIds.includes(item.id);
              const unlocked = index === 0 || completedIds.includes(room.challenges[index - 1]?.id);
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border px-3 py-4 text-center ${
                    done
                      ? 'border-emerald-400 bg-emerald-500/20'
                      : unlocked
                        ? 'border-sky-400 bg-sky-500/10'
                        : 'border-slate-600 bg-slate-800/80 opacity-70'
                  }`}
                >
                  <div className="text-xs uppercase tracking-wide text-slate-300">
                    Challenge {index + 1}
                  </div>
                  <div className="font-bold mt-1">{item.title || ESCAPE_CHALLENGE_TYPE_LABELS[item.type]}</div>
                  <div className="text-sm mt-2">
                    {done ? (
                      <span className="inline-flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faCheck} aria-hidden className="h-[1em] w-[1em]" />
                        Complete
                      </span>
                    ) : unlocked ? (
                      'Ready'
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faLock} aria-hidden className="h-[1em] w-[1em]" />
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <ComicButton
              type="button"
              variant="secondary"
              size="lg"
              disabled={starting || room.challenges.length === 0}
              onClick={() => void startMission()}
            >
              {starting ? 'Starting…' : 'Start Mission'}
            </ComicButton>
          </div>
          {error ? <p className="text-center text-red-300 font-bold">{error}</p> : null}
        </div>
      </div>
    );
  }

  if (step === 'escaped') {
    return (
      <div className="min-h-screen px-4 py-16 bg-gradient-to-b from-emerald-900 to-slate-950 text-white flex items-center justify-center">
        <div className="max-w-xl text-center space-y-6">
          <h1 className="text-4xl font-black">ESCAPED</h1>
          <p className="text-xl whitespace-pre-wrap">{escapedMessage}</p>
          {rewards.length > 0 ? (
            <p className="text-slate-200">Code pieces collected: {rewards.join(' · ')}</p>
          ) : null}
          <ComicButton type="button" variant="accent" onClick={() => window.location.reload()}>
            Play again
          </ComicButton>
        </div>
      </div>
    );
  }

  if (step === 'success' && challenge) {
    return (
      <div className="min-h-screen px-4 py-16 bg-slate-900 text-white flex items-center justify-center">
        <div className="max-w-md text-center space-y-5">
          <div className="text-5xl">✓</div>
          <h2 className="text-3xl font-black">Correct!</h2>
          {rewardFlash ? (
            <p className="text-2xl font-bold text-amber-300">You discovered: {rewardFlash}</p>
          ) : null}
          <p className="text-slate-200">{feedback}</p>
          <ComicButton type="button" variant="secondary" size="lg" onClick={continueNext}>
            Continue
          </ComicButton>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ComicText className="font-bold">No challenges configured.</ComicText>
      </div>
    );
  }

  const image = getPrimaryMedia(challenge.media, 'image');
  const audio =
    String(challenge.content.audio_url ?? '') ||
    getPrimaryMedia(challenge.media, 'audio')?.url ||
    '';
  const video =
    String(challenge.content.video_url ?? '') ||
    getPrimaryMedia(challenge.media, 'video')?.url ||
    '';
  const embed = video ? youtubeEmbedUrl(video) : null;
  const question = getQuestionFromContent(challenge.type, challenge.content);
  const choices = challenge.answer_configuration.choices || [];

  return (
    <div className="min-h-screen px-4 py-8 bg-[var(--comic-light)]">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
              {room.title}
            </ComicText>
            <ComicTitle level={2} className="text-[var(--comic-primary)]">
              Challenge {challengeIndex + 1} of {room.challenges.length}
            </ComicTitle>
          </div>
          <ComicText className="text-sm font-bold">
            Code so far: {rewards.join('') || '—'}
          </ComicText>
        </div>

        <ComicCard className="comic-shadow-xl space-y-4">
          <ComicText className="font-black text-lg">{challenge.title}</ComicText>
          {challenge.instructions ? (
            <ComicText className="font-bold whitespace-pre-wrap">{challenge.instructions}</ComicText>
          ) : null}

          {image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.url}
              alt={image.title || challenge.title}
              className="w-full max-h-[420px] object-contain rounded-lg border-2 border-[var(--comic-dark)] bg-white"
            />
          ) : null}

          {audio ? <audio controls className="w-full" src={audio} /> : null}

          {embed ? (
            <div className="aspect-video w-full overflow-hidden rounded-lg border-2 border-[var(--comic-dark)]">
              <iframe
                src={embed}
                title={challenge.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : video ? (
            <video controls className="w-full rounded-lg border-2 border-[var(--comic-dark)]" src={video} />
          ) : null}

          <ComicText className="text-lg font-bold whitespace-pre-wrap">{question}</ComicText>

          {challenge.type === 'vocabulary' || challenge.type === 'matching' ? (
            <div className="space-y-3">
              {pairs.map((pair) => (
                <label key={pair.left} className="grid gap-2 sm:grid-cols-[1fr_1fr] items-center">
                  <span className="font-bold">{pair.left}</span>
                  <select
                    className="comic-input"
                    value={matching[pair.left] || ''}
                    onChange={(event) =>
                      setMatching((prev) => ({ ...prev, [pair.left]: event.target.value }))
                    }
                  >
                    <option value="">Select…</option>
                    {shuffledRights.map((right) => (
                      <option key={`${pair.left}-${right}`} value={right}>
                        {right}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          ) : choices.length > 0 ? (
            <div className="space-y-2">
              {choices.map((choice) => (
                <label
                  key={choice}
                  className={`flex items-center gap-3 rounded-lg border-2 px-3 py-2 cursor-pointer ${
                    answer === choice
                      ? 'border-[var(--comic-primary)] bg-white'
                      : 'border-black/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="escape-choice"
                    checked={answer === choice}
                    onChange={() => setAnswer(choice)}
                  />
                  <span className="font-bold">{choice}</span>
                </label>
              ))}
            </div>
          ) : (
            <input
              className="w-full comic-input text-lg"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder={challenge.type === 'code_lock' ? 'Enter final code' : 'Your answer'}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void submitAnswer();
              }}
            />
          )}

          {visibleHint ? (
            <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
              Hint: {visibleHint}
            </ComicText>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <ComicButton
              type="button"
              variant="secondary"
              size="md"
              disabled={submitting}
              onClick={() => void submitAnswer()}
            >
              {submitting ? 'Checking…' : 'Submit'}
            </ComicButton>
            <ComicButton type="button" variant="accent" size="md" onClick={showHint}>
              Hint
            </ComicButton>
          </div>

          {feedback ? (
            <ComicText className="font-bold text-[var(--comic-danger)]">{feedback}</ComicText>
          ) : null}
          {error ? (
            <ComicText className="font-bold text-[var(--comic-danger)]">{error}</ComicText>
          ) : null}
        </ComicCard>
      </div>
    </div>
  );
}
