import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'ef_teacher_auth';

function getTeacherSecret(): string | null {
  return process.env.TEACHER_SECRET || null;
}

export function createTeacherToken(): string {
  const secret = getTeacherSecret();
  if (!secret) {
    throw new Error('TEACHER_SECRET is not configured');
  }
  return createHmac('sha256', secret)
    .update('englishfully-teacher-session')
    .digest('hex');
}

export function isValidTeacherToken(token: string | undefined): boolean {
  if (!token || !getTeacherSecret()) return false;
  try {
    const expected = createTeacherToken();
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function isTeacherAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return isValidTeacherToken(token);
}

export function getTeacherCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: createTeacherToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function getTeacherCookieName(): string {
  return COOKIE_NAME;
}

export function verifyTeacherPassword(password: string): boolean {
  const secret = getTeacherSecret();
  if (!secret) return false;
  try {
    const a = Buffer.from(password);
    const b = Buffer.from(secret);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
