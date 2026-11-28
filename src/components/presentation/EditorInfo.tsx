'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Round info control. The explanation stays hidden until the teacher clicks it.
 */
export default function EditorInfo({ text }: { text: string }) {
  const tipId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;

    function closeIfOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || tipRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', closeIfOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', closeIfOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function toggle() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 240;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    setPlace({ top: rect.bottom + 6, left });
    setOpen((current) => !current);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[var(--comic-black)] bg-white text-[11px] font-black leading-none text-[var(--comic-secondary)]"
        aria-label="About this"
        aria-expanded={open}
        aria-controls={open ? tipId : undefined}
        onClick={(event) => {
          event.stopPropagation();
          toggle();
        }}
      >
        i
      </button>
      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={tipRef}
              id={tipId}
              role="tooltip"
              className="fixed z-[80] w-60 border-4 border-[var(--comic-black)] bg-white p-2 text-xs font-bold leading-snug text-[var(--comic-dark)] comic-shadow-md"
              style={{ top: place.top, left: place.left }}
            >
              {text}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
