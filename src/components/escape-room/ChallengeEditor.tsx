'use client';

import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import type {
  EscapeAnswerConfig,
  EscapeChallengeContent,
  EscapeChallengeType,
  EscapeHintConfig,
  EscapeMediaItem,
  EscapeRewardConfig,
} from '@/lib/escape-room/types';
import {
  ESCAPE_CHALLENGE_TYPE_LABELS,
  ESCAPE_CHALLENGE_TYPES,
  emptyAnswerConfig,
  emptyHints,
} from '@/lib/escape-room/types';
import { defaultContentForType, parseVocabPairs } from '@/lib/escape-room/challenge-content';

export interface ChallengeDraftFull {
  id: string;
  type: EscapeChallengeType;
  title: string;
  instructions: string;
  content: EscapeChallengeContent;
  media: EscapeMediaItem[];
  answer_configuration: EscapeAnswerConfig;
  reward_configuration: EscapeRewardConfig | null;
  hints: EscapeHintConfig;
  settings: Record<string, unknown>;
}

interface ChallengeEditorProps {
  challenge: ChallengeDraftFull;
  index: number;
  canDelete: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canDuplicate: boolean;
  onChange: (next: ChallengeDraftFull) => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function updateContent(
  challenge: ChallengeDraftFull,
  patch: EscapeChallengeContent
): ChallengeDraftFull {
  return { ...challenge, content: { ...challenge.content, ...patch } };
}

export default function ChallengeEditor({
  challenge,
  index,
  canDelete,
  canMoveUp,
  canMoveDown,
  canDuplicate,
  onChange,
  onMove,
  onDuplicate,
  onDelete,
}: ChallengeEditorProps) {
  const pairs = parseVocabPairs(challenge.content);
  const image = challenge.media.find((item) => item.kind === 'image');
  const audioUrl =
    String(challenge.content.audio_url ?? '') ||
    challenge.media.find((item) => item.kind === 'audio')?.url ||
    '';
  const videoUrl =
    String(challenge.content.video_url ?? '') ||
    challenge.media.find((item) => item.kind === 'video')?.url ||
    '';

  async function transcribeAudio() {
    if (!audioUrl) {
      window.alert('Add an audio URL first.');
      return;
    }
    const response = await fetch('/api/escape-room/transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio_url: audioUrl }),
    });
    const data = await response.json();
    if (!response.ok) {
      window.alert(data.error || 'Transcription failed');
      return;
    }
    onChange(updateContent(challenge, { transcript: String(data.transcript || '') }));
  }

  return (
    <div className="rounded-lg border-2 border-[var(--comic-dark)] p-4 space-y-3 bg-[var(--comic-bg)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ComicText className="font-black">
          Challenge {index + 1}
          {challenge.type === 'code_lock' ? ' · Final Lock' : ''}
        </ComicText>
        <div className="flex flex-wrap gap-2">
          <ComicButton type="button" variant="accent" size="sm" disabled={!canMoveUp} onClick={() => onMove(-1)}>
            ↑
          </ComicButton>
          <ComicButton type="button" variant="accent" size="sm" disabled={!canMoveDown} onClick={() => onMove(1)}>
            ↓
          </ComicButton>
          <ComicButton type="button" variant="primary" size="sm" disabled={!canDuplicate} onClick={onDuplicate}>
            Duplicate
          </ComicButton>
          <ComicButton type="button" variant="danger" size="sm" disabled={!canDelete} onClick={onDelete}>
            Delete
          </ComicButton>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <ComicText className="font-bold text-sm">Type</ComicText>
          <select
            className="w-full comic-input"
            value={challenge.type}
            onChange={(event) => {
              const type = event.target.value as EscapeChallengeType;
              onChange({
                ...challenge,
                type,
                content: {
                  ...defaultContentForType(type),
                  ...challenge.content,
                },
              });
            }}
          >
            {ESCAPE_CHALLENGE_TYPES.map((type) => (
              <option key={type} value={type}>
                {ESCAPE_CHALLENGE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <ComicText className="font-bold text-sm">Title</ComicText>
          <input
            className="w-full comic-input"
            value={challenge.title}
            onChange={(event) => onChange({ ...challenge, title: event.target.value })}
          />
        </label>
      </div>

      <label className="block space-y-1">
        <ComicText className="font-bold text-sm">Instructions</ComicText>
        <textarea
          className="w-full comic-input min-h-[60px]"
          value={challenge.instructions}
          onChange={(event) => onChange({ ...challenge, instructions: event.target.value })}
        />
      </label>

      {(challenge.type === 'image_investigation' ||
        challenge.type === 'multiple_choice' ||
        challenge.type === 'open_response' ||
        challenge.type === 'listening' ||
        challenge.type === 'video') && (
        <label className="block space-y-1">
          <ComicText className="font-bold text-sm">Question</ComicText>
          <textarea
            className="w-full comic-input min-h-[60px]"
            value={String(challenge.content.question ?? '')}
            onChange={(event) =>
              onChange(updateContent(challenge, { question: event.target.value }))
            }
          />
        </label>
      )}

      {(challenge.type === 'sentence_building' || challenge.type === 'fill_in_blank') && (
        <label className="block space-y-1">
          <ComicText className="font-bold text-sm">Sentence (use ______ for blanks)</ComicText>
          <textarea
            className="w-full comic-input min-h-[60px]"
            value={String(challenge.content.sentence ?? '')}
            onChange={(event) =>
              onChange(updateContent(challenge, { sentence: event.target.value }))
            }
          />
        </label>
      )}

      {challenge.type === 'code_lock' && (
        <label className="block space-y-1">
          <ComicText className="font-bold text-sm">Lock prompt</ComicText>
          <textarea
            className="w-full comic-input min-h-[60px]"
            value={String(challenge.content.prompt ?? '')}
            onChange={(event) =>
              onChange(updateContent(challenge, { prompt: event.target.value }))
            }
          />
        </label>
      )}

      {(challenge.type === 'image_investigation' || challenge.type === 'open_response') && (
        <label className="block space-y-1">
          <ComicText className="font-bold text-sm">Optional clue</ComicText>
          <input
            className="w-full comic-input"
            value={String(challenge.content.clue ?? '')}
            onChange={(event) => onChange(updateContent(challenge, { clue: event.target.value }))}
          />
        </label>
      )}

      {/* Media */}
      {(challenge.type === 'image_investigation' ||
        challenge.type === 'open_response' ||
        challenge.type === 'multiple_choice') && (
        <div className="space-y-2">
          <ComicText className="font-bold text-sm">Image URL</ComicText>
          <input
            className="w-full comic-input"
            value={image?.url || ''}
            onChange={(event) => {
              const url = event.target.value;
              onChange({
                ...challenge,
                media: [
                  ...challenge.media.filter((item) => item.kind !== 'image'),
                  ...(url.trim()
                    ? [
                        {
                          kind: 'image' as const,
                          url,
                          title: image?.title || '',
                          description: image?.description || '',
                        },
                      ]
                    : []),
                ],
              });
            }}
            placeholder="https://…"
          />
          {image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image.url} alt={image.title || 'Challenge'} className="max-h-48 rounded border" />
          ) : null}
        </div>
      )}

      {(challenge.type === 'listening' || challenge.type === 'multiple_choice') && (
        <div className="space-y-2">
          <ComicText className="font-bold text-sm">Audio URL</ComicText>
          <input
            className="w-full comic-input"
            value={audioUrl}
            onChange={(event) => {
              const url = event.target.value;
              onChange({
                ...updateContent(challenge, { audio_url: url }),
                media: [
                  ...challenge.media.filter((item) => item.kind !== 'audio'),
                  ...(url.trim() ? [{ kind: 'audio' as const, url }] : []),
                ],
              });
            }}
          />
          <div className="flex flex-wrap gap-2">
            <ComicButton type="button" variant="primary" size="sm" onClick={() => void transcribeAudio()}>
              Transcribe audio
            </ComicButton>
          </div>
          <ComicText className="text-xs text-[var(--comic-dark)]">
            Paste an audio URL (same approach as Listen &amp; Learn). No text-to-speech — use your
            own clip or a segment from existing lesson audio.
          </ComicText>
          {audioUrl ? <audio controls className="w-full" src={audioUrl} /> : null}
          <label className="block space-y-1">
            <ComicText className="font-bold text-sm">Transcript</ComicText>
            <textarea
              className="w-full comic-input min-h-[70px]"
              value={String(challenge.content.transcript ?? '')}
              onChange={(event) =>
                onChange(updateContent(challenge, { transcript: event.target.value }))
              }
            />
          </label>
        </div>
      )}

      {challenge.type === 'video' && (
        <div className="space-y-2">
          <ComicText className="font-bold text-sm">Video URL (YouTube or direct)</ComicText>
          <input
            className="w-full comic-input"
            value={videoUrl}
            onChange={(event) => {
              const url = event.target.value;
              onChange({
                ...updateContent(challenge, { video_url: url }),
                media: [
                  ...challenge.media.filter((item) => item.kind !== 'video'),
                  ...(url.trim() ? [{ kind: 'video' as const, url }] : []),
                ],
              });
            }}
          />
        </div>
      )}

      {(challenge.type === 'vocabulary' || challenge.type === 'matching') && (
        <div className="space-y-2">
          <ComicText className="font-bold text-sm">
            Vocabulary pairs (word | meaning) — one per line
          </ComicText>
          <textarea
            className="w-full comic-input min-h-[120px]"
            value={pairs.map((pair) => `${pair.left} | ${pair.right}`).join('\n')}
            onChange={(event) => {
              const nextPairs = event.target.value
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => {
                  const [left, ...rest] = line.split('|');
                  return {
                    left: (left || '').trim(),
                    right: rest.join('|').trim(),
                  };
                })
                .filter((pair) => pair.left && pair.right);
              onChange(updateContent(challenge, { pairs: nextPairs }));
            }}
            placeholder={'messy | untidy\nneat | organized'}
          />
        </div>
      )}

      {challenge.type !== 'code_lock' &&
        challenge.type !== 'vocabulary' &&
        challenge.type !== 'matching' && (
          <>
            <label className="block space-y-1">
              <ComicText className="font-bold text-sm">
                Choices (optional, one per line — for multiple choice)
              </ComicText>
              <textarea
                className="w-full comic-input min-h-[80px]"
                value={(challenge.answer_configuration.choices || []).join('\n')}
                onChange={(event) =>
                  onChange({
                    ...challenge,
                    answer_configuration: {
                      ...emptyAnswerConfig(),
                      ...challenge.answer_configuration,
                      choices: event.target.value
                        .split('\n')
                        .map((line) => line.trim())
                        .filter(Boolean),
                    },
                  })
                }
              />
            </label>
            <label className="block space-y-1">
              <ComicText className="font-bold text-sm">
                Accepted answers (one per line — supports multiple)
              </ComicText>
              <textarea
                className="w-full comic-input min-h-[80px]"
                value={(challenge.answer_configuration.accepted_answers || []).join('\n')}
                onChange={(event) =>
                  onChange({
                    ...challenge,
                    answer_configuration: {
                      ...emptyAnswerConfig(),
                      ...challenge.answer_configuration,
                      accepted_answers: event.target.value
                        .split('\n')
                        .map((line) => line.trim())
                        .filter(Boolean),
                    },
                  })
                }
              />
            </label>
          </>
        )}

      {challenge.type !== 'code_lock' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <ComicText className="font-bold text-sm">Reward type</ComicText>
            <select
              className="w-full comic-input"
              value={challenge.reward_configuration?.kind || 'letter'}
              onChange={(event) =>
                onChange({
                  ...challenge,
                  reward_configuration: {
                    kind: event.target.value as EscapeRewardConfig['kind'],
                    value: challenge.reward_configuration?.value || '',
                  },
                })
              }
            >
              <option value="letter">Letter</option>
              <option value="number">Number</option>
              <option value="word">Word</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label className="block space-y-1">
            <ComicText className="font-bold text-sm">Reward value</ComicText>
            <input
              className="w-full comic-input"
              value={challenge.reward_configuration?.value || ''}
              onChange={(event) =>
                onChange({
                  ...challenge,
                  reward_configuration: {
                    kind: challenge.reward_configuration?.kind || 'letter',
                    value: event.target.value,
                  },
                })
              }
              placeholder="A"
            />
          </label>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {(['hint_1', 'hint_2', 'final_hint'] as const).map((key, hintIndex) => (
          <label key={key} className="block space-y-1">
            <ComicText className="font-bold text-sm">Hint {hintIndex + 1}</ComicText>
            <input
              className="w-full comic-input"
              value={challenge.hints[key] || ''}
              onChange={(event) =>
                onChange({
                  ...challenge,
                  hints: { ...emptyHints(), ...challenge.hints, [key]: event.target.value },
                })
              }
            />
          </label>
        ))}
      </div>
    </div>
  );
}
