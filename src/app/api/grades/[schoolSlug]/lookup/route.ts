import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/speak-and-submit/api';
import { getGradebookSettingsBySlug, lookupStudentGrades } from '@/lib/gradebook/db';
import { parseSemester } from '@/lib/gradebook/types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { schoolSlug: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const settings = await getGradebookSettingsBySlug(params.schoolSlug);
    if (!settings) {
      return jsonError('School grades page not found', 404);
    }

    const body = await request.json();
    const classId = String(body.class_id ?? '').trim();
    const studentNumber = String(body.student_number ?? '').trim();
    const studentLetter = String(body.student_letter ?? '').trim().toUpperCase();
    const rollNumber = String(body.roll_number ?? '').trim();
    const semester = body.semester != null ? parseSemester(body.semester) : undefined;
    const schoolYear = String(body.school_year ?? '').trim() || undefined;

    const combinedNumber = studentLetter
      ? `${studentNumber.replace(/\D/g, '')}${studentLetter}`
      : studentNumber;

    const result = await lookupStudentGrades({
      classId,
      studentNumber: combinedNumber,
      rollNumber,
      semester,
      schoolYear,
      teacherId: settings.teacher_id,
    });

    if (!result) {
      return jsonError('No grades found for that class, student number, and roll number.', 404);
    }

    return NextResponse.json(
      { grade: result },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Student grade lookup error:', error);
    return jsonError('Failed to look up grades', 500);
  }
}
