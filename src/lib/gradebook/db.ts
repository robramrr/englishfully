import { sql } from '@vercel/postgres';
import { nanoid } from 'nanoid';
import { getEntryConfig } from '@/lib/speak-and-submit/settings';
import { listTasks, getSubmissionsForTask } from '@/lib/speak-and-submit/db';
import { listAssignments } from '@/lib/listen-and-answer/db';
import { normalizeStudentNumber } from '@/lib/speak-and-submit/types';
import type {
  GradebookClassSummary,
  GradebookEntry,
  GradebookSeat,
  GradebookSemester,
  GradebookSettings,
  GradebookTaskColumn,
  GradebookTaskOption,
  GradebookTool,
  SaveGradebookSettingsPayload,
  UpsertGradeEntryPayload,
  UpsertRosterRollPayload,
  StudentGradeLookupResult,
} from './types';
import {
  DEFAULT_MAX_POINTS,
  buildStudentRoster,
  clampPoints,
  formatPercent,
  getCurrentSchoolYear,
  gradePointsFromTestScore,
  isValidRollNumber,
  normalizeRollNumber,
  parseSemester,
  taskKey,
  clampPassPercent,
} from './types';

const DEFAULT_TEACHER_ID = 'default';

let schemaReady: Promise<void> | null = null;

export async function ensureGradebookSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS gradebook_settings (
          teacher_id TEXT PRIMARY KEY DEFAULT 'default',
          school_year TEXT NOT NULL DEFAULT '',
          active_semester INTEGER NOT NULL DEFAULT 1,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS gradebook_entries (
          id TEXT PRIMARY KEY,
          teacher_id TEXT NOT NULL DEFAULT 'default',
          school_year TEXT NOT NULL,
          semester INTEGER NOT NULL,
          class_id TEXT NOT NULL,
          class_label TEXT NOT NULL,
          student_number TEXT NOT NULL,
          tool TEXT NOT NULL,
          task_id TEXT NOT NULL,
          task_title TEXT NOT NULL DEFAULT '',
          points DOUBLE PRECISION NOT NULL DEFAULT 0,
          max_points DOUBLE PRECISION NOT NULL DEFAULT 10,
          notes TEXT NOT NULL DEFAULT '',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (teacher_id, school_year, semester, class_id, student_number, tool, task_id)
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_gradebook_entries_class
        ON gradebook_entries(teacher_id, school_year, semester, class_id)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_gradebook_entries_task
        ON gradebook_entries(teacher_id, tool, task_id)
      `;
      await sql`
        ALTER TABLE gradebook_entries
        ADD COLUMN IF NOT EXISTS test_correct DOUBLE PRECISION
      `;
      await sql`
        ALTER TABLE gradebook_entries
        ADD COLUMN IF NOT EXISTS test_total DOUBLE PRECISION
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS gradebook_roster (
          id TEXT PRIMARY KEY,
          teacher_id TEXT NOT NULL DEFAULT 'default',
          class_id TEXT NOT NULL,
          class_label TEXT NOT NULL DEFAULT '',
          student_number TEXT NOT NULL,
          roll_number TEXT NOT NULL DEFAULT '',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (teacher_id, class_id, student_number)
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_gradebook_roster_lookup
        ON gradebook_roster(teacher_id, class_id, student_number)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_gradebook_roster_roll
        ON gradebook_roster(teacher_id, class_id, roll_number)
      `;
    })();
  }
  await schemaReady;
}

function rowToSettings(row: Record<string, unknown>): GradebookSettings {
  return {
    teacher_id: row.teacher_id as string,
    school_year: (row.school_year as string) || getCurrentSchoolYear(),
    active_semester: parseSemester(row.active_semester),
    updated_at: new Date(row.updated_at as string).toISOString(),
  };
}

function rowToEntry(row: Record<string, unknown>): GradebookEntry {
  return {
    id: row.id as string,
    teacher_id: row.teacher_id as string,
    school_year: row.school_year as string,
    semester: parseSemester(row.semester),
    class_id: row.class_id as string,
    class_label: row.class_label as string,
    student_number: row.student_number as string,
    tool: row.tool as GradebookTool,
    task_id: row.task_id as string,
    task_title: row.task_title as string,
    points: Number(row.points ?? 0),
    max_points: Number(row.max_points ?? DEFAULT_MAX_POINTS),
    test_correct:
      row.test_correct === null || row.test_correct === undefined
        ? null
        : Number(row.test_correct),
    test_total:
      row.test_total === null || row.test_total === undefined ? null : Number(row.test_total),
    notes: (row.notes as string) ?? '',
    updated_at: new Date(row.updated_at as string).toISOString(),
  };
}

export async function getGradebookSettings(
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<GradebookSettings> {
  await ensureGradebookSchema();
  const { rows } = await sql`
    SELECT * FROM gradebook_settings WHERE teacher_id = ${teacherId}
  `;
  if (rows.length === 0) {
    const schoolYear = getCurrentSchoolYear();
    await sql`
      INSERT INTO gradebook_settings (teacher_id, school_year, active_semester)
      VALUES (${teacherId}, ${schoolYear}, 1)
      ON CONFLICT (teacher_id) DO NOTHING
    `;
    return {
      teacher_id: teacherId,
      school_year: schoolYear,
      active_semester: 1,
      updated_at: new Date().toISOString(),
    };
  }
  return rowToSettings(rows[0]);
}

export async function saveGradebookSettings(
  payload: SaveGradebookSettingsPayload,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<GradebookSettings> {
  await ensureGradebookSchema();
  const schoolYear = payload.school_year.trim() || getCurrentSchoolYear();
  const semester = parseSemester(payload.active_semester);

  await sql`
    INSERT INTO gradebook_settings (teacher_id, school_year, active_semester, updated_at)
    VALUES (${teacherId}, ${schoolYear}, ${semester}, NOW())
    ON CONFLICT (teacher_id) DO UPDATE SET
      school_year = EXCLUDED.school_year,
      active_semester = EXCLUDED.active_semester,
      updated_at = NOW()
  `;

  return getGradebookSettings(teacherId);
}

export async function listGradebookTasks(): Promise<GradebookTaskOption[]> {
  const [speakTasks, listenAssignments] = await Promise.all([
    listTasks(),
    listAssignments(),
  ]);

  const speakOptions: GradebookTaskOption[] = speakTasks.map((task) => ({
    id: task.id,
    title: task.title,
    tool: 'speak_and_submit',
    class_name: task.class_name,
    question_count: null,
  }));

  const listenOptions: GradebookTaskOption[] = listenAssignments.map((assignment) => {
    const declaredTotal = Number.parseInt(String(assignment.total_questions ?? '').trim(), 10);
    const questionCount =
      Number.isFinite(declaredTotal) && declaredTotal > 0
        ? declaredTotal
        : assignment.question_count > 0
          ? assignment.question_count
          : null;
    return {
      id: assignment.id,
      title: assignment.title,
      tool: 'listen_and_answer' as const,
      class_name: assignment.class_name,
      question_count: questionCount,
    };
  });

  return [...speakOptions, ...listenOptions];
}

export async function getClassOverview(
  semester?: GradebookSemester,
  schoolYear?: string,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<{
  settings: GradebookSettings;
  letter_enabled: boolean;
  classes: GradebookClassSummary[];
}> {
  await ensureGradebookSchema();
  const settings = await getGradebookSettings(teacherId);
  const activeSemester = semester ?? settings.active_semester;
  const activeYear = schoolYear?.trim() || settings.school_year;
  const entryConfig = await getEntryConfig(teacherId);

  const { rows: entryRows } = await sql`
    SELECT
      class_id,
      COUNT(*)::int AS entry_count,
      COUNT(DISTINCT student_number)::int AS graded_seat_count,
      COALESCE(SUM(points), 0)::float AS total_points_earned,
      COALESCE(SUM(max_points), 0)::float AS total_points_possible
    FROM gradebook_entries
    WHERE teacher_id = ${teacherId}
      AND school_year = ${activeYear}
      AND semester = ${activeSemester}
    GROUP BY class_id
  `;

  const statsByClass = new Map(
    entryRows.map((row) => [
      row.class_id as string,
      {
        entry_count: Number(row.entry_count ?? 0),
        graded_seat_count: Number(row.graded_seat_count ?? 0),
        total_points_earned: Number(row.total_points_earned ?? 0),
        total_points_possible: Number(row.total_points_possible ?? 0),
      },
    ])
  );

  const classes: GradebookClassSummary[] = entryConfig.classes.map((classOption) => {
    const seats = buildStudentRoster(
      classOption.max_student_number,
      entryConfig.student_letter_enabled
    );
    const stats = statsByClass.get(classOption.id) ?? {
      entry_count: 0,
      graded_seat_count: 0,
      total_points_earned: 0,
      total_points_possible: 0,
    };
    return {
      id: classOption.id,
      label: classOption.label,
      max_student_number: classOption.max_student_number,
      seat_count: seats.length,
      graded_seat_count: stats.graded_seat_count,
      entry_count: stats.entry_count,
      total_points_earned: stats.total_points_earned,
      total_points_possible: stats.total_points_possible,
    };
  });

  return {
    settings: { ...settings, active_semester: activeSemester, school_year: activeYear },
    letter_enabled: entryConfig.student_letter_enabled,
    classes,
  };
}

export async function getClassGradebook(
  classId: string,
  semester?: GradebookSemester,
  schoolYear?: string,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<{
  settings: GradebookSettings;
  letter_enabled: boolean;
  class_id: string;
  class_label: string;
  max_student_number: number;
  seats: GradebookSeat[];
  task_columns: GradebookTaskColumn[];
  available_tasks: GradebookTaskOption[];
}> {
  await ensureGradebookSchema();
  const settings = await getGradebookSettings(teacherId);
  const activeSemester = semester ?? settings.active_semester;
  const activeYear = schoolYear?.trim() || settings.school_year;
  const entryConfig = await getEntryConfig(teacherId);
  const classOption = entryConfig.classes.find((item) => item.id === classId);
  if (!classOption) {
    throw new Error('Class not found in Speak & Submit settings');
  }

  const roster = buildStudentRoster(
    classOption.max_student_number,
    entryConfig.student_letter_enabled
  );

  const { rows } = await sql`
    SELECT * FROM gradebook_entries
    WHERE teacher_id = ${teacherId}
      AND school_year = ${activeYear}
      AND semester = ${activeSemester}
      AND class_id = ${classId}
    ORDER BY updated_at DESC
  `;
  const entries = rows.map(rowToEntry);

  const taskMap = new Map<string, GradebookTaskColumn>();
  for (const entry of entries) {
    const key = taskKey(entry.tool, entry.task_id);
    const existing = taskMap.get(key);
    if (!existing) {
      taskMap.set(key, {
        task_key: key,
        tool: entry.tool,
        task_id: entry.task_id,
        task_title: entry.task_title,
        max_points: entry.max_points,
        submitted_student_numbers: [],
      });
    } else {
      existing.max_points = Math.max(existing.max_points, entry.max_points);
      if (!existing.task_title && entry.task_title) {
        existing.task_title = entry.task_title;
      }
    }
  }

  // Attach Speak submission indicators for speak tasks already in the gradebook
  for (const column of taskMap.values()) {
    if (column.tool !== 'speak_and_submit') continue;
    try {
      const submissions = await getSubmissionsForTask(column.task_id);
      const submitted = new Set(
        submissions
          .filter((item) => item.class_number.trim() === classOption.label.trim())
          .map((item) => normalizeStudentNumber(item.student_number))
      );
      column.submitted_student_numbers = Array.from(submitted);
    } catch {
      column.submitted_student_numbers = [];
    }
  }

  // Also collect display names from speak submissions for this class
  const nameByStudent = new Map<string, string>();
  for (const column of taskMap.values()) {
    if (column.tool !== 'speak_and_submit') continue;
    try {
      const submissions = await getSubmissionsForTask(column.task_id);
      for (const submission of submissions) {
        if (submission.class_number.trim() !== classOption.label.trim()) continue;
        const number = normalizeStudentNumber(submission.student_number);
        if (!nameByStudent.has(number) && submission.student_name.trim()) {
          nameByStudent.set(number, submission.student_name.trim());
        }
      }
    } catch {
      // ignore
    }
  }

  const rollByStudent = await getClassRollMap(classId, teacherId);

  const seats: GradebookSeat[] = roster.map((studentNumber) => {
    const seatEntries = entries.filter((entry) => entry.student_number === studentNumber);
    const entriesByTask: Record<string, GradebookEntry> = {};
    let totalEarned = 0;
    let totalPossible = 0;
    for (const entry of seatEntries) {
      entriesByTask[taskKey(entry.tool, entry.task_id)] = entry;
      totalEarned += entry.points;
      totalPossible += entry.max_points;
    }
    const roll = rollByStudent.get(studentNumber) || '';
    return {
      student_number: studentNumber,
      display_name: nameByStudent.get(studentNumber) ?? null,
      roll_number: roll || null,
      entries_by_task: entriesByTask,
      total_earned: totalEarned,
      total_possible: totalPossible,
    };
  });

  const availableTasks = await listGradebookTasks();
  const taskColumns = Array.from(taskMap.values()).sort((a, b) =>
    a.task_title.localeCompare(b.task_title, undefined, { sensitivity: 'base' })
  );

  return {
    settings: { ...settings, active_semester: activeSemester, school_year: activeYear },
    letter_enabled: entryConfig.student_letter_enabled,
    class_id: classOption.id,
    class_label: classOption.label,
    max_student_number: classOption.max_student_number,
    seats,
    task_columns: taskColumns,
    available_tasks: availableTasks,
  };
}

export async function upsertGradeEntry(
  payload: UpsertGradeEntryPayload,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<GradebookEntry> {
  await ensureGradebookSchema();

  if (payload.tool !== 'speak_and_submit' && payload.tool !== 'listen_and_answer') {
    throw new Error('Invalid tool');
  }

  const maxPoints = Math.max(0, Number(payload.max_points) || DEFAULT_MAX_POINTS);
  let points = clampPoints(payload.points, maxPoints);
  let testCorrect: number | null =
    payload.test_correct === null || payload.test_correct === undefined
      ? null
      : Number(payload.test_correct);
  let testTotal: number | null =
    payload.test_total === null || payload.test_total === undefined
      ? null
      : Number(payload.test_total);

  if (testCorrect !== null && !Number.isFinite(testCorrect)) testCorrect = null;
  if (testTotal !== null && !Number.isFinite(testTotal)) testTotal = null;
  if (testCorrect !== null) testCorrect = Math.max(0, testCorrect);
  if (testTotal !== null) testTotal = Math.max(0, testTotal);
  if (testCorrect !== null && testTotal !== null && testCorrect > testTotal) {
    testCorrect = testTotal;
  }

  // Listen & Answer: if a test score is provided, derive the 10-point grade automatically
  // unless the client already sent an explicit points value with no test fields.
  if (
    payload.tool === 'listen_and_answer' &&
    testCorrect !== null &&
    testTotal !== null &&
    testTotal > 0
  ) {
    const passPercent = clampPassPercent(payload.pass_percent);
    points = gradePointsFromTestScore(testCorrect, testTotal, maxPoints, passPercent);
  }

  const studentNumber = normalizeStudentNumber(payload.student_number);
  const semester = parseSemester(payload.semester);
  const schoolYear = payload.school_year.trim() || getCurrentSchoolYear();
  const classLabel = payload.class_label.trim();
  const taskTitle = payload.task_title.trim() || 'Untitled Task';
  const notes = (payload.notes ?? '').trim();

  if (!payload.class_id.trim()) throw new Error('Class is required');
  if (!classLabel) throw new Error('Class label is required');
  if (!studentNumber) throw new Error('Student number is required');
  if (!payload.task_id.trim()) throw new Error('Task is required');

  const { rows: existingRows } = await sql`
    SELECT id FROM gradebook_entries
    WHERE teacher_id = ${teacherId}
      AND school_year = ${schoolYear}
      AND semester = ${semester}
      AND class_id = ${payload.class_id}
      AND student_number = ${studentNumber}
      AND tool = ${payload.tool}
      AND task_id = ${payload.task_id}
    LIMIT 1
  `;

  const id = existingRows.length > 0 ? (existingRows[0].id as string) : nanoid(21);

  await sql`
    INSERT INTO gradebook_entries (
      id, teacher_id, school_year, semester, class_id, class_label,
      student_number, tool, task_id, task_title, points, max_points,
      test_correct, test_total, notes, updated_at
    )
    VALUES (
      ${id},
      ${teacherId},
      ${schoolYear},
      ${semester},
      ${payload.class_id},
      ${classLabel},
      ${studentNumber},
      ${payload.tool},
      ${payload.task_id},
      ${taskTitle},
      ${points},
      ${maxPoints},
      ${testCorrect},
      ${testTotal},
      ${notes},
      NOW()
    )
    ON CONFLICT (teacher_id, school_year, semester, class_id, student_number, tool, task_id)
    DO UPDATE SET
      class_label = EXCLUDED.class_label,
      task_title = EXCLUDED.task_title,
      points = EXCLUDED.points,
      max_points = EXCLUDED.max_points,
      test_correct = EXCLUDED.test_correct,
      test_total = EXCLUDED.test_total,
      notes = EXCLUDED.notes,
      updated_at = NOW()
  `;

  const { rows } = await sql`SELECT * FROM gradebook_entries WHERE id = ${id}`;
  return rowToEntry(rows[0]);
}

export async function deleteGradeEntry(
  entryId: string,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<boolean> {
  await ensureGradebookSchema();
  const result = await sql`
    DELETE FROM gradebook_entries
    WHERE id = ${entryId} AND teacher_id = ${teacherId}
  `;
  return (result.rowCount ?? 0) > 0;
}

export async function getSpeakSubmissionNumbersForTask(
  taskId: string,
  classLabel: string
): Promise<string[]> {
  const submissions = await getSubmissionsForTask(taskId);
  const submitted = new Set(
    submissions
      .filter((item) => item.class_number.trim() === classLabel.trim())
      .map((item) => normalizeStudentNumber(item.student_number))
  );
  return Array.from(submitted);
}

async function getClassRollMap(
  classId: string,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<Map<string, string>> {
  await ensureGradebookSchema();
  const { rows } = await sql`
    SELECT student_number, roll_number
    FROM gradebook_roster
    WHERE teacher_id = ${teacherId} AND class_id = ${classId}
  `;
  const map = new Map<string, string>();
  for (const row of rows) {
    const number = normalizeStudentNumber(String(row.student_number ?? ''));
    const roll = normalizeRollNumber(row.roll_number);
    if (number && roll) map.set(number, roll);
  }
  return map;
}

export async function upsertRosterRoll(
  payload: UpsertRosterRollPayload,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<{ student_number: string; roll_number: string | null }> {
  await ensureGradebookSchema();
  const classId = String(payload.class_id || '').trim();
  const classLabel = String(payload.class_label || '').trim();
  const studentNumber = normalizeStudentNumber(String(payload.student_number || ''));
  const rollNumber = normalizeRollNumber(payload.roll_number);

  if (!classId) throw new Error('Class is required');
  if (!studentNumber) throw new Error('Student number is required');
  if (rollNumber && !isValidRollNumber(rollNumber)) {
    throw new Error('Roll number must be exactly 5 digits');
  }

  // Prevent two seats in the same class from sharing a roll number.
  if (rollNumber) {
    const { rows: conflicts } = await sql`
      SELECT student_number FROM gradebook_roster
      WHERE teacher_id = ${teacherId}
        AND class_id = ${classId}
        AND roll_number = ${rollNumber}
        AND student_number <> ${studentNumber}
      LIMIT 1
    `;
    if (conflicts.length > 0) {
      throw new Error(`Roll number ${rollNumber} is already used by #${conflicts[0].student_number}`);
    }
  }

  const id = nanoid(21);
  await sql`
    INSERT INTO gradebook_roster (
      id, teacher_id, class_id, class_label, student_number, roll_number, updated_at
    )
    VALUES (
      ${id},
      ${teacherId},
      ${classId},
      ${classLabel},
      ${studentNumber},
      ${rollNumber},
      NOW()
    )
    ON CONFLICT (teacher_id, class_id, student_number)
    DO UPDATE SET
      class_label = EXCLUDED.class_label,
      roll_number = EXCLUDED.roll_number,
      updated_at = NOW()
  `;

  return {
    student_number: studentNumber,
    roll_number: rollNumber || null,
  };
}

export async function listPublicGradeClasses(
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<Array<{ id: string; label: string; letter_enabled: boolean }>> {
  const entryConfig = await getEntryConfig(teacherId);
  return entryConfig.classes.map((item) => ({
    id: item.id,
    label: item.label,
    letter_enabled: entryConfig.student_letter_enabled,
  }));
}

export async function lookupStudentGrades(params: {
  classId: string;
  studentNumber: string;
  rollNumber: string;
  semester?: GradebookSemester;
  schoolYear?: string;
  teacherId?: string;
}): Promise<StudentGradeLookupResult | null> {
  const teacherId = params.teacherId || DEFAULT_TEACHER_ID;
  await ensureGradebookSchema();

  const classId = String(params.classId || '').trim();
  const studentNumber = normalizeStudentNumber(params.studentNumber);
  const rollNumber = normalizeRollNumber(params.rollNumber);

  if (!classId || !studentNumber || !isValidRollNumber(rollNumber)) {
    return null;
  }

  const { rows: rosterRows } = await sql`
    SELECT roll_number, class_label
    FROM gradebook_roster
    WHERE teacher_id = ${teacherId}
      AND class_id = ${classId}
      AND student_number = ${studentNumber}
    LIMIT 1
  `;
  const roster = rosterRows[0];
  if (!roster || normalizeRollNumber(roster.roll_number) !== rollNumber) {
    return null;
  }

  const gradebook = await getClassGradebook(
    classId,
    params.semester,
    params.schoolYear,
    teacherId
  );
  const seat = gradebook.seats.find((item) => item.student_number === studentNumber);
  if (!seat) return null;

  const tasks = Object.values(seat.entries_by_task)
    .sort((a, b) => a.task_title.localeCompare(b.task_title, undefined, { sensitivity: 'base' }))
    .map((entry) => ({
      tool: entry.tool,
      task_title: entry.task_title,
      points: entry.points,
      max_points: entry.max_points,
      test_correct: entry.test_correct,
      test_total: entry.test_total,
    }));

  return {
    class_label: gradebook.class_label || String(roster.class_label || ''),
    school_year: gradebook.settings.school_year,
    semester: gradebook.settings.active_semester,
    student_number: seat.student_number,
    display_name: seat.display_name,
    tasks,
    total_earned: seat.total_earned,
    total_possible: seat.total_possible,
    percent_label: formatPercent(seat.total_earned, seat.total_possible),
  };
}
