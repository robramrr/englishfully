import { nanoid } from 'nanoid';
import {
  defaultFieldOrder,
  defaultHeaderVisibility,
  emptyWorksheetHeader,
  normalizeFieldOrder,
  type WorksheetHeader,
  type WorksheetLevel,
  type WorksheetSection,
} from './types';

const LIBRARY_KEY = 'ef-worksheet-library';
const MAX_SAVED = 40;

export interface SavedWorksheet {
  id: string;
  savedAt: string;
  title: string;
  header: WorksheetHeader;
  sections: WorksheetSection[];
  level: WorksheetLevel;
  source: string;
  includeAnswerKey: boolean;
}

export interface SavedWorksheetSummary {
  id: string;
  savedAt: string;
  title: string;
}

function readAll(): SavedWorksheet[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(LIBRARY_KEY) || '[]') as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((entry): entry is SavedWorksheet => {
      if (!entry || typeof entry !== 'object') return false;
      const record = entry as SavedWorksheet;
      return typeof record.id === 'string' && record.header && Array.isArray(record.sections);
    });
  } catch {
    return [];
  }
}

function writeAll(sheets: SavedWorksheet[]) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(sheets.slice(0, MAX_SAVED)));
}

export function listSavedWorksheets(): SavedWorksheetSummary[] {
  return readAll()
    .map((sheet) => ({
      id: sheet.id,
      savedAt: sheet.savedAt,
      title: sheet.title || 'Worksheet',
    }))
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function loadSavedWorksheet(id: string): SavedWorksheet | null {
  const found = readAll().find((sheet) => sheet.id === id);
  if (!found) return null;
  const level = found.level || found.header.level || 'A2';
  return {
    ...found,
    level: level as WorksheetLevel,
    header: {
      ...emptyWorksheetHeader(level as WorksheetLevel),
      ...found.header,
      level,
      show: { ...defaultHeaderVisibility(), ...found.header.show },
      fieldOrder: normalizeFieldOrder(found.header.fieldOrder ?? defaultFieldOrder()),
    },
  };
}

export function saveWorksheet(sheet: {
  id?: string | null;
  header: WorksheetHeader;
  sections: WorksheetSection[];
  level: WorksheetLevel;
  source: string;
  includeAnswerKey: boolean;
}): SavedWorksheet {
  const all = readAll();
  const id = sheet.id && all.some((entry) => entry.id === sheet.id) ? sheet.id : nanoid(10);
  const saved: SavedWorksheet = {
    id,
    savedAt: new Date().toISOString(),
    title: sheet.header.title.trim() || sheet.header.masthead.trim() || 'Worksheet',
    header: sheet.header,
    sections: sheet.sections,
    level: sheet.level,
    source: sheet.source,
    includeAnswerKey: sheet.includeAnswerKey,
  };
  const rest = all.filter((entry) => entry.id !== id);
  writeAll([saved, ...rest]);
  return saved;
}

export function deleteSavedWorksheet(id: string) {
  writeAll(readAll().filter((sheet) => sheet.id !== id));
}
