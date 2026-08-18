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

export async function analyzeDescribeImage(params: {
  imageUrl: string;
}): Promise<{ matches: string[]; distractors: string[] }> {
  const imageUrl = params.imageUrl.trim();
  if (!imageUrl) {
    throw new Error('Image URL is required');
  }

  const openai = getOpenAIClient();
  const model = process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You help ESL teachers build a "describe the image" word bank.
Look at the image and return JSON:
{"matches":["..."],"distractors":["..."]}

Rules:
- matches: 8–14 short English nouns or adjectives that clearly describe something visible in the image (or a clear quality of it). Prefer everyday classroom vocabulary. Single words preferred; short two-word phrases OK (e.g. "blue sky").
- distractors: 6–10 plausible nouns/adjectives that do NOT match this image (wrong objects, colors, settings, or moods). Keep them the same difficulty as matches.
- Lowercase unless a proper noun.
- No duplicates across matches and distractors.
- No full sentences.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this image and build the word bank.',
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl, detail: 'low' },
          },
        ],
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || '{}';
  const parsed = extractJsonObject(raw) as {
    matches?: unknown;
    distractors?: unknown;
  };

  const cleanList = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of value) {
      const text = String(item ?? '')
        .trim()
        .replace(/\s+/g, ' ');
      if (!text) continue;
      const key = text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(text);
    }
    return out;
  };

  const matches = cleanList(parsed.matches);
  const matchKeys = new Set(matches.map((item) => item.toLowerCase()));
  const distractors = cleanList(parsed.distractors).filter(
    (item) => !matchKeys.has(item.toLowerCase())
  );

  if (matches.length === 0) {
    throw new Error('Could not find describing words for this image');
  }

  return { matches, distractors };
}
