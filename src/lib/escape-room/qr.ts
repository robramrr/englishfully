export function getStudentEscapeRoomUrl(roomId: string, origin?: string): string {
  const base =
    origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base.replace(/\/$/, '')}/escape-room/${roomId}`;
}
