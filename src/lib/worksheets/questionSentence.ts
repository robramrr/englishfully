const GAP = /_{3,}/;
const QUESTION_WORDS = new Set(['who', 'what', 'when', 'where', 'why', 'how', 'which', 'whose']);
const HOW_FOLLOW = new Set(['many', 'much', 'long', 'often', 'old', 'far']);

export interface SentencePiece {
  type: 'text' | 'blank';
  text: string;
  /** How many words this blank stands in for. Longer answers get a longer line. */
  words?: number;
}

export function emptyQuestionSentenceItem(): {
  question: string;
  underline: number[];
  sentence: string;
  blanks: [number, number][];
} {
  return { question: '', underline: [], sentence: '', blanks: [] };
}

export function wordTokens(text: string): string[] {
  return text.match(/\S+/g) ?? [];
}

export function wordSpans(text: string): { word: string; start: number; end: number }[] {
  const spans: { word: string; start: number; end: number }[] = [];
  const pattern = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    spans.push({ word: match[0], start: match.index, end: match.index + match[0].length });
  }
  return spans;
}

export function trailingPunct(word: string): string {
  return word.match(/[.,!?;:]+$/)?.[0] ?? '';
}

export function normalizeToken(word: string): string {
  return word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toLowerCase();
}

export function rangesFromIndexes(indexes: number[]): [number, number][] {
  const sorted = [...new Set(indexes)].filter((index) => index >= 0).sort((a, b) => a - b);
  const ranges: [number, number][] = [];
  for (const index of sorted) {
    const last = ranges[ranges.length - 1];
    if (last && index === last[1] + 1) last[1] = index;
    else ranges.push([index, index]);
  }
  return ranges;
}

export function indexesFromRanges(ranges: [number, number][]): number[] {
  const indexes: number[] = [];
  for (const [start, end] of ranges) {
    const from = Math.min(start, end);
    const to = Math.max(start, end);
    for (let index = from; index <= to; index += 1) indexes.push(index);
  }
  return indexes;
}

export function underlineQuestionWords(question: string): number[] {
  const words = wordTokens(question);
  const indexes: number[] = [];
  words.forEach((word, index) => {
    const bare = normalizeToken(word);
    if (QUESTION_WORDS.has(bare)) indexes.push(index);
    const previous = index > 0 ? normalizeToken(words[index - 1]) : '';
    if (previous === 'how' && HOW_FOLLOW.has(bare)) indexes.push(index);
  });
  return indexes;
}

export function remapIndexes(previous: string, next: string, indexes: number[]): number[] {
  const oldWords = wordTokens(previous);
  const newWords = wordTokens(next);
  const wanted = [...new Set(indexes)]
    .filter((index) => index >= 0 && index < oldWords.length)
    .sort((a, b) => a - b)
    .map((index) => normalizeToken(oldWords[index]))
    .filter(Boolean);
  const nextIndexes: number[] = [];
  let from = 0;
  for (const word of wanted) {
    const found = newWords.findIndex(
      (candidate, index) => index >= from && normalizeToken(candidate) === word
    );
    if (found >= 0) {
      nextIndexes.push(found);
      from = found + 1;
    }
  }
  return nextIndexes;
}

export function remapRanges(
  previous: string,
  next: string,
  ranges: [number, number][]
): [number, number][] {
  return rangesFromIndexes(remapIndexes(previous, next, indexesFromRanges(ranges)));
}

export function wordIndexesTouching(text: string, start: number, end: number): number[] {
  if (end <= start) return [];
  return wordSpans(text)
    .map((span, index) => (span.end > start && span.start < end ? index : -1))
    .filter((index) => index >= 0);
}

export function questionPieces(
  question: string,
  underline: number[]
): { text: string; underline: boolean }[] {
  const marked = new Set(underline);
  const pieces: { text: string; underline: boolean }[] = [];
  const pattern = /\S+|\s+/g;
  let match: RegExpExecArray | null;
  let wordIndex = 0;
  while ((match = pattern.exec(question))) {
    const token = match[0];
    if (/^\s+$/.test(token)) pieces.push({ text: token, underline: false });
    else {
      pieces.push({ text: token, underline: marked.has(wordIndex) });
      wordIndex += 1;
    }
  }
  return pieces;
}

export function sentencePieces(sentence: string, blanks: [number, number][]): SentencePiece[] {
  const wordCount = wordTokens(sentence).length;
  const hidden = new Set(indexesFromRanges(blanks).filter((index) => index >= 0 && index < wordCount));
  const pieces: SentencePiece[] = [];
  const pattern = /\S+|\s+/g;
  let match: RegExpExecArray | null;
  let wordIndex = 0;
  let inRun = false;
  let pendingSpace = '';
  let pendingPunct = '';
  let run: SentencePiece | null = null;

  const closeRun = () => {
    if (!inRun) return;
    if (pendingPunct) pieces.push({ type: 'text', text: pendingPunct });
    if (pendingSpace) pieces.push({ type: 'text', text: pendingSpace });
    inRun = false;
    pendingPunct = '';
    pendingSpace = '';
    run = null;
  };

  while ((match = pattern.exec(sentence))) {
    const token = match[0];
    if (/^\s+$/.test(token)) {
      if (inRun) pendingSpace = token;
      else pieces.push({ type: 'text', text: token });
      continue;
    }
    const typedGap = GAP.test(token);
    if (hidden.has(wordIndex) || typedGap) {
      if (!inRun || !run) {
        run = { type: 'blank', text: '', words: 1 };
        pieces.push(run);
        inRun = true;
      } else {
        run.words = (run.words || 1) + 1;
      }
      pendingSpace = '';
      pendingPunct = trailingPunct(token);
    } else {
      closeRun();
      pieces.push({ type: 'text', text: token });
    }
    wordIndex += 1;
  }
  if (inRun && pendingPunct) pieces.push({ type: 'text', text: pendingPunct });
  return pieces;
}

function isGapToken(word: string): boolean {
  return GAP.test(word);
}

function skeletonMatches(studentWords: string[], answerWords: string[]): boolean {
  let cursor = 0;
  for (const word of studentWords) {
    if (isGapToken(word)) continue;
    const wanted = normalizeToken(word);
    if (!wanted) continue;
    const found = answerWords.findIndex(
      (candidate, index) => index >= cursor && normalizeToken(candidate) === wanted
    );
    if (found < 0) return false;
    cursor = found + 1;
  }
  return true;
}

function spliceMissing(
  studentWords: string[],
  answerWords: string[]
): { sentence: string; blanks: [number, number][] } {
  const built: string[] = [];
  const blanks: number[] = [];
  let used = false;
  for (const word of studentWords) {
    if (!isGapToken(word)) {
      built.push(word);
      continue;
    }
    if (used) continue;
    const punct = trailingPunct(word);
    const start = built.length;
    if (answerWords.length === 0) {
      built.push('______');
      blanks.push(start);
    } else {
      answerWords.forEach((part, index) => {
        const last = index === answerWords.length - 1;
        built.push(last && punct && !trailingPunct(part) ? `${part}${punct}` : part);
        blanks.push(start + index);
      });
    }
    used = true;
  }
  return { sentence: built.join(' '), blanks: rangesFromIndexes(blanks) };
}

function alignFullAnswer(
  studentWords: string[],
  answerWords: string[],
  answer: string
): { sentence: string; blanks: [number, number][] } {
  const blanks: number[] = [];
  let cursor = 0;
  for (let index = 0; index < studentWords.length; index += 1) {
    const word = studentWords[index];
    if (isGapToken(word)) {
      const next = studentWords
        .slice(index + 1)
        .find((candidate) => !isGapToken(candidate) && normalizeToken(candidate));
      const start = cursor;
      if (!next) cursor = answerWords.length;
      else {
        const wanted = normalizeToken(next);
        const found = answerWords.findIndex(
          (candidate, wordIndex) => wordIndex >= cursor && normalizeToken(candidate) === wanted
        );
        cursor = found >= 0 ? found : answerWords.length;
      }
      for (let blank = start; blank < cursor; blank += 1) blanks.push(blank);
      continue;
    }
    const wanted = normalizeToken(word);
    if (!wanted) continue;
    if (normalizeToken(answerWords[cursor] || '') === wanted) {
      cursor += 1;
      continue;
    }
    const found = answerWords.findIndex(
      (candidate, wordIndex) => wordIndex >= cursor && normalizeToken(candidate) === wanted
    );
    if (found >= 0) {
      for (let blank = cursor; blank < found; blank += 1) blanks.push(blank);
      cursor = found + 1;
    }
  }
  for (let blank = cursor; blank < answerWords.length; blank += 1) blanks.push(blank);
  return { sentence: answer, blanks: rangesFromIndexes(blanks) };
}

/** Turn an AI sentence that uses ______ into the full sentence plus blank ranges. */
export function mergeBlankAnswer(
  student: string,
  answer: string
): { sentence: string; blanks: [number, number][] } {
  const studentWords = wordTokens(student);
  const hasGap = studentWords.some(isGapToken);
  const answerWords = wordTokens(answer);
  if (!hasGap) return { sentence: (student || answer).trim(), blanks: [] };
  if (answerWords.length === 0) {
    return {
      sentence: student.trim(),
      blanks: rangesFromIndexes(
        studentWords.map((word, index) => (isGapToken(word) ? index : -1)).filter((index) => index >= 0)
      ),
    };
  }
  if (!skeletonMatches(studentWords, answerWords)) return spliceMissing(studentWords, answerWords);
  return alignFullAnswer(studentWords, answerWords, answer.trim());
}
