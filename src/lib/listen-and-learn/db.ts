import { sql } from '@vercel/postgres';
import { nanoid } from 'nanoid';
import type { CefrLevel } from '@/lib/listen-and-answer/types';
import { getEntryConfig } from '@/lib/speak-and-submit/settings';
import { getDefaultEntryConfig, normalizeStudentNumber } from '@/lib/speak-and-submit/types';
import type {
  LearnAssignment,
  LearnAssignmentListItem,
  LearnAssignmentWithDetails,
  LearnDifficulty,
  LearnQuestion,
  LearnSegment,
  LearnSubmission,
  LearnTranscriptSource,
  PublicLearnAssignment,
  SaveLearnAssignmentPayload,
  SubmitLearnPayload,
} from './types';
import { shuffleArray, stripChoiceLetterPrefix } from './types';

const DEFAULT_TEACHER_ID = 'default';

let schemaReady: Promise<void> | null = null;

function safeTrim(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseCefr(value: unknown): CefrLevel {
  const allowed: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  return allowed.includes(value as CefrLevel) ? (value as CefrLevel) : 'A2';
}

function parseDifficulty(value: unknown): LearnDifficulty {
  return value === 'easy' || value === 'hard' ? value : 'medium';
}

export async function ensureLearnSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS learn_assignments (
          id TEXT PRIMARY KEY,
          teacher_id TEXT NOT NULL DEFAULT 'default',
          teacher_name TEXT NOT NULL DEFAULT '',
          title TEXT NOT NULL DEFAULT '',
          class_name TEXT NOT NULL DEFAULT '',
          due_date TEXT,
          audio_url TEXT NOT NULL DEFAULT '',
          transcript TEXT NOT NULL DEFAULT '',
          transcript_source TEXT NOT NULL DEFAULT 'auto',
          cefr_level TEXT NOT NULL DEFAULT 'A2',
          question_count_target INTEGER NOT NULL DEFAULT 8,
          difficulty TEXT NOT NULL DEFAULT 'medium',
          question_framework TEXT NOT NULL DEFAULT 'American English File',
          attempts_allowed INTEGER NOT NULL DEFAULT 1,
          passing_score INTEGER NOT NULL DEFAULT 70,
          max_replays INTEGER NOT NULL DEFAULT 3,
          randomize_questions BOOLEAN NOT NULL DEFAULT false,
          randomize_answers BOOLEAN NOT NULL DEFAULT false,
          status TEXT NOT NULL DEFAULT 'draft',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS learn_segments (
          id TEXT PRIMARY KEY,
          assignment_id TEXT NOT NULL REFERENCES learn_assignments(id) ON DELETE CASCADE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          sentence_text TEXT NOT NULL DEFAULT '',
          start_seconds DOUBLE PRECISION NOT NULL DEFAULT 0,
          end_seconds DOUBLE PRECISION NOT NULL DEFAULT 0,
          selected BOOLEAN NOT NULL DEFAULT true
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS learn_questions (
          id TEXT PRIMARY KEY,
          assignment_id TEXT NOT NULL REFERENCES learn_assignments(id) ON DELETE CASCADE,
          segment_id TEXT REFERENCES learn_segments(id) ON DELETE SET NULL,
          sort_order INTEGER NOT NULL DEFAULT 0,
          question_text TEXT NOT NULL DEFAULT '',
          choices JSONB NOT NULL DEFAULT '[]'::jsonb,
          correct_answer TEXT NOT NULL DEFAULT '',
          explanation TEXT NOT NULL DEFAULT '',
          keep_question BOOLEAN NOT NULL DEFAULT true
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS learn_submissions (
          id TEXT PRIMARY KEY,
          assignment_id TEXT NOT NULL REFERENCES learn_assignments(id) ON DELETE CASCADE,
          student_name TEXT NOT NULL DEFAULT '',
          student_number TEXT NOT NULL DEFAULT '',
          class_number TEXT NOT NULL DEFAULT '',
          score INTEGER NOT NULL DEFAULT 0,
          max_score INTEGER NOT NULL DEFAULT 0,
          percent DOUBLE PRECISION NOT NULL DEFAULT 0,
          attempt_number INTEGER NOT NULL DEFAULT 1,
          duration_seconds INTEGER,
          submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS learn_submission_answers (
          id TEXT PRIMARY KEY,
          submission_id TEXT NOT NULL REFERENCES learn_submissions(id) ON DELETE CASCADE,
          question_id TEXT NOT NULL,
          selected_answer TEXT NOT NULL DEFAULT '',
          is_correct BOOLEAN NOT NULL DEFAULT false
        )
      `;
      await sql`
        ALTER TABLE learn_assignments
        ADD COLUMN IF NOT EXISTS thumbnail_url TEXT NOT NULL DEFAULT ''
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_learn_segments_assignment ON learn_segments(assignment_id, sort_order)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_learn_questions_assignment ON learn_questions(assignment_id, sort_order)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_learn_submissions_assignment ON learn_submissions(assignment_id, submitted_at DESC)`;
    })();
  }
  await schemaReady;
}

function rowToAssignment(row: Record<string, unknown>): LearnAssignment {
  return {
    id: row.id as string,
    teacher_id: row.teacher_id as string,
    teacher_name: (row.teacher_name as string) ?? '',
    title: (row.title as string) ?? '',
    class_name: (row.class_name as string) ?? '',
    due_date: (row.due_date as string | null) ?? null,
    audio_url: (row.audio_url as string) ?? '',
    thumbnail_url: (row.thumbnail_url as string) ?? '',
    transcript: (row.transcript as string) ?? '',
    transcript_source: ((row.transcript_source as LearnTranscriptSource) ?? 'auto'),
    cefr_level: parseCefr(row.cefr_level),
    question_count_target: Number(row.question_count_target ?? 8),
    difficulty: parseDifficulty(row.difficulty),
    question_framework: (row.question_framework as string) || 'American English File',
    attempts_allowed: Math.max(1, Number(row.attempts_allowed ?? 1)),
    passing_score: Math.min(100, Math.max(0, Number(row.passing_score ?? 70))),
    max_replays: Math.max(0, Number(row.max_replays ?? 3)),
    randomize_questions: Boolean(row.randomize_questions),
    randomize_answers: Boolean(row.randomize_answers),
    status: row.status === 'published' ? 'published' : 'draft',
    created_at: new Date(row.created_at as string).toISOString(),
    updated_at: new Date(row.updated_at as string).toISOString(),
  };
}

function rowToSegment(row: Record<string, unknown>): LearnSegment {
  return {
    id: row.id as string,
    assignment_id: row.assignment_id as string,
    sort_order: Number(row.sort_order ?? 0),
    sentence_text: (row.sentence_text as string) ?? '',
    start_seconds: Number(row.start_seconds ?? 0),
    end_seconds: Number(row.end_seconds ?? 0),
    selected: Boolean(row.selected),
  };
}

function rowToQuestion(row: Record<string, unknown>): LearnQuestion {
  const choices = row.choices;
  return {
    id: row.id as string,
    assignment_id: row.assignment_id as string,
    segment_id: (row.segment_id as string | null) ?? null,
    sort_order: Number(row.sort_order ?? 0),
    question_text: (row.question_text as string) ?? '',
    choices: Array.isArray(choices) ? (choices as string[]) : [],
    correct_answer: (row.correct_answer as string) ?? '',
    explanation: (row.explanation as string) ?? '',
    keep_question: Boolean(row.keep_question),
  };
}

export async function listLearnAssignments(
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<LearnAssignmentListItem[]> {
  await ensureLearnSchema();
  const { rows } = await sql`
    SELECT
      a.*,
      COUNT(DISTINCT s.id)::int AS segment_count,
      COUNT(DISTINCT CASE WHEN s.selected THEN s.id END)::int AS selected_segment_count,
      COUNT(DISTINCT q.id)::int AS question_count,
      COUNT(DISTINCT sub.id)::int AS submission_count
    FROM learn_assignments a
    LEFT JOIN learn_segments s ON s.assignment_id = a.id
    LEFT JOIN learn_questions q ON q.assignment_id = a.id
    LEFT JOIN learn_submissions sub ON sub.assignment_id = a.id
    WHERE a.teacher_id = ${teacherId}
    GROUP BY a.id
    ORDER BY a.updated_at DESC
  `;

  return rows.map((row) => ({
    ...rowToAssignment(row),
    segment_count: Number(row.segment_count ?? 0),
    selected_segment_count: Number(row.selected_segment_count ?? 0),
    question_count: Number(row.question_count ?? 0),
    submission_count: Number(row.submission_count ?? 0),
  }));
}

export async function getLearnAssignmentById(
  assignmentId: string
): Promise<LearnAssignmentWithDetails | null> {
  await ensureLearnSchema();
  const { rows } = await sql`SELECT * FROM learn_assignments WHERE id = ${assignmentId}`;
  if (rows.length === 0) return null;

  const assignment = rowToAssignment(rows[0]);
  const { rows: segmentRows } = await sql`
    SELECT * FROM learn_segments
    WHERE assignment_id = ${assignmentId}
    ORDER BY sort_order ASC
  `;
  const { rows: questionRows } = await sql`
    SELECT * FROM learn_questions
    WHERE assignment_id = ${assignmentId}
    ORDER BY sort_order ASC
  `;

  return {
    ...assignment,
    segments: segmentRows.map(rowToSegment),
    questions: questionRows.map(rowToQuestion),
  };
}

export async function createLearnAssignment(
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<LearnAssignmentWithDetails> {
  await ensureLearnSchema();
  const id = nanoid(21);
  await sql`
    INSERT INTO learn_assignments (id, teacher_id, title, status)
    VALUES (${id}, ${teacherId}, 'Untitled Listen & Learn', 'draft')
  `;
  const assignment = await getLearnAssignmentById(id);
  if (!assignment) throw new Error('Failed to create assignment');
  return assignment;
}

async function replaceLearnChildren(
  assignmentId: string,
  payload: SaveLearnAssignmentPayload
): Promise<void> {
  await sql`DELETE FROM learn_questions WHERE assignment_id = ${assignmentId}`;
  await sql`DELETE FROM learn_segments WHERE assignment_id = ${assignmentId}`;

  const segmentIdMap = new Map<number, string>();
  const validSegmentIds = new Set<string>();

  for (let index = 0; index < payload.segments.length; index += 1) {
    const segment = payload.segments[index];
    const segmentId = segment.id || nanoid(21);
    segmentIdMap.set(index, segmentId);
    validSegmentIds.add(segmentId);
    await sql`
      INSERT INTO learn_segments (
        id, assignment_id, sort_order, sentence_text, start_seconds, end_seconds, selected
      )
      VALUES (
        ${segmentId},
        ${assignmentId},
        ${index},
        ${segment.sentence_text},
        ${Number(segment.start_seconds) || 0},
        ${Number(segment.end_seconds) || 0},
        ${Boolean(segment.selected)}
      )
    `;
  }

  for (let index = 0; index < payload.questions.length; index += 1) {
    const question = payload.questions[index];
    const questionId = question.id || nanoid(21);
    let segmentId = question.segment_id ?? null;
    if (segmentId && !validSegmentIds.has(segmentId)) {
      segmentId = segmentIdMap.get(index) ?? null;
    }
    if (!segmentId) {
      segmentId = segmentIdMap.get(index) ?? null;
    }

    await sql`
      INSERT INTO learn_questions (
        id, assignment_id, segment_id, sort_order, question_text, choices,
        correct_answer, explanation, keep_question
      )
      VALUES (
        ${questionId},
        ${assignmentId},
        ${segmentId},
        ${index},
        ${question.question_text},
        ${JSON.stringify(question.choices ?? [])},
        ${question.correct_answer},
        ${question.explanation ?? ''},
        ${Boolean(question.keep_question)}
      )
    `;
  }
}

export async function saveLearnAssignment(
  assignmentId: string,
  payload: SaveLearnAssignmentPayload,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<LearnAssignmentWithDetails> {
  await ensureLearnSchema();
  const existing = await getLearnAssignmentById(assignmentId);
  if (!existing) throw new Error('Assignment not found');

  await sql`
    UPDATE learn_assignments
    SET
      teacher_name = ${safeTrim(payload.teacher_name)},
      title = ${safeTrim(payload.title) || 'Untitled Listen & Learn'},
      class_name = ${safeTrim(payload.class_name)},
      due_date = ${payload.due_date},
      audio_url = ${safeTrim(payload.audio_url)},
      thumbnail_url = ${safeTrim(payload.thumbnail_url)},
      transcript = ${payload.transcript ?? ''},
      transcript_source = ${payload.transcript_source === 'manual' ? 'manual' : 'auto'},
      cefr_level = ${parseCefr(payload.cefr_level)},
      question_count_target = ${Math.max(1, Number(payload.question_count_target) || 8)},
      difficulty = ${parseDifficulty(payload.difficulty)},
      question_framework = ${safeTrim(payload.question_framework) || 'American English File'},
      attempts_allowed = ${Math.max(1, Number(payload.attempts_allowed) || 1)},
      passing_score = ${Math.min(100, Math.max(0, Number(payload.passing_score) || 70))},
      max_replays = ${Math.max(0, Number(payload.max_replays) || 0)},
      randomize_questions = ${Boolean(payload.randomize_questions)},
      randomize_answers = ${Boolean(payload.randomize_answers)},
      status = ${payload.status === 'published' ? 'published' : 'draft'},
      updated_at = NOW()
    WHERE id = ${assignmentId} AND teacher_id = ${teacherId}
  `;

  await replaceLearnChildren(assignmentId, payload);
  const saved = await getLearnAssignmentById(assignmentId);
  if (!saved) throw new Error('Failed to load saved assignment');
  return saved;
}

export async function deleteLearnAssignment(assignmentId: string): Promise<boolean> {
  await ensureLearnSchema();
  const result = await sql`DELETE FROM learn_assignments WHERE id = ${assignmentId}`;
  return (result.rowCount ?? 0) > 0;
}

export async function getPublicLearnAssignment(
  assignmentId: string
): Promise<PublicLearnAssignment | null> {
  const assignment = await getLearnAssignmentById(assignmentId);
  if (!assignment || assignment.status !== 'published') return null;

  const segmentById = new Map(assignment.segments.map((segment) => [segment.id, segment]));
  let questions = assignment.questions.filter((question) => question.keep_question);

  if (assignment.randomize_questions) {
    questions = shuffleArray(questions);
  }

  let entryConfig = getDefaultEntryConfig();
  try {
    entryConfig = await getEntryConfig(assignment.teacher_id || DEFAULT_TEACHER_ID);
  } catch (error) {
    console.error('Listen & Learn entry config fallback:', error);
  }

  return {
    id: assignment.id,
    title: assignment.title,
    teacher_name: assignment.teacher_name,
    class_name: assignment.class_name,
    due_date: assignment.due_date,
    audio_url: assignment.audio_url,
    thumbnail_url: assignment.thumbnail_url,
    attempts_allowed: assignment.attempts_allowed,
    passing_score: assignment.passing_score,
    max_replays: assignment.max_replays,
    randomize_questions: assignment.randomize_questions,
    randomize_answers: assignment.randomize_answers,
    entry_config: entryConfig,
    questions: questions.map((question) => {
      const segment = question.segment_id ? segmentById.get(question.segment_id) : null;
      let choices = question.choices
        .map((choice) => stripChoiceLetterPrefix(choice))
        .filter((choice) => choice.trim());
      if (assignment.randomize_answers) {
        choices = shuffleArray(choices);
      }
      return {
        id: question.id,
        question_text: question.question_text,
        choices,
        start_seconds: segment?.start_seconds ?? 0,
        end_seconds: segment?.end_seconds ?? 0,
      };
    }),
  };
}

export async function countLearnAttempts(
  assignmentId: string,
  studentNumber: string,
  classNumber: string
): Promise<number> {
  await ensureLearnSchema();
  const normalizedNumber = normalizeStudentNumber(studentNumber);
  const normalizedClass = classNumber.trim();
  const { rows } = await sql`
    SELECT COUNT(*)::int AS attempt_count
    FROM learn_submissions
    WHERE assignment_id = ${assignmentId}
      AND student_number = ${normalizedNumber}
      AND class_number = ${normalizedClass}
  `;
  return Number(rows[0]?.attempt_count ?? 0);
}

export async function submitLearnAssignment(
  assignmentId: string,
  payload: SubmitLearnPayload
): Promise<LearnSubmission> {
  await ensureLearnSchema();
  const assignment = await getLearnAssignmentById(assignmentId);
  if (!assignment || assignment.status !== 'published') {
    throw new Error('Assignment is not available');
  }

  const studentNumber = normalizeStudentNumber(payload.student_number);
  const classNumber = payload.class_number.trim();
  if (!safeTrim(payload.student_name)) throw new Error('Student name is required');
  if (!studentNumber) throw new Error('Student number is required');
  if (!classNumber) throw new Error('Class is required');

  const attempts = await countLearnAttempts(assignmentId, studentNumber, classNumber);
  if (attempts >= assignment.attempts_allowed) {
    throw new Error('No attempts remaining');
  }

  const keepQuestions = assignment.questions.filter((question) => question.keep_question);
  const answerByQuestion = new Map(
    payload.answers.map((answer) => [answer.question_id, answer.selected_answer.trim()])
  );

  let score = 0;
  const gradedAnswers = keepQuestions.map((question) => {
    const selected = answerByQuestion.get(question.id) ?? '';
    const isCorrect =
      stripChoiceLetterPrefix(selected).toLowerCase() ===
      stripChoiceLetterPrefix(question.correct_answer).toLowerCase();
    if (isCorrect) score += 1;
    return {
      question_id: question.id,
      selected_answer: selected,
      is_correct: isCorrect,
    };
  });

  const maxScore = keepQuestions.length;
  const percent = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const submissionId = nanoid(21);

  await sql`
    INSERT INTO learn_submissions (
      id, assignment_id, student_name, student_number, class_number,
      score, max_score, percent, attempt_number, duration_seconds
    )
    VALUES (
      ${submissionId},
      ${assignmentId},
      ${safeTrim(payload.student_name)},
      ${studentNumber},
      ${classNumber},
      ${score},
      ${maxScore},
      ${Number(percent.toFixed(2))},
      ${attempts + 1},
      ${payload.duration_seconds ?? null}
    )
  `;

  for (const answer of gradedAnswers) {
    await sql`
      INSERT INTO learn_submission_answers (
        id, submission_id, question_id, selected_answer, is_correct
      )
      VALUES (
        ${nanoid(21)},
        ${submissionId},
        ${answer.question_id},
        ${answer.selected_answer},
        ${answer.is_correct}
      )
    `;
  }

  return {
    id: submissionId,
    assignment_id: assignmentId,
    student_name: safeTrim(payload.student_name),
    student_number: studentNumber,
    class_number: classNumber,
    score,
    max_score: maxScore,
    percent: Number(percent.toFixed(2)),
    attempt_number: attempts + 1,
    duration_seconds: payload.duration_seconds ?? null,
    submitted_at: new Date().toISOString(),
    answers: gradedAnswers,
  };
}

export async function listLearnSubmissions(assignmentId: string): Promise<LearnSubmission[]> {
  await ensureLearnSchema();
  const { rows } = await sql`
    SELECT * FROM learn_submissions
    WHERE assignment_id = ${assignmentId}
    ORDER BY submitted_at DESC
  `;

  const submissions: LearnSubmission[] = [];
  for (const row of rows) {
    const { rows: answerRows } = await sql`
      SELECT question_id, selected_answer, is_correct
      FROM learn_submission_answers
      WHERE submission_id = ${row.id as string}
    `;
    submissions.push({
      id: row.id as string,
      assignment_id: row.assignment_id as string,
      student_name: row.student_name as string,
      student_number: row.student_number as string,
      class_number: row.class_number as string,
      score: Number(row.score ?? 0),
      max_score: Number(row.max_score ?? 0),
      percent: Number(row.percent ?? 0),
      attempt_number: Number(row.attempt_number ?? 1),
      duration_seconds: row.duration_seconds === null ? null : Number(row.duration_seconds),
      submitted_at: new Date(row.submitted_at as string).toISOString(),
      answers: answerRows.map((answer) => ({
        question_id: answer.question_id as string,
        selected_answer: answer.selected_answer as string,
        is_correct: Boolean(answer.is_correct),
      })),
    });
  }

  return submissions;
}
