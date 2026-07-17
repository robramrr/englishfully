import OpenAI from 'openai';
import type { CefrLevel, GeneratedLearnQuestion, LearnDifficulty, TranscriptSegmentDraft } from './types';
import { mergeShortSegments, splitIntoSentences } from './types';
import { buildSegmentQuestionPrompt } from './prompts';

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

  const choices = (parsed.choices ?? []).map((choice) => String(choice).trim()).filter(Boolean);
  while (choices.length < 4) choices.push('');

  return {
    segment_index: params.segmentIndex,
    question_text: String(parsed.question_text ?? '').trim(),
    choices: choices.slice(0, 4),
    correct_answer: String(parsed.correct_answer ?? '').trim(),
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
