import OpenAI from 'openai';
import type { AiQuestionPart, CefrLevel, GeneratedQuestionDraft } from './types';
import { buildQuestionGenerationPrompt } from './prompts';

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

export async function transcribeAudioFromUrl(audioUrl: string): Promise<string> {
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
  const file = new File([buffer], `audio.${extension}`, {
    type: contentType || 'audio/mpeg',
  });

  const openai = getOpenAIClient();
  const result = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en',
  });

  const text = result.text?.trim();
  if (!text) {
    throw new Error('Transcription returned empty text');
  }
  return text;
}

function parseGeneratedQuestions(raw: string): GeneratedQuestionDraft[] {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI response did not contain valid JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    questions?: Array<{
      question_text?: string;
      question_type?: string;
      choices?: string[];
      correct_answer?: string;
    }>;
  };

  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error('AI did not return any questions');
  }

  return parsed.questions.slice(0, 5).map((item) => {
    const choices = (item.choices ?? []).map((c) => String(c).trim()).filter(Boolean);
    while (choices.length < 4) choices.push('');
    return {
      question_text: String(item.question_text ?? '').trim(),
      question_type: 'multiple_choice',
      choices: choices.slice(0, 4),
      correct_answer: String(item.correct_answer ?? '').trim(),
    };
  });
}

export async function generateListeningQuestions(params: {
  transcript: string;
  framework: string;
  cefrLevels: CefrLevel[];
  part: AiQuestionPart;
}): Promise<GeneratedQuestionDraft[]> {
  if (!params.transcript.trim()) {
    throw new Error('A transcript is required before generating questions');
  }

  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You create high-quality English listening comprehension questions for teachers. Always return valid JSON.',
      },
      {
        role: 'user',
        content: buildQuestionGenerationPrompt(params),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('AI did not return question content');
  }

  return parseGeneratedQuestions(content);
}
