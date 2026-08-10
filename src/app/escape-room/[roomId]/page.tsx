import ComicText from '@/components/ComicText';
import ComicTitle from '@/components/ComicTitle';
import StudentEscapePlayer from '@/components/escape-room/StudentEscapePlayer';
import { getPublishedEscapeRoomById } from '@/lib/escape-room/db';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { roomId: string };
}

export default async function EscapeRoomStudentPage({ params }: PageProps) {
  const room = await getPublishedEscapeRoomById(params.roomId);

  if (!room) {
    return (
      <main className="min-h-screen bg-[var(--comic-light)] px-4 py-16">
        <div className="max-w-xl mx-auto text-center space-y-4">
          <ComicTitle level={2} className="text-[var(--comic-primary)]">
            Escape room not available
          </ComicTitle>
          <ComicText className="font-bold text-[var(--comic-dark)]">
            This mission is not published yet, or the link is incorrect.
          </ComicText>
        </div>
      </main>
    );
  }

  return <StudentEscapePlayer room={room} mode="live" />;
}
