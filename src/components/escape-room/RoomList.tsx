'use client';

import Link from 'next/link';
import { useState } from 'react';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import type { EscapeRoomListItem } from '@/lib/escape-room/types';
import { ESCAPE_ROOM_STATUS_LABELS } from '@/lib/escape-room/types';
import { getStudentEscapeRoomUrl } from '@/lib/escape-room/qr';

interface RoomListProps {
  rooms: EscapeRoomListItem[];
  onRefresh: () => void;
}

export default function RoomList({ rooms, onRefresh }: RoomListProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleDuplicate(roomId: string) {
    setBusyId(roomId);
    setError('');
    try {
      const response = await fetch(`/api/escape-room/rooms/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to duplicate');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(roomId: string, title: string) {
    const confirmed = window.confirm(
      `Delete “${title || 'Untitled Escape Room'}”? This cannot be undone.`
    );
    if (!confirmed) return;
    setBusyId(roomId);
    setError('');
    try {
      const response = await fetch(`/api/escape-room/rooms/${roomId}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to delete');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setBusyId(null);
    }
  }

  if (rooms.length === 0) {
    return (
      <ComicCard className="comic-shadow-xl text-center">
        <ComicText className="font-bold text-[var(--comic-dark)]">
          No escape rooms yet. Create one to get started.
        </ComicText>
      </ComicCard>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText>
      ) : null}
      {rooms.map((room) => (
        <ComicCard key={room.id} className="comic-shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1 min-w-0">
              <ComicTitle level={3} className="comic-title-no-shadow text-[var(--comic-primary)]">
                {room.title || 'Untitled Escape Room'}
              </ComicTitle>
              <ComicText className="text-sm text-[var(--comic-dark)]">
                {ESCAPE_ROOM_STATUS_LABELS[room.status]} · {room.challenge_count} challenge
                {room.challenge_count === 1 ? '' : 's'}
                {room.english_level ? ` · ${room.english_level}` : ''}
              </ComicText>
              {room.status === 'published' ? (
                <ComicText className="text-xs break-all text-[var(--comic-dark)]">
                  Student link: {getStudentEscapeRoomUrl(room.id)}
                </ComicText>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link href={`/teacher-resources/escape-room/${room.id}`}>
                <ComicButton variant="primary" size="sm">
                  Edit
                </ComicButton>
              </Link>
              <ComicButton
                type="button"
                variant="accent"
                size="sm"
                disabled={busyId === room.id}
                onClick={() => void handleDuplicate(room.id)}
              >
                Duplicate
              </ComicButton>
              <ComicButton
                type="button"
                variant="danger"
                size="sm"
                disabled={busyId === room.id}
                onClick={() => void handleDelete(room.id, room.title)}
              >
                Delete
              </ComicButton>
            </div>
          </div>
        </ComicCard>
      ))}
    </div>
  );
}
