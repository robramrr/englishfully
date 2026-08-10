import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/speak-and-submit/api';
import {
  getEscapeProgress,
  getPublishedEscapeRoomById,
  recordEscapeAttempt,
} from '@/lib/escape-room/db';
import { checkChallengeAnswer } from '@/lib/escape-room/challenge-content';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { roomId: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const progressId = String(body.progress_id ?? '').trim();
    const challengeId = String(body.challenge_id ?? '').trim();
    const answer = String(body.answer ?? '');
    const matchingAnswers =
      body.matching_answers && typeof body.matching_answers === 'object'
        ? (body.matching_answers as Record<string, string>)
        : undefined;
    const hintLevel = Number(body.hint_level ?? 0);

    if (!progressId || !challengeId) {
      return jsonError('Progress and challenge are required', 400);
    }

    const room = await getPublishedEscapeRoomById(params.roomId);
    if (!room) return jsonError('Escape room not found', 404);

    const progress = await getEscapeProgress(progressId);
    if (!progress || progress.escape_room_id !== params.roomId) {
      return jsonError('Progress not found', 404);
    }

    const challenge = room.challenges.find((item) => item.id === challengeId);
    if (!challenge) return jsonError('Challenge not found', 404);

    const challengeIndex = room.challenges.findIndex((item) => item.id === challengeId);
    const result = checkChallengeAnswer({
      challenge,
      finalCode: room.final_code,
      answer,
      matchingAnswers,
    });

    const nextChallenge =
      result.correct && challengeIndex >= 0 && challengeIndex < room.challenges.length - 1
        ? room.challenges[challengeIndex + 1]
        : null;
    const isFinal =
      result.correct &&
      (challenge.type === 'code_lock' || challengeIndex === room.challenges.length - 1);

    const updated = await recordEscapeAttempt({
      progressId,
      challengeId,
      answer:
        matchingAnswers != null ? JSON.stringify(matchingAnswers) : answer,
      correct: result.correct,
      hintLevel,
      rewardValue: result.correct ? challenge.reward_configuration?.value || null : null,
      nextChallengeId: nextChallenge?.id || null,
      markRoomComplete: Boolean(isFinal),
    });

    return NextResponse.json({
      correct: result.correct,
      message: result.correct
        ? isFinal
          ? room.final_success_message || 'You escaped!'
          : result.message
        : result.message,
      reward: result.correct ? challenge.reward_configuration : null,
      progress: updated,
      escaped: Boolean(isFinal),
      next_challenge_id: nextChallenge?.id || null,
    });
  } catch (error) {
    console.error('Escape room submit error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to check answer',
      500
    );
  }
}
