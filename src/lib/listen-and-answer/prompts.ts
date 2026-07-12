import type { AiQuestionPart, CefrLevel } from './types';

interface QuestionPromptParams {
  framework: string;
  cefrLevels: CefrLevel[];
  transcript: string;
  part: AiQuestionPart;
}

const PART_A_FOCUS = `Main idea, general understanding, speaker's purpose, speaker's feelings or opinion, and overall message.`;

const PART_B_FOCUS = `Specific details, facts, sequence of events, names, actions, reasons, and cause and effect.`;

export function buildQuestionGenerationPrompt({
  framework,
  cefrLevels,
  transcript,
  part,
}: QuestionPromptParams): string {
  const focus = part === 'A' ? PART_A_FOCUS : PART_B_FOCUS;
  const partLabel = part === 'A' ? 'Part A — Main Idea' : 'Part B — Detail';

  return `You are an expert English listening test writer creating materials in the style of "${framework}".

CEFR difficulty levels: ${cefrLevels.join(', ')}

Use this transcript as the ONLY source of truth:

"""
${transcript}
"""

Generate exactly 5 multiple-choice listening questions for ${partLabel}.

Focus on: ${focus}

Requirements:
- Style: ${framework} listening task style
- Avoid trick questions
- Each question must have exactly 4 plausible answer choices
- Exactly one correct answer per question
- Questions must be answerable from the transcript alone
- Use clear, classroom-appropriate English
- Part A = overall comprehension; Part B = specific detail comprehension

Return valid JSON only, with this shape:
{
  "questions": [
    {
      "question_text": "string",
      "question_type": "multiple_choice",
      "choices": ["A", "B", "C", "D"],
      "correct_answer": "exact text of one choice"
    }
  ]
}`;
}
