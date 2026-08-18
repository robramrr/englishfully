export type PresentationSlideLayout =
  | 'title'
  | 'content'
  | 'bullets'
  | 'image'
  | 'audio_image';

export type PresentationChoiceLetter = 'A' | 'B' | 'C' | 'D';

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
    present: { sm: 22, md: 30, lg: 44, xl: 64 },
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
  return {
    id: patch.id || createAudioTrackId(),
    startSeconds,
    endSeconds: Math.max(startSeconds + 0.5, normalizeSeconds(patch.endSeconds, 5)),
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
  /** Definition / explanation — always separate from grammar practice. */
  body: string;
  bullets: string[];
  imageUrl: string;
  imageAlt: string;
  /** Font size for definition / explanation. */
  bodyFontSize: PresentationFontSize;
  /** Theme color for definition / explanation. */
  bodyColor: PresentationFontColor;
  /** Font size for bullets. */
  bulletsFontSize: PresentationFontSize;
  /** Theme color for bullets. */
  bulletsColor: PresentationFontColor;
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

export function createEmptySlide(
  layout: PresentationSlideLayout = 'content'
): PresentationSlide {
  return {
    id: createSlideId(),
    layout,
    title: '',
    body: '',
    bullets: [],
    imageUrl: '',
    imageAlt: '',
    bodyFontSize: 'md',
    bodyColor: 'navy',
    bulletsFontSize: 'md',
    bulletsColor: 'navy',
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
    body: String(slide.body ?? ''),
    bullets: Array.isArray(slide.bullets)
      ? slide.bullets.map((item) => String(item ?? '').trim()).filter(Boolean)
      : [],
    imageUrl: String(slide.imageUrl ?? ''),
    imageAlt: String(slide.imageAlt ?? ''),
    bodyFontSize: normalizeFontSize(slide.bodyFontSize),
    bodyColor: normalizeFontColor(slide.bodyColor),
    bulletsFontSize: normalizeFontSize(slide.bulletsFontSize),
    bulletsColor: normalizeFontColor(slide.bulletsColor),
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
