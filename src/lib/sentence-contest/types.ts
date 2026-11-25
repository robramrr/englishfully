export interface SentenceContestActivity {
  id: string;
  title: string;
  /** Shown on the play screen. Example: "Write a sentence using an adverb of frequency." */
  prompt: string;
  /** How the AI picks a winner. Example: "the funniest sentence". */
  criteria: string;
  /** Highlighted in yellow on the play screen. */
  grammarTarget: string;
  updatedAt: string;
}

export interface SentenceContestListItem {
  id: string;
  title: string;
  prompt: string;
  updated_at: string;
}

export function createSentenceContestId(): string {
  return `contest_${Math.random().toString(36).slice(2, 12)}`;
}

export function createEmptySentenceContest(): SentenceContestActivity {
  return {
    id: createSentenceContestId(),
    title: '',
    prompt: '',
    criteria: '',
    grammarTarget: '',
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeSentenceContest(
  activity: Partial<SentenceContestActivity>
): SentenceContestActivity {
  const base = createEmptySentenceContest();
  return {
    ...base,
    ...activity,
    id: String(activity.id || base.id),
    title: String(activity.title ?? ''),
    prompt: String(activity.prompt ?? ''),
    criteria: String(activity.criteria ?? ''),
    grammarTarget: String(activity.grammarTarget ?? ''),
    updatedAt: String(activity.updatedAt || base.updatedAt),
  };
}

export function sentenceContestName(activity: {
  title?: string;
  prompt?: string;
}): string {
  return activity.title?.trim() || activity.prompt?.trim() || 'Sentence contest';
}
