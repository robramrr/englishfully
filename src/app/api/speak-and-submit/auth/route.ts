import { NextRequest, NextResponse } from 'next/server';
import {
  getTeacherCookieName,
  getTeacherCookieOptions,
  isTeacherAuthenticated,
  verifyTeacherPassword,
} from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';

export async function GET() {
  try {
    const authenticated = await isTeacherAuthenticated();
    return NextResponse.json({ authenticated });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = body.password as string | undefined;

    if (!password || !verifyTeacherPassword(password)) {
      return jsonError('Invalid teacher password', 401);
    }

    const cookieOptions = getTeacherCookieOptions();
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(cookieOptions.name, cookieOptions.value, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });
    return response;
  } catch (error) {
    console.error('Teacher auth error:', error);
    return jsonError('Authentication failed', 500);
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(getTeacherCookieName(), '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
