export type GradebookTool = 'speak_and_submit' | 'listen_and_answer';
export type GradebookSemester = 1 | 2;

export const GRADEBOOK_TOOLS: GradebookTool[] = ['speak_and_submit', 'listen_and_answer'];

export const GRADEBOOK_TOOL_LABELS: Record<GradebookTool, string> = {
  speak_and_submit: 'Speak & Submit',
  listen_and_answer: 'Listen & Answer',
};

export const DEFAULT_MAX_POINTS = 10;
export const LISTEN_PASS_PERCENT = 70;

export interface GradebookSettings {
  teacher_id: string;
  school_year: string;
  active_semester: GradebookSemester;
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
