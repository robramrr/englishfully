export type PresentationSlideLayout =
  | 'title'
  | 'content'
  | 'bullets'
  | 'image'
  | 'audio_image'
  | 'describe_image'
  | 'match_text_image'
  | 'fill_blank';

export type PresentationChoiceLetter = 'A' | 'B' | 'C' | 'D';

export interface PresentationDescribeWord {
  id: string;
  text: string;
  /** True = matches the image (green). False = distractor (red). */
  matches: boolean;
}

/** Match text → image: one vocabulary word paired with one image (max 6). */
export interface PresentationMatchPair {
  id: string;
  word: string;
  imageUrl: string;
}

export const MAX_MATCH_PAIRS = 6;

/** Fill-in-the-blank: one sentence with a single hidden word. */
export interface PresentationBlankItem {
  id: string;
  text: string;
  /** Index into the sentence's words. -1 means no blank chosen yet. */
  blankIndex: number;
}

/** One lead-in plus the sentences under it. */
export interface PresentationBlankGroup {
  id: string;
  /** Example heading, e.g. "Past tense of be". The slide title stays separate. */
  heading: string;
  items: PresentationBlankItem[];
}

export const MAX_BLANK_GROUPS = 6;
export const MAX_BLANK_ITEMS = 8;

export const QUIZ_CHOICE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
export const MAX_QUIZ_CHOICES = QUIZ_CHOICE_LETTERS.length;

export interface PresentationQuizChoice {
  id: string;
  text: string;
}

export function createQuizChoiceId(): string {
  return `qc_${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyQuizChoice(
  patch: Partial<PresentationQuizChoice> = {}
): PresentationQuizChoice {
  return {
    id: patch.id || createQuizChoiceId(),
    text: String(patch.text ?? ''),
  };
}

export function normalizeQuizChoices(value: unknown): PresentationQuizChoice[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [createEmptyQuizChoice(), createEmptyQuizChoice()];
  }
  return value.slice(0, MAX_QUIZ_CHOICES).map((item) => {
    if (!item || typeof item !== 'object') return createEmptyQuizChoice();
    const raw = item as Partial<PresentationQuizChoice>;
    return createEmptyQuizChoice({ id: raw.id, text: String(raw.text ?? '') });
  });
}

export function normalizeQuizCorrectIndex(value: unknown, count: number): number {
  const index = Number(value);
  if (!Number.isInteger(index) || index < 0 || index >= count) return 0;
  return index;
}

export function createBlankItemId(): string {
  return `bl_${Math.random().toString(36).slice(2, 10)}`;
}

export function createBlankGroupId(): string {
  return `bg_${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyBlankGroup(
  patch: Partial<PresentationBlankGroup> = {}
): PresentationBlankGroup {
  const items = Array.isArray(patch.items) && patch.items.length > 0
    ? patch.items.map((item) => createEmptyBlankItem(item))
    : [createEmptyBlankItem()];
  return {
    id: patch.id || createBlankGroupId(),
    heading: String(patch.heading ?? ''),
    items,
  };
}

export function createEmptyBlankItem(
  patch: Partial<PresentationBlankItem> = {}
): PresentationBlankItem {
  const blankIndex = Number(patch.blankIndex);
  return {
    id: patch.id || createBlankItemId(),
    text: String(patch.text ?? ''),
    blankIndex: Number.isInteger(blankIndex) ? blankIndex : -1,
  };
}

export function blankTokens(text: string): string[] {
  return String(text ?? '')
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

/** Keep punctuation outside the hidden word so "terrible." becomes a blank plus a period. */
export function splitBlankToken(token: string): {
  leading: string;
  word: string;
  trailing: string;
} {
  const match = token.match(/^([^A-Za-z0-9'-]*)([A-Za-z0-9'-]*)([^A-Za-z0-9'-]*)$/);
  if (!match || !match[2]) return { leading: '', word: token, trailing: '' };
  return { leading: match[1], word: match[2], trailing: match[3] };
}

export type BlankSentencePart =
  | { type: 'text'; value: string }
  | { type: 'blank'; word: string; leading: string; trailing: string };

export function blankSentenceParts(text: string, blankIndex: number): BlankSentencePart[] {
  return blankTokens(text).map((token, index) => {
    if (index !== blankIndex) return { type: 'text', value: token };
    const split = splitBlankToken(token);
    if (!/[A-Za-z0-9]/.test(split.word)) return { type: 'text', value: token };
    return {
      type: 'blank',
      word: split.word,
      leading: split.leading,
      trailing: split.trailing,
    };
  });
}

/** Plain sentence with the chosen word replaced by underscores. */
export function blankSentencePlain(text: string, blankIndex: number): string {
  return blankSentenceParts(text, blankIndex)
    .map((part) => {
      if (part.type === 'text') return part.value;
      return `${part.leading}${'_'.repeat(Math.max(part.word.length, 4))}${part.trailing}`;
    })
    .join(' ');
}

/** Keep the blank on the same word when the sentence is edited. */
export function retargetBlankIndex(
  previousText: string,
  nextText: string,
  blankIndex: number
): number {
  if (blankIndex < 0) return -1;
  const previous = blankTokens(previousText);
  const next = blankTokens(nextText);
  const chosen = previous[blankIndex];
  if (!chosen) return blankIndex < next.length ? blankIndex : -1;
  if (next[blankIndex] === chosen) return blankIndex;
  return next.findIndex((token) => token === chosen);
}

function normalizeBlankItems(value: unknown): PresentationBlankItem[] {
  if (!Array.isArray(value) || value.length === 0) return [createEmptyBlankItem()];
  return value.slice(0, MAX_BLANK_ITEMS).map((item) => {
    if (!item || typeof item !== 'object') return createEmptyBlankItem();
    const raw = item as Partial<PresentationBlankItem>;
    const text = String(raw.text ?? '');
    const tokens = blankTokens(text);
    let blankIndex = Number(raw.blankIndex);
    if (!Number.isInteger(blankIndex) || blankIndex < 0 || blankIndex >= tokens.length) {
      blankIndex = -1;
    }
    return createEmptyBlankItem({ id: raw.id, text, blankIndex });
  });
}

function normalizeBlankGroups(
  groups: unknown,
  legacyItems: unknown
): PresentationBlankGroup[] {
  if (Array.isArray(groups) && groups.length > 0) {
    return groups.slice(0, MAX_BLANK_GROUPS).map((group) => {
      if (!group || typeof group !== 'object') return createEmptyBlankGroup();
      const raw = group as Partial<PresentationBlankGroup>;
      return createEmptyBlankGroup({
        id: raw.id,
        heading: String(raw.heading ?? ''),
        items: normalizeBlankItems(raw.items),
      });
    });
  }
  return [
    createEmptyBlankGroup({
      items: normalizeBlankItems(legacyItems),
    }),
  ];
}

export function createMatchPairId(): string {
  return `mp_${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyMatchPair(
  patch: Partial<PresentationMatchPair> = {}
): PresentationMatchPair {
  return {
    id: patch.id || createMatchPairId(),
    word: String(patch.word ?? '').trim(),
    imageUrl: String(patch.imageUrl ?? '').trim(),
  };
}

function normalizeMatchPairs(value: unknown): PresentationMatchPair[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, MAX_MATCH_PAIRS)
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const raw = item as Partial<PresentationMatchPair>;
      return createEmptyMatchPair({
        id: raw.id,
        word: raw.word,
        imageUrl: raw.imageUrl,
      });
    })
    .filter((item): item is PresentationMatchPair => Boolean(item));
}

export function createDescribeWordId(): string {
  return `dw_${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyDescribeWord(
  patch: Partial<PresentationDescribeWord> = {}
): PresentationDescribeWord {
  return {
    id: patch.id || createDescribeWordId(),
    text: String(patch.text ?? '').trim(),
    matches: patch.matches !== false,
  };
}

function normalizeDescribeWords(value: unknown): PresentationDescribeWord[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const raw = item as Partial<PresentationDescribeWord>;
      const text = String(raw.text ?? '').trim();
      if (!text) return null;
      return createEmptyDescribeWord({
        id: raw.id,
        text,
        matches: raw.matches !== false,
      });
    })
    .filter((item): item is PresentationDescribeWord => Boolean(item));
}

function normalizePositiveInt(value: unknown, fallback: number, max = 50): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(max, n);
}

export const PRESENTATION_CHOICE_LETTERS: PresentationChoiceLetter[] = [
  'A',
  'B',
  'C',
  'D',
];

/** Slide body / bullets type scale. */
export type PresentationFontSize = 'sm' | 'md' | 'lg' | 'xl';

/** Brand navy / red plus readable greys for slide text. */
export type PresentationFontColor = 'navy' | 'red' | 'mediumGray' | 'softGray';

export const PRESENTATION_FONT_SIZES: {
  value: PresentationFontSize;
  label: string;
}[] = [
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'L' },
  { value: 'xl', label: 'XL' },
];

export const PRESENTATION_FONT_COLORS: {
  value: PresentationFontColor;
  label: string;
  cssVar: string;
}[] = [
  { value: 'navy', label: 'Navy', cssVar: 'var(--brand-navy)' },
  { value: 'red', label: 'Red', cssVar: 'var(--brand-red)' },
  { value: 'mediumGray', label: 'Medium grey', cssVar: 'var(--brand-medium-gray)' },
  { value: 'softGray', label: 'Soft grey', cssVar: 'var(--brand-soft-gray)' },
];

export function presentationFontColorCss(
  color: PresentationFontColor | string | undefined
): string {
  const match = PRESENTATION_FONT_COLORS.find((item) => item.value === color);
  return match?.cssVar ?? 'var(--brand-navy)';
}

/** Explicit px sizes so slide text scale always applies (not Tailwind-scanned classes). */
export function presentationFontSizePx(
  size: PresentationFontSize | string | undefined,
  mode: 'compact' | 'default' | 'present'
): number {
  const key: PresentationFontSize =
    size === 'sm' || size === 'lg' || size === 'xl' ? size : 'md';
  const scales = {
    compact: { sm: 10, md: 12, lg: 15, xl: 18 },
    default: { sm: 14, md: 18, lg: 26, xl: 36 },
    // Designed for ~1280×720 present canvas; PresentSlideStage scales the whole slide on TVs.
    present: { sm: 28, md: 40, lg: 56, xl: 76 },
  } as const;
  return scales[mode][key];
}

function normalizeFontSize(value: unknown): PresentationFontSize {
  return value === 'sm' || value === 'lg' || value === 'xl' ? value : 'md';
}

function normalizeFontColor(value: unknown): PresentationFontColor {
  if (value === 'red') return 'red';
  if (value === 'mediumGray' || value === 'gray') return 'mediumGray';
  if (value === 'softGray' || value === 'white') return 'softGray';
  return 'navy';
}

function normalizeChoiceLetter(value: unknown): PresentationChoiceLetter {
  const letter = String(value ?? '')
    .trim()
    .toUpperCase();
  if (letter === 'B' || letter === 'C' || letter === 'D') return letter;
  return 'A';
}

function normalizeChoiceImages(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : [];
  return [0, 1, 2, 3].map((index) => String(raw[index] ?? '').trim());
}

function normalizeSeconds(value: unknown, fallback = 0): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Number(n.toFixed(2));
}

export function createAudioTrackId(): string {
  return `track_${Math.random().toString(36).slice(2, 10)}`;
}

export interface PresentationAudioTrack {
  id: string;
  startSeconds: number;
  endSeconds: number;
  clipText: string;
  correctChoice: PresentationChoiceLetter;
}

export function createEmptyAudioTrack(
  patch: Partial<PresentationAudioTrack> = {}
): PresentationAudioTrack {
  const startSeconds = normalizeSeconds(patch.startSeconds, 0);
  const rawEnd = normalizeSeconds(patch.endSeconds, startSeconds + 5);
  return {
    id: patch.id || createAudioTrackId(),
    startSeconds,
    endSeconds: Math.max(startSeconds + 0.05, rawEnd),
    clipText: String(patch.clipText ?? ''),
    correctChoice: normalizeChoiceLetter(patch.correctChoice),
  };
}

function normalizeAudioTrack(
  track: Partial<PresentationAudioTrack> & { id?: string }
): PresentationAudioTrack {
  return createEmptyAudioTrack(track);
}

/**
 * Prefer audioTracks; fall back to legacy single-clip fields.
 */
export function getPresentationAudioTracks(
  slide: Pick<
    PresentationSlide,
    | 'audioTracks'
    | 'audioStartSeconds'
    | 'audioEndSeconds'
    | 'audioClipText'
    | 'correctChoice'
  >
): PresentationAudioTrack[] {
  if (Array.isArray(slide.audioTracks) && slide.audioTracks.length > 0) {
    return slide.audioTracks.map((track) => normalizeAudioTrack(track));
  }
  return [
    createEmptyAudioTrack({
      id: 'track_legacy',
      startSeconds: slide.audioStartSeconds,
      endSeconds: slide.audioEndSeconds,
      clipText: slide.audioClipText,
      correctChoice: slide.correctChoice,
    }),
  ];
}

/** Keep legacy single-clip fields in sync with the first track. */
export function withSyncedAudioTrackFields(
  patch: Partial<PresentationSlide> & { audioTracks?: PresentationAudioTrack[] }
): Partial<PresentationSlide> {
  const tracks = patch.audioTracks;
  if (!tracks || tracks.length === 0) return patch;
  const first = normalizeAudioTrack(tracks[0]);
  return {
    ...patch,
    audioTracks: tracks.map((track) => normalizeAudioTrack(track)),
    audioStartSeconds: first.startSeconds,
    audioEndSeconds: first.endSeconds,
    audioClipText: first.clipText,
    correctChoice: first.correctChoice,
  };
}

export interface PresentationSlide {
  id: string;
  layout: PresentationSlideLayout;
  title: string;
  /** When false, title is hidden on the slide (editor fields still keep the text). */
  showTitle: boolean;
  /** Definition / explanation — always separate from grammar practice. */
  body: string;
  /** When false, definition/body text is hidden on the slide. */
  showBody: boolean;
  bullets: string[];
  imageUrl: string;
  /** Visible image title. Also used as the image alt text. */
  imageAlt: string;
  /** Text + image: show this image's title under the picture. */
  showImageTitle: boolean;
  /** Text + image: optional line under the image title. */
  imageSubtitle: string;
  /** Text + image: show this image's subtitle under the picture. */
  showImageSubtitle: boolean;
  /** Text + image: optional second image (2+ images → row below text). */
  imageUrl2: string;
  imageAlt2: string;
  showImageTitle2: boolean;
  imageSubtitle2: string;
  showImageSubtitle2: boolean;
  /** Text + image: optional third image. */
  imageUrl3: string;
  imageAlt3: string;
  showImageTitle3: boolean;
  imageSubtitle3: string;
  showImageSubtitle3: boolean;
  /** Text + image: optional fourth image (4 images → 2×2 grid). */
  imageUrl4: string;
  imageAlt4: string;
  showImageTitle4: boolean;
  imageSubtitle4: string;
  showImageSubtitle4: boolean;
  /** Font size for definition / explanation. */
  bodyFontSize: PresentationFontSize;
  /** Theme color for definition / explanation. */
  bodyColor: PresentationFontColor;
  /** Font size for bullets. */
  bulletsFontSize: PresentationFontSize;
  /** Theme color for bullets. */
  bulletsColor: PresentationFontColor;
  /** Text + image: optional table in the right column (heading row on top). */
  tableEnabled: boolean;
  /** Heading / top row cells. */
  tableHeaders: string[];
  /** Body rows (each row matches header column count). */
  tableRows: string[][];
  tableFontSize: PresentationFontSize;
  tableColor: PresentationFontColor;
  /** Text + image only: show a separate practice box with yellow grammar highlights. */
  grammarHighlighterEnabled: boolean;
  /** e.g. "Possessive Adjectives" */
  grammarTarget: string;
  /** Practice text for the grammar highlighter box (not the definition). */
  grammarText: string;
  /** When true, grammarPlaceholder replaces the default "Example..." hint. */
  grammarCustomPlaceholderEnabled: boolean;
  /** Multi-line custom placeholder (e.g. sentence frames). */
  grammarPlaceholder: string;
  /** Audio + image: full audio URL (same pattern as Listen & Learn). */
  audioUrl: string;
  /**
   * One or more clips from the same audio URL. Images stay shared;
   * each track has its own correct letter.
   */
  audioTracks: PresentationAudioTrack[];
  /** @deprecated Synced from audioTracks[0] for older decks / exports. */
  audioStartSeconds: number;
  /** @deprecated Synced from audioTracks[0]. */
  audioEndSeconds: number;
  /** Optional transcript text for the clip editor. */
  audioTranscript: string;
  /** @deprecated Synced from audioTracks[0]. */
  audioClipText: string;
  /** Choice image URLs for A–D (empty string = unused slot). Shared across tracks. */
  choiceImages: string[];
  /** @deprecated Synced from audioTracks[0]. */
  correctChoice: PresentationChoiceLetter;
  /** Describe + image: word bank (matches + distractors). */
  describeWords: PresentationDescribeWord[];
  /** How many matching words students must find to complete. */
  describeWordsNeeded: number;
  /** Match text → image: up to 6 word/image pairs. */
  matchPairs: PresentationMatchPair[];
  /** Fill in the blank: lead-in groups, each with its own sentences. */
  blankGroups: PresentationBlankGroup[];
  /** Older decks stored one flat sentence list. Kept so those slides still load. */
  blankItems: PresentationBlankItem[];
  /** When true, each fill-in sentence shows a bullet. */
  blankBullets: boolean;
  /** Optional multiple choice shown on any slide. */
  quizEnabled: boolean;
  /** Optional question above the choices. Leave blank when the slide already asks it. */
  quizPrompt: string;
  quizChoices: PresentationQuizChoice[];
  /** Index of the correct choice. */
  quizCorrectIndex: number;
  /** Font size for the multiple-choice prompt and choices. */
  quizFontSize: PresentationFontSize;
  /** Theme color for the multiple-choice prompt and choices. */
  quizColor: PresentationFontColor;
  /**
   * Optional countdown on any slide (think / speak / activity time).
   * Started from present mode.
   */
  timerEnabled: boolean;
  /** Countdown length in seconds when timer is on. */
  timerSeconds: number;
  /** @deprecated Migrated into timerEnabled. */
  describeTimerEnabled?: boolean;
  /** @deprecated Migrated into timerSeconds. */
  describeTimerSeconds?: number;
}

/** Pairs ready to play (both word and image filled). */
export function getFilledMatchPairs(
  slide: Pick<PresentationSlide, 'matchPairs'>
): PresentationMatchPair[] {
  return (slide.matchPairs || []).filter(
    (pair) => pair.word.trim() && pair.imageUrl.trim()
  );
}

export type PresentationStatus = 'draft' | 'published';

export interface PresentationDeck {
  id: string;
  /** Small banner/logo line on the title slide (default Englishfully). */
  brandLabel: string;
  title: string;
  subtitle: string;
  status: PresentationStatus;
  slides: PresentationSlide[];
  updatedAt: string;
}

export const DEFAULT_BRAND_LABEL = 'Englishfully';

export interface PresentationListItem {
  id: string;
  title: string;
  brand_label: string;
  status: PresentationStatus;
  slide_count: number;
  updated_at: string;
}

export function createSlideId(): string {
  return `slide_${Math.random().toString(36).slice(2, 10)}`;
}

export function createDeckId(): string {
  return `deck_${Math.random().toString(36).slice(2, 10)}`;
}

export const MAX_CONTENT_IMAGES = 4;

export interface ContentSlideImage {
  url: string;
  /** Visible title. Also used as the image alt text. */
  title: string;
  showTitle: boolean;
  subtitle: string;
  showSubtitle: boolean;
}

export interface ContentSlideImageView extends ContentSlideImage {
  alt: string;
}

const CONTENT_IMAGE_KEYS = [
  {
    url: 'imageUrl',
    title: 'imageAlt',
    showTitle: 'showImageTitle',
    subtitle: 'imageSubtitle',
    showSubtitle: 'showImageSubtitle',
  },
  {
    url: 'imageUrl2',
    title: 'imageAlt2',
    showTitle: 'showImageTitle2',
    subtitle: 'imageSubtitle2',
    showSubtitle: 'showImageSubtitle2',
  },
  {
    url: 'imageUrl3',
    title: 'imageAlt3',
    showTitle: 'showImageTitle3',
    subtitle: 'imageSubtitle3',
    showSubtitle: 'showImageSubtitle3',
  },
  {
    url: 'imageUrl4',
    title: 'imageAlt4',
    showTitle: 'showImageTitle4',
    subtitle: 'imageSubtitle4',
    showSubtitle: 'showImageSubtitle4',
  },
] as const;

const EMPTY_CONTENT_IMAGE: ContentSlideImage = {
  url: '',
  title: '',
  showTitle: true,
  subtitle: '',
  showSubtitle: true,
};

export function readContentSlideImages(
  slide: Partial<PresentationSlide>
): ContentSlideImage[] {
  return CONTENT_IMAGE_KEYS.map((keys) => ({
    url: String(slide[keys.url] ?? '').trim(),
    title: String(slide[keys.title] ?? ''),
    showTitle: slide[keys.showTitle] !== false,
    subtitle: String(slide[keys.subtitle] ?? ''),
    showSubtitle: slide[keys.showSubtitle] !== false,
  }));
}

export function contentImagesToSlidePatch(
  images: ContentSlideImage[]
): Pick<
  PresentationSlide,
  | 'imageUrl'
  | 'imageAlt'
  | 'showImageTitle'
  | 'imageSubtitle'
  | 'showImageSubtitle'
  | 'imageUrl2'
  | 'imageAlt2'
  | 'showImageTitle2'
  | 'imageSubtitle2'
  | 'showImageSubtitle2'
  | 'imageUrl3'
  | 'imageAlt3'
  | 'showImageTitle3'
  | 'imageSubtitle3'
  | 'showImageSubtitle3'
  | 'imageUrl4'
  | 'imageAlt4'
  | 'showImageTitle4'
  | 'imageSubtitle4'
  | 'showImageSubtitle4'
> {
  const padded = Array.from({ length: MAX_CONTENT_IMAGES }, (_, index) => ({
    ...EMPTY_CONTENT_IMAGE,
    ...(images[index] ?? {}),
  }));
  return {
    imageUrl: padded[0].url.trim(),
    imageAlt: padded[0].title,
    showImageTitle: padded[0].showTitle,
    imageSubtitle: padded[0].subtitle,
    showImageSubtitle: padded[0].showSubtitle,
    imageUrl2: padded[1].url.trim(),
    imageAlt2: padded[1].title,
    showImageTitle2: padded[1].showTitle,
    imageSubtitle2: padded[1].subtitle,
    showImageSubtitle2: padded[1].showSubtitle,
    imageUrl3: padded[2].url.trim(),
    imageAlt3: padded[2].title,
    showImageTitle3: padded[2].showTitle,
    imageSubtitle3: padded[2].subtitle,
    showImageSubtitle3: padded[2].showSubtitle,
    imageUrl4: padded[3].url.trim(),
    imageAlt4: padded[3].title,
    showImageTitle4: padded[3].showTitle,
    imageSubtitle4: padded[3].subtitle,
    showImageSubtitle4: padded[3].showSubtitle,
  };
}

export function getContentSlideImages(
  slide: Partial<PresentationSlide>,
  titleFallback = ''
): ContentSlideImageView[] {
  return readContentSlideImages(slide)
    .filter((item) => item.url)
    .map((item) => ({
      ...item,
      alt: item.title.trim() || titleFallback,
    }));
}

export function countFilledContentImages(slide: Partial<PresentationSlide>): number {
  return readContentSlideImages(slide).filter((item) => item.url).length;
}

/** Keep blank lines for extra vertical spacing (including before the first bullet). */
export function normalizeBulletsKeepGaps(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const mapped = value.map((item) => String(item ?? '').trim());
  // Drop only trailing empties from the textarea end — keep leading gaps for top spacing.
  while (mapped.length > 0 && mapped[mapped.length - 1] === '') mapped.pop();
  return mapped;
}

const DEFAULT_TABLE_COLS = 2;
const DEFAULT_TABLE_ROWS = 2;
const MAX_TABLE_COLS = 6;
const MAX_TABLE_ROWS = 12;

export function createEmptyTableHeaders(cols = DEFAULT_TABLE_COLS): string[] {
  return Array.from({ length: Math.max(1, cols) }, () => '');
}

export function createEmptyTableRows(
  rows = DEFAULT_TABLE_ROWS,
  cols = DEFAULT_TABLE_COLS
): string[][] {
  return Array.from({ length: Math.max(1, rows) }, () =>
    createEmptyTableHeaders(cols)
  );
}

function normalizeTableHeaders(value: unknown, fallbackCols = DEFAULT_TABLE_COLS): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    return createEmptyTableHeaders(fallbackCols);
  }
  return value
    .slice(0, MAX_TABLE_COLS)
    .map((cell) => String(cell ?? ''));
}

function normalizeTableRows(
  value: unknown,
  cols: number
): string[][] {
  const width = Math.max(1, Math.min(MAX_TABLE_COLS, cols));
  if (!Array.isArray(value) || value.length === 0) {
    return createEmptyTableRows(DEFAULT_TABLE_ROWS, width);
  }
  return value.slice(0, MAX_TABLE_ROWS).map((row) => {
    const cells = Array.isArray(row) ? row.map((cell) => String(cell ?? '')) : [];
    while (cells.length < width) cells.push('');
    return cells.slice(0, width);
  });
}

export function createEmptySlide(
  layout: PresentationSlideLayout = 'content'
): PresentationSlide {
  return {
    id: createSlideId(),
    layout,
    title: '',
    showTitle: true,
    body: '',
    showBody: true,
    bullets: [],
    imageUrl: '',
    imageAlt: '',
    showImageTitle: true,
    imageSubtitle: '',
    showImageSubtitle: true,
    imageUrl2: '',
    imageAlt2: '',
    showImageTitle2: true,
    imageSubtitle2: '',
    showImageSubtitle2: true,
    imageUrl3: '',
    imageAlt3: '',
    showImageTitle3: true,
    imageSubtitle3: '',
    showImageSubtitle3: true,
    imageUrl4: '',
    imageAlt4: '',
    showImageTitle4: true,
    imageSubtitle4: '',
    showImageSubtitle4: true,
    bodyFontSize: 'md',
    bodyColor: 'navy',
    bulletsFontSize: 'md',
    bulletsColor: 'navy',
    tableEnabled: false,
    tableHeaders: createEmptyTableHeaders(),
    tableRows: createEmptyTableRows(),
    tableFontSize: 'md',
    tableColor: 'navy',
    grammarHighlighterEnabled: false,
    grammarTarget: '',
    grammarText: '',
    grammarCustomPlaceholderEnabled: false,
    grammarPlaceholder: '',
    audioUrl: '',
    audioTracks: [createEmptyAudioTrack()],
    audioStartSeconds: 0,
    audioEndSeconds: 5,
    audioTranscript: '',
    audioClipText: '',
    choiceImages: ['', '', '', ''],
    correctChoice: 'A',
    describeWords: [],
    describeWordsNeeded: 10,
    matchPairs: [],
    blankGroups: [createEmptyBlankGroup()],
    blankItems: [createEmptyBlankItem()],
    blankBullets: false,
    quizEnabled: false,
    quizPrompt: '',
    quizChoices: [createEmptyQuizChoice(), createEmptyQuizChoice()],
    quizCorrectIndex: 0,
    quizFontSize: 'sm',
    quizColor: 'navy',
    timerEnabled: false,
    timerSeconds: 60,
  };
}

export function normalizeSlide(
  slide: Partial<PresentationSlide> & { id?: string }
): PresentationSlide {
  const base = createEmptySlide(
    (slide.layout as PresentationSlideLayout) || 'content'
  );
  const tracks = getPresentationAudioTracks({
    audioTracks: Array.isArray(slide.audioTracks) ? slide.audioTracks : [],
    audioStartSeconds: slide.audioStartSeconds ?? base.audioStartSeconds,
    audioEndSeconds: slide.audioEndSeconds ?? base.audioEndSeconds,
    audioClipText: slide.audioClipText ?? base.audioClipText,
    correctChoice: slide.correctChoice ?? base.correctChoice,
  });
  const first = tracks[0];
  return {
    ...base,
    ...slide,
    id: slide.id || base.id,
    layout: (slide.layout as PresentationSlideLayout) || base.layout,
    title: String(slide.title ?? ''),
    showTitle: slide.showTitle !== false,
    body: String(slide.body ?? ''),
    showBody: slide.showBody !== false,
    bullets: Array.isArray(slide.bullets)
      ? normalizeBulletsKeepGaps(slide.bullets)
      : [],
    imageUrl: String(slide.imageUrl ?? ''),
    imageAlt: String(slide.imageAlt ?? ''),
    showImageTitle: slide.showImageTitle !== false,
    imageSubtitle: String(slide.imageSubtitle ?? ''),
    showImageSubtitle: slide.showImageSubtitle !== false,
    imageUrl2: String(slide.imageUrl2 ?? ''),
    imageAlt2: String(slide.imageAlt2 ?? ''),
    showImageTitle2: slide.showImageTitle2 !== false,
    imageSubtitle2: String(slide.imageSubtitle2 ?? ''),
    showImageSubtitle2: slide.showImageSubtitle2 !== false,
    imageUrl3: String(slide.imageUrl3 ?? ''),
    imageAlt3: String(slide.imageAlt3 ?? ''),
    showImageTitle3: slide.showImageTitle3 !== false,
    imageSubtitle3: String(slide.imageSubtitle3 ?? ''),
    showImageSubtitle3: slide.showImageSubtitle3 !== false,
    imageUrl4: String(slide.imageUrl4 ?? ''),
    imageAlt4: String(slide.imageAlt4 ?? ''),
    showImageTitle4: slide.showImageTitle4 !== false,
    imageSubtitle4: String(slide.imageSubtitle4 ?? ''),
    showImageSubtitle4: slide.showImageSubtitle4 !== false,
    bodyFontSize: normalizeFontSize(slide.bodyFontSize),
    bodyColor: normalizeFontColor(slide.bodyColor),
    bulletsFontSize: normalizeFontSize(slide.bulletsFontSize),
    bulletsColor: normalizeFontColor(slide.bulletsColor),
    tableEnabled: Boolean(slide.tableEnabled),
    tableHeaders: normalizeTableHeaders(slide.tableHeaders),
    tableRows: normalizeTableRows(
      slide.tableRows,
      normalizeTableHeaders(slide.tableHeaders).length
    ),
    tableFontSize: normalizeFontSize(slide.tableFontSize),
    tableColor: normalizeFontColor(slide.tableColor),
    grammarHighlighterEnabled: Boolean(slide.grammarHighlighterEnabled),
    grammarTarget: String(slide.grammarTarget ?? ''),
    grammarText: String(slide.grammarText ?? ''),
    grammarCustomPlaceholderEnabled: Boolean(slide.grammarCustomPlaceholderEnabled),
    grammarPlaceholder: String(slide.grammarPlaceholder ?? ''),
    audioUrl: String(slide.audioUrl ?? ''),
    audioTracks: tracks,
    audioStartSeconds: first.startSeconds,
    audioEndSeconds: first.endSeconds,
    audioTranscript: String(slide.audioTranscript ?? ''),
    audioClipText: first.clipText,
    choiceImages: normalizeChoiceImages(slide.choiceImages),
    correctChoice: first.correctChoice,
    describeWords: normalizeDescribeWords(slide.describeWords),
    describeWordsNeeded: normalizePositiveInt(slide.describeWordsNeeded, 10),
    matchPairs: normalizeMatchPairs(slide.matchPairs),
    blankGroups: normalizeBlankGroups(slide.blankGroups, slide.blankItems),
    blankItems: normalizeBlankItems(slide.blankItems),
    blankBullets: Boolean(slide.blankBullets),
    quizEnabled: Boolean(slide.quizEnabled),
    quizPrompt: String(slide.quizPrompt ?? ''),
    quizChoices: normalizeQuizChoices(slide.quizChoices),
    quizCorrectIndex: normalizeQuizCorrectIndex(
      slide.quizCorrectIndex,
      normalizeQuizChoices(slide.quizChoices).length
    ),
    quizFontSize:
      slide.quizFontSize === 'sm' ||
      slide.quizFontSize === 'md' ||
      slide.quizFontSize === 'lg' ||
      slide.quizFontSize === 'xl'
        ? slide.quizFontSize
        : 'sm',
    quizColor: normalizeFontColor(slide.quizColor),
    timerEnabled: Boolean(
      slide.timerEnabled ?? slide.describeTimerEnabled ?? false
    ),
    timerSeconds: normalizePositiveInt(
      slide.timerSeconds ?? slide.describeTimerSeconds,
      60,
      600
    ),
  };
}

export function createEmptyDeck(): PresentationDeck {
  return {
    id: createDeckId(),
    brandLabel: DEFAULT_BRAND_LABEL,
    title: '',
    subtitle: '',
    status: 'draft',
    slides: [
      {
        ...createEmptySlide('title'),
        title: '',
        body: '',
      },
      createEmptySlide('content'),
    ],
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeDeck(deck: Partial<PresentationDeck>): PresentationDeck {
  const base = createEmptyDeck();
  const status: PresentationStatus =
    deck.status === 'published' ? 'published' : 'draft';
  return {
    ...base,
    ...deck,
    id: String(deck.id || base.id),
    brandLabel: String(deck.brandLabel ?? DEFAULT_BRAND_LABEL).trim() || DEFAULT_BRAND_LABEL,
    title: String(deck.title ?? ''),
    subtitle: String(deck.subtitle ?? ''),
    status,
    slides: Array.isArray(deck.slides)
      ? deck.slides.map((slide) => normalizeSlide(slide))
      : base.slides,
    updatedAt: String(deck.updatedAt || base.updatedAt),
  };
}
