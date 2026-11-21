'use client';

import { createContext, useContext } from 'react';
import {
  anagramActivityIdFromHref,
  anagramLinkLabelIsRaw,
  splitSlideLinks,
} from '@/lib/presentation/linkify';

const SlideAnagramContext = createContext<((activityId: string) => void) | null>(null);

export function SlideAnagramProvider({
  children,
  onOpen,
}: {
  children: React.ReactNode;
  onOpen: (activityId: string) => void;
}) {
  return <SlideAnagramContext.Provider value={onOpen}>{children}</SlideAnagramContext.Provider>;
}

/** Slide copy with http(s) addresses and [label](url) turned into real links. */
export function SlideRichText({ text }: { text: string }) {
  const openAnagram = useContext(SlideAnagramContext);
  const parts = splitSlideLinks(text);
  if (parts.length === 0) return null;
  return (
    <>
      {parts.map((part, index) => {
        if (part.type !== 'link') {
          return <span key={`text-${index}`}>{part.value}</span>;
        }
        const anagramId = openAnagram ? anagramActivityIdFromHref(part.href) : null;
        if (anagramId && openAnagram) {
          const raw = anagramLinkLabelIsRaw(part.href, part.label);
          return (
            <button
              key={`link-${index}`}
              type="button"
              className={
                raw
                  ? 'mx-[0.15em] inline-flex align-middle border-4 border-[var(--comic-black)] bg-[var(--comic-yellow)] px-[0.55em] py-[0.18em] font-bungee text-[0.82em] uppercase leading-none text-[var(--comic-secondary)]'
                  : 'font-black text-[var(--comic-primary)] underline decoration-2 underline-offset-[0.12em]'
              }
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                openAnagram(anagramId);
              }}
            >
              {raw ? 'Play anagram' : part.label}
            </button>
          );
        }
        return (
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
        );
      })}
    </>
  );
}
