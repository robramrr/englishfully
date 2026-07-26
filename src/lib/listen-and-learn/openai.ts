import OpenAI from 'openai';
import type {
  CefrLevel,
  GeneratedLearnQuestion,
  GeneratedVocabularyItem,
  LearnDifficulty,
  TranscriptSegmentDraft,
} from './types';
import { mergeShortSegments, splitIntoSentences, stripChoiceLetterPrefix } from './types';
import { buildSegmentQuestionPrompt, buildVocabularyPrompt } from './prompts';

interface WhisperWordStamp {
  word: string;
  start: number;
  end: number;
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey });
}

function getAudioExtension(url: string, contentType: string | null): string {
  if (contentType?.includes('mpeg')) return 'mp3';
  if (contentType?.includes('wav')) return 'wav';
  if (contentType?.includes('mp4') || contentType?.includes('m4a')) return 'm4a';
  if (contentType?.includes('ogg')) return 'ogg';
  if (url.includes('.mp3')) return 'mp3';
  if (url.includes('.wav')) return 'wav';
  if (url.includes('.m4a')) return 'm4a';
  return 'mp3';
}

async function downloadAudioFile(audioUrl: string): Promise<File> {
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error('Could not download audio from the provided URL');
  }
  const contentType = response.headers.get('content-type');
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error('Audio file is empty');
  }
  const extension = getAudioExtension(audioUrl, contentType);
  return new File([buffer], `audio.${extension}`, {
    type: contentType || 'audio/mpeg',
  });
}

function distributeSentenceTimestamps(
  sentences: string[],
  start: number,
  end: number
): TranscriptSegmentDraft[] {
  if (sentences.length === 0) return [];
  const span = Math.max(0.4, end - start);
  const weights = sentences.map((sentence) => Math.max(1, sentence.split(/\s+/).length));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = start;
  return sentences.map((sentence, index) => {
    const portion = span * (weights[index] / totalWeight);
    const segmentEnd = index === sentences.length - 1 ? end : cursor + portion;
    const draft: TranscriptSegmentDraft = {
      sentence_text: sentence,
      start_seconds: Number(cursor.toFixed(2)),
      end_seconds: Number(Math.max(cursor + 0.3, segmentEnd).toFixed(2)),
    };
    cursor = draft.end_seconds;
    return draft;
  });
}

export async function transcribeAudioWithSegments(
  audioUrl: string
): Promise<{ transcript: string; segments: TranscriptSegmentDraft[] }> {
  const file = await downloadAudioFile(audioUrl);
  const openai = getOpenAIClient();

  const result = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  });

  const transcript = String(result.text ?? '').trim();
  if (!transcript) {
    throw new Error('Transcription returned empty text');
  }

  const whisperSegments = Array.isArray(result.segments) ? result.segments : [];
  const segments: TranscriptSegmentDraft[] = [];

  if (whisperSegments.length > 0) {
    for (const segment of whisperSegments) {
      const text = String(segment.text ?? '').trim();
      if (!text) continue;
      const start = Number(segment.start ?? 0);
      const end = Number(segment.end ?? start + 1);
      const sentences = splitIntoSentences(text);
      if (sentences.length <= 1) {
        segments.push({
          sentence_text: text,
          start_seconds: Number(start.toFixed(2)),
          end_seconds: Number(Math.max(start + 0.3, end).toFixed(2)),
        });
      } else {
        segments.push(...distributeSentenceTimestamps(sentences, start, end));
      }
    }
  } else {
    const sentences = splitIntoSentences(transcript);
    segments.push(...distributeSentenceTimestamps(sentences, 0, Math.max(8, sentences.length * 3)));
  }

  return { transcript, segments: mergeShortSegments(segments) };
}

export function buildSegmentsFromManualTranscript(
  transcript: string,
  totalSeconds = 60
): TranscriptSegmentDraft[] {
  const sentences = splitIntoSentences(transcript);
  if (sentences.length === 0) return [];
  return mergeShortSegments(
    distributeSentenceTimestamps(sentences, 0, Math.max(totalSeconds, sentences.length * 5))
  );
}

export async function generateQuestionForSegment(params: {
  framework: string;
  cefrLevel: CefrLevel;
  difficulty: LearnDifficulty;
  sentenceText: string;
  segmentIndex: number;
}): Promise<GeneratedLearnQuestion> {
  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You create high-quality English short-listening multiple-choice questions for teachers. Always return valid JSON.',
      },
      {
        role: 'user',
        content: buildSegmentQuestionPrompt(params),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('AI did not return question content');
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI response did not contain valid JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    question_text?: string;
    choices?: string[];
    correct_answer?: string;
    explanation?: string;
  };

  const choices = (parsed.choices ?? [])
    .map((choice) => stripChoiceLetterPrefix(String(choice ?? '')))
    .filter(Boolean);
  while (choices.length < 4) choices.push('');

  const correctAnswer = stripChoiceLetterPrefix(String(parsed.correct_answer ?? ''));
  // Prefer the matching cleaned choice so grading compares equal strings.
  const matchedChoice =
    choices.find((choice) => choice.toLowerCase() === correctAnswer.toLowerCase()) ||
    choices.find((choice) =>
      correctAnswer.toLowerCase().includes(choice.toLowerCase())
    ) ||
    correctAnswer;

  return {
    segment_index: params.segmentIndex,
    question_text: String(parsed.question_text ?? '').trim(),
    choices: choices.slice(0, 4),
    correct_answer: matchedChoice,
    explanation: String(parsed.explanation ?? '').trim(),
  };
}

export async function generateQuestionsForSegments(params: {
  framework: string;
  cefrLevel: CefrLevel;
  difficulty: LearnDifficulty;
  segments: Array<{ sentence_text: string }>;
  limit?: number;
}): Promise<GeneratedLearnQuestion[]> {
  const selected = params.segments.slice(0, params.limit ?? params.segments.length);
  const results: GeneratedLearnQuestion[] = [];

  for (let index = 0; index < selected.length; index += 1) {
    const segment = selected[index];
    if (!segment.sentence_text.trim()) continue;
    const question = await generateQuestionForSegment({
      framework: params.framework,
      cefrLevel: params.cefrLevel,
      difficulty: params.difficulty,
      sentenceText: segment.sentence_text,
      segmentIndex: index,
    });
    results.push(question);
  }

  return results;
}

function normalizeVocabToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9'\-]/g, '')
    .trim();
}

async function getWhisperWordTimestamps(audioUrl: string): Promise<WhisperWordStamp[]> {
  const file = await downloadAudioFile(audioUrl);
  const openai = getOpenAIClient();
  const result = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en',
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
  });

  const words = Array.isArray((result as { words?: unknown[] }).words)
    ? ((result as { words: Array<{ word?: string; start?: number; end?: number }> }).words)
    : [];

  return words
    .map((item) => ({
      word: String(item.word ?? '').trim(),
      start: Number(item.start ?? 0),
      end: Number(item.end ?? item.start ?? 0),
    }))
    .filter((item) => item.word && Number.isFinite(item.start) && Number.isFinite(item.end));
}

function locateWordClip(
  target: string,
  wordStamps: WhisperWordStamp[],
  segments: TranscriptSegmentDraft[]
): { start_seconds: number; end_seconds: number } {
  const tokens = target
    .split(/\s+/)
    .map(normalizeVocabToken)
    .filter(Boolean);
  if (tokens.length === 0) {
    return { start_seconds: 0, end_seconds: 0.8 };
  }

  if (wordStamps.length > 0) {
    const normalizedStamps = wordStamps.map((stamp) => ({
      ...stamp,
      normalized: normalizeVocabToken(stamp.word),
    }));

    for (let index = 0; index < normalizedStamps.length; index += 1) {
      let matches = true;
      for (let offset = 0; offset < tokens.length; offset += 1) {
        if (normalizedStamps[index + offset]?.normalized !== tokens[offset]) {
          matches = false;
          break;
        }
      }
      if (!matches) continue;
      const start = Math.max(0, normalizedStamps[index].start - 0.12);
      const endStamp = normalizedStamps[index + tokens.length - 1];
      const end = Math.max(start + 0.45, endStamp.end + 0.18);
      return {
        start_seconds: Number(start.toFixed(2)),
        end_seconds: Number(end.toFixed(2)),
      };
    }
  }

  const needle = tokens.join(' ');
  for (const segment of segments) {
    const haystack = normalizeVocabToken(segment.sentence_text);
    if (haystack.includes(needle.replace(/\s+/g, ''))) {
      const duration = Math.max(0.6, segment.end_seconds - segment.start_seconds);
      const clip = Math.min(1.4, duration);
      const mid = (segment.start_seconds + segment.end_seconds) / 2;
      return {
        start_seconds: Number(Math.max(0, mid - clip / 2).toFixed(2)),
        end_seconds: Number((mid + clip / 2).toFixed(2)),
      };
    }
  }

  return { start_seconds: 0, end_seconds: 0.8 };
}

export async function generateVocabularyFromTranscript(params: {
  framework: string;
  cefrLevel: CefrLevel;
  transcript: string;
  audioUrl?: string;
  segments?: TranscriptSegmentDraft[];
  count?: number;
}): Promise<GeneratedVocabularyItem[]> {
  const count = Math.max(1, Math.min(8, params.count ?? 5));
  const transcript = params.transcript.trim();
  if (!transcript) {
    throw new Error('Transcript is required to generate vocabulary');
  }

  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.35,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You select useful English vocabulary from listening transcripts for teachers. Always return valid JSON.',
      },
      {
        role: 'user',
        content: buildVocabularyPrompt({
          framework: params.framework,
          cefrLevel: params.cefrLevel,
          transcript,
          count,
        }),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('AI did not return vocabulary content');
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI response did not contain valid JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    vocabulary?: Array<{ word?: string; definition?: string }>;
  };
  const drafts = (parsed.vocabulary ?? [])
    .map((item) => ({
      word: String(item.word ?? '').trim(),
      definition: String(item.definition ?? '').trim(),
    }))
    .filter((item) => item.word && item.definition)
    .slice(0, count);

  if (drafts.length === 0) {
    throw new Error('AI did not return any vocabulary words');
  }

  let wordStamps: WhisperWordStamp[] = [];
  if (params.audioUrl?.trim()) {
    try {
      wordStamps = await getWhisperWordTimestamps(params.audioUrl.trim());
    } catch (error) {
      console.error('Word-level timestamps unavailable for vocabulary:', error);
    }
  }

  const segments = params.segments ?? [];
  return drafts.map((item) => {
    const clip = locateWordClip(item.word, wordStamps, segments);
    return {
      word: item.word,
      definition: item.definition,
      start_seconds: clip.start_seconds,
      end_seconds: clip.end_seconds,
    };
  });
}
