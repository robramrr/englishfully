import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { analyzeDescribeImage } from '@/lib/presentation/openai';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    const imageUrl = String(body.image_url ?? body.imageUrl ?? '').trim();
    if (!imageUrl) {
      return jsonError('Paste an image URL first.', 400);
    }

    const result = await analyzeDescribeImage({ imageUrl });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Describe image analyze error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to analyze image',
      500
    );
  }
}
