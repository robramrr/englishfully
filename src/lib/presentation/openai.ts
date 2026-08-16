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

export async function findGrammarMatches(params: {
  text: string;
  grammarTarget: string;
}): Promise<string[]> {
  const text = params.text.trim();
  const grammarTarget = params.grammarTarget.trim();
  if (!text || !grammarTarget) return [];

  const openai = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an English grammar highlighter for ESL teachers.
Given student/teacher text and a target grammar concept, return ONLY the exact surface forms from the text that exemplify that concept.
Rules:
- Return JSON: {"matches":["..."]}
- Each match must be copied exactly from the text (same spelling/casing as it appears).
- Include every distinct occurrence form (e.g. "my", "your", "her").
- Do not invent words that are not in the text.
- If nothing matches, return {"matches":[]}.
- Prefer the smallest meaningful phrase that demonstrates the grammar.`,
      },
      {
        role: 'user',
        content: `Target grammar: ${grammarTarget}\n\nText:\n${text}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || '{}';
  const parsed = extractJsonObject(raw) as { matches?: unknown };
  const matches = Array.isArray(parsed.matches)
    ? parsed.matches
        .map((item) => String(item ?? '').trim())
        .filter(Boolean)
        .filter((match) => text.toLowerCase().includes(match.toLowerCase()))
    : [];

  // Unique, longest-first for non-overlapping highlight
  const unique = Array.from(new Set(matches));
  unique.sort((a, b) => b.length - a.length);
  return unique;
}
