import type { GradebookSeat, GradebookSemester, GradebookTaskColumn } from '@/lib/gradebook/types';
import { GRADEBOOK_TOOL_LABELS, formatTestScore } from '@/lib/gradebook/types';

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadAllGradedTasksExcel(params: {
  classLabel: string;
  schoolYear: string;
  semester: GradebookSemester;
  taskColumns: GradebookTaskColumn[];
  seats: GradebookSeat[];
}) {
  const { classLabel, schoolYear, semester, taskColumns, seats } = params;
  const titleLine = `Class ${classLabel || '—'} · ${schoolYear || '—'} · Semester ${semester}`;
  const header = [
    '#',
    ...taskColumns.map(
      (column) => `${GRADEBOOK_TOOL_LABELS[column.tool]} — ${column.task_title}`
    ),
    'Total earned',
    'Total possible',
    'Total',
  ];

  const dataRows = seats.map((seat) => {
    const cells = taskColumns.map((column) => {
      const entry = seat.entries_by_task[column.task_key];
      if (!entry) return '—';
      if (
        column.tool === 'listen_and_answer' &&
        entry.test_correct != null &&
        entry.test_total != null
      ) {
        return `${formatTestScore(entry.test_correct, entry.test_total)} | ${entry.points}/${entry.max_points} pts`;
      }
      return `${entry.points}/${entry.max_points}`;
    });
    const totalLabel =
      seat.total_possible > 0 ? `${seat.total_earned}/${seat.total_possible}` : '—';
    return [
      seat.student_number,
      ...cells,
      seat.total_possible > 0 ? String(seat.total_earned) : '',
      seat.total_possible > 0 ? String(seat.total_possible) : '',
      totalLabel,
    ];
  });

  const lines = [
    ['Gradebook'],
    [titleLine],
    [],
    header,
    ...dataRows,
  ].map((row) => row.map((cell) => escapeCsvCell(String(cell ?? ''))).join(','));

  // UTF-8 BOM so Excel opens Thai/Unicode cleanly
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const classPart = (classLabel || 'Class').replace(/[^\w.-]+/g, '-');
  const yearPart = (schoolYear || 'School-Year').replace(/[^\w.-]+/g, '-');
  const filename = `Class_${classPart}_${yearPart}_Semester_${semester}_Gradebook.csv`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
