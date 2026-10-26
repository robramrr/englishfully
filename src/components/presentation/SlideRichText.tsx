'use client';

import { splitSlideLinks } from '@/lib/presentation/linkify';

/** Slide copy with http(s) addresses and [label](url) turned into real links. */
export function SlideRichText({ text }: { text: string }) {
  const parts = splitSlideLinks(text);
  if (parts.length === 0) return null;
  return (
    <>
      {parts.map((part, index) =>
        part.type === 'link' ? (
          <a
            key={`link-${index}`}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-black text-[var(--comic-primary)] underline decoration-2 underline-offset-[0.12em]"
            onClick={(event) => event.stopPropagation()}
          >
            {part.label}
          </a>
        ) : (
          <span key={`text-${index}`}>{part.value}</span>
        )
      )}
    </>
  );
}
