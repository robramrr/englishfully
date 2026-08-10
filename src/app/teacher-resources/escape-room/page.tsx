'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDoorOpen } from '@fortawesome/free-solid-svg-icons';
import ComicButton from '../../../components/ComicButton';
import ComicCard from '../../../components/ComicCard';
import ComicText from '../../../components/ComicText';
import ComicTitle from '../../../components/ComicTitle';
import Footer from '../../../components/Footer';
import RoomList from '../../../components/escape-room/RoomList';
import TeacherAuthGate from '../../../components/speak-and-submit/TeacherAuthGate';
import type { EscapeRoomListItem } from '@/lib/escape-room/types';

function EscapeRoomHomeContent() {
  const router = useRouter();
  const [rooms, setRooms] = useState<EscapeRoomListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [challengeCount, setChallengeCount] = useState(4);
  const [error, setError] = useState('');

  const loadRooms = useCallback(async () => {
    const response = await fetch('/api/escape-room/rooms');
    if (!response.ok) {
      setLoaded(true);
      setRooms([]);
      return;
    }
    const data = await response.json();
    setRooms(data.rooms || []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  async function handleCreate() {
    setCreating(true);
    setError('');
    try {
      const response = await fetch('/api/escape-room/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled Escape Room',
          challenge_count: challengeCount,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create escape room');
      router.push(`/teacher-resources/escape-room/${data.room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create escape room');
      setCreating(false);
    }
  }

  return (
    <section className="max-w-6xl mx-auto py-16 px-4 space-y-10">
      <div className="flex flex-wrap gap-3">
        <Link href="/teacher-resources">
          <ComicButton variant="accent" size="sm">
            ← Back to Teacher Resources
          </ComicButton>
        </Link>
      </div>

      <ComicCard className="comic-shadow-xl text-center space-y-4">
        <ComicTitle level={3} className="mb-2 text-[var(--comic-primary)]">
          Escape Room Generator
        </ComicTitle>
        <ComicText className="text-[var(--comic-dark)] font-bold">
          Turn lesson topics, artwork, vocabulary, and worksheets into an interactive escape-room
          mission with up to 6 challenges.
        </ComicText>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <label className="inline-flex items-center gap-2">
            <ComicText className="text-sm font-bold">Challenges</ComicText>
            <select
              className="comic-input w-20"
              value={challengeCount}
              onChange={(event) => setChallengeCount(Number(event.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <ComicButton
            variant="secondary"
            size="md"
            disabled={creating}
            onClick={() => void handleCreate()}
          >
            {creating ? 'Creating…' : '+ New Escape Room'}
          </ComicButton>
        </div>
        {error ? (
          <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText>
        ) : null}
      </ComicCard>

      {loaded ? (
        <RoomList rooms={rooms} onRefresh={() => void loadRooms()} />
      ) : (
        <ComicText className="font-bold text-center">Loading escape rooms…</ComicText>
      )}
    </section>
  );
}

export default function EscapeRoomPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <section className="comic-bg-primary py-16 px-4 comic-pattern-dots text-center">
        <ComicTitle level={1} className="comic-text-white mb-4">
          <span className="inline-flex items-center justify-center gap-3">
            <FontAwesomeIcon icon={faDoorOpen} aria-hidden className="h-[0.85em] w-[0.85em]" />
            Escape Room Generator
          </span>
        </ComicTitle>
        <ComicText size="lg" className="comic-text-white font-bold max-w-3xl mx-auto">
          Teacher tool — draft, edit, and publish English escape-room lessons
        </ComicText>
      </section>
      <TeacherAuthGate>
        <EscapeRoomHomeContent />
      </TeacherAuthGate>
      <Footer />
    </div>
  );
}
