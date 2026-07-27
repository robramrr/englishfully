import { NextResponse } from 'next/server';
import { jsonError } from '@/lib/speak-and-submit/api';
import { listPublicGradeClasses } from '@/lib/gradebook/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const classes = await listPublicGradeClasses();
    return NextResponse.json(
      { classes },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Public grade classes error:', error);
    return jsonError('Failed to load classes', 500);
  }
}
