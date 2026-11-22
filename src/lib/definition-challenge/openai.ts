import OpenAI from 'openai';
import {
  definitionLeaksAnswer,
  displayBingoWord,
} from '@/lib/vocab-bingo/types';
import {
  CHALLENGE_LEVELS,
  createEmptyChallengeWord,
  type ChallengeLevel,
  type ChallengeWord,
} from './types';

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
  return new OpenAI({ apiKey });
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI response did not include JSON');
  return JSON.parse(candidate.slice(start, end + 1));
}

const LEVEL_GUIDE: Record<ChallengeLevel, string> = {
  A1: 'Very common words. The clue uses words a beginner already knows. About 6 to 12 words.',
  A2: 'Familiar words and a short clue a student can understand in one hearing.',
  B1: 'Useful classroom words. One clear spoken clue.',
  B2: 'More precise words. The clue is still easy to say aloud once.',
  C1: 'Precise vocabulary. The clue can be specific, but a teacher can read it in one breath.',
  C2: 'Nuanced vocabulary. The clue is accurate and natural, not a long academic sentence.',
};

function levelOf(value: string): ChallengeLevel {
  const level = value.trim().toUpperCase();
  return CHALLENGE_LEVELS.includes(level as ChallengeLevel) ? (level as ChallengeLevel) : 'A2';
}

function systemPrompt(level: ChallengeLevel): string {
  return `You write Definition Challenge clues for an English class.
The teacher reads the clue aloud. Students cross out the matching word. The teacher never says the word.

Return JSON only.

Rules:
- Each clue matches exactly one word in the vocabulary list.
- A clue must not contain the answer, a word inside a multi-word answer, or an obvious form of it.
- A clue must not also be a fair description of another word in the list.
- Write a clue a teacher can read aloud comfortably.
- ${LEVEL_GUIDE[level]}
- No markdown and no example sentence that uses the answer.`;
}

async function completeJson(system: string, user: string): Promise<unknown> {
  const openai = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  return extractJsonObject(completion.choices[0]?.message?.content || '{}');
}

function cleanDefinition(definition: unknown, word: string, others: string[]): string {
  const text = String(definition ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 280);
  if (!text || definitionLeaksAnswer(text, word)) return '';
  if (others.some((other) => other.toLowerCase() !== word.toLowerCase() && definitionLeaksAnswer(text, other))) {
    return '';
  }
  return text;
}

export async function suggestChallengeWords(params: {
  topic: string;
  level: string;
  count: number;
  avoidWords: string[];
}): Promise<ChallengeWord[]> {
  const topic = params.topic.trim();
  if (topic.length < 2) throw new Error('Add a topic first.');
  const level = levelOf(params.level);
  const count = Math.max(1, Math.min(20, Math.round(params.count) || 8));
  const avoid = new Set(params.avoidWords.map((word) => word.trim().toLowerCase()).filter(Boolean));
  const parsed = (await completeJson(
    systemPrompt(level),
    `Topic: ${topic}
Learner level: ${level}
Suggest ${count} new vocabulary words for this topic.
Do not use these words: ${[...avoid].join(', ') || '(none)'}
JSON shape: {"words":[{"word":"Follower","definition":"A person who sees your posts online."}]}`
  )) as { words?: unknown };
  const words: ChallengeWord[] = [];
  const list = Array.isArray(parsed.words) ? parsed.words : [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const word = displayBingoWord(String(record.word ?? ''));
    const key = word.toLowerCase();
    if (!word || avoid.has(key)) continue;
    const definition = cleanDefinition(record.definition, word, [...avoid, ...words.map((entry) => entry.word)]);
    if (!definition) continue;
    avoid.add(key);
    words.push(createEmptyChallengeWord({ word, definition }));
    if (words.length >= count) break;
  }
  if (words.length === 0) throw new Error('AI did not return new words. Try again.');
  return words;
}

export async function defineChallengeWords(params: {
  topic: string;
  level: string;
  words: string[];
  otherWords: string[];
}): Promise<{ word: string; definition: string }[]> {
  const targets = params.words.map((word) => displayBingoWord(word)).filter(Boolean);
  if (targets.length === 0) throw new Error('Add a word first.');
  const level = levelOf(params.level);
  const others = params.otherWords.map((word) => displayBingoWord(word)).filter(Boolean);
  const parsed = (await completeJson(
    systemPrompt(level),
    `Topic: ${params.topic.trim() || 'general English'}
Learner level: ${level}
Write one clue for each of these words, and no others: ${targets.join(', ')}
Other words already in this activity, which the clue must not fit: ${others.join(', ') || '(none)'}
JSON shape: {"definitions":[{"word":"Follower","definition":"A person who sees your posts online."}]}`
  )) as { definitions?: unknown };
  const wanted = new Map(targets.map((word) => [word.toLowerCase(), word]));
  const found: { word: string; definition: string }[] = [];
  const list = Array.isArray(parsed.definitions) ? parsed.definitions : [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const word = displayBingoWord(String(record.word ?? ''));
    const canonical = wanted.get(word.toLowerCase());
    if (!canonical) continue;
    const definition = cleanDefinition(record.definition, canonical, [...others, ...targets]);
    if (!definition) continue;
    found.push({ word: canonical, definition });
    wanted.delete(word.toLowerCase());
  }
  if (found.length === 0) {
    throw new Error('That definition includes the answer or fits another word. Try again.');
  }
  return found;
}
