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
} from './types';
import {
  DEFAULT_MAX_POINTS,
  buildStudentRoster,
  clampPoints,
  getCurrentSchoolYear,
  parseSemester,
  taskKey,
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
  }));

  const listenOptions: GradebookTaskOption[] = listenAssignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    tool: 'listen_and_answer',
    class_name: assignment.class_name,
  }));

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
    return {
      student_number: studentNumber,
      display_name: nameByStudent.get(studentNumber) ?? null,
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
  const points = clampPoints(payload.points, maxPoints);
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
      student_number, tool, task_id, task_title, points, max_points, notes, updated_at
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
      ${notes},
      NOW()
    )
    ON CONFLICT (teacher_id, school_year, semester, class_id, student_number, tool, task_id)
    DO UPDATE SET
      class_label = EXCLUDED.class_label,
      task_title = EXCLUDED.task_title,
      points = EXCLUDED.points,
      max_points = EXCLUDED.max_points,
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
