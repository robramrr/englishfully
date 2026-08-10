export function buildEscapeRoomGeneratePrompt(input: {
  topic: string;
  title?: string;
  mission?: string;
  learning_objective?: string;
  english_level?: string;
  challenge_count: number;
  worksheet?: string;
  vocabulary?: string;
  media_notes?: string;
}): string {
  return `You are designing an educational English escape-room lesson for secondary-school students.

Return ONLY valid JSON matching this shape:
{
  "title": string,
  "mission": string,
  "instructions": string,
  "learning_objective": string,
  "english_level": string,
  "estimated_time": string,
  "final_code": string,
  "final_success_message": string,
  "challenges": [
    {
      "type": "image_investigation" | "vocabulary" | "sentence_building" | "multiple_choice" | "fill_in_blank" | "listening" | "video" | "code_lock" | "open_response" | "matching",
      "title": string,
      "instructions": string,
      "question": string,
      "sentence": string,
      "choices": string[],
      "accepted_answers": string[],
      "pairs": [{"left": string, "right": string}],
      "hint_1": string,
      "hint_2": string,
      "final_hint": string,
      "reward_kind": "letter" | "number" | "word" | "custom",
      "reward_value": string,
      "clue": string
    }
  ]
}

Rules:
- Exactly ${input.challenge_count} challenges.
- The LAST challenge MUST be type "code_lock".
- Earlier challenges should award reward pieces that combine into final_code (no spaces).
- Prefer concrete English practice: image investigation, sentence building, vocabulary/matching, multiple choice, listening.
- Multiple acceptable answers are allowed in accepted_answers.
- Keep language appropriate for level ${input.english_level || 'A2-B1'}.
- Do not invent real external image/audio URLs. Leave media empty; teacher will attach URLs.
- If worksheet/vocabulary content is provided, ground challenges in that material.

Teacher topic / brief:
${input.topic}

Optional title: ${input.title || '(none)'}
Optional mission: ${input.mission || '(none)'}
Optional learning objective: ${input.learning_objective || '(none)'}
Optional media notes: ${input.media_notes || '(none)'}

Worksheet content:
${input.worksheet || '(none)'}

Vocabulary list:
${input.vocabulary || '(none)'}
`;
}
