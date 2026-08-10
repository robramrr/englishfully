import OpenAI from 'openai';
import { buildEscapeRoomGeneratePrompt } from './prompts';
import type {
  EscapeChallengeSavePayload,
  EscapeChallengeType,
  EscapeRoomWithChallenges,
  UpdateEscapeRoomPayload,
} from './types';
import {
  clampChallengeCount,
  emptyAnswerConfig,
  emptyHints,
  isEscapeChallengeType,
} from './types';
import { defaultContentForType } from './challenge-content';

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey });
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('AI response did not include JSON');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

interface AiChallengeDraft {
  type?: string;
  title?: string;
  instructions?: string;
  question?: string;
  sentence?: string;
  choices?: string[];
  accepted_answers?: string[];
  pairs?: Array<{ left?: string; right?: string }>;
  hint_1?: string;
  hint_2?: string;
  final_hint?: string;
  reward_kind?: string;
  reward_value?: string;
  clue?: string;
}

interface AiRoomDraft {
  title?: string;
  mission?: string;
  instructions?: string;
  learning_objective?: string;
  english_level?: string;
  estimated_time?: string;
  final_code?: string;
  final_success_message?: string;
  challenges?: AiChallengeDraft[];
}

function mapAiChallenge(item: AiChallengeDraft, index: number): EscapeChallengeSavePayload {
  const type: EscapeChallengeType = isEscapeChallengeType(item.type)
    ? item.type
    : 'multiple_choice';
  const content = defaultContentForType(type);
  if (type === 'sentence_building' || type === 'fill_in_blank') {
    content.sentence = String(item.sentence || item.question || '').trim();
  } else if (type === 'code_lock') {
    content.prompt = String(item.question || item.instructions || content.prompt || '').trim();
  } else if (type === 'vocabulary' || type === 'matching') {
    content.pairs = Array.isArray(item.pairs)
      ? item.pairs
          .map((pair) => ({
            left: String(pair.left ?? '').trim(),
            right: String(pair.right ?? '').trim(),
          }))
          .filter((pair) => pair.left && pair.right)
      : [];
  } else {
    content.question = String(item.question || '').trim();
    if (item.clue) content.clue = String(item.clue).trim();
  }

  const choices = Array.isArray(item.choices)
    ? item.choices.map((choice) => String(choice).trim()).filter(Boolean)
    : [];
  const accepted = Array.isArray(item.accepted_answers)
    ? item.accepted_answers.map((answer) => String(answer).trim()).filter(Boolean)
    : [];

  const rewardValue = String(item.reward_value ?? '').trim();
  const rewardKind =
    item.reward_kind === 'number' ||
    item.reward_kind === 'word' ||
    item.reward_kind === 'custom'
      ? item.reward_kind
      : 'letter';

  return {
    type,
    title: String(item.title ?? '').trim() || `Challenge ${index + 1}`,
    instructions: String(item.instructions ?? '').trim(),
    content,
    media: [],
    answer_configuration: {
      ...emptyAnswerConfig(),
      choices,
      accepted_answers: accepted.length > 0 ? accepted : choices.slice(0, 1),
    },
    reward_configuration:
      type === 'code_lock' || !rewardValue
        ? null
        : { kind: rewardKind, value: rewardValue },
    hints: {
      ...emptyHints(),
      hint_1: String(item.hint_1 ?? '').trim(),
      hint_2: String(item.hint_2 ?? '').trim(),
      final_hint: String(item.final_hint ?? '').trim(),
    },
    settings: {},
  };
}

export async function generateEscapeRoomDraft(input: {
  topic: string;
  title?: string;
  mission?: string;
  learning_objective?: string;
  english_level?: string;
  challenge_count?: number;
  worksheet?: string;
  vocabulary?: string;
  media_notes?: string;
}): Promise<UpdateEscapeRoomPayload> {
  const challengeCount = clampChallengeCount(input.challenge_count ?? 6);
  const openai = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const prompt = buildEscapeRoomGeneratePrompt({
    ...input,
    challenge_count: challengeCount,
  });

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content:
          'You create editable English escape-room lesson drafts as strict JSON. Never publish. Never invent media URLs.',
      },
      { role: 'user', content: prompt },
    ],
  });

  const text = completion.choices[0]?.message?.content || '';
  const parsed = extractJsonObject(text) as AiRoomDraft;
  const challengesRaw = Array.isArray(parsed.challenges) ? parsed.challenges : [];

  let challenges = challengesRaw.slice(0, challengeCount).map((item, index) =>
    mapAiChallenge(item, index)
  );

  while (challenges.length < challengeCount) {
    const index = challenges.length;
    const isLast = index === challengeCount - 1;
    challenges.push(
      mapAiChallenge(
        {
          type: isLast ? 'code_lock' : 'multiple_choice',
          title: isLast ? 'Final Lock' : `Challenge ${index + 1}`,
          question: isLast
            ? 'Enter the final escape code.'
            : 'Answer the question to earn a code piece.',
          accepted_answers: isLast ? [] : ['answer'],
          reward_value: isLast ? '' : String(index + 1),
        },
        index
      )
    );
  }

  // Force last challenge to code lock.
  const lastIndex = challenges.length - 1;
  challenges[lastIndex] = {
    ...challenges[lastIndex],
    type: 'code_lock',
    title: challenges[lastIndex].title || 'Final Lock',
    reward_configuration: null,
    content: {
      ...defaultContentForType('code_lock'),
      ...(challenges[lastIndex].content || {}),
      prompt:
        String((challenges[lastIndex].content as { prompt?: string })?.prompt || '').trim() ||
        'Enter the final escape code to open the doors.',
    },
  };

  const rewardBits = challenges
    .slice(0, -1)
    .map((item) => item.reward_configuration?.value || '')
    .filter(Boolean)
    .join('');

  return {
    title: String(parsed.title || input.title || '').trim() || 'Escape Room',
    mission: String(parsed.mission || input.mission || '').trim(),
    instructions: String(parsed.instructions || '').trim(),
    learning_objective: String(
      parsed.learning_objective || input.learning_objective || ''
    ).trim(),
    english_level: String(parsed.english_level || input.english_level || '').trim(),
    estimated_time: String(parsed.estimated_time || '40 minutes').trim(),
    final_code: String(parsed.final_code || rewardBits || '').trim(),
    final_success_message: String(
      parsed.final_success_message || 'THE DOORS OPEN! You escaped.'
    ).trim(),
    challenges,
  };
}

export type { EscapeRoomWithChallenges };
