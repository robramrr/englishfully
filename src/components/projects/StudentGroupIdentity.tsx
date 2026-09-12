'use client';

import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHand } from '@fortawesome/free-solid-svg-icons';
import {
  MAX_PROJECT_GROUP_SIZE,
  type ProjectSubmissionMember,
} from '@/lib/projects/types';
import {
  STUDENT_LETTER_OPTIONS,
  type SpeakClassOption,
  type SpeakEntryConfig,
} from '@/lib/speak-and-submit/types';

export interface IdentityDraft {
  nickname: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  studentLetter: string;
  selectedClassId: string;
  manualClassNumber: string;
}

export function emptyIdentityDraft(selectedClassId = ''): IdentityDraft {
  return {
    nickname: '',
    firstName: '',
    lastName: '',
    studentNumber: '',
    studentLetter: '',
    selectedClassId,
    manualClassNumber: '',
  };
}

function studentNumberOptions(maxStudentNumber: number): string[] {
  return Array.from({ length: maxStudentNumber }, (_, index) => String(index + 1));
}

interface StudentGroupIdentityProps {
  drafts: IdentityDraft[];
  onChange: (drafts: IdentityDraft[]) => void;
  entryConfig: SpeakEntryConfig;
  sortedClasses: SpeakClassOption[];
  usesClassDropdown: boolean;
  usesStudentLetter: boolean;
  error: string;
  checking: boolean;
  onContinue: () => void;
}

export function resolveIdentityMembers(
  drafts: IdentityDraft[],
  options: {
    entryConfig: SpeakEntryConfig;
    sortedClasses: SpeakClassOption[];
    usesClassDropdown: boolean;
    usesStudentLetter: boolean;
  }
): { members: ProjectSubmissionMember[] } | { error: string } {
  const members: ProjectSubmissionMember[] = [];
  const seen = new Set<string>();

  for (const [index, draft] of drafts.entries()) {
    const label = drafts.length === 1 ? 'this student' : `student ${index + 1}`;
    const resolvedName =
      options.entryConfig.name_mode === 'first_last'
        ? `${draft.firstName.trim()} ${draft.lastName.trim()}`.trim()
        : draft.nickname.trim();
    const resolvedClass = options.usesClassDropdown
      ? options.sortedClasses.find((item) => item.id === draft.selectedClassId)?.label ?? ''
      : draft.manualClassNumber.trim();

    if (options.entryConfig.name_mode === 'first_last') {
      if (!draft.firstName.trim() || !draft.lastName.trim()) {
        return { error: `Please enter a first and last name for ${label}.` };
      }
    }
    if (!draft.studentNumber) {
      return { error: `Please select a student number for ${label}.` };
    }
    if (options.usesStudentLetter && !draft.studentLetter) {
      return { error: `Please select A or B for ${label}.` };
    }
    if (!resolvedClass) {
      return {
        error: options.usesClassDropdown
          ? `Please select a class for ${label}.`
          : `Please enter a class for ${label}.`,
      };
    }

    const studentNumber =
      options.usesStudentLetter && draft.studentLetter
        ? `${draft.studentNumber}${draft.studentLetter}`
        : draft.studentNumber;
    const key = `${resolvedClass.toLowerCase()}::${studentNumber}`;
    if (seen.has(key)) {
      return { error: 'The same student was added twice.' };
    }
    seen.add(key);
    members.push({
      student_name: resolvedName,
      student_number: studentNumber,
      class_number: resolvedClass,
    });
  }

  if (members.length === 0) {
    return { error: 'Add at least one student.' };
  }
  if (members.length > MAX_PROJECT_GROUP_SIZE) {
    return { error: `A group can have up to ${MAX_PROJECT_GROUP_SIZE} students.` };
  }

  return { members };
}

export default function StudentGroupIdentity({
  drafts,
  onChange,
  entryConfig,
  sortedClasses,
  usesClassDropdown,
  usesStudentLetter,
  error,
  checking,
  onContinue,
}: StudentGroupIdentityProps) {
  function updateDraft(index: number, patch: Partial<IdentityDraft>) {
    onChange(drafts.map((draft, draftIndex) => (draftIndex === index ? { ...draft, ...patch } : draft)));
  }

  function addStudent() {
    if (drafts.length >= MAX_PROJECT_GROUP_SIZE) return;
    const last = drafts[drafts.length - 1];
    onChange([...drafts, emptyIdentityDraft(last?.selectedClassId ?? '')]);
  }

  function removeStudent(index: number) {
    if (drafts.length === 1) return;
    onChange(drafts.filter((_, draftIndex) => draftIndex !== index));
  }

  return (
    <ComicCard className="comic-shadow-xl">
      <ComicTitle level={6} className="speak-identity-title mb-2 text-[var(--comic-primary)] text-center">
        <span className="inline-flex items-center justify-center gap-2">
          <FontAwesomeIcon icon={faHand} aria-hidden className="h-[0.85em] w-[0.85em]" />
          Who is submitting?
        </span>
      </ComicTitle>
      <ComicText className="text-[var(--comic-dark)] font-bold text-center mb-6">
        Work alone or add up to {MAX_PROJECT_GROUP_SIZE} students. Use the same class and number later
        to open the same work.
      </ComicText>
      <div className="space-y-6">
        {drafts.map((draft, index) => {
          const selectedClass =
            sortedClasses.find((item) => item.id === draft.selectedClassId) ?? null;
          const numberOptions = studentNumberOptions(selectedClass?.max_student_number ?? 35);
          return (
            <div
              key={`member-${index}`}
              className="space-y-3 rounded-lg comic-border bg-white p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <ComicText className="text-[var(--comic-secondary)] font-bold">
                  {drafts.length === 1 ? 'Student' : `Student ${index + 1}`}
                </ComicText>
                {drafts.length > 1 ? (
                  <ComicButton
                    variant="danger"
                    size="sm"
                    onClick={() => removeStudent(index)}
                  >
                    Remove
                  </ComicButton>
                ) : null}
              </div>
              {entryConfig.name_mode === 'first_last' ? (
                <>
                  <input
                    className="w-full comic-input text-lg py-4"
                    placeholder="First name"
                    value={draft.firstName}
                    onChange={(event) => updateDraft(index, { firstName: event.target.value })}
                  />
                  <input
                    className="w-full comic-input text-lg py-4"
                    placeholder="Last name"
                    value={draft.lastName}
                    onChange={(event) => updateDraft(index, { lastName: event.target.value })}
                  />
                </>
              ) : (
                <input
                  className="w-full comic-input text-lg py-4"
                  placeholder="Nickname (optional)"
                  value={draft.nickname}
                  onChange={(event) => updateDraft(index, { nickname: event.target.value })}
                />
              )}
              {usesClassDropdown ? (
                <select
                  className="w-full comic-input text-lg py-4"
                  value={draft.selectedClassId}
                  onChange={(event) => updateDraft(index, { selectedClassId: event.target.value })}
                >
                  <option value="">Select class</option>
                  {sortedClasses.map((classOption) => (
                    <option key={classOption.id} value={classOption.id}>
                      {classOption.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="w-full comic-input text-lg py-4"
                  placeholder="Class"
                  value={draft.manualClassNumber}
                  onChange={(event) => updateDraft(index, { manualClassNumber: event.target.value })}
                />
              )}
              <div className={`grid gap-3 ${usesStudentLetter ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <select
                  className="w-full comic-input text-lg py-4"
                  value={draft.studentNumber}
                  onChange={(event) => updateDraft(index, { studentNumber: event.target.value })}
                >
                  <option value="">#</option>
                  {numberOptions.map((number) => (
                    <option key={number} value={number}>
                      {number}
                    </option>
                  ))}
                </select>
                {usesStudentLetter ? (
                  <select
                    className="w-full comic-input text-lg py-4"
                    value={draft.studentLetter}
                    onChange={(event) =>
                      updateDraft(index, { studentLetter: event.target.value.toUpperCase() })
                    }
                  >
                    <option value="">ID</option>
                    {STUDENT_LETTER_OPTIONS.map((letter) => (
                      <option key={letter} value={letter}>
                        {letter}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            </div>
          );
        })}
        {drafts.length < MAX_PROJECT_GROUP_SIZE ? (
          <ComicButton variant="secondary" className="w-full" onClick={addStudent}>
            Add another student
          </ComicButton>
        ) : null}
        {error ? <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText> : null}
        <ComicButton
          variant="primary"
          size="lg"
          className="w-full"
          disabled={checking}
          onClick={onContinue}
        >
          {checking ? 'Checking…' : 'Continue'}
        </ComicButton>
      </div>
    </ComicCard>
  );
}
