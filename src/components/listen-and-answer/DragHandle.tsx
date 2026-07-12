'use client';

interface DragHandleProps {
  label?: string;
}

export default function DragHandle({ label = 'Drag to reorder' }: DragHandleProps) {
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-8 comic-border rounded-md bg-white text-[var(--comic-dark)] cursor-grab active:cursor-grabbing select-none"
      title={label}
      aria-label={label}
    >
      ⠿
    </span>
  );
}
