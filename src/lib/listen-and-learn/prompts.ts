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
- Label choices with A., B., C., D. prefixes

Return valid JSON only:
{
  "question_text": "string",
  "choices": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "correct_answer": "exact text of one choice",
  "explanation": "string"
}`;
}
