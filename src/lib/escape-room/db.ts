import { sql } from '@vercel/postgres';
import { nanoid } from 'nanoid';
import type {
  CreateEscapeRoomPayload,
  EscapeAnswerConfig,
  EscapeChallengeContent,
  EscapeChallengeSavePayload,
  EscapeChallengeType,
  EscapeHintConfig,
  EscapeMediaItem,
  EscapeRewardConfig,
  EscapeRoom,
  EscapeRoomChallenge,
  EscapeRoomListItem,
  EscapeRoomStatus,
  EscapeProgressRecord,
  EscapeRoomWithChallenges,
  UpdateEscapeRoomPayload,
} from './types';
import {
  clampChallengeCount,
  defaultChallengeTitle,
  emptyAnswerConfig,
  emptyHints,
  isEscapeChallengeType,
  isEscapeRoomStatus,
} from './types';

const DEFAULT_TEACHER_ID = 'default';

let schemaReady: Promise<void> | null = null;

function toIsoTimestamp(value: unknown): string {
  if (!value) return new Date().toISOString();
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function parseJsonObject<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function ensureEscapeRoomSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS escape_rooms (
          id TEXT PRIMARY KEY,
          teacher_id TEXT NOT NULL DEFAULT 'default',
          title TEXT NOT NULL DEFAULT '',
          mission TEXT NOT NULL DEFAULT '',
          instructions TEXT NOT NULL DEFAULT '',
          learning_objective TEXT NOT NULL DEFAULT '',
          english_level TEXT NOT NULL DEFAULT '',
          estimated_time TEXT NOT NULL DEFAULT '',
          final_code TEXT NOT NULL DEFAULT '',
          final_success_message TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'draft',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_escape_rooms_teacher
        ON escape_rooms(teacher_id, updated_at DESC)
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS escape_room_challenges (
          id TEXT PRIMARY KEY,
          escape_room_id TEXT NOT NULL REFERENCES escape_rooms(id) ON DELETE CASCADE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          type TEXT NOT NULL DEFAULT 'image_investigation',
          title TEXT NOT NULL DEFAULT '',
          instructions TEXT NOT NULL DEFAULT '',
          content JSONB NOT NULL DEFAULT '{}'::jsonb,
          media JSONB NOT NULL DEFAULT '[]'::jsonb,
          answer_configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
          reward_configuration JSONB,
          hints JSONB NOT NULL DEFAULT '{}'::jsonb,
          settings JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_escape_room_challenges_room
        ON escape_room_challenges(escape_room_id, sort_order)
      `;
      // Extensible progress tables (Phase 9 will wire UI/analytics).
      await sql`
        CREATE TABLE IF NOT EXISTS escape_room_progress (
          id TEXT PRIMARY KEY,
          escape_room_id TEXT NOT NULL REFERENCES escape_rooms(id) ON DELETE CASCADE,
          student_label TEXT NOT NULL DEFAULT '',
          student_number TEXT NOT NULL DEFAULT '',
          class_number TEXT NOT NULL DEFAULT '',
          current_challenge_id TEXT,
          completed BOOLEAN NOT NULL DEFAULT FALSE,
          started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          meta JSONB NOT NULL DEFAULT '{}'::jsonb
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_escape_room_progress_room
        ON escape_room_progress(escape_room_id, started_at DESC)
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS escape_room_challenge_attempts (
          id TEXT PRIMARY KEY,
          progress_id TEXT NOT NULL REFERENCES escape_room_progress(id) ON DELETE CASCADE,
          challenge_id TEXT NOT NULL,
          answer TEXT NOT NULL DEFAULT '',
          correct BOOLEAN NOT NULL DEFAULT FALSE,
          hint_level INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_escape_room_attempts_progress
        ON escape_room_challenge_attempts(progress_id, created_at DESC)
      `;
    })();
  }
  await schemaReady;
}

function rowToRoom(row: Record<string, unknown>): EscapeRoom {
  const statusRaw = String(row.status ?? 'draft');
  const status: EscapeRoomStatus = isEscapeRoomStatus(statusRaw) ? statusRaw : 'draft';
  return {
    id: row.id as string,
    teacher_id: String(row.teacher_id ?? DEFAULT_TEACHER_ID),
    title: String(row.title ?? ''),
    mission: String(row.mission ?? ''),
    instructions: String(row.instructions ?? ''),
    learning_objective: String(row.learning_objective ?? ''),
    english_level: String(row.english_level ?? ''),
    estimated_time: String(row.estimated_time ?? ''),
    final_code: String(row.final_code ?? ''),
    final_success_message: String(row.final_success_message ?? ''),
    status,
    created_at: toIsoTimestamp(row.created_at),
    updated_at: toIsoTimestamp(row.updated_at),
  };
}

function rowToChallenge(row: Record<string, unknown>): EscapeRoomChallenge {
  const typeRaw = String(row.type ?? 'image_investigation');
  const type: EscapeChallengeType = isEscapeChallengeType(typeRaw)
    ? typeRaw
    : 'image_investigation';
  const hints = parseJsonObject<EscapeHintConfig>(row.hints, emptyHints());
  const answer = parseJsonObject<EscapeAnswerConfig>(row.answer_configuration, emptyAnswerConfig());
  const rewardRaw = row.reward_configuration;
  let reward: EscapeRewardConfig | null = null;
  if (rewardRaw != null) {
    const parsed = parseJsonObject<EscapeRewardConfig | null>(rewardRaw, null);
    if (parsed && typeof parsed.value === 'string') {
      reward = {
        kind:
          parsed.kind === 'number' || parsed.kind === 'word' || parsed.kind === 'custom'
            ? parsed.kind
            : 'letter',
        value: String(parsed.value ?? ''),
      };
    }
  }

  return {
    id: row.id as string,
    escape_room_id: row.escape_room_id as string,
    sort_order: Number(row.sort_order ?? 0),
    type,
    title: String(row.title ?? ''),
    instructions: String(row.instructions ?? ''),
    content: parseJsonObject<EscapeChallengeContent>(row.content, {}),
    media: parseJsonArray<EscapeMediaItem>(row.media),
    answer_configuration: {
      accepted_answers: Array.isArray(answer.accepted_answers)
        ? answer.accepted_answers.map(String)
        : [],
      choices: Array.isArray(answer.choices) ? answer.choices.map(String) : [],
      case_sensitive: Boolean(answer.case_sensitive),
    },
    reward_configuration: reward,
    hints: {
      hint_1: String(hints.hint_1 ?? ''),
      hint_2: String(hints.hint_2 ?? ''),
      final_hint: String(hints.final_hint ?? ''),
    },
    settings: parseJsonObject<Record<string, unknown>>(row.settings, {}),
    created_at: toIsoTimestamp(row.created_at),
    updated_at: toIsoTimestamp(row.updated_at),
  };
}

async function listChallengesForRoom(roomId: string): Promise<EscapeRoomChallenge[]> {
  const { rows } = await sql`
    SELECT * FROM escape_room_challenges
    WHERE escape_room_id = ${roomId}
    ORDER BY sort_order ASC, created_at ASC
  `;
  return rows.map((row) => rowToChallenge(row));
}

export async function listEscapeRooms(
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<EscapeRoomListItem[]> {
  await ensureEscapeRoomSchema();
  const { rows } = await sql`
    SELECT
      r.*,
      COUNT(c.id)::int AS challenge_count
    FROM escape_rooms r
    LEFT JOIN escape_room_challenges c ON c.escape_room_id = r.id
    WHERE r.teacher_id = ${teacherId}
    GROUP BY r.id
    ORDER BY r.updated_at DESC
  `;
  return rows.map((row) => ({
    ...rowToRoom(row),
    challenge_count: Number(row.challenge_count ?? 0),
  }));
}

export async function getEscapeRoomById(
  roomId: string,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<EscapeRoomWithChallenges | null> {
  await ensureEscapeRoomSchema();
  const { rows } = await sql`
    SELECT * FROM escape_rooms
    WHERE id = ${roomId} AND teacher_id = ${teacherId}
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const room = rowToRoom(rows[0]);
  const challenges = await listChallengesForRoom(roomId);
  return { ...room, challenges };
}

/** Public student load — published rooms only. */
export async function getPublishedEscapeRoomById(
  roomId: string
): Promise<EscapeRoomWithChallenges | null> {
  await ensureEscapeRoomSchema();
  const { rows } = await sql`
    SELECT * FROM escape_rooms
    WHERE id = ${roomId} AND status = 'published'
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const room = rowToRoom(rows[0]);
  const challenges = await listChallengesForRoom(roomId);
  return { ...room, challenges };
}

async function insertChallengePlaceholder(
  roomId: string,
  sortOrder: number,
  type: EscapeChallengeType = 'image_investigation'
): Promise<void> {
  const id = nanoid(21);
  const title = defaultChallengeTitle(sortOrder, type);
  const answer = JSON.stringify(emptyAnswerConfig());
  const hints = JSON.stringify(emptyHints());
  await sql`
    INSERT INTO escape_room_challenges (
      id, escape_room_id, sort_order, type, title, instructions,
      content, media, answer_configuration, reward_configuration, hints, settings
    )
    VALUES (
      ${id},
      ${roomId},
      ${sortOrder},
      ${type},
      ${title},
      ${''},
      ${JSON.stringify({})},
      ${JSON.stringify([])},
      ${answer},
      ${null},
      ${hints},
      ${JSON.stringify({})}
    )
  `;
}

export async function createEscapeRoom(
  payload: CreateEscapeRoomPayload = {},
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<EscapeRoomWithChallenges> {
  await ensureEscapeRoomSchema();
  const id = nanoid(21);
  const title = String(payload.title ?? '').trim() || 'Untitled Escape Room';
  const mission = String(payload.mission ?? '').trim();
  const instructions = String(payload.instructions ?? '').trim();
  const learningObjective = String(payload.learning_objective ?? '').trim();
  const englishLevel = String(payload.english_level ?? '').trim();
  const estimatedTime = String(payload.estimated_time ?? '').trim();
  const challengeCount = clampChallengeCount(payload.challenge_count);

  await sql`
    INSERT INTO escape_rooms (
      id, teacher_id, title, mission, instructions, learning_objective,
      english_level, estimated_time, final_code, final_success_message, status
    )
    VALUES (
      ${id},
      ${teacherId},
      ${title},
      ${mission},
      ${instructions},
      ${learningObjective},
      ${englishLevel},
      ${estimatedTime},
      ${''},
      ${'THE DOORS OPEN! You escaped.'},
      ${'draft'}
    )
  `;

  for (let index = 0; index < challengeCount; index += 1) {
    await insertChallengePlaceholder(id, index);
  }

  const room = await getEscapeRoomById(id, teacherId);
  if (!room) throw new Error('Failed to create escape room');
  return room;
}

async function replaceChallenges(
  roomId: string,
  challenges: EscapeChallengeSavePayload[]
): Promise<void> {
  await sql`DELETE FROM escape_room_challenges WHERE escape_room_id = ${roomId}`;

  const limited = challenges.slice(0, 6);
  for (let index = 0; index < limited.length; index += 1) {
    const item = limited[index];
    const type: EscapeChallengeType = isEscapeChallengeType(item.type)
      ? item.type
      : 'image_investigation';
    const id = String(item.id ?? '').trim() || nanoid(21);
    const title =
      String(item.title ?? '').trim() || defaultChallengeTitle(index, type);
    const instructions = String(item.instructions ?? '').trim();
    const content = item.content && typeof item.content === 'object' ? item.content : {};
    const media = Array.isArray(item.media) ? item.media : [];
    const answer = {
      ...emptyAnswerConfig(),
      ...(item.answer_configuration || {}),
      accepted_answers: Array.isArray(item.answer_configuration?.accepted_answers)
        ? item.answer_configuration!.accepted_answers.map(String)
        : [],
      choices: Array.isArray(item.answer_configuration?.choices)
        ? item.answer_configuration!.choices.map(String)
        : [],
    };
    const hints = { ...emptyHints(), ...(item.hints || {}) };
    const settings =
      item.settings && typeof item.settings === 'object' ? item.settings : {};
    const reward =
      item.reward_configuration && typeof item.reward_configuration === 'object'
        ? JSON.stringify(item.reward_configuration)
        : null;

    await sql`
      INSERT INTO escape_room_challenges (
        id, escape_room_id, sort_order, type, title, instructions,
        content, media, answer_configuration, reward_configuration, hints, settings
      )
      VALUES (
        ${id},
        ${roomId},
        ${index},
        ${type},
        ${title},
        ${instructions},
        ${JSON.stringify(content)},
        ${JSON.stringify(media)},
        ${JSON.stringify(answer)},
        ${reward},
        ${JSON.stringify(hints)},
        ${JSON.stringify(settings)}
      )
    `;
  }
}

export async function updateEscapeRoom(
  roomId: string,
  payload: UpdateEscapeRoomPayload,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<EscapeRoomWithChallenges> {
  await ensureEscapeRoomSchema();
  const existing = await getEscapeRoomById(roomId, teacherId);
  if (!existing) throw new Error('Escape room not found');

  const title =
    payload.title !== undefined ? String(payload.title).trim() || existing.title : existing.title;
  const mission =
    payload.mission !== undefined ? String(payload.mission).trim() : existing.mission;
  const instructions =
    payload.instructions !== undefined
      ? String(payload.instructions).trim()
      : existing.instructions;
  const learningObjective =
    payload.learning_objective !== undefined
      ? String(payload.learning_objective).trim()
      : existing.learning_objective;
  const englishLevel =
    payload.english_level !== undefined
      ? String(payload.english_level).trim()
      : existing.english_level;
  const estimatedTime =
    payload.estimated_time !== undefined
      ? String(payload.estimated_time).trim()
      : existing.estimated_time;
  const finalCode =
    payload.final_code !== undefined
      ? String(payload.final_code).trim()
      : existing.final_code;
  const finalSuccessMessage =
    payload.final_success_message !== undefined
      ? String(payload.final_success_message).trim()
      : existing.final_success_message;
  const status =
    payload.status !== undefined && isEscapeRoomStatus(payload.status)
      ? payload.status
      : existing.status;

  await sql`
    UPDATE escape_rooms
    SET
      title = ${title},
      mission = ${mission},
      instructions = ${instructions},
      learning_objective = ${learningObjective},
      english_level = ${englishLevel},
      estimated_time = ${estimatedTime},
      final_code = ${finalCode},
      final_success_message = ${finalSuccessMessage},
      status = ${status},
      updated_at = NOW()
    WHERE id = ${roomId} AND teacher_id = ${teacherId}
  `;

  if (Array.isArray(payload.challenges)) {
    await replaceChallenges(roomId, payload.challenges);
    await sql`
      UPDATE escape_rooms SET updated_at = NOW()
      WHERE id = ${roomId} AND teacher_id = ${teacherId}
    `;
  }

  const room = await getEscapeRoomById(roomId, teacherId);
  if (!room) throw new Error('Escape room not found after update');
  return room;
}

export async function deleteEscapeRoom(
  roomId: string,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<boolean> {
  await ensureEscapeRoomSchema();
  const { rowCount } = await sql`
    DELETE FROM escape_rooms
    WHERE id = ${roomId} AND teacher_id = ${teacherId}
  `;
  return (rowCount ?? 0) > 0;
}

export async function duplicateEscapeRoom(
  roomId: string,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<EscapeRoomWithChallenges> {
  const source = await getEscapeRoomById(roomId, teacherId);
  if (!source) throw new Error('Escape room not found');

  const created = await createEscapeRoom(
    {
      title: `${source.title || 'Untitled Escape Room'} (copy)`,
      mission: source.mission,
      instructions: source.instructions,
      learning_objective: source.learning_objective,
      english_level: source.english_level,
      estimated_time: source.estimated_time,
      challenge_count: Math.max(1, source.challenges.length || 1),
    },
    teacherId
  );

  return updateEscapeRoom(
    created.id,
    {
      final_code: source.final_code,
      final_success_message: source.final_success_message,
      status: 'draft',
      challenges: source.challenges.map((challenge) => ({
        type: challenge.type,
        title: challenge.title,
        instructions: challenge.instructions,
        content: challenge.content,
        media: challenge.media,
        answer_configuration: challenge.answer_configuration,
        reward_configuration: challenge.reward_configuration,
        hints: challenge.hints,
        settings: challenge.settings,
      })),
    },
    teacherId
  );
}

function parseProgressMeta(meta: unknown): {
  completed_challenge_ids: string[];
  collected_rewards: string[];
} {
  const parsed = parseJsonObject<{
    completed_challenge_ids?: string[];
    collected_rewards?: string[];
  }>(meta, {});
  return {
    completed_challenge_ids: Array.isArray(parsed.completed_challenge_ids)
      ? parsed.completed_challenge_ids.map(String)
      : [],
    collected_rewards: Array.isArray(parsed.collected_rewards)
      ? parsed.collected_rewards.map(String)
      : [],
  };
}

function rowToProgress(row: Record<string, unknown>): EscapeProgressRecord {
  const meta = parseProgressMeta(row.meta);
  return {
    id: row.id as string,
    escape_room_id: row.escape_room_id as string,
    student_label: String(row.student_label ?? ''),
    student_number: String(row.student_number ?? ''),
    class_number: String(row.class_number ?? ''),
    current_challenge_id: (row.current_challenge_id as string | null) ?? null,
    completed_challenge_ids: meta.completed_challenge_ids,
    collected_rewards: meta.collected_rewards,
    completed: Boolean(row.completed),
    started_at: toIsoTimestamp(row.started_at),
    completed_at: row.completed_at ? toIsoTimestamp(row.completed_at) : null,
  };
}

export async function startEscapeProgress(params: {
  roomId: string;
  studentLabel?: string;
  studentNumber?: string;
  classNumber?: string;
}): Promise<EscapeProgressRecord> {
  await ensureEscapeRoomSchema();
  const room = await getPublishedEscapeRoomById(params.roomId);
  if (!room) throw new Error('Escape room not found or not published');

  const id = nanoid(21);
  const firstChallengeId = room.challenges[0]?.id || null;
  const meta = JSON.stringify({
    completed_challenge_ids: [],
    collected_rewards: [],
  });

  await sql`
    INSERT INTO escape_room_progress (
      id, escape_room_id, student_label, student_number, class_number,
      current_challenge_id, completed, meta
    )
    VALUES (
      ${id},
      ${params.roomId},
      ${String(params.studentLabel ?? '').trim()},
      ${String(params.studentNumber ?? '').trim()},
      ${String(params.classNumber ?? '').trim()},
      ${firstChallengeId},
      ${false},
      ${meta}
    )
  `;

  const { rows } = await sql`
    SELECT * FROM escape_room_progress WHERE id = ${id} LIMIT 1
  `;
  return rowToProgress(rows[0]);
}

export async function getEscapeProgress(progressId: string): Promise<EscapeProgressRecord | null> {
  await ensureEscapeRoomSchema();
  const { rows } = await sql`
    SELECT * FROM escape_room_progress WHERE id = ${progressId} LIMIT 1
  `;
  if (rows.length === 0) return null;
  return rowToProgress(rows[0]);
}

export async function recordEscapeAttempt(params: {
  progressId: string;
  challengeId: string;
  answer: string;
  correct: boolean;
  hintLevel?: number;
  rewardValue?: string | null;
  nextChallengeId?: string | null;
  markRoomComplete?: boolean;
}): Promise<EscapeProgressRecord> {
  await ensureEscapeRoomSchema();
  const progress = await getEscapeProgress(params.progressId);
  if (!progress) throw new Error('Progress not found');

  await sql`
    INSERT INTO escape_room_challenge_attempts (
      id, progress_id, challenge_id, answer, correct, hint_level
    )
    VALUES (
      ${nanoid(21)},
      ${params.progressId},
      ${params.challengeId},
      ${params.answer},
      ${params.correct},
      ${Math.max(0, Number(params.hintLevel ?? 0))}
    )
  `;

  let completedIds = [...progress.completed_challenge_ids];
  let rewards = [...progress.collected_rewards];
  let currentId = progress.current_challenge_id;
  let completed = progress.completed;
  let completedAt = progress.completed_at;

  if (params.correct) {
    if (!completedIds.includes(params.challengeId)) {
      completedIds.push(params.challengeId);
    }
    if (params.rewardValue && !rewards.includes(params.rewardValue)) {
      rewards.push(params.rewardValue);
    }
    if (params.nextChallengeId) {
      currentId = params.nextChallengeId;
    }
    if (params.markRoomComplete) {
      completed = true;
      completedAt = new Date().toISOString();
      currentId = params.challengeId;
    }
  }

  const meta = JSON.stringify({
    completed_challenge_ids: completedIds,
    collected_rewards: rewards,
  });

  await sql`
    UPDATE escape_room_progress
    SET
      current_challenge_id = ${currentId},
      completed = ${completed},
      completed_at = ${completedAt},
      meta = ${meta}
    WHERE id = ${params.progressId}
  `;

  const updated = await getEscapeProgress(params.progressId);
  if (!updated) throw new Error('Progress not found after update');
  return updated;
}
