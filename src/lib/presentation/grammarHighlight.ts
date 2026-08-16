export interface GrammarHighlightSpan {
  start: number;
  end: number;
  text: string;
}

/** Build non-overlapping highlight spans from AI match phrases. */
export function buildGrammarHighlightSpans(
  text: string,
  matches: string[]
): GrammarHighlightSpan[] {
  if (!text || matches.length === 0) return [];

  const sorted = [...matches]
    .map((match) => match.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  const occupied = new Array<boolean>(text.length).fill(false);
  const spans: GrammarHighlightSpan[] = [];
  const lower = text.toLowerCase();

  for (const match of sorted) {
    const needle = match.toLowerCase();
    let from = 0;
    while (from <= lower.length - needle.length) {
      const index = lower.indexOf(needle, from);
      if (index < 0) break;
      const end = index + needle.length;
      const overlaps = occupied.slice(index, end).some(Boolean);
      if (!overlaps) {
        for (let i = index; i < end; i += 1) occupied[i] = true;
        spans.push({
          start: index,
          end,
          text: text.slice(index, end),
        });
      }
      from = index + 1;
    }
  }

  spans.sort((a, b) => a.start - b.start);
  return spans;
}
