'use client';

import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import SegmentAudioPlayer from './SegmentAudioPlayer';
import {
  formatTimestamp,
  parseTimestamp,
  segmentDuration,
} from '@/lib/listen-and-learn/types';

export interface ClientLearnSegment {
  clientId: string;
  id?: string;
  sentence_text: string;
  start_seconds: number;
  end_seconds: number;
  selected: boolean;
}

interface SegmentReviewTableProps {
  audioUrl: string;
  segments: ClientLearnSegment[];
  onChange: (segments: ClientLearnSegment[]) => void;
}

export default function SegmentReviewTable({
  audioUrl,
  segments,
  onChange,
}: SegmentReviewTableProps) {
  function updateSegment(clientId: string, updates: Partial<ClientLearnSegment>) {
    onChange(
      segments.map((segment) =>
        segment.clientId === clientId ? { ...segment, ...updates } : segment
      )
    );
  }

  function toggleAll(selected: boolean) {
    onChange(segments.map((segment) => ({ ...segment, selected })));
  }

  if (segments.length === 0) {
    return (
      <ComicText className="text-[var(--comic-dark)] font-bold">
        No listening segments yet. Generate or enter a transcript to create segments.
      </ComicText>
    );
  }

  const selectedCount = segments.filter((segment) => segment.selected).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <ComicButton variant="accent" size="sm" onClick={() => toggleAll(true)}>
          Select all
        </ComicButton>
        <ComicButton variant="accent" size="sm" onClick={() => toggleAll(false)}>
          Deselect all
        </ComicButton>
        <ComicText className="text-[var(--comic-dark)] font-bold text-sm">
          {selectedCount} of {segments.length} selected
        </ComicText>
      </div>

      <div className="overflow-x-auto comic-border-thick rounded-lg bg-white">
        <table className="w-full text-left border-collapse min-w-[720px]">
          <thead>
            <tr className="bg-[var(--comic-primary)] text-white">
              <th className="p-3 font-black">✓</th>
              <th className="p-3 font-black">Sentence</th>
              <th className="p-3 font-black">Start</th>
              <th className="p-3 font-black">End</th>
              <th className="p-3 font-black">Duration</th>
              <th className="p-3 font-black">Preview</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((segment) => (
              <tr key={segment.clientId} className="border-t-2 border-[var(--comic-black)]">
                <td className="p-3 align-top">
                  <input
                    type="checkbox"
                    checked={segment.selected}
                    onChange={(event) =>
                      updateSegment(segment.clientId, { selected: event.target.checked })
                    }
                    className="w-5 h-5"
                  />
                </td>
                <td className="p-3 align-top min-w-[240px]">
                  <textarea
                    value={segment.sentence_text}
                    onChange={(event) =>
                      updateSegment(segment.clientId, { sentence_text: event.target.value })
                    }
                    rows={2}
                    className="w-full comic-border-thick rounded-md p-2 font-bold text-[var(--comic-dark)]"
                  />
                </td>
                <td className="p-3 align-top">
                  <input
                    type="text"
                    value={formatTimestamp(segment.start_seconds)}
                    onChange={(event) =>
                      updateSegment(segment.clientId, {
                        start_seconds: parseTimestamp(event.target.value),
                      })
                    }
                    className="w-24 comic-border-thick rounded-md p-2 font-bold"
                  />
                </td>
                <td className="p-3 align-top">
                  <input
                    type="text"
                    value={formatTimestamp(segment.end_seconds)}
                    onChange={(event) =>
                      updateSegment(segment.clientId, {
                        end_seconds: parseTimestamp(event.target.value),
                      })
                    }
                    className="w-24 comic-border-thick rounded-md p-2 font-bold"
                  />
                </td>
                <td className="p-3 align-top">
                  <ComicText className="text-[var(--comic-dark)] font-bold">
                    {segmentDuration(segment.start_seconds, segment.end_seconds).toFixed(1)}s
                  </ComicText>
                </td>
                <td className="p-3 align-top">
                  <SegmentAudioPlayer
                    audioUrl={audioUrl}
                    startSeconds={segment.start_seconds}
                    endSeconds={segment.end_seconds}
                    maxReplays={null}
                    label="▶"
                    compact
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
