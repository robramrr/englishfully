'use client';

import { useEffect, useRef, useState } from 'react';
import type { SpeakClassOption } from '@/lib/speak-and-submit/types';

interface ClassCheckboxDropdownProps {
  classes: SpeakClassOption[];
  selected: string[];
  onChange: (labels: string[]) => void;
}

export default function ClassCheckboxDropdown({
  classes,
  selected,
  onChange,
}: ClassCheckboxDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const checkAllRef = useRef<HTMLInputElement>(null);
  const selectedSet = new Set(selected);
  const allChecked = classes.length > 0 && classes.every((item) => selectedSet.has(item.label));
  const someChecked = selected.length > 0 && !allChecked;

  useEffect(() => {
    if (checkAllRef.current) {
      checkAllRef.current.indeterminate = someChecked;
    }
  }, [someChecked]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  function toggleAll() {
    onChange(allChecked ? [] : classes.map((item) => item.label));
  }

  function toggleOne(label: string) {
    if (selectedSet.has(label)) {
      onChange(selected.filter((item) => item !== label));
      return;
    }
    onChange([...selected, label]);
  }

  const summary = allChecked
    ? 'All classes'
    : selected.length === 0
      ? 'Select classes'
      : selected.join(', ');

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="w-full comic-input text-left flex items-center justify-between gap-3"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selected.length === 0 ? 'text-gray-500' : ''}>{summary}</span>
        <span aria-hidden className="text-[var(--comic-secondary)]">
          ▾
        </span>
      </button>
      {open ? (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-20 mt-2 w-full comic-border bg-white rounded-lg p-2 max-h-64 overflow-auto"
        >
          <label className="flex items-center gap-2 rounded-md px-2 py-2 font-bold text-[var(--comic-dark)] hover:bg-[var(--comic-light)]">
            <input
              ref={checkAllRef}
              type="checkbox"
              checked={allChecked}
              onChange={toggleAll}
            />
            Check all
          </label>
          {classes.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2 rounded-md px-2 py-2 font-bold text-[var(--comic-dark)] hover:bg-[var(--comic-light)]"
            >
              <input
                type="checkbox"
                checked={selectedSet.has(item.label)}
                onChange={() => toggleOne(item.label)}
              />
              {item.label}
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
