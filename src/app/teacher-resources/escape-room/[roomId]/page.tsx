'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ComicButton from '../../../../components/ComicButton';
import ComicText from '../../../../components/ComicText';
import ComicTitle from '../../../../components/ComicTitle';
import Footer from '../../../../components/Footer';
import RoomEditor from '../../../../components/escape-room/RoomEditor';
import TeacherAuthGate from '../../../../components/speak-and-submit/TeacherAuthGate';
import type { EscapeRoomWithChallenges } from '@/lib/escape-room/types';

function EscapeRoomEditorContent() {
  const params = useParams();
  const roomId = String(params.roomId ?? '');
  const [room, setRoom] = useState<EscapeRoomWithChallenges | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;
    setLoading(true);
    fetch(`/api/escape-room/rooms/${encodeURIComponent(roomId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load');
        setRoom(data.room);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load escape room');
      })
      .finally(() => setLoading(false));
  }, [roomId]);

  if (loading) {
    return (
      <section className="max-w-4xl mx-auto py-16 px-4">
        <ComicText className="font-bold">Loading escape room…</ComicText>
      </section>
    );
  }

  if (error || !room) {
    return (
      <section className="max-w-4xl mx-auto py-16 px-4 space-y-4">
        <ComicText className="text-[var(--comic-danger)] font-bold">
          {error || 'Escape room not found.'}
        </ComicText>
        <Link href="/teacher-resources/escape-room">
          <ComicButton variant="accent" size="sm">
            ← Back
          </ComicButton>
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto py-16 px-4">
      <RoomEditor initialRoom={room} />
    </section>
  );
}

export default function EscapeRoomEditorPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <section className="comic-bg-secondary py-12 px-4 comic-pattern-dots text-center">
        <ComicTitle level={1} className="comic-text-white mb-2">
          Escape Room Editor
        </ComicTitle>
        <ComicText className="comic-text-white font-bold">
          Edit mission details and challenge structure
        </ComicText>
      </section>
      <TeacherAuthGate>
        <EscapeRoomEditorContent />
      </TeacherAuthGate>
      <Footer />
    </div>
  );
}
