import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import type { ListeningPart } from '@/lib/listen-and-answer/types';
import { shouldShowAdditionalThumbnail } from '@/lib/listen-and-answer/types';

interface PartThumbnailBlockProps {
  part: ListeningPart;
  partIndex: number;
  imageHeightClass: string;
  titleComponent?: 'text' | 'title';
}

export default function PartThumbnailBlock({
  part,
  partIndex,
  imageHeightClass,
  titleComponent = 'text',
}: PartThumbnailBlockProps) {
  const partTitle = part.title || `Part ${partIndex + 1}`;
  const hasPrimaryThumbnail = part.thumbnail_url.trim().length > 0;
  const hasAdditionalThumbnail = shouldShowAdditionalThumbnail(part);

  if (!hasPrimaryThumbnail && !hasAdditionalThumbnail) {
    if (titleComponent === 'title') {
      return (
        <ComicTitle level={4} className="!text-xl !mb-0 text-[var(--comic-primary)]">
          {partTitle}
        </ComicTitle>
      );
    }

    return (
      <ComicText className="font-bold text-xl text-[var(--comic-secondary)]">
        {partTitle}
      </ComicText>
    );
  }

  const titleClassName =
    titleComponent === 'title'
      ? '!text-xl !mb-0 mt-1 text-[var(--comic-primary)]'
      : 'font-bold text-xl text-[var(--comic-secondary)] mt-1';

  return (
    <div className="shrink-0 print-part-thumbnail-block">
      <div className="flex items-start gap-2">
        {hasPrimaryThumbnail ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={part.thumbnail_url}
            alt=""
            className={`print-thumbnail-img block w-auto max-w-full comic-border object-contain ${imageHeightClass}`}
          />
        ) : null}
        {hasAdditionalThumbnail ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={part.additional_thumbnail_url}
            alt=""
            className={`print-thumbnail-img block w-auto max-w-full comic-border object-contain ${imageHeightClass}`}
          />
        ) : null}
      </div>
      {titleComponent === 'title' ? (
        <ComicTitle level={4} className={titleClassName}>
          {partTitle}
        </ComicTitle>
      ) : (
        <ComicText className={titleClassName}>{partTitle}</ComicText>
      )}
    </div>
  );
}
