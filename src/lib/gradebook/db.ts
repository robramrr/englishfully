import { sql } from '@vercel/postgres';
import { nanoid } from 'nanoid';
import { getEntryConfig } from '@/lib/speak-and-submit/settings';
import { listTasks, getSubmissionsForTask } from '@/lib/speak-and-submit/db';
import { listAssignments } from '@/lib/listen-and-answer/db';
import { normalizeStudentNumber } from '@/lib/speak-and-submit/types';
import type {
  GradebookClassSummary,
  GradebookEntry,
  GradebookRollClaim,
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
  isValidGradesSlug,
  isValidRollNumber,
  normalizeGradesSlug,
  normalizeRollNumber,
  parseSemester,
  taskKey,
  clampPassPercent,
  classLabelsMatch,
  formatGradebookTaskTitle,
  taskAppliesToGradebookClass,
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
      await sql`
        ALTER TABLE gradebook_settings
        ADD COLUMN IF NOT EXISTS grades_slug TEXT NOT NULL DEFAULT ''
      `;
      await sql`
        ALTER TABLE gradebook_settings
        ADD COLUMN IF NOT EXISTS school_name TEXT NOT NULL DEFAULT ''
      `;
      await sql`
        ALTER TABLE gradebook_settings
        ADD COLUMN IF NOT EXISTS roll_lookup_open BOOLEAN NOT NULL DEFAULT FALSE
      `;
      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_gradebook_settings_grades_slug
        ON gradebook_settings(grades_slug)
        WHERE grades_slug <> ''
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS gradebook_roll_claims (
          id TEXT PRIMARY KEY,
          teacher_id TEXT NOT NULL DEFAULT 'default',
          class_id TEXT NOT NULL,
          class_label TEXT NOT NULL DEFAULT '',
          student_number TEXT NOT NULL,
          claimed_roll TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_gradebook_roll_claims_teacher
        ON gradebook_roll_claims(teacher_id, created_at DESC)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_gradebook_roll_claims_seat
        ON gradebook_roll_claims(teacher_id, class_id, student_number, created_at DESC)
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

function parseGradebookBoolean(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value == null) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized === 't' || normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function toIsoTimestamp(value: unknown): string {
  const date = value instanceof Date ? value : new Date(String(value ?? ''));
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

/**
 * Keep empty-string teacher ids as-is. Coercing "" → "default" made /grades classes
 * load under one teacher id while lookup used another, so scores disappeared.
 */
function resolveTeacherId(value: unknown, allowEmpty = true): string {
  if (value === undefined || value === null) return DEFAULT_TEACHER_ID;
  const trimmed = String(value).trim();
  if (trimmed) return trimmed;
  return allowEmpty ? '' : DEFAULT_TEACHER_ID;
}

function rowToSettings(row: Record<string, unknown>): GradebookSettings {
  return {
    // Preserve DB value (including "") so public classes + lookup use the same id.
    teacher_id: resolveTeacherId(row.teacher_id, true),
    school_year: (row.school_year as string) || getCurrentSchoolYear(),
    active_semester: parseSemester(row.active_semester),
    grades_slug: normalizeGradesSlug(row.grades_slug),
    school_name: String(row.school_name ?? '').trim(),
    roll_lookup_open: parseGradebookBoolean(row.roll_lookup_open),
    updated_at: toIsoTimestamp(row.updated_at),
  };
}

/** One-time repair for the stuck /grades/spk header (same idea as Learn title repair). */
async function repairStuckSchoolNameForSlug(slug: string): Promise<void> {
  const normalized = normalizeGradesSlug(slug);
  if (normalized !== 'spk') return;
  // Exact stuck value, plus any leftover “ - English Robert” suffix on this slug.
  await sql`
    UPDATE gradebook_settings
    SET
      school_name = 'Sarakham Pittayakhom School',
      updated_at = NOW()
    WHERE grades_slug = ${normalized}
      AND (
        school_name = 'Sarakham Pittayakhom School - English Robert'
        OR school_name LIKE '% - English Robert'
      )
  `;
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
    updated_at: toIsoTimestamp(row.updated_at),
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
      grades_slug: '',
      school_name: '',
      roll_lookup_open: false,
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
  const current = await getGradebookSettings(teacherId);

  const gradesSlug =
    payload.grades_slug !== undefined
      ? normalizeGradesSlug(payload.grades_slug)
      : current.grades_slug;
  const schoolName =
    payload.school_name !== undefined
      ? String(payload.school_name).trim().slice(0, 120)
      : current.school_name;
  const rollLookupOpen =
    payload.roll_lookup_open !== undefined
      ? Boolean(payload.roll_lookup_open)
      : current.roll_lookup_open;

  if (payload.grades_slug !== undefined && gradesSlug && !isValidGradesSlug(gradesSlug)) {
    throw new Error('Grades link must be at least 2 characters (letters, numbers, hyphens).');
  }

  if (gradesSlug) {
    const { rows: conflicts } = await sql`
      SELECT teacher_id FROM gradebook_settings
      WHERE grades_slug = ${gradesSlug} AND teacher_id <> ${teacherId}
      LIMIT 1
    `;
    if (conflicts.length > 0) {
      throw new Error('That grades link (/grades/...) is already in use. Choose a different link name.');
    }
  }

  // Ensure a row exists, then update semester/year/slug first.
  await sql`
    INSERT INTO gradebook_settings (
      teacher_id, school_year, active_semester, grades_slug, school_name, roll_lookup_open, updated_at
    )
    VALUES (
      ${teacherId}, ${schoolYear}, ${semester}, ${gradesSlug}, ${schoolName}, ${rollLookupOpen}, NOW()
    )
    ON CONFLICT (teacher_id) DO NOTHING
  `;

  await sql`
    UPDATE gradebook_settings
    SET
      school_year = ${schoolYear},
      active_semester = ${semester},
      grades_slug = ${gradesSlug},
      roll_lookup_open = ${rollLookupOpen},
      updated_at = NOW()
    WHERE teacher_id = ${teacherId}
  `;

  // Keep slug row in sync (student lookup reads by slug). Same row usually, but write both.
  if (gradesSlug) {
    await sql`
      UPDATE gradebook_settings
      SET
        roll_lookup_open = ${rollLookupOpen},
        updated_at = NOW()
      WHERE grades_slug = ${gradesSlug}
    `;
  }

  // Write school_name LAST (like Learn title), on both teacher_id and grades_slug rows.
  // The student page loads by slug — updating only teacher_id can leave /grades/spk stuck.
  let verifiedName = '';
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const byTeacher = await sql`
      UPDATE gradebook_settings
      SET
        school_name = ${schoolName},
        roll_lookup_open = ${rollLookupOpen},
        updated_at = NOW()
      WHERE teacher_id = ${teacherId}
    `;
    if ((byTeacher.rowCount ?? 0) < 1) {
      throw new Error('Failed to save school name (settings row not updated).');
    }

    if (gradesSlug) {
      await sql`
        UPDATE gradebook_settings
        SET
          school_name = ${schoolName},
          roll_lookup_open = ${rollLookupOpen},
          updated_at = NOW()
        WHERE grades_slug = ${gradesSlug}
      `;
    }

    // Verify the value students will see (slug row), not only the teacher_id row.
    if (gradesSlug) {
      const { rows } = await sql`
        SELECT school_name FROM gradebook_settings
        WHERE grades_slug = ${gradesSlug}
        LIMIT 1
      `;
      verifiedName = String(rows[0]?.school_name ?? '').trim();
    } else {
      const { rows } = await sql`
        SELECT school_name FROM gradebook_settings WHERE teacher_id = ${teacherId} LIMIT 1
      `;
      verifiedName = String(rows[0]?.school_name ?? '').trim();
    }
    if (verifiedName === schoolName) break;
  }

  if (verifiedName !== schoolName) {
    throw new Error(
      `School name did not stick after save (students would still see “${verifiedName || '(empty)'}”). Try Save again.`
    );
  }

  const saved = await getGradebookSettings(teacherId);
  return {
    ...saved,
    school_year: schoolYear,
    active_semester: semester,
    grades_slug: gradesSlug,
    school_name: verifiedName,
    roll_lookup_open: rollLookupOpen,
  };
}

export async function getTeacherIdByGradesSlug(slug: string): Promise<string | null> {
  await ensureGradebookSchema();
  const normalized = normalizeGradesSlug(slug);
  if (!normalized) return null;
  await repairStuckSchoolNameForSlug(normalized);
  const { rows } = await sql`
    SELECT teacher_id FROM gradebook_settings
    WHERE grades_slug = ${normalized}
    LIMIT 1
  `;
  return rows.length > 0 ? String(rows[0].teacher_id) : null;
}

export async function getGradebookSettingsBySlug(
  slug: string
): Promise<GradebookSettings | null> {
  await ensureGradebookSchema();
  const normalized = normalizeGradesSlug(slug);
  if (!normalized) return null;
  await repairStuckSchoolNameForSlug(normalized);

  // Read the slug row directly so student pages cannot pick up a different teacher_id row.
  const { rows } = await sql`
    SELECT * FROM gradebook_settings
    WHERE grades_slug = ${normalized}
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return rowToSettings(rows[0]);
}

export async function listGradebookTasks(): Promise<GradebookTaskOption[]> {
  const speakOptions: GradebookTaskOption[] = [];
  const listenOptions: GradebookTaskOption[] = [];
  const learnOptions: GradebookTaskOption[] = [];

  try {
    const speakTasks = await listTasks();
    for (const task of speakTasks) {
      speakOptions.push({
        id: task.id,
        title: task.title,
        tool: 'speak_and_submit',
        class_name: String(task.class_name ?? ''),
        question_count: null,
      });
    }
  } catch (error) {
    console.error('listGradebookTasks speak failed:', error);
  }

  try {
    const listenAssignments = await listAssignments();
    for (const assignment of listenAssignments) {
      const declaredTotal = Number.parseInt(String(assignment.total_questions ?? '').trim(), 10);
      const questionCount =
        Number.isFinite(declaredTotal) && declaredTotal > 0
          ? declaredTotal
          : assignment.question_count > 0
            ? assignment.question_count
            : null;
      listenOptions.push({
        id: assignment.id,
        title: assignment.title,
        tool: 'listen_and_answer',
        class_name: String(assignment.class_name ?? ''),
        question_count: questionCount,
      });
    }
  } catch (error) {
    console.error('listGradebookTasks listen failed:', error);
  }

  try {
    const { listLearnAssignments } = await import('@/lib/listen-and-learn/db');
    const learnAssignments = await listLearnAssignments();
    for (const assignment of learnAssignments) {
      learnOptions.push({
        id: assignment.id,
        title: assignment.title,
        tool: 'listen_and_learn',
        class_name: String(assignment.class_name ?? ''),
        question_count: assignment.question_count > 0 ? assignment.question_count : null,
      });
    }
  } catch (error) {
    console.error('listGradebookTasks learn failed:', error);
  }

  return [...speakOptions, ...listenOptions, ...learnOptions];
}

/**
 * Speak settings used to recreate class rows with new IDs on every save, which
 * orphaned gradebook_entries still keyed by the old class_id. Remap by class label.
 */
export async function repairOrphanedGradebookClassIds(
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<{ remapped: number; merged: number; removed: number; rolls_restored: number }> {
  await ensureGradebookSchema();
  const entryConfig = await getEntryConfig(teacherId);
  let remapped = 0;
  let merged = 0;
  let removed = 0;
  let rollsRestored = 0;

  for (const classOption of entryConfig.classes) {
    const label = String(classOption.label ?? '').trim();
    if (!label) continue;
    const labelKey = label.toLowerCase();

    const { rows: orphanIdRows } = await sql`
      SELECT class_id FROM (
        SELECT DISTINCT class_id
        FROM gradebook_entries
        WHERE teacher_id = ${teacherId}
          AND lower(trim(class_label)) = ${labelKey}
          AND class_id <> ${classOption.id}
        UNION
        SELECT DISTINCT class_id
        FROM gradebook_roster
        WHERE teacher_id = ${teacherId}
          AND lower(trim(class_label)) = ${labelKey}
          AND class_id <> ${classOption.id}
      ) orphan_ids
    `;

    for (const orphan of orphanIdRows) {
      const oldId = String(orphan.class_id ?? '').trim();
      if (!oldId) continue;

      const { rows: orphanEntries } = await sql`
        SELECT *
        FROM gradebook_entries
        WHERE teacher_id = ${teacherId}
          AND class_id = ${oldId}
      `;

      for (const row of orphanEntries) {
        const { rows: existingRows } = await sql`
          SELECT *
          FROM gradebook_entries
          WHERE teacher_id = ${teacherId}
            AND school_year = ${row.school_year}
            AND semester = ${row.semester}
            AND class_id = ${classOption.id}
            AND student_number = ${row.student_number}
            AND tool = ${row.tool}
            AND task_id = ${row.task_id}
          LIMIT 1
        `;

        if (existingRows.length === 0) {
          await sql`
            UPDATE gradebook_entries
            SET class_id = ${classOption.id},
                class_label = ${label}
            WHERE id = ${row.id}
          `;
          remapped += 1;
          continue;
        }

        const current = existingRows[0];
        const orphanHasTest = row.test_correct != null && row.test_total != null;
        const currentHasTest = current.test_correct != null && current.test_total != null;
        const orphanPoints = Number(row.points ?? 0);
        const currentPoints = Number(current.points ?? 0);
        const orphanUpdated = new Date(String(row.updated_at ?? 0)).getTime();
        const currentUpdated = new Date(String(current.updated_at ?? 0)).getTime();

        const preferOrphan =
          (orphanHasTest && !currentHasTest) ||
          (!orphanHasTest &&
            !currentHasTest &&
            orphanPoints > currentPoints) ||
          (orphanHasTest &&
            currentHasTest &&
            Number.isFinite(orphanUpdated) &&
            Number.isFinite(currentUpdated) &&
            orphanUpdated > currentUpdated);

        if (preferOrphan) {
          await sql`
            UPDATE gradebook_entries
            SET
              class_label = ${label},
              task_title = ${String(row.task_title ?? '')},
              points = ${Number(row.points ?? 0)},
              max_points = ${Number(row.max_points ?? DEFAULT_MAX_POINTS)},
              test_correct = ${row.test_correct == null ? null : Number(row.test_correct)},
              test_total = ${row.test_total == null ? null : Number(row.test_total)},
              notes = ${String(row.notes ?? '')},
              updated_at = NOW()
            WHERE id = ${current.id}
          `;
          merged += 1;
        }

        await sql`DELETE FROM gradebook_entries WHERE id = ${row.id}`;
        removed += 1;
      }

      const { rows: orphanRoster } = await sql`
        SELECT id, student_number, roll_number
        FROM gradebook_roster
        WHERE teacher_id = ${teacherId}
          AND class_id = ${oldId}
      `;

      for (const row of orphanRoster) {
        const studentNumber = normalizeStudentNumber(String(row.student_number ?? ''));
        const orphanRoll = normalizeRollNumber(row.roll_number);
        if (!studentNumber) {
          await sql`DELETE FROM gradebook_roster WHERE id = ${row.id}`;
          continue;
        }

        const { rows: currentRoster } = await sql`
          SELECT id, roll_number
          FROM gradebook_roster
          WHERE teacher_id = ${teacherId}
            AND class_id = ${classOption.id}
            AND student_number = ${studentNumber}
          LIMIT 1
        `;

        if (currentRoster.length === 0) {
          await sql`
            UPDATE gradebook_roster
            SET class_id = ${classOption.id},
                class_label = ${label}
            WHERE id = ${row.id}
          `;
          continue;
        }

        const currentRoll = normalizeRollNumber(currentRoster[0].roll_number);
        if (!currentRoll && orphanRoll) {
          await sql`
            UPDATE gradebook_roster
            SET roll_number = ${orphanRoll},
                class_label = ${label},
                updated_at = NOW()
            WHERE id = ${currentRoster[0].id}
          `;
          rollsRestored += 1;
        }

        await sql`DELETE FROM gradebook_roster WHERE id = ${row.id}`;
      }

      await sql`
        UPDATE gradebook_roll_claims
        SET class_id = ${classOption.id},
            class_label = ${label}
        WHERE teacher_id = ${teacherId}
          AND class_id = ${oldId}
      `;
    }
  }

  return { remapped, merged, removed, rolls_restored: rollsRestored };
}

const CLASS_ID_REPAIR_VERSION = '2';
const classIdRepairByTeacher = new Map<string, Promise<void>>();

async function ensureGradebookClassIdsRepaired(
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<void> {
  const cacheKey = `${teacherId}::${CLASS_ID_REPAIR_VERSION}`;
  const existing = classIdRepairByTeacher.get(cacheKey);
  if (existing) {
    await existing;
    return;
  }

  const pending = (async () => {
    try {
      const result = await repairOrphanedGradebookClassIds(teacherId);
      if (result.remapped || result.merged || result.removed || result.rolls_restored) {
        console.info('Repaired orphaned gradebook class IDs:', { teacherId, ...result });
      }
    } catch (error) {
      classIdRepairByTeacher.delete(cacheKey);
      console.error('Gradebook class ID repair failed:', error);
    }
  })();

  classIdRepairByTeacher.set(cacheKey, pending);
  await pending;
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
  await ensureGradebookClassIdsRepaired(teacherId);
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
  teacherId: string = DEFAULT_TEACHER_ID,
  options?: { skipMakeupBackfill?: boolean }
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
  await ensureGradebookClassIdsRepaired(teacherId);
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
          .filter((item) => classLabelsMatch(item.class_number, classOption.label))
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
        if (!classLabelsMatch(submission.class_number, classOption.label)) continue;
        const number = normalizeStudentNumber(submission.student_number);
        const displayName = String(submission.student_name ?? '').trim();
        if (!nameByStudent.has(number) && displayName) {
          nameByStudent.set(number, displayName);
        }
      }
    } catch {
      // ignore
    }
  }

  const rollByStudent = await getClassRollMap(classId, teacherId);

  // Backfill makeup credits that passed Learn but never wrote a gradebook row.
  // Student lookup skips this class-wide pass (it has its own seat-scoped backfill).
  if (!options?.skipMakeupBackfill) {
    try {
      const { listPublishedMakeupAssignments } = await import('@/lib/listen-and-learn/db');
      const makeups = await listPublishedMakeupAssignments(teacherId);
      let creditedAny = false;
      for (const makeup of makeups) {
        const classKey = classOption.label.trim().toLowerCase();
        const { rows: passers } = await sql`
          SELECT DISTINCT student_number
          FROM learn_submissions
          WHERE assignment_id = ${makeup.id}
            AND lower(trim(class_number)) = ${classKey}
            AND percent >= ${makeup.passing_score}
        `;
        for (const passer of passers) {
          const credit = await creditListenLearnMakeup({
            teacherId,
            learnAssignmentId: makeup.id,
            learnTitle: makeup.title,
            makeupListenAssignmentId: makeup.makeup_listen_assignment_id,
            makeupClassNames: makeup.makeup_class_names,
            studentNumber: String(passer.student_number ?? ''),
            classNumber: classOption.label,
          });
          if (credit.credited) creditedAny = true;
        }
      }
      if (creditedAny) {
        const { rows: refreshedRows } = await sql`
          SELECT * FROM gradebook_entries
          WHERE teacher_id = ${teacherId}
            AND school_year = ${activeYear}
            AND semester = ${activeSemester}
            AND class_id = ${classId}
          ORDER BY updated_at DESC
        `;
        entries.length = 0;
        entries.push(...refreshedRows.map(rowToEntry));
        taskMap.clear();
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
      }
    } catch (error) {
      console.error('Class gradebook makeup backfill failed:', error);
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
      // Makeup (Listen & Learn) adds credit only — it does not raise the possible total.
      if (entry.tool !== 'listen_and_learn') {
        totalPossible += entry.max_points;
      }
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

  let availableTasks: GradebookTaskOption[] = [];
  try {
    availableTasks = await listGradebookTasks();
  } catch (error) {
    console.error('listGradebookTasks failed during class gradebook load:', error);
  }
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

  if (
    payload.tool !== 'speak_and_submit' &&
    payload.tool !== 'listen_and_answer' &&
    payload.tool !== 'listen_and_learn'
  ) {
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
      .filter((item) => classLabelsMatch(item.class_number, classLabel))
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
  const entryConfig = await getEntryConfig(resolveTeacherId(teacherId, true));
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
  /** When set, overrides DB read — use the slug page’s saved open-mode flag. */
  rollLookupOpen?: boolean;
  /** Optional class label from the student page — helps when class IDs rotated. */
  classLabel?: string;
}): Promise<StudentGradeLookupResult | null> {
  // Must match /api/grades/.../classes exactly — do not coerce "" to "default".
  const teacherId =
    params.teacherId === undefined || params.teacherId === null
      ? DEFAULT_TEACHER_ID
      : String(params.teacherId);
  await ensureGradebookSchema();

  const classId = String(params.classId || '').trim();
  const studentNumber = normalizeStudentNumber(params.studentNumber);
  const rollNumber = normalizeRollNumber(params.rollNumber);
  const requestedClassLabel = String(params.classLabel ?? '').trim();

  if (!classId || !studentNumber || !isValidRollNumber(rollNumber)) {
    return null;
  }

  const settings = await getGradebookSettings(teacherId);
  const openLookup =
    params.rollLookupOpen !== undefined
      ? Boolean(params.rollLookupOpen)
      : settings.roll_lookup_open;

  const { rows: rosterRows } = await sql`
    SELECT roll_number, class_label
    FROM gradebook_roster
    WHERE teacher_id = ${teacherId}
      AND class_id = ${classId}
      AND student_number = ${studentNumber}
    LIMIT 1
  `;
  const roster = rosterRows[0];
  const rosterRoll = roster ? normalizeRollNumber(roster.roll_number) : '';

  if (!openLookup) {
    if (!roster || rosterRoll !== rollNumber) {
      return null;
    }
  }

  const entryConfig = await getEntryConfig(teacherId);
  let resolvedClassId = classId;
  let classOption = entryConfig.classes.find((item) => item.id === classId) || null;

  // Class IDs used to rotate on Speak settings save — recover by label when needed.
  if (!classOption && requestedClassLabel) {
    classOption =
      entryConfig.classes.find((item) => classLabelsMatch(item.label, requestedClassLabel)) ||
      null;
  }
  if (!classOption) {
    const labelGuess = String(roster?.class_label || '').trim();
    if (labelGuess) {
      classOption =
        entryConfig.classes.find((item) => classLabelsMatch(item.label, labelGuess)) || null;
    }
  }
  if (!classOption) {
    try {
      const { rows: labelRows } = await sql`
        SELECT class_label
        FROM gradebook_entries
        WHERE class_id = ${classId}
        LIMIT 1
      `;
      const fromEntry = String(labelRows[0]?.class_label || '').trim();
      if (fromEntry) {
        classOption =
          entryConfig.classes.find((item) => classLabelsMatch(item.label, fromEntry)) || null;
      }
    } catch (error) {
      console.error('Lookup class-label recovery failed:', error);
    }
  }
  if (!classOption) {
    try {
      const { rows: speakRows } = await sql`
        SELECT label
        FROM speak_class_options
        WHERE id = ${classId}
        LIMIT 1
      `;
      const fromSpeak = String(speakRows[0]?.label || '').trim();
      if (fromSpeak) {
        classOption =
          entryConfig.classes.find((item) => classLabelsMatch(item.label, fromSpeak)) || null;
        if (!classOption) {
          // Class exists in Speak under another teacher_id — use it directly.
          classOption = {
            id: classId,
            label: fromSpeak,
            max_student_number: 35,
            sort_order: 0,
          };
        }
      }
    } catch (error) {
      console.error('Lookup speak-class recovery failed:', error);
    }
  }
  if (classOption) {
    resolvedClassId = classOption.id;
  }

  let gradebook: Awaited<ReturnType<typeof getClassGradebook>> | null = null;
  if (classOption && entryConfig.classes.some((item) => item.id === classOption!.id)) {
    try {
      gradebook = await getClassGradebook(
        resolvedClassId,
        params.semester,
        params.schoolYear,
        teacherId,
        { skipMakeupBackfill: true }
      );
    } catch (error) {
      console.error('lookup getClassGradebook failed:', error);
      gradebook = null;
    }
  }

  const settingsForYear = gradebook?.settings || settings;
  const activeSemester = params.semester ?? settingsForYear.active_semester;
  const activeYear = params.schoolYear?.trim() || settingsForYear.school_year;
  const classLabel =
    gradebook?.class_label ||
    classOption?.label ||
    requestedClassLabel ||
    String(roster?.class_label || '') ||
    '';
  const classLabelKey = classLabel.trim().toLowerCase();

  async function loadSeatEntries(targetClassId: string): Promise<{
    entriesByTask: Record<string, GradebookEntry>;
    totalEarned: number;
    totalPossible: number;
  }> {
    const entriesByTask: Record<string, GradebookEntry> = {};
    let totalEarned = 0;
    let totalPossible = 0;

    const addRows = (rows: Record<string, unknown>[]) => {
      for (const row of rows) {
        const entry = rowToEntry(row);
        const key = taskKey(entry.tool, entry.task_id);
        if (entriesByTask[key]) continue;
        entriesByTask[key] = entry;
        totalEarned += entry.points;
        // Makeup (Listen & Learn) adds credit only — it does not raise the possible total.
        if (entry.tool !== 'listen_and_learn') {
          totalPossible += entry.max_points;
        }
      }
    };

    const { rows: seatRows } = await sql`
      SELECT *
      FROM gradebook_entries
      WHERE teacher_id = ${teacherId}
        AND school_year = ${activeYear}
        AND semester = ${activeSemester}
        AND class_id = ${targetClassId}
        AND student_number = ${studentNumber}
      ORDER BY updated_at DESC
    `;
    addRows(seatRows);

    if (Object.keys(entriesByTask).length === 0) {
      const { rows: anyRows } = await sql`
        SELECT *
        FROM gradebook_entries
        WHERE teacher_id = ${teacherId}
          AND class_id = ${targetClassId}
          AND student_number = ${studentNumber}
        ORDER BY updated_at DESC
      `;
      addRows(anyRows);
    }

    // Orphaned class_id rows: match by class label for this seat.
    if (Object.keys(entriesByTask).length === 0 && classLabelKey) {
      const { rows: labelRows } = await sql`
        SELECT *
        FROM gradebook_entries
        WHERE student_number = ${studentNumber}
          AND lower(trim(class_label)) = ${classLabelKey}
        ORDER BY updated_at DESC
      `;
      addRows(labelRows);
    }

    return { entriesByTask, totalEarned, totalPossible };
  }

  // Prefer the roster seat, but never fail open-mode (or a valid roll match) just because
  // the generated seat list didn't include this number.
  let seat: GradebookSeat | null =
    gradebook?.seats.find((item) => item.student_number === studentNumber) || null;

  if (!seat || Object.keys(seat.entries_by_task).length === 0) {
    try {
      const loaded = await loadSeatEntries(resolvedClassId || classId);
      if (!seat) {
        seat = {
          student_number: studentNumber,
          display_name: null,
          roll_number: rosterRoll || null,
          entries_by_task: loaded.entriesByTask,
          total_earned: loaded.totalEarned,
          total_possible: loaded.totalPossible,
        };
      } else if (Object.keys(loaded.entriesByTask).length > 0) {
        const mergedEntries = {
          ...loaded.entriesByTask,
          ...seat.entries_by_task,
        };
        seat = {
          ...seat,
          entries_by_task: mergedEntries,
          total_earned: Object.values(mergedEntries).reduce(
            (sum, entry) => sum + entry.points,
            0
          ),
          total_possible: Object.values(mergedEntries).reduce(
            (sum, entry) =>
              entry.tool === 'listen_and_learn' ? sum : sum + entry.max_points,
            0
          ),
        };
      }
    } catch (error) {
      console.error('Lookup synthetic seat failed:', error);
      if (!seat) {
        seat = {
          student_number: studentNumber,
          display_name: null,
          roll_number: rosterRoll || null,
          entries_by_task: {},
          total_earned: 0,
          total_possible: 0,
        };
      }
    }
  }

  if (!seat) {
    seat = {
      student_number: studentNumber,
      display_name: null,
      roll_number: rosterRoll || null,
      entries_by_task: {},
      total_earned: 0,
      total_possible: 0,
    };
  }

  const availableTasks = gradebook?.available_tasks || (await listGradebookTasks().catch(() => []));
  const taskColumns = gradebook?.task_columns || [];
  const taskMetaById = new Map(availableTasks.map((task) => [task.id, task]));

  const titleFor = (taskId: string, fallbackTitle: string) => {
    const meta = taskMetaById.get(taskId);
    return formatGradebookTaskTitle(fallbackTitle || meta?.title || 'Untitled', meta?.class_name);
  };

  const listenTaskAllowed = (taskId: string, tool: GradebookTool) => {
    if (tool !== 'listen_and_answer') return true;
    const meta = taskMetaById.get(taskId);
    // If we can't resolve the Listen assignment, keep graded rows visible.
    if (!meta) return true;
    return taskAppliesToGradebookClass(meta.class_name, classLabel);
  };

  // If this seat already passed a makeup Learn but credit failed earlier (silent miss),
  // backfill the gradebook now so the next grades check shows the points.
  try {
    const {
      listPublishedMakeupAssignments,
      hasPassingLearnSubmission,
    } = await import('@/lib/listen-and-learn/db');
    const makeups = await listPublishedMakeupAssignments(teacherId);
    let creditedAny = false;
    for (const makeup of makeups) {
      const makeupKey = taskKey('listen_and_learn', makeup.id);
      const existing = seat.entries_by_task[makeupKey];
      const existingPoints = Number(existing?.points ?? 0);
      const existingMax = Math.max(
        DEFAULT_MAX_POINTS,
        Number(existing?.max_points ?? DEFAULT_MAX_POINTS)
      );
      if (existing && existingPoints >= existingMax) continue;

      const passed = await hasPassingLearnSubmission(
        makeup.id,
        studentNumber,
        classLabel,
        makeup.passing_score
      );
      if (!passed) continue;

      const credit = await creditListenLearnMakeup({
        teacherId,
        learnAssignmentId: makeup.id,
        learnTitle: makeup.title,
        makeupListenAssignmentId: makeup.makeup_listen_assignment_id,
        makeupClassNames: makeup.makeup_class_names,
        studentNumber,
        classNumber: classLabel,
      });
      if (credit.credited) creditedAny = true;
      else {
        console.warn('Makeup backfill skipped:', credit.reason, {
          makeupId: makeup.id,
          studentNumber,
          classLabel,
        });
      }
    }
    if (creditedAny) {
      try {
        const refreshed = await getClassGradebook(
          resolvedClassId,
          params.semester,
          params.schoolYear,
          teacherId,
          { skipMakeupBackfill: true }
        );
        const refreshedSeat = refreshed.seats.find(
          (item) => item.student_number === studentNumber
        );
        if (refreshedSeat) {
          Object.assign(seat, refreshedSeat);
        }
      } catch (error) {
        console.error('Lookup makeup refresh failed:', error);
      }
    }
  } catch (error) {
    console.error('Listen & Learn makeup backfill failed:', error);
  }

  // Temporary open mode: still require 5 digits, but log what they typed for the teacher.
  // Never fail the student lookup if claim logging has a problem.
  if (openLookup) {
    try {
      await logRollClaim({
        teacherId,
        classId: resolvedClassId,
        classLabel,
        studentNumber,
        claimedRoll: rollNumber,
      });
    } catch (error) {
      console.error('Roll claim log failed during grade lookup:', error);
    }
  }

  type AssignedTask = {
    tool: GradebookTool;
    task_id: string;
    task_title: string;
    max_points: number;
    student_url: string | null;
    makeup_for_task_id: string | null;
  };

  const assigned = new Map<string, AssignedTask>();

  // Tasks created for this class (Speak/Listen & Answer), even if nobody has a grade yet.
  // Listen & Learn makeups are added separately for students who failed the tied assessment.
  for (const task of availableTasks) {
    if (task.tool === 'listen_and_learn') continue;
    if (task.tool === 'listen_and_answer') {
      if (!taskAppliesToGradebookClass(task.class_name, classLabel)) continue;
    } else if (classLabel && !classLabelsMatch(task.class_name, classLabel)) {
      continue;
    }
    const key = taskKey(task.tool, task.id);
    assigned.set(key, {
      tool: task.tool,
      task_id: task.id,
      task_title: titleFor(task.id, task.title || 'Untitled'),
      max_points: DEFAULT_MAX_POINTS,
      student_url: studentUrlForTool(task.tool, task.id),
      makeup_for_task_id: null,
    });
  }

  // Tasks already in this class gradebook for the semester (any student graded).
  // Skip Listen & Learn here — those are makeup-only and must not appear for every
  // seat just because another classmate earned makeup credit.
  for (const column of taskColumns) {
    if (column.tool === 'listen_and_learn') continue;
    if (!listenTaskAllowed(column.task_id, column.tool)) continue;
    const key = column.task_key;
    const existing = assigned.get(key);
    assigned.set(key, {
      tool: column.tool,
      task_id: column.task_id,
      task_title: titleFor(column.task_id, column.task_title || existing?.task_title || 'Untitled'),
      max_points: Math.max(column.max_points || 0, existing?.max_points || 0, DEFAULT_MAX_POINTS),
      student_url: existing?.student_url ?? studentUrlForTool(column.tool, column.task_id),
      makeup_for_task_id: existing?.makeup_for_task_id ?? null,
    });
  }

  // Always include this seat’s saved scores even if task lists failed to load.
  // Hide Listen tasks tagged for a different level (e.g. M6 on a 4/16 sheet).
  for (const entry of Object.values(seat.entries_by_task)) {
    if (entry.tool === 'listen_and_learn') continue;
    if (!listenTaskAllowed(entry.task_id, entry.tool)) continue;
    const key = taskKey(entry.tool, entry.task_id);
    const existing = assigned.get(key);
    assigned.set(key, {
      tool: entry.tool,
      task_id: entry.task_id,
      task_title: titleFor(entry.task_id, entry.task_title || existing?.task_title || 'Untitled'),
      max_points: Math.max(entry.max_points || 0, existing?.max_points || 0, DEFAULT_MAX_POINTS),
      student_url: existing?.student_url ?? studentUrlForTool(entry.tool, entry.task_id),
      makeup_for_task_id: existing?.makeup_for_task_id ?? null,
    });
  }

  // Makeup Listen & Learn: show only when THIS seat failed the tied assessment.
  // Class checkboxes are ignored here — a failing gradebook entry in this class is enough.
  try {
    const { listPublishedMakeupAssignments } = await import('@/lib/listen-and-learn/db');
    const { getAssignmentById } = await import('@/lib/listen-and-answer/db');
    const makeups = await listPublishedMakeupAssignments(teacherId);

    const failedListenEntries = Object.values(seat.entries_by_task).filter((entry) => {
      if (entry.tool !== 'listen_and_answer') return false;
      if (!listenTaskAllowed(entry.task_id, entry.tool)) return false;
      const maxPoints = Math.max(DEFAULT_MAX_POINTS, Number(entry.max_points ?? 0));
      return Number(entry.points ?? 0) < maxPoints;
    });
    const failedTitleKeys = new Set(
      failedListenEntries
        .map((entry) => String(entry.task_title ?? '').trim().toLowerCase())
        .filter(Boolean)
    );

    for (const makeup of makeups) {
      const tiedId = String(makeup.makeup_listen_assignment_id ?? '').trim();
      if (!tiedId) continue;

      const makeupKey = taskKey('listen_and_learn', makeup.id);
      let failedEntry = failedListenEntries.find((entry) => entry.task_id === tiedId) || null;

      // Fallback: only when exactly one failing Listen row shares the tied title.
      if (!failedEntry) {
        try {
          const tied = await getAssignmentById(tiedId);
          const tiedTitle = tied?.title?.trim().toLowerCase() || '';
          if (tiedTitle && failedTitleKeys.has(tiedTitle)) {
            const sameTitle = failedListenEntries.filter(
              (entry) => String(entry.task_title ?? '').trim().toLowerCase() === tiedTitle
            );
            failedEntry = sameTitle.length === 1 ? sameTitle[0] : null;
          }
        } catch {
          // ignore title lookup failures
        }
      }

      // Passers must not see an open makeup row for an assessment they already passed.
      if (!failedEntry) continue;

      const makeupEntry = seat.entries_by_task[makeupKey];
      const maxPoints = Math.max(
        DEFAULT_MAX_POINTS,
        Number(failedEntry.max_points ?? 0),
        Number(makeupEntry?.max_points ?? 0)
      );
      assigned.set(makeupKey, {
        tool: 'listen_and_learn',
        task_id: makeup.id,
        task_title: makeup.title || 'Makeup',
        max_points: maxPoints,
        student_url: studentUrlForTool('listen_and_learn', makeup.id),
        makeup_for_task_id: failedEntry.task_id || tiedId,
      });
    }
  } catch (error) {
    console.error('Listen & Learn makeup lookup failed:', error);
  }

  // Speak submission flags for this seat (turned in vs not).
  const submittedKeys = new Set<string>();
  for (const item of assigned.values()) {
    if (item.tool !== 'speak_and_submit') continue;
    try {
      const numbers = await getSpeakSubmissionNumbersForTask(item.task_id, classLabel);
      if (numbers.includes(studentNumber)) {
        submittedKeys.add(taskKey(item.tool, item.task_id));
      }
    } catch {
      // ignore
    }
  }

  const tasks = Array.from(assigned.values())
    .sort((a, b) => {
      const aGroup = a.makeup_for_task_id || a.task_id;
      const bGroup = b.makeup_for_task_id || b.task_id;
      const aTitle =
        a.makeup_for_task_id
          ? assigned.get(taskKey('listen_and_answer', a.makeup_for_task_id))?.task_title || a.task_title
          : a.task_title;
      const bTitle =
        b.makeup_for_task_id
          ? assigned.get(taskKey('listen_and_answer', b.makeup_for_task_id))?.task_title || b.task_title
          : b.task_title;
      if (aGroup !== bGroup) {
        const titleCmp = aTitle.localeCompare(bTitle, undefined, { sensitivity: 'base' });
        if (titleCmp !== 0) return titleCmp;
        return aGroup.localeCompare(bGroup);
      }
      // Same group: original assessment first, makeup after.
      if (Boolean(a.makeup_for_task_id) !== Boolean(b.makeup_for_task_id)) {
        return a.makeup_for_task_id ? 1 : -1;
      }
      return a.task_title.localeCompare(b.task_title, undefined, { sensitivity: 'base' });
    })
    .map((item) => {
      const key = taskKey(item.tool, item.task_id);
      const entry = seat.entries_by_task[key];
      if (entry) {
        return {
          tool: item.tool,
          task_id: item.task_id,
          task_title: entry.task_title || item.task_title,
          points: entry.points,
          max_points: entry.max_points || item.max_points,
          test_correct: entry.test_correct,
          test_total: entry.test_total,
          status: 'graded' as const,
          submitted: true,
          student_url: item.student_url,
          makeup_for_task_id: item.makeup_for_task_id,
        };
      }
      return {
        tool: item.tool,
        task_id: item.task_id,
        task_title: item.task_title,
        points: null,
        max_points: item.max_points,
        test_correct: null,
        test_total: null,
        status: 'missing' as const,
        submitted: submittedKeys.has(key),
        student_url: item.student_url,
        makeup_for_task_id: item.makeup_for_task_id,
      };
    });

  // Assigned tasks count toward possible. Makeup rows do not increase the denominator —
  // they only add earned points when completed (recovering the failed assessment's points).
  let totalEarned = 0;
  let totalPossible = 0;
  for (const task of tasks) {
    const isMakeup = task.tool === 'listen_and_learn' || Boolean(task.makeup_for_task_id);
    if (!isMakeup) {
      totalPossible += Math.max(0, task.max_points || 0);
    }
    if (task.status === 'graded' && task.points != null) {
      totalEarned += task.points;
    }
  }

  return {
    class_label: classLabel,
    school_year: activeYear,
    semester: activeSemester,
    student_number: seat.student_number,
    display_name: seat.display_name,
    tasks,
    total_earned: totalEarned,
    total_possible: totalPossible,
    percent_label: formatPercent(totalEarned, totalPossible),
  };
}

function rowToRollClaim(row: Record<string, unknown>): GradebookRollClaim {
  return {
    id: row.id as string,
    teacher_id: row.teacher_id as string,
    class_id: row.class_id as string,
    class_label: String(row.class_label ?? ''),
    student_number: normalizeStudentNumber(String(row.student_number ?? '')),
    claimed_roll: normalizeRollNumber(row.claimed_roll),
    created_at: toIsoTimestamp(row.created_at),
  };
}

async function logRollClaim(params: {
  teacherId: string;
  classId: string;
  classLabel: string;
  studentNumber: string;
  claimedRoll: string;
}): Promise<void> {
  await ensureGradebookSchema();
  const id = nanoid(21);
  await sql`
    INSERT INTO gradebook_roll_claims (
      id, teacher_id, class_id, class_label, student_number, claimed_roll, created_at
    )
    VALUES (
      ${id},
      ${params.teacherId},
      ${params.classId},
      ${params.classLabel},
      ${params.studentNumber},
      ${params.claimedRoll},
      NOW()
    )
  `;
}

export async function listRollClaims(
  teacherId: string = DEFAULT_TEACHER_ID,
  limit = 200
): Promise<GradebookRollClaim[]> {
  await ensureGradebookSchema();
  const safeLimit = Math.min(500, Math.max(1, Math.floor(limit)));
  const { rows } = await sql`
    SELECT *
    FROM gradebook_roll_claims
    WHERE teacher_id = ${teacherId}
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `;
  return rows.map((row) => rowToRollClaim(row));
}

export async function clearRollClaims(
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<number> {
  await ensureGradebookSchema();
  const { rowCount } = await sql`
    DELETE FROM gradebook_roll_claims
    WHERE teacher_id = ${teacherId}
  `;
  return rowCount ?? 0;
}

function studentUrlForTool(tool: GradebookTool, taskId: string): string | null {
  if (tool === 'speak_and_submit') {
    return `/speak/${taskId}`;
  }
  if (tool === 'listen_and_learn') {
    return `/listen-learn/${taskId}`;
  }
  // Listen & Answer is print-based today — no student submit URL.
  return null;
}

/**
 * True when this seat scored below full points on the tied Listen & Answer assessment
 * (eligible for a makeup Listen & Learn).
 */
export async function hasFailedTiedListenAssessment(params: {
  teacherId?: string;
  listenAssignmentId: string;
  studentNumber: string;
  classNumber: string;
}): Promise<boolean> {
  await ensureGradebookSchema();
  const teacherId = params.teacherId || DEFAULT_TEACHER_ID;
  const studentNumber = normalizeStudentNumber(params.studentNumber);
  const classLabel = params.classNumber.trim();
  const tiedId = params.listenAssignmentId.trim();
  if (!studentNumber || !classLabel || !tiedId) return false;

  const entryConfig = await getEntryConfig(teacherId);
  const classOption = entryConfig.classes.find(
    (item) => item.label.trim().toLowerCase() === classLabel.toLowerCase()
  );
  if (!classOption) return false;

  const settings = await getGradebookSettings(teacherId);
  const schoolYear = settings.school_year;

  const { rows } = await sql`
    SELECT points, max_points, task_title, task_id
    FROM gradebook_entries
    WHERE teacher_id = ${teacherId}
      AND school_year = ${schoolYear}
      AND class_id = ${classOption.id}
      AND student_number = ${studentNumber}
      AND tool = 'listen_and_answer'
  `;

  const failing = rows.filter((row) => {
    const maxPoints = Math.max(DEFAULT_MAX_POINTS, Number(row.max_points ?? DEFAULT_MAX_POINTS));
    return Number(row.points ?? 0) < maxPoints;
  });

  if (failing.some((row) => String(row.task_id ?? '') === tiedId)) return true;

  try {
    const { getAssignmentById } = await import('@/lib/listen-and-answer/db');
    const tied = await getAssignmentById(tiedId);
    const tiedTitle = tied?.title?.trim().toLowerCase() || '';
    if (
      tiedTitle &&
      failing.some((row) => String(row.task_title ?? '').trim().toLowerCase() === tiedTitle)
    ) {
      return true;
    }
  } catch {
    // ignore
  }

  return false;
}

export type MakeupCreditResult = {
  credited: boolean;
  reason: string;
};

/**
 * After a student passes a Listen & Learn makeup, credit a separate gradebook row
 * (original Listen & Answer fail stays as recorded).
 *
 * Matching is intentionally forgiving: exact tied assessment id first, then same
 * Listen & Answer title; prefer the active semester, but credit into the semester
 * where the failing grade actually lives.
 */
export async function creditListenLearnMakeup(params: {
  teacherId: string;
  learnAssignmentId: string;
  learnTitle: string;
  makeupListenAssignmentId: string;
  makeupClassNames?: string[];
  studentNumber: string;
  classNumber: string;
}): Promise<MakeupCreditResult> {
  await ensureGradebookSchema();
  const teacherId = params.teacherId || DEFAULT_TEACHER_ID;
  const studentNumber = normalizeStudentNumber(params.studentNumber);
  const classLabel = params.classNumber.trim();
  if (!studentNumber || !classLabel) {
    return { credited: false, reason: 'missing_student_or_class' };
  }

  const entryConfig = await getEntryConfig(teacherId);
  const classOption = entryConfig.classes.find(
    (item) => item.label.trim().toLowerCase() === classLabel.toLowerCase()
  );
  if (!classOption) {
    return { credited: false, reason: `class_not_found:${classLabel}` };
  }

  const settings = await getGradebookSettings(teacherId);
  const schoolYear = settings.school_year;
  const activeSemester = settings.active_semester;
  const tiedId = String(params.makeupListenAssignmentId ?? '').trim();
  if (!tiedId) {
    return { credited: false, reason: 'missing_tied_assessment' };
  }

  let tiedTitle = '';
  try {
    const { getAssignmentById } = await import('@/lib/listen-and-answer/db');
    const tied = await getAssignmentById(tiedId);
    tiedTitle = tied?.title?.trim().toLowerCase() || '';
  } catch {
    // Title fallback unavailable — exact id match may still work.
  }

  // Find failing Listen & Answer rows for this seat in the current school year
  // (any semester — teachers often enter grades while viewing a non-active tab).
  const { rows: listenRows } = await sql`
    SELECT points, max_points, task_title, task_id, semester, school_year
    FROM gradebook_entries
    WHERE teacher_id = ${teacherId}
      AND school_year = ${schoolYear}
      AND class_id = ${classOption.id}
      AND student_number = ${studentNumber}
      AND tool = 'listen_and_answer'
    ORDER BY updated_at DESC
  `;

  type FailCandidate = {
    points: number;
    max_points: number;
    task_title: string;
    task_id: string;
    semester: GradebookSemester;
    school_year: string;
  };

  const failing = listenRows
    .map((row) => {
      const maxPoints = Math.max(
        DEFAULT_MAX_POINTS,
        Number(row.max_points ?? DEFAULT_MAX_POINTS)
      );
      return {
        points: Number(row.points ?? 0),
        max_points: maxPoints,
        task_title: String(row.task_title ?? ''),
        task_id: String(row.task_id ?? ''),
        semester: parseSemester(row.semester),
        school_year: String(row.school_year ?? schoolYear),
      } satisfies FailCandidate;
    })
    .filter((row) => row.points < row.max_points);

  const byPreference = (a: FailCandidate, b: FailCandidate) => {
    if (a.semester === activeSemester && b.semester !== activeSemester) return -1;
    if (b.semester === activeSemester && a.semester !== activeSemester) return 1;
    return 0;
  };

  let failed: FailCandidate | null =
    failing.filter((row) => row.task_id === tiedId).sort(byPreference)[0] || null;

  // Title fallback only when exactly one failing row shares the title — never steal
  // scores across different Listen tasks that happen to be named "English Listening".
  if (!failed && tiedTitle) {
    const sameTitle = failing
      .filter((row) => String(row.task_title ?? '').trim().toLowerCase() === tiedTitle)
      .sort(byPreference);
    failed = sameTitle.length === 1 ? sameTitle[0] : null;
  }

  if (!failed) {
    const anyTied = listenRows.find((row) => String(row.task_id ?? '') === tiedId);
    if (anyTied) {
      return { credited: false, reason: 'tied_assessment_already_full_points' };
    }
    return {
      credited: false,
      reason: `no_failing_tied_assessment:${tiedId}`,
    };
  }

  await upsertGradeEntry(
    {
      school_year: failed.school_year || schoolYear,
      semester: failed.semester,
      class_id: classOption.id,
      class_label: classOption.label,
      student_number: studentNumber,
      tool: 'listen_and_learn',
      task_id: params.learnAssignmentId,
      task_title: params.learnTitle.trim() || 'Makeup',
      points: failed.max_points,
      max_points: failed.max_points,
      notes: `Makeup for: ${failed.task_title || 'assessment'}`,
    },
    teacherId
  );
  return { credited: true, reason: 'ok' };
}

/** Clear makeup gradebook points after a teacher deletes the last passing Learn submission. */
export async function removeListenLearnMakeupCredit(params: {
  teacherId: string;
  learnAssignmentId: string;
  studentNumber: string;
  classNumber: string;
}): Promise<number> {
  await ensureGradebookSchema();
  const teacherId = params.teacherId || DEFAULT_TEACHER_ID;
  const studentNumber = normalizeStudentNumber(params.studentNumber);
  const classLabel = params.classNumber.trim();
  const learnAssignmentId = params.learnAssignmentId.trim();
  if (!studentNumber || !classLabel || !learnAssignmentId) return 0;

  const entryConfig = await getEntryConfig(teacherId);
  const classOption = entryConfig.classes.find(
    (item) => item.label.trim().toLowerCase() === classLabel.toLowerCase()
  );

  if (classOption) {
    const { rowCount } = await sql`
      DELETE FROM gradebook_entries
      WHERE teacher_id = ${teacherId}
        AND tool = 'listen_and_learn'
        AND task_id = ${learnAssignmentId}
        AND student_number = ${studentNumber}
        AND class_id = ${classOption.id}
    `;
    return rowCount ?? 0;
  }

  const { rowCount } = await sql`
    DELETE FROM gradebook_entries
    WHERE teacher_id = ${teacherId}
      AND tool = 'listen_and_learn'
      AND task_id = ${learnAssignmentId}
      AND student_number = ${studentNumber}
      AND lower(trim(class_label)) = ${classLabel.toLowerCase()}
  `;
  return rowCount ?? 0;
}
