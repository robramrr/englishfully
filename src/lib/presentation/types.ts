export type PresentationSlideLayout =
  | 'title'
  | 'content'
  | 'bullets'
  | 'image'
  | 'audio_image'
  | 'describe_image';

export type PresentationChoiceLetter = 'A' | 'B' | 'C' | 'D';

export interface PresentationDescribeWord {
  id: string;
  text: string;
  /** True = matches the image (green). False = distractor (red). */
  matches: boolean;
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
  imageAlt: string;
  /** Text + image: optional second image (2+ images → row below text). */
  imageUrl2: string;
  imageAlt2: string;
  /** Text + image: optional third image. */
  imageUrl3: string;
  imageAlt3: string;
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

export function getContentSlideImages(
  slide: Pick<
    PresentationSlide,
    'imageUrl' | 'imageAlt' | 'imageUrl2' | 'imageAlt2' | 'imageUrl3' | 'imageAlt3'
  >,
  titleFallback = ''
): { url: string; alt: string }[] {
  return [
    { url: slide.imageUrl, alt: slide.imageAlt },
    { url: slide.imageUrl2, alt: slide.imageAlt2 },
    { url: slide.imageUrl3, alt: slide.imageAlt3 },
  ]
    .map((item) => {
      const url = String(item.url ?? '').trim();
      if (!url) return null;
      return {
        url,
        alt: String(item.alt ?? '').trim() || titleFallback,
      };
    })
    .filter((item): item is { url: string; alt: string } => Boolean(item));
}

export function countFilledContentImages(
  slide: Pick<PresentationSlide, 'imageUrl' | 'imageUrl2' | 'imageUrl3'>
): number {
  return [slide.imageUrl, slide.imageUrl2, slide.imageUrl3].filter((url) =>
    String(url ?? '').trim()
  ).length;
}

/** Keep blank lines between bullets for extra vertical spacing; drop only edge empties. */
export function normalizeBulletsKeepGaps(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const mapped = value.map((item) => String(item ?? '').trim());
  while (mapped.length > 0 && mapped[0] === '') mapped.shift();
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
    imageUrl2: '',
    imageAlt2: '',
    imageUrl3: '',
    imageAlt3: '',
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
    imageUrl2: String(slide.imageUrl2 ?? ''),
    imageAlt2: String(slide.imageAlt2 ?? ''),
    imageUrl3: String(slide.imageUrl3 ?? ''),
    imageAlt3: String(slide.imageAlt3 ?? ''),
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
