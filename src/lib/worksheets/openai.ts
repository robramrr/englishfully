import OpenAI from 'openai';
import { VOCAB_LEVELS, type VocabLevel } from '@/lib/vocabulary/types';
import { normalizeWorksheet } from './normalize';
import {
  exerciseLabel,
  type WorksheetExerciseRequest,
  type WorksheetSection,
} from './types';

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
  if (start < 0 || end <= start) {
    throw new Error('AI response did not include JSON');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function generateWorksheet(params: {
  source: string;
  level: VocabLevel;
  exercises: WorksheetExerciseRequest[];
}): Promise<{ title: string; instructions: string; sections: WorksheetSection[] }> {
  const level = VOCAB_LEVELS.includes(params.level) ? params.level : 'A2';
  const source = params.source.trim().slice(0, 8000);
  if (source.length < 3) {
    throw new Error('Paste a topic or a transcript first.');
  }
  if (params.exercises.length === 0) {
    throw new Error('Choose at least one exercise.');
  }

  const openai = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const exerciseLines = params.exercises
    .map((exercise) => `- ${exercise.type}: exactly ${exercise.count} items. Title it "${exerciseLabel(exercise.type)}".`)
    .join('\n');

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You write printable English worksheets for language teachers.
Return JSON only with this shape:
{"title":"...","instructions":"...","sections":[{"type":"fill_blank","title":"...","instructions":"...","items":[...]}]}

Section item shapes:
- fill_blank items: {"prompt":"She ______ to school.","answer":"goes"}
- multiple_choice items: {"prompt":"...","choices":["...","...","...","..."],"answer":"the correct choice text"}
- matching items: {"left":"apple","right":"a fruit"}
- unjumble items: {"answer":"She goes to school every day."}
- anagram items: {"clue":"a place where students learn","answer":"school"}
- true_false items: {"statement":"...","answer":true}
- short_answer items: {"prompt":"...","answer":"a short sample answer"}
- crossword items: {"clue":"a place where students learn","answer":"school"}

Rules:
- Use only the requested section types, in the requested order.
- Every item must match learner level ${level}: short, natural, classroom English.
- Base every item on the teacher's source. If the source is a topic, invent suitable practice. If it is a transcript or reading, do not contradict it.
- Do not repeat the same answer across a section.
- fill_blank: the answer is one word or a short phrase and it is missing from the prompt. Use ______ for the gap.
- multiple_choice: exactly 4 plausible choices. Only one is correct.
- matching: left is the prompt, right is the match. Rights in one section must all be different.
- unjumble: answer is one correct sentence of 4 to 10 words. Do not include a scrambled word list.
- anagram: answer is one English word of 4 to 12 letters. The clue must not contain the answer.
- true_false: about half the statements are false. False statements are clearly false at this level.
- short_answer: one question a student can answer in a few words, plus a sample answer.
- crossword: each answer is one English word of 4 to 8 letters, with no spaces. The clue must not contain the answer. Choose words that share letters so they can cross, using common letters such as A, E, I, O, R, S, T, L, and N.
- instructions: one short line telling the student what to do on the whole sheet.
- No markdown and no extra keys.`,
      },
      {
        role: 'user',
        content: `Learner level: ${level}
Create these sections only:
${exerciseLines}

Teacher source:
${source}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || '{}';
  return normalizeWorksheet(extractJsonObject(raw), params.exercises);
}
