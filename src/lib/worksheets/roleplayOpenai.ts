import OpenAI from 'openai';
import { normalizeGuidedRoleplay } from './roleplay';
import type { RoleplayBank, RoleplayLine, RoleplaySettings, WorksheetSection } from './types';

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Worksheet AI is not set up yet. Add OPENAI_API_KEY and try again.');
  }
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

const LEVEL_GUIDE: Record<string, string> = {
  A1: 'Very common words and very short sentences. Students should not have to guess.',
  A2: 'Familiar words and short classroom sentences, like the social-media example a teacher would read with A2 students.',
  B1: 'Clear everyday conversation. Sentences stay speakable in one breath.',
  B2: 'Natural conversation with more precise words, still easy to say aloud.',
  C1: 'Precise and natural, without long academic sentences.',
  C2: 'Nuanced but still a conversation two people would actually say.',
};

function systemPrompt(level: string, difficulty: string, wordUse: string): string {
  return `You write guided speaking worksheets for English teachers.
This is a fill-in-the-blank conversation for a pair, not an open roleplay.
Student A reads Speaker 1. Student B reads Speaker 2. Then they practise it aloud.

Return JSON only:
{"title":"...","objective":"...","banks":[{"label":"How often?","words":["always","often"]}],"lines":[{"speaker":1,"text":"How often do you use social media?","answers":[],"note":""},{"speaker":2,"text":"I ______ use it after school.","answers":[["always","often"]],"note":"Often also fits."}]}

Rules:
- ${LEVEL_GUIDE[level] || LEVEL_GUIDE.A2}
- Difficulty ${difficulty}: easy means one obvious answer and no extra words. standard means clear context and at most one alternative. challenging means a few related distractor words in the banks and some blanks that accept two answers.
- Word use ${wordUse}: once means each target word is the preferred answer of only one blank. repeat means a word may be used again when it sounds natural.
- Start with Speaker 1 and alternate. Give both speakers a similar number of lines.
- The conversation needs a beginning, a middle, and an ending.
- Most of each line is already written. Use ______ only for the target word.
- A line may have no blank. Do not blank every line.
- Every blank needs enough context to choose the word.
- answers is one list per blank, in order. The first word is the best answer. Add another word only when it also fits.
- Do not put the answer word in the visible line.
- Put every target word in a word bank. Group banks by category when the teacher grouped them, or when the words belong to different types.
- Shuffle is not your job. List words in a sensible teaching order; the app shuffles them.
- On challenging activities, add two or three related distractors to the banks. Distractors must not be a correct answer.
- notes are short and only when a blank has more than one fair answer.
- No markdown.`;
}

async function completeRoleplay(system: string, user: string): Promise<Record<string, unknown>> {
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
  const parsed = extractJsonObject(completion.choices[0]?.message?.content || '{}');
  if (!parsed || typeof parsed !== 'object') throw new Error('AI response did not include a conversation');
  return parsed as Record<string, unknown>;
}

export async function generateGuidedRoleplay(params: {
  topic: string;
  exchanges: number;
  settings: RoleplaySettings;
  mode?: 'full' | 'conversation' | 'banks';
  banks?: RoleplayBank[];
  lines?: RoleplayLine[];
}): Promise<Extract<WorksheetSection, { type: 'guided_roleplay' }>> {
  const topic = params.topic.trim();
  if (topic.length < 3 && !params.settings.vocabulary.trim()) {
    throw new Error('Add a topic or the target vocabulary first.');
  }
  const mode = params.mode || 'full';
  const exchanges = Math.max(4, Math.min(10, Math.round(params.exchanges) || 8));
  const settings = params.settings;
  const shared = `Topic: ${topic || 'the vocabulary below'}
Learner level: ${settings.level}
Learning objective: ${settings.objective.trim() || 'Choose a clear speaking objective that matches the topic and level, and write it in objective.'}
Target vocabulary: ${settings.vocabulary.trim() || 'Choose useful words for this topic and level. Group them into banks.'}
Target grammar: ${settings.grammar.trim() || 'No extra grammar target.'}
Exchanges: ${exchanges} pairs, so about ${exchanges * 2} lines.`;

  const user =
    mode === 'conversation'
      ? `${shared}
Keep these word banks. Write a new conversation that uses them. Do not change the banks.
Banks JSON: ${JSON.stringify(params.banks || [])}`
      : mode === 'banks'
        ? `${shared}
Keep this conversation. Rebuild the word banks from its answers. Add distractors only if the difficulty is challenging.
Conversation JSON: ${JSON.stringify(params.lines || [])}`
        : `${shared}
Write the word banks and the full conversation.`;

  const parsed = await completeRoleplay(
    systemPrompt(settings.level, settings.difficulty, settings.wordUse),
    user
  );
  const merged =
    mode === 'conversation'
      ? { ...parsed, banks: params.banks }
      : mode === 'banks'
        ? { ...parsed, lines: params.lines }
        : parsed;
  const section = normalizeGuidedRoleplay(merged, { ...settings, topic, exchanges }, {
    shuffleBanks: mode !== 'conversation',
  });
  if (section.lines.length < 4) {
    throw new Error('The conversation came back too short. Try again.');
  }
  if (section.banks.length === 0 && mode !== 'conversation') {
    throw new Error('The word banks came back empty. Try again.');
  }
  return section;
}
