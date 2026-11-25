import OpenAI from 'openai';

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

/** Pick one classroom sentence that best matches the teacher's award standard. */
export async function awardSentenceContest(params: {
  prompt: string;
  criteria: string;
  grammarTarget: string;
  sentences: string[];
}): Promise<{ winnerIndex: number; reason: string }> {
  const sentences = params.sentences.map((sentence) => sentence.trim()).filter(Boolean);
  const criteria = params.criteria.trim();
  if (sentences.length < 2) {
    throw new Error('Add at least two sentences before awarding a winner.');
  }
  if (!criteria) {
    throw new Error('Say how the AI should award the winner.');
  }

  const numbered = sentences
    .map((sentence, index) => `${index + 1}. ${sentence}`)
    .join('\n');

  const openai = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You judge a classroom sentence contest for English learners.
Pick exactly one winning sentence.
Return JSON: {"winner":1,"reason":"..."}
Rules:
- winner is the sentence number (1-based) from the list.
- reason is one or two short sentences a teacher can read aloud. Say why that sentence best matches the award standard.
- Prefer a sentence that does the task. A sentence that ignores the task should not beat one that does the task and also fits the award standard.
- Do not rewrite the sentences and do not insult the others.`,
      },
      {
        role: 'user',
        content: `Task: ${params.prompt.trim() || '(no task given)'}
Award standard: ${criteria}
Target language: ${params.grammarTarget.trim() || '(none)'}

Sentences:
${numbered}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || '{}';
  const parsed = extractJsonObject(raw) as { winner?: unknown; reason?: unknown };
  const winnerNumber = Number(parsed.winner);
  if (!Number.isInteger(winnerNumber) || winnerNumber < 1 || winnerNumber > sentences.length) {
    throw new Error('The AI did not pick a sentence. Try again.');
  }
  const reason = String(parsed.reason ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!reason) {
    throw new Error('The AI did not explain the winner. Try again.');
  }
  return { winnerIndex: winnerNumber - 1, reason: reason.slice(0, 400) };
}
