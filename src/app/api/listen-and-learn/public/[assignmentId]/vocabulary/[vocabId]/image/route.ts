import { NextRequest, NextResponse } from 'next/server';
import { getLearnAssignmentById } from '@/lib/listen-and-learn/db';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { extractKeyFromUrl, getAudioFromR2 } from '@/lib/speak-and-submit/r2';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { assignmentId: string; vocabId: string };
}

function contentTypeForKey(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/png';
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const assignment = await getLearnAssignmentById(params.assignmentId);
    if (!assignment) {
      return new NextResponse('Not found', { status: 404 });
    }

    if (assignment.status !== 'published') {
      const isTeacher = await isTeacherAuthenticated();
      if (!isTeacher) {
        return new NextResponse('Not found', { status: 404 });
      }
    }

    const item = assignment.vocabulary.find((entry) => entry.id === params.vocabId);
    const imageUrl = item?.image_url?.trim() || '';
    if (!imageUrl) {
      return new NextResponse('Image not found', { status: 404 });
    }

    // Same-origin relative proxy paths should not recurse.
    if (imageUrl.startsWith('/')) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const key = extractKeyFromUrl(imageUrl);
    if (key) {
      try {
        const buffer = await getAudioFromR2(key);
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            'Content-Type': contentTypeForKey(key),
            'Cache-Control': 'public, max-age=86400',
          },
        });
      } catch (error) {
        console.error('R2 vocabulary image read failed, falling back to URL:', error);
      }
    }

    // External / public URL fallback (pasted links, public R2, etc.)
    const upstream = await fetch(imageUrl);
    if (!upstream.ok) {
      return new NextResponse('Image not found', { status: 404 });
    }
    const contentType = upstream.headers.get('content-type') || 'image/png';
    const bytes = await upstream.arrayBuffer();
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Public vocabulary image error:', error);
    return new NextResponse('Failed to load image', { status: 500 });
  }
}
