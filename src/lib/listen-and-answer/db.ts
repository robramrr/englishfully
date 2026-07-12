import { sql } from '@vercel/postgres';
import { nanoid } from 'nanoid';
import type {
  AssignmentListItem,
  ListenAssignment,
  ListenAssignmentWithParts,
  ListeningPart,
  ListenQuestion,
  SaveAssignmentPayload,
  CefrLevel,
  TranscriptSource,
  QuestionType,
  TimeUnit,
  AiQuestionPart,
} from './types';

const DEFAULT_TEACHER_ID = 'default';

function normalizeTimeUnit(value: unknown): TimeUnit {
  return value === 'hours' ? 'hours' : 'minutes';
}

let schemaReady: Promise<void> | null = null;

export async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS listen_assignments (
          id TEXT PRIMARY KEY,
          teacher_id TEXT NOT NULL DEFAULT 'default',
          teacher_name TEXT NOT NULL DEFAULT '',
          title TEXT NOT NULL DEFAULT '',
          class_name TEXT NOT NULL DEFAULT '',
          due_date TEXT,
          include_answer_key BOOLEAN NOT NULL DEFAULT true,
          status TEXT NOT NULL DEFAULT 'draft',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS listen_parts (
          id TEXT PRIMARY KEY,
          assignment_id TEXT NOT NULL REFERENCES listen_assignments(id) ON DELETE CASCADE,
          title TEXT NOT NULL DEFAULT 'Part 1',
          sort_order INTEGER NOT NULL DEFAULT 0,
          audio_url TEXT NOT NULL DEFAULT '',
          thumbnail_url TEXT NOT NULL DEFAULT '',
          qr_enabled BOOLEAN NOT NULL DEFAULT false,
          transcript TEXT NOT NULL DEFAULT '',
          transcript_source TEXT NOT NULL DEFAULT 'auto',
          question_framework TEXT NOT NULL DEFAULT 'American English File',
          cefr_levels JSONB NOT NULL DEFAULT '["A2","B1"]'::jsonb
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS listen_questions (
          id TEXT PRIMARY KEY,
          part_id TEXT NOT NULL REFERENCES listen_parts(id) ON DELETE CASCADE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          question_type TEXT NOT NULL DEFAULT 'multiple_choice',
          question_text TEXT NOT NULL DEFAULT '',
          choices JSONB NOT NULL DEFAULT '[]'::jsonb,
          correct_answer TEXT NOT NULL DEFAULT '',
          keep_question BOOLEAN NOT NULL DEFAULT true,
          is_ai_generated BOOLEAN NOT NULL DEFAULT false,
          ai_part TEXT
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_listen_parts_assignment ON listen_parts(assignment_id, sort_order)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_listen_questions_part ON listen_questions(part_id, sort_order)`;
      await sql`
        ALTER TABLE listen_assignments
        ADD COLUMN IF NOT EXISTS include_student_info_line BOOLEAN NOT NULL DEFAULT false
      `;
      await sql`
        ALTER TABLE listen_assignments
        ADD COLUMN IF NOT EXISTS points TEXT NOT NULL DEFAULT ''
      `;
      await sql`
        ALTER TABLE listen_assignments
        ADD COLUMN IF NOT EXISTS instructions TEXT NOT NULL DEFAULT ''
      `;
      await sql`
        ALTER TABLE listen_parts
        ADD COLUMN IF NOT EXISTS instructions TEXT NOT NULL DEFAULT ''
      `;
      await sql`
        ALTER TABLE listen_questions
        ADD COLUMN IF NOT EXISTS show_question_type BOOLEAN NOT NULL DEFAULT false
      `;
      await sql`
        ALTER TABLE listen_assignments
        ADD COLUMN IF NOT EXISTS total_questions TEXT NOT NULL DEFAULT ''
      `;
      await sql`
        ALTER TABLE listen_assignments
        ADD COLUMN IF NOT EXISTS time_amount TEXT NOT NULL DEFAULT ''
      `;
      await sql`
        ALTER TABLE listen_assignments
        ADD COLUMN IF NOT EXISTS time_unit TEXT NOT NULL DEFAULT 'minutes'
      `;
      await sql`
        ALTER TABLE listen_parts
        ADD COLUMN IF NOT EXISTS total_questions TEXT NOT NULL DEFAULT ''
      `;
      await sql`
        ALTER TABLE listen_parts
        ADD COLUMN IF NOT EXISTS time_amount TEXT NOT NULL DEFAULT ''
      `;
      await sql`
        ALTER TABLE listen_parts
        ADD COLUMN IF NOT EXISTS time_unit TEXT NOT NULL DEFAULT 'minutes'
      `;
    })();
  }
  await schemaReady;
}

function rowToAssignment(row: Record<string, unknown>): ListenAssignment {
  return {
    id: row.id as string,
    teacher_id: row.teacher_id as string,
    teacher_name: row.teacher_name as string,
    title: row.title as string,
    class_name: row.class_name as string,
    due_date: (row.due_date as string | null) ?? null,
    points: (row.points as string) ?? '',
    include_answer_key: Boolean(row.include_answer_key),
    include_student_info_line: Boolean(row.include_student_info_line),
    instructions: (row.instructions as string) ?? '',
    total_questions: (row.total_questions as string) ?? '',
    time_amount: (row.time_amount as string) ?? '',
    time_unit: normalizeTimeUnit(row.time_unit),
    status: (row.status as 'draft' | 'published') ?? 'draft',
    created_at: new Date(row.created_at as string).toISOString(),
    updated_at: new Date(row.updated_at as string).toISOString(),
  };
}

function rowToQuestion(row: Record<string, unknown>): ListenQuestion {
  const choices = row.choices;
  return {
    id: row.id as string,
    part_id: row.part_id as string,
    sort_order: row.sort_order as number,
    question_type: row.question_type as QuestionType,
    question_text: row.question_text as string,
    choices: Array.isArray(choices) ? (choices as string[]) : [],
    correct_answer: row.correct_answer as string,
    keep_question: Boolean(row.keep_question),
    is_ai_generated: Boolean(row.is_ai_generated),
    ai_part: (row.ai_part as AiQuestionPart | null) ?? null,
    show_question_type: Boolean(row.show_question_type),
  };
}

function rowToPart(row: Record<string, unknown>, questions: ListenQuestion[]): ListeningPart {
  const cefrLevels = row.cefr_levels;
  return {
    id: row.id as string,
    assignment_id: row.assignment_id as string,
    title: row.title as string,
    sort_order: row.sort_order as number,
    audio_url: row.audio_url as string,
    thumbnail_url: row.thumbnail_url as string,
    qr_enabled: Boolean(row.qr_enabled),
    transcript: row.transcript as string,
    transcript_source: (row.transcript_source as TranscriptSource) ?? 'auto',
    question_framework: row.question_framework as string,
    cefr_levels: Array.isArray(cefrLevels) ? (cefrLevels as CefrLevel[]) : ['A2', 'B1'],
    instructions: (row.instructions as string) ?? '',
    total_questions: (row.total_questions as string) ?? '',
    time_amount: (row.time_amount as string) ?? '',
    time_unit: normalizeTimeUnit(row.time_unit),
    questions,
  };
}

export async function listAssignments(
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<AssignmentListItem[]> {
  await ensureSchema();
  const { rows } = await sql`
    SELECT
      a.*,
      COUNT(DISTINCT p.id)::int AS part_count,
      COUNT(DISTINCT q.id)::int AS question_count
    FROM listen_assignments a
    LEFT JOIN listen_parts p ON p.assignment_id = a.id
    LEFT JOIN listen_questions q ON q.part_id = p.id
    WHERE a.teacher_id = ${teacherId}
    GROUP BY a.id
    ORDER BY a.updated_at DESC
  `;

  return rows.map((row) => ({
    ...rowToAssignment(row),
    part_count: Number(row.part_count ?? 0),
    question_count: Number(row.question_count ?? 0),
  }));
}

export async function getAssignmentById(
  assignmentId: string
): Promise<ListenAssignmentWithParts | null> {
  await ensureSchema();
  const { rows: assignmentRows } = await sql`
    SELECT * FROM listen_assignments WHERE id = ${assignmentId}
  `;
  if (assignmentRows.length === 0) return null;

  const assignment = rowToAssignment(assignmentRows[0]);
  const { rows: partRows } = await sql`
    SELECT * FROM listen_parts
    WHERE assignment_id = ${assignmentId}
    ORDER BY sort_order ASC
  `;

  const parts: ListeningPart[] = [];
  for (const partRow of partRows) {
    const { rows: questionRows } = await sql`
      SELECT * FROM listen_questions
      WHERE part_id = ${partRow.id}
      ORDER BY sort_order ASC
    `;
    parts.push(rowToPart(partRow, questionRows.map(rowToQuestion)));
  }

  return { ...assignment, parts };
}

export async function createAssignment(
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<ListenAssignmentWithParts> {
  await ensureSchema();
  const id = nanoid(21);
  await sql`
    INSERT INTO listen_assignments (id, teacher_id, title, class_name, status)
    VALUES (${id}, ${teacherId}, 'Untitled Listening Assignment', '', 'draft')
  `;

  const partId = nanoid(21);
  await sql`
    INSERT INTO listen_parts (id, assignment_id, title, sort_order)
    VALUES (${partId}, ${id}, 'Part 1', 0)
  `;

  const assignment = await getAssignmentById(id);
  if (!assignment) throw new Error('Failed to create assignment');
  return assignment;
}

async function replaceAssignmentParts(
  assignmentId: string,
  parts: SaveAssignmentPayload['parts']
): Promise<void> {
  await sql`DELETE FROM listen_parts WHERE assignment_id = ${assignmentId}`;

  for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
    const part = parts[partIndex];
    const partId = part.id || nanoid(21);

    await sql`
      INSERT INTO listen_parts (
        id, assignment_id, title, sort_order, audio_url, thumbnail_url,
        qr_enabled, transcript, transcript_source, question_framework, cefr_levels,
        instructions, total_questions, time_amount, time_unit
      )
      VALUES (
        ${partId},
        ${assignmentId},
        ${part.title.trim() || `Part ${partIndex + 1}`},
        ${partIndex},
        ${part.audio_url.trim()},
        ${part.thumbnail_url.trim()},
        ${Boolean(part.qr_enabled)},
        ${part.transcript},
        ${part.transcript_source},
        ${part.question_framework.trim() || 'American English File'},
        ${JSON.stringify(part.cefr_levels)},
        ${part.instructions},
        ${part.total_questions.trim()},
        ${part.time_amount.trim()},
        ${normalizeTimeUnit(part.time_unit)}
      )
    `;

    for (let questionIndex = 0; questionIndex < part.questions.length; questionIndex += 1) {
      const question = part.questions[questionIndex];
      const questionId = question.id || nanoid(21);
      await sql`
        INSERT INTO listen_questions (
          id, part_id, sort_order, question_type, question_text, choices,
          correct_answer, keep_question, is_ai_generated, ai_part, show_question_type
        )
        VALUES (
          ${questionId},
          ${partId},
          ${questionIndex},
          ${question.question_type},
          ${question.question_text},
          ${JSON.stringify(question.choices)},
          ${question.correct_answer},
          ${Boolean(question.keep_question)},
          ${Boolean(question.is_ai_generated)},
          ${question.ai_part},
          ${Boolean(question.show_question_type)}
        )
      `;
    }
  }
}

export async function saveAssignment(
  assignmentId: string,
  payload: SaveAssignmentPayload,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<ListenAssignmentWithParts> {
  await ensureSchema();

  const existing = await getAssignmentById(assignmentId);
  if (!existing) throw new Error('Assignment not found');

  await sql`
    UPDATE listen_assignments
    SET
      teacher_name = ${payload.teacher_name.trim()},
      title = ${payload.title.trim() || 'Untitled Listening Assignment'},
      class_name = ${payload.class_name.trim()},
      due_date = ${payload.due_date},
      points = ${payload.points.trim()},
      include_answer_key = ${Boolean(payload.include_answer_key)},
      include_student_info_line = ${Boolean(payload.include_student_info_line)},
      instructions = ${payload.instructions.trim()},
      total_questions = ${payload.total_questions.trim()},
      time_amount = ${payload.time_amount.trim()},
      time_unit = ${normalizeTimeUnit(payload.time_unit)},
      status = ${payload.status},
      updated_at = NOW()
    WHERE id = ${assignmentId} AND teacher_id = ${teacherId}
  `;

  await replaceAssignmentParts(assignmentId, payload.parts);

  const saved = await getAssignmentById(assignmentId);
  if (!saved) throw new Error('Failed to load saved assignment');
  return saved;
}

export async function duplicateAssignment(
  assignmentId: string,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<ListenAssignmentWithParts> {
  const source = await getAssignmentById(assignmentId);
  if (!source) throw new Error('Assignment not found');

  const payload: SaveAssignmentPayload = {
    teacher_name: source.teacher_name,
    title: `${source.title} (Copy)`,
    class_name: source.class_name,
    due_date: source.due_date,
    points: source.points,
    include_answer_key: source.include_answer_key,
    include_student_info_line: source.include_student_info_line,
    instructions: source.instructions,
    total_questions: source.total_questions,
    time_amount: source.time_amount,
    time_unit: source.time_unit,
    status: 'draft',
    parts: source.parts.map((part) => ({
      title: part.title,
      audio_url: part.audio_url,
      thumbnail_url: part.thumbnail_url,
      qr_enabled: part.qr_enabled,
      transcript: part.transcript,
      transcript_source: part.transcript_source,
      question_framework: part.question_framework,
      cefr_levels: part.cefr_levels,
      instructions: part.instructions,
      total_questions: part.total_questions,
      time_amount: part.time_amount,
      time_unit: part.time_unit,
      questions: part.questions.map((q) => ({
        question_type: q.question_type,
        question_text: q.question_text,
        choices: q.choices,
        correct_answer: q.correct_answer,
        keep_question: q.keep_question,
        is_ai_generated: q.is_ai_generated,
        ai_part: q.ai_part,
        show_question_type: q.show_question_type,
      })),
    })),
  };

  const created = await createAssignment(teacherId);
  return saveAssignment(created.id, payload, teacherId);
}

export async function deleteAssignment(assignmentId: string): Promise<boolean> {
  await ensureSchema();
  const result = await sql`DELETE FROM listen_assignments WHERE id = ${assignmentId}`;
  return (result.rowCount ?? 0) > 0;
}
