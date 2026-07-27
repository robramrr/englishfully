export type GradebookTool = 'speak_and_submit' | 'listen_and_answer' | 'listen_and_learn';
export type GradebookSemester = 1 | 2;

export const GRADEBOOK_TOOLS: GradebookTool[] = [
  'speak_and_submit',
  'listen_and_answer',
  'listen_and_learn',
];

export const GRADEBOOK_TOOL_LABELS: Record<GradebookTool, string> = {
  speak_and_submit: 'Speak & Submit',
  listen_and_answer: 'Listen & Answer',
  listen_and_learn: 'Listen & Learn',
};

export const DEFAULT_MAX_POINTS = 10;
export const LISTEN_PASS_PERCENT = 70;

export interface GradebookSettings {
  teacher_id: string;
  school_year: string;
  active_semester: GradebookSemester;
  /** URL path segment for /grades/{grades_slug} */
  grades_slug: string;
  /** Optional friendly school name shown on the grades page */
  school_name: string;
  /**
   * Temporary: students must still enter 5 digits, but the roll is not verified.
   * Claimed rolls are logged for the teacher to copy into the roster later.
   */
  roll_lookup_open: boolean;
  updated_at: string;
}

export interface GradebookEntry {
  id: string;
  teacher_id: string;
  school_year: string;
  semester: GradebookSemester;
  class_id: string;
  class_label: string;
  student_number: string;
  tool: GradebookTool;
  task_id: string;
  task_title: string;
  points: number;
  max_points: number;
  test_correct: number | null;
  test_total: number | null;
  notes: string;
  updated_at: string;
}

export interface GradebookTaskOption {
  id: string;
  title: string;
  tool: GradebookTool;
  class_name: string;
  question_count: number | null;
}

export interface GradebookClassSummary {
  id: string;
  label: string;
  max_student_number: number;
  seat_count: number;
  graded_seat_count: number;
  entry_count: number;
  total_points_earned: number;
  total_points_possible: number;
}

export interface GradebookSeat {
  student_number: string;
  display_name: string | null;
  /** 5-digit roll number used for student grade lookup (optional until teacher sets it). */
  roll_number: string | null;
  entries_by_task: Record<string, GradebookEntry>;
  total_earned: number;
  total_possible: number;
}

export interface GradebookTaskColumn {
  task_key: string;
  tool: GradebookTool;
  task_id: string;
  task_title: string;
  max_points: number;
  submitted_student_numbers: string[];
}

export interface UpsertGradeEntryPayload {
  school_year: string;
  semester: GradebookSemester;
  class_id: string;
  class_label: string;
  student_number: string;
  tool: GradebookTool;
  task_id: string;
  task_title: string;
  points: number;
  max_points: number;
  test_correct?: number | null;
  test_total?: number | null;
  pass_percent?: number;
  notes?: string;
}

export interface SaveGradebookSettingsPayload {
  school_year: string;
  active_semester: GradebookSemester;
  grades_slug?: string;
  school_name?: string;
  /** Temporary open lookup (still requires 5 digits; logs what students typed). */
  roll_lookup_open?: boolean;
}

export interface GradebookRollClaim {
  id: string;
  teacher_id: string;
  class_id: string;
  class_label: string;
  student_number: string;
  claimed_roll: string;
  created_at: string;
}

export interface UpsertRosterRollPayload {
  class_id: string;
  class_label: string;
  student_number: string;
  roll_number: string;
}

export interface StudentGradeLookupResult {
  class_label: string;
  school_year: string;
  semester: GradebookSemester;
  student_number: string;
  display_name: string | null;
  tasks: Array<{
    tool: GradebookTool;
    task_id: string;
    task_title: string;
    points: number | null;
    max_points: number;
    test_correct: number | null;
    test_total: number | null;
    /** graded = has gradebook entry; missing = assigned but no grade yet */
    status: 'graded' | 'missing';
    /** True when Speak & Submit has a recording for this seat (even if ungraded). */
    submitted: boolean;
    /** Student-facing assignment URL when available (e.g. /speak/...). */
    student_url: string | null;
    /** When set, this row is makeup for the given Listen & Answer task id. */
    makeup_for_task_id?: string | null;
  }>;
  total_earned: number;
  total_possible: number;
  percent_label: string;
}

export function normalizeRollNumber(value: unknown): string {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.slice(0, 5);
}

export function isValidRollNumber(value: unknown): boolean {
  return /^\d{5}$/.test(normalizeRollNumber(value));
}

/** Lowercase slug for /grades/{slug} — letters, numbers, hyphens. */
export function normalizeGradesSlug(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function isValidGradesSlug(value: unknown): boolean {
  const slug = normalizeGradesSlug(value);
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 2;
}

export function getCurrentSchoolYear(date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based
  // Thai school year often starts mid-year; use May–Apr style: if before May, previous-current
  if (month < 4) {
    return `${year - 1}-${year}`;
  }
  return `${year}-${year + 1}`;
}

export function buildStudentRoster(
  maxStudentNumber: number,
  letterEnabled: boolean
): string[] {
  const seats: string[] = [];
  const max = Math.min(99, Math.max(1, maxStudentNumber));
  for (let number = 1; number <= max; number += 1) {
    if (letterEnabled) {
      seats.push(`${number}A`, `${number}B`);
    } else {
      seats.push(String(number));
    }
  }
  return seats;
}

export function taskKey(tool: GradebookTool, taskId: string): string {
  return `${tool}:${taskId}`;
}

export function parseSemester(value: unknown): GradebookSemester {
  return Number(value) === 2 ? 2 : 1;
}

export function clampPoints(value: unknown, maxPoints: number): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(Math.max(0, numeric), Math.max(0, maxPoints));
}

export function clampPassPercent(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return LISTEN_PASS_PERCENT;
  return Math.min(100, Math.max(0, numeric));
}

export function formatPercent(earned: number, possible: number): string {
  if (possible <= 0) return '—';
  return `${Math.round((earned / possible) * 100)}%`;
}

/** Yellow when full points earned; red when short of the possible total. */
export function runningTotalHighlightClass(earned: number, possible: number): string {
  if (!(possible > 0)) return '';
  if (earned >= possible) {
    return 'gradebook-total-complete';
  }
  return 'gradebook-total-incomplete';
}

export function getTestPercent(correct: number, total: number): number | null {
  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) return null;
  return (correct / total) * 100;
}

/** Convert a Listen & Answer test score into gradebook points (10-point system). */
export function gradePointsFromTestScore(
  correct: number,
  total: number,
  maxPoints: number = DEFAULT_MAX_POINTS,
  passPercent: number = LISTEN_PASS_PERCENT
): number {
  const percent = getTestPercent(correct, total);
  if (percent === null) return 0;
  return percent >= passPercent ? maxPoints : 0;
}

export function formatTestScore(
  correct: number | null | undefined,
  total: number | null | undefined
): string {
  if (correct == null || total == null || total <= 0) return '—';
  const percent = getTestPercent(correct, total);
  return percent === null
    ? `${correct}/${total}`
    : `${correct}/${total} (${Math.round(percent)}%)`;
}
