'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import ChallengeEditor, { type ChallengeDraftFull } from './ChallengeEditor';
import type {
  EscapeChallengeSavePayload,
  EscapeChallengeType,
  EscapeRoomStatus,
  EscapeRoomWithChallenges,
  UpdateEscapeRoomPayload,
} from '@/lib/escape-room/types';
import {
  ESCAPE_ROOM_STATUS_LABELS,
  MAX_ESCAPE_CHALLENGES,
  MIN_ESCAPE_CHALLENGES,
  defaultChallengeTitle,
  emptyAnswerConfig,
  emptyHints,
} from '@/lib/escape-room/types';
import { defaultContentForType } from '@/lib/escape-room/challenge-content';
import { getStudentEscapeRoomUrl } from '@/lib/escape-room/qr';

interface RoomEditorProps {
  initialRoom: EscapeRoomWithChallenges;
}

function toDrafts(room: EscapeRoomWithChallenges): ChallengeDraftFull[] {
  return room.challenges.map((challenge) => ({
    id: challenge.id,
    type: challenge.type,
    title: challenge.title,
    instructions: challenge.instructions,
    content: challenge.content || defaultContentForType(challenge.type),
    media: challenge.media || [],
    answer_configuration: challenge.answer_configuration || emptyAnswerConfig(),
    reward_configuration: challenge.reward_configuration,
    hints: challenge.hints || emptyHints(),
    settings: challenge.settings || {},
  }));
}

export default function RoomEditor({ initialRoom }: RoomEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialRoom.title);
  const [mission, setMission] = useState(initialRoom.mission);
  const [instructions, setInstructions] = useState(initialRoom.instructions);
  const [learningObjective, setLearningObjective] = useState(initialRoom.learning_objective);
  const [englishLevel, setEnglishLevel] = useState(initialRoom.english_level);
  const [estimatedTime, setEstimatedTime] = useState(initialRoom.estimated_time);
  const [finalCode, setFinalCode] = useState(initialRoom.final_code);
  const [finalSuccessMessage, setFinalSuccessMessage] = useState(
    initialRoom.final_success_message
  );
  const [status, setStatus] = useState<EscapeRoomStatus>(initialRoom.status);
  const [challenges, setChallenges] = useState<ChallengeDraftFull[]>(() => toDrafts(initialRoom));
  const [worksheet, setWorksheet] = useState('');
  const [vocabulary, setVocabulary] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [mediaNotes, setMediaNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const studentUrl = useMemo(
    () => getStudentEscapeRoomUrl(initialRoom.id),
    [initialRoom.id]
  );

  function applyDraft(draft: UpdateEscapeRoomPayload) {
    if (draft.title != null) setTitle(draft.title);
    if (draft.mission != null) setMission(draft.mission);
    if (draft.instructions != null) setInstructions(draft.instructions);
    if (draft.learning_objective != null) setLearningObjective(draft.learning_objective);
    if (draft.english_level != null) setEnglishLevel(draft.english_level);
    if (draft.estimated_time != null) setEstimatedTime(draft.estimated_time);
    if (draft.final_code != null) setFinalCode(draft.final_code);
    if (draft.final_success_message != null) setFinalSuccessMessage(draft.final_success_message);
    if (Array.isArray(draft.challenges)) {
      setChallenges(
        draft.challenges.map((item, index) => ({
          id: `new_${Date.now()}_${index}`,
          type: item.type,
          title: item.title || defaultChallengeTitle(index, item.type),
          instructions: item.instructions || '',
          content: item.content || defaultContentForType(item.type),
          media: item.media || [],
          answer_configuration: item.answer_configuration || emptyAnswerConfig(),
          reward_configuration: item.reward_configuration ?? null,
          hints: { ...emptyHints(), ...(item.hints || {}) },
          settings: item.settings || {},
        }))
      );
    }
  }

  async function handleGenerate(fromWorksheet: boolean) {
    setGenerating(true);
    setError('');
    setMessage('');
    try {
      const topic = fromWorksheet
        ? worksheet.trim() || aiTopic.trim() || mission.trim() || title.trim()
        : aiTopic.trim() || mission.trim() || title.trim() || worksheet.trim();
      if (!topic) {
        throw new Error('Enter a topic, mission, or worksheet text first.');
      }
      const response = await fetch('/api/escape-room/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          title,
          mission,
          learning_objective: learningObjective,
          english_level: englishLevel,
          challenge_count: Math.max(challenges.length, 4),
          worksheet: worksheet.trim() || undefined,
          vocabulary: vocabulary.trim() || undefined,
          media_notes: mediaNotes.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Generation failed');
      applyDraft(data.draft);
      setMessage(
        fromWorksheet
          ? 'Worksheet converted into a draft escape room. Review and edit before publishing.'
          : 'AI draft ready. Review and edit before publishing.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const challengePayload: EscapeChallengeSavePayload[] = challenges.map((challenge, index) => ({
        id: challenge.id.startsWith('new_') ? undefined : challenge.id,
        type: challenge.type,
        title: challenge.title.trim() || defaultChallengeTitle(index, challenge.type),
        instructions: challenge.instructions,
        content: challenge.content,
        media: challenge.media,
        answer_configuration: challenge.answer_configuration,
        reward_configuration: challenge.reward_configuration,
        hints: challenge.hints,
        settings: challenge.settings,
      }));

      const response = await fetch(`/api/escape-room/rooms/${initialRoom.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          mission,
          instructions,
          learning_objective: learningObjective,
          english_level: englishLevel,
          estimated_time: estimatedTime,
          final_code: finalCode,
          final_success_message: finalSuccessMessage,
          status,
          challenges: challengePayload,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save');
      setChallenges(toDrafts(data.room));
      setStatus(data.room.status);
      setMessage('Escape room saved.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <Link href="/teacher-resources/escape-room">
          <ComicButton variant="accent" size="sm">
            ← All escape rooms
          </ComicButton>
        </Link>
        <ComicButton type="button" variant="secondary" size="sm" disabled={saving} onClick={() => void handleSave()}>
          {saving ? 'Saving…' : 'Save'}
        </ComicButton>
        <Link href={`/escape-room/${initialRoom.id}/preview`}>
          <ComicButton variant="primary" size="sm">
            Preview as student
          </ComicButton>
        </Link>
      </div>

      <ComicCard className="comic-shadow-xl space-y-4">
        <ComicTitle level={3} className="comic-title-no-shadow text-[var(--comic-primary)]">
          Escape Room Information
        </ComicTitle>
        <label className="block space-y-1">
          <ComicText className="font-bold text-sm">Title</ComicText>
          <input className="w-full comic-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="block space-y-1">
          <ComicText className="font-bold text-sm">Mission / Story</ComicText>
          <textarea className="w-full comic-input min-h-[100px]" value={mission} onChange={(e) => setMission(e.target.value)} />
        </label>
        <label className="block space-y-1">
          <ComicText className="font-bold text-sm">Instructions for Students</ComicText>
          <textarea className="w-full comic-input min-h-[80px]" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
        </label>
        <label className="block space-y-1">
          <ComicText className="font-bold text-sm">Learning Objective</ComicText>
          <textarea className="w-full comic-input min-h-[70px]" value={learningObjective} onChange={(e) => setLearningObjective(e.target.value)} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <ComicText className="font-bold text-sm">English Level</ComicText>
            <input className="w-full comic-input" value={englishLevel} onChange={(e) => setEnglishLevel(e.target.value)} placeholder="A2–B1" />
          </label>
          <label className="block space-y-1">
            <ComicText className="font-bold text-sm">Estimated Time</ComicText>
            <input className="w-full comic-input" value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <ComicText className="font-bold text-sm">Final Code</ComicText>
            <input className="w-full comic-input" value={finalCode} onChange={(e) => setFinalCode(e.target.value)} placeholder="A7B4C" />
          </label>
          <label className="block space-y-1">
            <ComicText className="font-bold text-sm">Status</ComicText>
            <select className="w-full comic-input" value={status} onChange={(e) => setStatus(e.target.value as EscapeRoomStatus)}>
              {Object.entries(ESCAPE_ROOM_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="block space-y-1">
          <ComicText className="font-bold text-sm">Final Success Message</ComicText>
          <input className="w-full comic-input" value={finalSuccessMessage} onChange={(e) => setFinalSuccessMessage(e.target.value)} />
        </label>
        {status === 'published' ? (
          <ComicText className="text-sm break-all">
            Student URL: <span className="font-bold">{studentUrl}</span>
          </ComicText>
        ) : (
          <ComicText className="text-sm">Publish to enable the live student link.</ComicText>
        )}
      </ComicCard>

      <ComicCard className="comic-shadow-xl space-y-4">
        <ComicTitle level={3} className="comic-title-no-shadow text-[var(--comic-primary)]">
          AI Generator / Worksheet Convert
        </ComicTitle>
        <label className="block space-y-1">
          <ComicText className="font-bold text-sm">Topic / brief</ComicText>
          <textarea
            className="w-full comic-input min-h-[80px]"
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            placeholder="Students go to an art museum and critique artwork to escape…"
          />
        </label>
        <label className="block space-y-1">
          <ComicText className="font-bold text-sm">Worksheet content</ComicText>
          <textarea
            className="w-full comic-input min-h-[140px]"
            value={worksheet}
            onChange={(e) => setWorksheet(e.target.value)}
            placeholder="Paste worksheet text, sentence frames, questions…"
          />
        </label>
        <label className="block space-y-1">
          <ComicText className="font-bold text-sm">Vocabulary list</ComicText>
          <textarea
            className="w-full comic-input min-h-[80px]"
            value={vocabulary}
            onChange={(e) => setVocabulary(e.target.value)}
            placeholder="cards, poker, secret, cheat…"
          />
        </label>
        <label className="block space-y-1">
          <ComicText className="font-bold text-sm">Media notes (optional)</ComicText>
          <textarea
            className="w-full comic-input min-h-[60px]"
            value={mediaNotes}
            onChange={(e) => setMediaNotes(e.target.value)}
            placeholder="Use painting A Friend in Need; listening clue about a hidden card…"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <ComicButton
            type="button"
            variant="secondary"
            size="sm"
            disabled={generating}
            onClick={() => void handleGenerate(false)}
          >
            {generating ? 'Generating…' : 'AI suggest challenges'}
          </ComicButton>
          <ComicButton
            type="button"
            variant="warning"
            size="sm"
            disabled={generating}
            onClick={() => void handleGenerate(true)}
          >
            {generating ? 'Converting…' : 'Convert worksheet to escape room'}
          </ComicButton>
        </div>
        <ComicText className="text-sm text-[var(--comic-dark)]">
          AI never auto-publishes. Review every challenge, attach image/audio/video URLs, then save.
        </ComicText>
      </ComicCard>

      <ComicCard className="comic-shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ComicTitle level={3} className="comic-title-no-shadow text-[var(--comic-primary)]">
            Challenges ({challenges.length}/{MAX_ESCAPE_CHALLENGES})
          </ComicTitle>
          <ComicButton
            type="button"
            variant="secondary"
            size="sm"
            disabled={challenges.length >= MAX_ESCAPE_CHALLENGES}
            onClick={() => {
              const type: EscapeChallengeType = 'image_investigation';
              setChallenges((current) => [
                ...current,
                {
                  id: `new_${Date.now()}`,
                  type,
                  title: defaultChallengeTitle(current.length, type),
                  instructions: '',
                  content: defaultContentForType(type),
                  media: [],
                  answer_configuration: emptyAnswerConfig(),
                  reward_configuration: { kind: 'letter', value: '' },
                  hints: emptyHints(),
                  settings: {},
                },
              ]);
            }}
          >
            + Add challenge
          </ComicButton>
        </div>

        <div className="space-y-4">
          {challenges.map((challenge, index) => (
            <ChallengeEditor
              key={challenge.id}
              challenge={challenge}
              index={index}
              canDelete={challenges.length > MIN_ESCAPE_CHALLENGES}
              canMoveUp={index > 0}
              canMoveDown={index < challenges.length - 1}
              canDuplicate={challenges.length < MAX_ESCAPE_CHALLENGES}
              onChange={(next) =>
                setChallenges((current) =>
                  current.map((item, i) => (i === index ? next : item))
                )
              }
              onMove={(direction) => {
                setChallenges((current) => {
                  const next = [...current];
                  const target = index + direction;
                  if (target < 0 || target >= next.length) return current;
                  const tmp = next[index];
                  next[index] = next[target];
                  next[target] = tmp;
                  return next;
                });
              }}
              onDuplicate={() => {
                setChallenges((current) => {
                  const source = current[index];
                  const copy: ChallengeDraftFull = {
                    ...source,
                    id: `new_${Date.now()}_${index}`,
                    title: `${source.title || 'Challenge'} (copy)`,
                    content: { ...source.content },
                    media: [...source.media],
                    answer_configuration: { ...source.answer_configuration },
                    hints: { ...source.hints },
                    settings: { ...source.settings },
                  };
                  const next = [...current];
                  next.splice(index + 1, 0, copy);
                  return next.slice(0, MAX_ESCAPE_CHALLENGES);
                });
              }}
              onDelete={() => {
                if (challenges.length <= MIN_ESCAPE_CHALLENGES) {
                  setError(`Keep at least ${MIN_ESCAPE_CHALLENGES} challenge.`);
                  return;
                }
                setChallenges((current) => current.filter((_, i) => i !== index));
              }}
            />
          ))}
        </div>
      </ComicCard>

      {message ? <ComicText className="text-[var(--comic-success)] font-bold">{message}</ComicText> : null}
      {error ? <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText> : null}

      <ComicButton type="button" variant="secondary" size="md" disabled={saving} onClick={() => void handleSave()}>
        {saving ? 'Saving…' : 'Save escape room'}
      </ComicButton>
    </div>
  );
}
