import type { CefrLevel, LearnDifficulty } from './types';

export function buildSegmentQuestionPrompt(params: {
  framework: string;
  cefrLevel: CefrLevel;
  difficulty: LearnDifficulty;
  sentenceText: string;
}): string {
  return `You are an expert English listening test writer creating materials in the style of "${params.framework}".

CEFR level: ${params.cefrLevel}
Difficulty: ${params.difficulty}

The student will hear ONLY this short listening segment (they cannot see the transcript):

"""
${params.sentenceText}
"""

Generate exactly ONE multiple-choice listening comprehension question based ONLY on this segment.

Requirements:
- Test listening comprehension (main idea, meaning, inference, vocabulary in context, speaker intention, or factual detail)
- Do NOT require memorization of unrelated content
- Exactly 4 plausible answer choices
- Exactly one correct answer
- Match CEFR ${params.cefrLevel} and ${params.difficulty} difficulty
- Include a short teacher explanation
- Use clear classroom-appropriate English
- Do NOT prefix choices with A., B., C., D. (or A) B) etc.) — the interface adds letters already
- choices must be plain answer text only, e.g. "They watched a DVD"

Return valid JSON only:
{
  "question_text": "string",
  "choices": ["plain choice text", "plain choice text", "plain choice text", "plain choice text"],
  "correct_answer": "exact text of one choice (no letter prefix)",
  "explanation": "string"
}`;
}

export function buildVocabularyPrompt(params: {
  framework: string;
  cefrLevel: CefrLevel;
  transcript: string;
  count: number;
}): string {
  return `You are an expert English vocabulary teacher creating materials in the style of "${params.framework}".

CEFR level: ${params.cefrLevel}

From this listening transcript, choose the ${params.count} most useful vocabulary words for learners at CEFR ${params.cefrLevel}.

Transcript:
"""
${params.transcript}
"""

Requirements:
- Exactly ${params.count} words (or fewer only if the transcript is very short)
- Prefer content words that appear in the transcript (nouns, verbs, adjectives, useful phrases of 1–2 words)
- Avoid ultra-basic function words (the, and, is, a, to) unless they are part of a useful chunk
- Each word must appear in the transcript (same spelling, ignoring capitalization)
- Give a clear, simple classroom definition suitable for CEFR ${params.cefrLevel}
- Definition should be one short sentence in plain English
- Do NOT invent words that are not in the transcript

Return valid JSON only:
{
  "vocabulary": [
    { "word": "example", "definition": "a clear short definition" }
  ]
}`;
}
