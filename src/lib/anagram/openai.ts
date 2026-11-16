import OpenAI from 'openai';
import {
  MAX_AI_ANAGRAM_WORDS,
  MAX_ANAGRAM_LETTERS,
  MIN_ANAGRAM_LETTERS,
  VOCAB_LEVELS,
  puzzleWord,
  type AnagramLevel,
} from './types';

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

export interface GeneratedAnagramWord {
  word: string;
  clue: string;
}

function cleanGenerated(value: unknown): GeneratedAnagramWord | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const word = puzzleWord(String(raw.word ?? raw.answer ?? ''));
  if (word.length < MIN_ANAGRAM_LETTERS || word.length > MAX_ANAGRAM_LETTERS) return null;
  let clue = String(raw.clue ?? raw.meaning ?? raw.definition ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  const leaked = new RegExp(`\\b${word}\\b`, 'ig');
  if (leaked.test(clue)) {
    clue = clue.replace(leaked, 'this').replace(/\s+/g, ' ').trim();
  }
  return { word, clue: clue.slice(0, 160) };
}

export async function generateAnagramWords(params: {
  topic: string;
  words: string[];
  count: number;
  level: AnagramLevel;
  notes: string;
}): Promise<GeneratedAnagramWord[]> {
  const level = VOCAB_LEVELS.includes(params.level) ? params.level : 'A2';
  const words = params.words
    .map((word) => puzzleWord(word))
    .filter((word) => word.length >= MIN_ANAGRAM_LETTERS)
    .slice(0, MAX_AI_ANAGRAM_WORDS);
  const topic = params.topic.trim();
  const notes = params.notes.trim();
  const count =
    words.length > 0
      ? words.length
      : Math.max(1, Math.min(MAX_AI_ANAGRAM_WORDS, Math.round(params.count) || 8));

  if (!topic && words.length === 0) {
    throw new Error('Add a topic or a list of words first');
  }

  const openai = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const source = words.length
    ? `Use exactly these words, in this order. Write one item per word. Do not add, drop, or change a word.
Words:
${words.map((word) => `- ${word}`).join('\n')}
${topic ? `Topic context: ${topic}` : ''}`
    : `Choose ${count} high-frequency English words for this topic. One word each, ${MIN_ANAGRAM_LETTERS} to 12 letters, no spaces.
Topic: ${topic}
Do not pick obscure words. Do not repeat a word.`;

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You write anagram puzzles for English language teachers.
Return JSON only: {"words":[{"word":"school","clue":"a place where students learn"}]}

Rules:
- word: one English word, lowercase, letters only.
- clue: a simple definition a ${level} learner can understand. Maximum 14 words.
- The clue must not contain the answer word, or a form of that word.
- No example sentences, no markdown, no extra keys.`,
      },
      {
        role: 'user',
        content: `Learner level: ${level}
${source}
${notes ? `Teacher notes: ${notes}` : ''}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || '{}';
  const parsed = extractJsonObject(raw) as { words?: unknown; cards?: unknown };
  const list = Array.isArray(parsed.words)
    ? parsed.words
    : Array.isArray(parsed.cards)
      ? parsed.cards
      : [];
  const seen = new Set<string>();
  const generated: GeneratedAnagramWord[] = [];
  for (const item of list) {
    const word = cleanGenerated(item);
    if (!word) continue;
    if (!word.clue && words.length === 0) continue;
    if (seen.has(word.word)) continue;
    seen.add(word.word);
    generated.push(word);
    if (generated.length >= count) break;
  }

  if (words.length > 0) {
    const byWord = new Map(generated.map((item) => [item.word, item]));
    const ordered = words.map((word) => {
      const found = byWord.get(word);
      return found || { word, clue: '' };
    });
    if (ordered.every((item) => !item.clue)) {
      throw new Error('AI did not return clues for those words');
    }
    return ordered;
  }

  if (generated.length === 0) {
    throw new Error('AI did not return any words');
  }
  return generated;
}
