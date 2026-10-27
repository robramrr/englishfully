import OpenAI from 'openai';
import {
  MAX_AI_CARDS,
  VOCAB_LEVELS,
  type VocabLevel,
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

export interface GeneratedVocabCard {
  word: string;
  meaning: string;
  example: string;
  partOfSpeech: string;
}

function cleanCard(value: unknown): GeneratedVocabCard | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const word = String(raw.word ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  const meaning = String(raw.meaning ?? raw.definition ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!word || !meaning) return null;
  return {
    word,
    meaning,
    example: String(raw.example ?? '')
      .trim()
      .replace(/\s+/g, ' '),
    partOfSpeech: String(raw.partOfSpeech ?? raw.part_of_speech ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 32),
  };
}

export async function generateVocabCards(params: {
  topic: string;
  words: string[];
  count: number;
  level: VocabLevel;
  notes: string;
}): Promise<GeneratedVocabCard[]> {
  const level = VOCAB_LEVELS.includes(params.level) ? params.level : 'A2';
  const words = params.words.map((word) => word.trim()).filter(Boolean).slice(0, MAX_AI_CARDS);
  const topic = params.topic.trim();
  const notes = params.notes.trim();
  const count =
    words.length > 0
      ? words.length
      : Math.max(1, Math.min(MAX_AI_CARDS, Math.round(params.count) || 8));

  if (!topic && words.length === 0) {
    throw new Error('Add a topic or a list of words first');
  }

  const openai = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const source = words.length
    ? `Use exactly these words, in this order. Write one card per word. Do not add, drop, or merge words.
Words:
${words.map((word) => `- ${word}`).join('\n')}
${topic ? `Topic context: ${topic}` : ''}`
    : `Choose ${count} high-frequency, teachable English words for this topic.
Topic: ${topic}
Do not pick obscure words. Do not repeat a word.`;

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You write vocabulary flashcards for English language teachers.
Return JSON only: {"cards":[{"word":"...","partOfSpeech":"noun","meaning":"...","example":"..."}]}

Rules:
- One useful meaning per card.
- meaning: simple English a ${level} learner can understand. Maximum 14 words. Do not use the target word inside the meaning.
- example: one natural ${level} sentence that contains the target word or a clear form of it.
- partOfSpeech: noun, verb, adjective, adverb, phrase, preposition, or pronoun.
- Lowercase the word unless it is a proper noun.
- No pictures, no markdown, no extra keys.`,
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
  const parsed = extractJsonObject(raw) as { cards?: unknown };
  const seen = new Set<string>();
  const cards: GeneratedVocabCard[] = [];
  const list = Array.isArray(parsed.cards) ? parsed.cards : [];
  for (const item of list) {
    const card = cleanCard(item);
    if (!card) continue;
    const key = card.word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cards.push(card);
    if (cards.length >= count) break;
  }

  if (words.length > 0) {
    const byWord = new Map(cards.map((card) => [card.word.toLowerCase(), card]));
    const ordered = words
      .map((word) => byWord.get(word.toLowerCase()))
      .filter((card): card is GeneratedVocabCard => Boolean(card));
    if (ordered.length === 0) {
      throw new Error('AI did not return cards for those words');
    }
    return ordered;
  }

  if (cards.length === 0) {
    throw new Error('AI did not return any vocabulary cards');
  }
  return cards;
}
