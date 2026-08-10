import type {
  EscapeAnswerConfig,
  EscapeChallengeContent,
  EscapeChallengeType,
  EscapeMediaItem,
  EscapeRoomChallenge,
} from './types';
import { emptyAnswerConfig } from './types';

export interface VocabPair {
  left: string;
  right: string;
}

export interface ImageInvestigationContent {
  question: string;
  clue?: string;
}

export interface SentenceBuildingContent {
  sentence: string;
  blanks?: number;
}

export interface ListeningContent {
  audio_url: string;
  transcript: string;
  question: string;
}

export interface VideoContent {
  video_url: string;
  question: string;
}

export interface MatchingContent {
  pairs: VocabPair[];
}

export interface CodeLockContent {
  prompt: string;
}

function asString(value: unknown): string {
  return String(value ?? '').trim();
}

export function normalizeAnswer(value: string, caseSensitive = false): string {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  return caseSensitive ? trimmed : trimmed.toLowerCase();
}

export function getPrimaryMedia(
  media: EscapeMediaItem[],
  kind: EscapeMediaItem['kind']
): EscapeMediaItem | null {
  return media.find((item) => item.kind === kind && item.url.trim()) || null;
}

export function getQuestionFromContent(
  type: EscapeChallengeType,
  content: EscapeChallengeContent
): string {
  if (type === 'sentence_building') return asString(content.sentence);
  if (type === 'code_lock') return asString(content.prompt) || 'Enter the final escape code.';
  return asString(content.question);
}

export function parseVocabPairs(content: EscapeChallengeContent): VocabPair[] {
  const raw = content.pairs;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const left = asString((item as VocabPair).left);
      const right = asString((item as VocabPair).right);
      if (!left || !right) return null;
      return { left, right };
    })
    .filter((item): item is VocabPair => Boolean(item));
}

export function checkChallengeAnswer(params: {
  challenge: Pick<
    EscapeRoomChallenge,
    'type' | 'content' | 'answer_configuration' | 'media'
  >;
  /** Final room code — used for code_lock challenges. */
  finalCode?: string;
  answer: string;
  /** For matching: JSON map of left -> right */
  matchingAnswers?: Record<string, string>;
}): { correct: boolean; message: string } {
  const { challenge, answer, finalCode, matchingAnswers } = params;
  const config: EscapeAnswerConfig = {
    ...emptyAnswerConfig(),
    ...challenge.answer_configuration,
  };
  const caseSensitive = Boolean(config.case_sensitive);

  if (challenge.type === 'matching' || challenge.type === 'vocabulary') {
    const pairs = parseVocabPairs(challenge.content);
    if (pairs.length === 0) {
      return { correct: false, message: 'This challenge is not configured yet.' };
    }
    const answers = matchingAnswers || {};
    const allMatch = pairs.every((pair) => {
      const chosen = normalizeAnswer(answers[pair.left] ?? '', caseSensitive);
      return chosen === normalizeAnswer(pair.right, caseSensitive);
    });
    return {
      correct: allMatch,
      message: allMatch ? 'All matches are correct!' : 'Not quite. Check your matches.',
    };
  }

  if (challenge.type === 'code_lock') {
    const expected = normalizeAnswer(finalCode || config.accepted_answers[0] || '', caseSensitive);
    const given = normalizeAnswer(answer, caseSensitive).replace(/\s+/g, '');
    const ok = Boolean(expected) && given === expected.replace(/\s+/g, '');
    return {
      correct: ok,
      message: ok ? 'Code accepted!' : 'Incorrect code. Try again.',
    };
  }

  const accepted = (config.accepted_answers || [])
    .map((item) => normalizeAnswer(item, caseSensitive))
    .filter(Boolean);
  if (accepted.length === 0) {
    return { correct: false, message: 'This challenge has no accepted answers yet.' };
  }

  const given = normalizeAnswer(answer, caseSensitive);
  const correct = accepted.some(
    (item) => given === item || given.includes(item) || item.includes(given)
  );
  return {
    correct,
    message: correct ? 'Correct!' : 'Not quite. Try again.',
  };
}

export function defaultContentForType(type: EscapeChallengeType): EscapeChallengeContent {
  switch (type) {
    case 'image_investigation':
      return { question: '', clue: '' };
    case 'sentence_building':
    case 'fill_in_blank':
      return { sentence: '' };
    case 'listening':
      return { audio_url: '', transcript: '', question: '' };
    case 'video':
      return { video_url: '', question: '' };
    case 'vocabulary':
    case 'matching':
      return { pairs: [] };
    case 'code_lock':
      return { prompt: 'Enter the final escape code to open the doors.' };
    case 'multiple_choice':
    case 'open_response':
    default:
      return { question: '' };
  }
}

export function youtubeEmbedUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
      const parts = parsed.pathname.split('/');
      const embedIndex = parts.indexOf('embed');
      if (embedIndex >= 0 && parts[embedIndex + 1]) {
        return `https://www.youtube.com/embed/${parts[embedIndex + 1]}`;
      }
    }
  } catch {
    return null;
  }
  return null;
}
