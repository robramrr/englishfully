'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ComicButton from '@/components/ComicButton';
import ComicText from '@/components/ComicText';
import StudentEscapePlayer from '@/components/escape-room/StudentEscapePlayer';
import TeacherAuthGate from '@/components/speak-and-submit/TeacherAuthGate';
import type { EscapeRoomWithChallenges } from '@/lib/escape-room/types';

function PreviewContent() {
  const params = useParams();
  const roomId = String(params.roomId ?? '');
  const [room, setRoom] = useState<EscapeRoomWithChallenges | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomId) return;
    fetch(`/api/escape-room/rooms/${encodeURIComponent(roomId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load');
        setRoom(data.room);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, [roomId]);

  if (error) {
    return (
      <div className="p-8 space-y-3">
        <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText>
        <Link href={`/teacher-resources/escape-room/${roomId}`}>
          <ComicButton variant="accent" size="sm">
            ← Back to editor
          </ComicButton>
        </Link>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="p-8">
        <ComicText className="font-bold">Loading preview…</ComicText>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-20 bg-amber-100 border-b-2 border-amber-400 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <ComicText className="font-bold text-sm">Teacher preview — answers checked locally</ComicText>
        <Link href={`/teacher-resources/escape-room/${roomId}`}>
          <ComicButton variant="accent" size="sm">
            ← Editor
          </ComicButton>
        </Link>
      </div>
      <StudentEscapePlayer room={room} mode="preview" />
    </div>
  );
}

export default function EscapeRoomPreviewPage() {
  return (
    <TeacherAuthGate>
      <PreviewContent />
    </TeacherAuthGate>
  );
}