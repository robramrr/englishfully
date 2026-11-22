import OpenAI from 'openai';
import {
  BINGO_LEVELS,
  bingoCellCount,
  clampBingoWordCount,
  createEmptyBingoDistractor,
  createEmptyBingoWord,
  definitionLeaksAnswer,
  displayBingoWord,
  type BingoDefinitionStyle,
  type BingoDistractor,
  type BingoGridSize,
  type BingoLevel,
  type BingoWord,
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

const LEVEL_GUIDE: Record<BingoLevel, string> = {
  A1: 'Very common words. Definitions use everyday words a beginner already knows. About 6 to 12 words. Example for follower: "A person who follows you online."',
  A2: 'Familiar words. Short natural definitions. Example for follower: "Someone who chooses to see your posts on social media."',
  B1: 'Useful classroom words. Clear definitions a student can understand in one hearing. Example for follower: "A person who subscribes to someone\'s social media account to see their updates."',
  B2: 'More precise words and ideas, still easy to say aloud once. Example for follower: "Someone who regularly follows another user\'s online content and activities."',
  C1: 'Precise vocabulary. The definition can be more specific, but a teacher can still read it aloud in one breath.',
  C2: 'Nuanced vocabulary. The definition is accurate and natural, not a long academic sentence.',
};

const STYLE_GUIDE: Record<BingoDefinitionStyle, string> = {
  simple: 'Use the most direct fair clue for this level.',
  standard: 'Use a natural definition a teacher would say to the class.',
  challenging:
    'Be less direct. Describe the situation or function. There must still be one clear answer, and the language must stay inside the CEFR level.',
};

function levelOf(value: string): BingoLevel {
  const level = value.trim().toUpperCase();
  return BINGO_LEVELS.includes(level as BingoLevel) ? (level as BingoLevel) : 'A2';
}

function styleOf(value: string): BingoDefinitionStyle {
  if (value === 'simple' || value === 'challenging') return value;
  return 'standard';
}

function systemPrompt(level: BingoLevel, style: BingoDefinitionStyle): string {
  return `You write Vocabulary Bingo for English teachers.
Students hear a definition and cross out the matching word. The teacher never says the word.

Return JSON only.

Rules:
- Each definition matches exactly one target word.
- A definition must not contain the answer, any word inside a multi-word answer, or an obvious form of it.
- Write definitions a teacher can read aloud comfortably.
- Match the CEFR level in the ideas and the words you choose, not by making sentences longer.
- ${LEVEL_GUIDE[level]}
- Definition style: ${STYLE_GUIDE[style]}
- No markdown and no example sentence that uses the answer.`;
}

function cleanWord(raw: unknown, avoid: Set<string>): BingoWord | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const word = displayBingoWord(String(record.word ?? record.answer ?? ''));
  const definition = String(record.definition ?? record.clue ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!word || !definition) return null;
  if (avoid.has(word.toLowerCase())) return null;
  if (definitionLeaksAnswer(definition, word)) return null;
  return createEmptyBingoWord({ word, definition });
}

function cleanDistractors(raw: unknown, avoid: Set<string>, needed: number): BingoDistractor[] {
  const list = Array.isArray(raw) ? raw : [];
  const distractors: BingoDistractor[] = [];
  for (const item of list) {
    const word = displayBingoWord(
      typeof item === 'string' ? item : String((item as { word?: string })?.word ?? '')
    );
    if (!word || avoid.has(word.toLowerCase())) continue;
    avoid.add(word.toLowerCase());
    distractors.push(createEmptyBingoDistractor({ word }));
    if (distractors.length >= needed) break;
  }
  return distractors;
}

async function completeJson(system: string, user: string): Promise<unknown> {
  const openai = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.5,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  return extractJsonObject(completion.choices[0]?.message?.content || '{}');
}

export async function generateBingoSet(params: {
  topic: string;
  level: string;
  wordCount: number;
  gridSize: BingoGridSize;
  definitionStyle: string;
}): Promise<{ words: BingoWord[]; distractors: BingoDistractor[] }> {
  const topic = params.topic.trim();
  if (!topic) throw new Error('Add a topic first');
  const level = levelOf(params.level);
  const style = styleOf(params.definitionStyle);
  const gridSize: BingoGridSize = params.gridSize === 5 ? 5 : 4;
  const count = clampBingoWordCount(params.wordCount, gridSize);
  const fillerCount = Math.max(0, bingoCellCount(gridSize) - count);

  const parsed = (await completeJson(
    systemPrompt(level, style),
    `Topic: ${topic}
Learner level: ${level}
Create exactly ${count} target words about this topic.
Create exactly ${fillerCount} extra related words to fill a ${gridSize} by ${gridSize} bingo card.
Those extra words must not be correct answers for any definition.
JSON shape: {"words":[{"word":"Follower","definition":"A person who follows you online."}],"distractors":["Like","Comment"]}`
  )) as { words?: unknown; distractors?: unknown };

  const avoid = new Set<string>();
  const words: BingoWord[] = [];
  const list = Array.isArray(parsed.words) ? parsed.words : [];
  for (const item of list) {
    const word = cleanWord(item, avoid);
    if (!word) continue;
    avoid.add(word.word.toLowerCase());
    words.push(word);
    if (words.length >= count) break;
  }
  if (words.length < Math.min(count, 4)) {
    throw new Error('AI did not return enough words. Try again.');
  }
  const distractors = cleanDistractors(parsed.distractors, avoid, fillerCount);
  return { words, distractors };
}

export async function regenerateBingoWord(params: {
  topic: string;
  level: string;
  definitionStyle: string;
  avoidWords: string[];
}): Promise<BingoWord> {
  const topic = params.topic.trim();
  if (!topic) throw new Error('Add a topic first');
  const level = levelOf(params.level);
  const style = styleOf(params.definitionStyle);
  const avoid = new Set(params.avoidWords.map((word) => word.trim().toLowerCase()).filter(Boolean));
  const parsed = (await completeJson(
    systemPrompt(level, style),
    `Topic: ${topic}
Learner level: ${level}
Write one new target word and one definition.
Do not use these words: ${[...avoid].join(', ') || '(none)'}
JSON shape: {"word":"Story","definition":"A short video or message that disappears after a certain time."}`
  )) as Record<string, unknown>;
  const word = cleanWord(
    { word: parsed.word, definition: parsed.definition },
    avoid
  );
  if (!word) throw new Error('AI returned a word the definition gives away. Try again.');
  return word;
}

export async function regenerateBingoDefinition(params: {
  topic: string;
  level: string;
  definitionStyle: string;
  word: string;
}): Promise<string> {
  const word = displayBingoWord(params.word);
  if (!word) throw new Error('Add the word first');
  const level = levelOf(params.level);
  const style = styleOf(params.definitionStyle);
  const parsed = (await completeJson(
    systemPrompt(level, style),
    `Topic: ${params.topic.trim() || 'general English'}
Learner level: ${level}
Write one new definition for this exact word: ${word}
Do not change the word. Do not include the word in the definition.
JSON shape: {"definition":"A person who follows you online."}`
  )) as { definition?: unknown };
  const definition = String(parsed.definition ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!definition || definitionLeaksAnswer(definition, word)) {
    throw new Error('That definition includes the answer. Try again.');
  }
  return definition.slice(0, 280);
}

export async function generateBingoDistractors(params: {
  topic: string;
  words: string[];
  count: number;
}): Promise<BingoDistractor[]> {
  const topic = params.topic.trim();
  if (!topic) throw new Error('Add a topic first');
  const count = Math.max(1, Math.min(25, Math.round(params.count) || 1));
  const avoid = new Set(params.words.map((word) => word.trim().toLowerCase()).filter(Boolean));
  const parsed = (await completeJson(
    `You suggest extra bingo-card words for an English class. Return JSON only: {"distractors":["Like","Comment"]}`,
    `Topic: ${topic}
These words are already on the card: ${[...avoid].join(', ') || '(none)'}
Give ${count} different related words. They must not be synonyms that could answer a definition of the words already on the card.`
  )) as { distractors?: unknown };
  const distractors = cleanDistractors(parsed.distractors, avoid, count);
  if (distractors.length === 0) throw new Error('AI did not return filler words');
  return distractors;
}
