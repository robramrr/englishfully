/** One spoken word and where it sits in the source audio. */
export interface CaptionWord {
  text: string;
  start: number;
  end: number;
}

export function normalizeCaptionWords(value: unknown): CaptionWord[] {
  if (!Array.isArray(value)) return [];
  const words: CaptionWord[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as { text?: unknown; word?: unknown; start?: unknown; end?: unknown };
    const text = String(raw.text ?? raw.word ?? '').trim();
    const start = Number(raw.start);
    const end = Number(raw.end);
    if (!text || !Number.isFinite(start) || !Number.isFinite(end)) continue;
    words.push({
      text,
      start: Math.max(0, start),
      end: Math.max(start + 0.05, end),
    });
  }
  return words;
}

function compactCaptionText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Space typed words evenly across a clip when the audio has no word times. */
export function estimateCaptionWords(text: string, start: number, end: number): CaptionWord[] {
  const parts = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (parts.length === 0) return [];
  const safeStart = Math.max(0, Number(start) || 0);
  const safeEnd = Math.max(safeStart + 0.3, Number(end) || safeStart + 0.3);
  const slice = (safeEnd - safeStart) / parts.length;
  return parts.map((part, index) => ({
    text: part,
    start: Number((safeStart + index * slice).toFixed(3)),
    end: Number(
      (index === parts.length - 1 ? safeEnd : safeStart + (index + 1) * slice).toFixed(3)
    ),
  }));
}

/**
 * Use saved word times when they still match the caption text.
 * Otherwise space the current text across the clip.
 */
export function captionWordsForClip(
  text: string,
  start: number,
  end: number,
  saved?: CaptionWord[] | null
): CaptionWord[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  const words = (saved || []).filter((word) => word.text.trim());
  const savedText = words.map((word) => word.text.trim()).join(' ');
  if (words.length > 0 && compactCaptionText(savedText) === compactCaptionText(clean)) {
    return words;
  }
  return estimateCaptionWords(clean, start, end);
}

/** Keep the spoken words that fall inside each clip. */
export function attachWordsToSegments<T extends { start_seconds: number; end_seconds: number }>(
  segments: T[],
  words: Array<{ word: string; start: number; end: number }>
): Array<T & { words: CaptionWord[] }> {
  return segments.map((segment) => ({
    ...segment,
    words: words
      .filter((word) => {
        const mid = (Number(word.start) + Number(word.end)) / 2;
        return mid >= segment.start_seconds - 0.05 && mid <= segment.end_seconds + 0.05;
      })
      .map((word) => {
        const start = Math.max(0, Number(word.start) || 0);
        return {
          text: String(word.word ?? '').trim(),
          start: Number(start.toFixed(3)),
          end: Number(Math.max(start + 0.05, Number(word.end) || start).toFixed(3)),
        };
      })
      .filter((word) => word.text),
  }));
}

export function activeCaptionIndex(words: CaptionWord[], time: number): number {
  if (words.length === 0) return -1;
  if (time <= words[0].start) return 0;
  for (let index = 0; index < words.length; index += 1) {
    if (time >= words[index].start && time < words[index].end) return index;
  }
  let last = 0;
  for (let index = 0; index < words.length; index += 1) {
    if (words[index].start <= time) last = index;
    else break;
  }
  return last;
}

/** A short phrase around the spoken word, instead of the whole caption. */
export function captionLineAround(words: CaptionWord[], index: number, maxWords = 5): CaptionWord[] {
  if (words.length === 0 || index < 0) return [];
  const start = Math.floor(index / maxWords) * maxWords;
  return words.slice(start, start + maxWords);
}
