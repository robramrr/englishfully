import {
  createEmptyDeck,
  createEmptySlide,
  createSlideId,
  type PresentationDeck,
  type PresentationSlide,
  type PresentationSlideLayout,
} from './types';

function isImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  if (/\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(trimmed)) return true;
  if (/images?\.|img\.|cdn\.|cloudinary|unsplash|imgur/i.test(trimmed)) return true;
  return false;
}

function stripBullet(line: string): string {
  return line.replace(/^\s*(?:[-*•–—]|\d+[.)])\s+/, '').trim();
}

function looksLikeBullet(line: string): boolean {
  return /^\s*(?:[-*•–—]|\d+[.)])\s+\S/.test(line);
}

function parseSlideChunk(chunk: string, index: number): PresentationSlide {
  const lines = chunk
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let title = '';
  let body = '';
  const bullets: string[] = [];
  let imageUrl = '';
  const bodyParts: string[] = [];

  for (const line of lines) {
    if (!title && /^(#{1,3}\s+|slide\s*\d+\s*[:.-]\s*)/i.test(line)) {
      title = line
        .replace(/^#{1,3}\s+/, '')
        .replace(/^slide\s*\d+\s*[:.-]\s*/i, '')
        .trim();
      continue;
    }

    if (isImageUrl(line)) {
      imageUrl = line;
      continue;
    }

    if (looksLikeBullet(line)) {
      bullets.push(stripBullet(line));
      continue;
    }

    if (!title) {
      title = line;
      continue;
    }

    bodyParts.push(line);
  }

  body = bodyParts.join('\n\n').trim();

  let layout: PresentationSlideLayout = 'content';
  if (index === 0 && !imageUrl && bullets.length === 0) {
    layout = 'title';
  } else if (bullets.length > 0 && !body && !imageUrl) {
    layout = 'bullets';
  } else if (imageUrl && !body && bullets.length === 0) {
    layout = 'image';
  } else if (imageUrl || body) {
    layout = 'content';
  } else if (bullets.length > 0) {
    layout = 'bullets';
  }

  return {
    ...createEmptySlide(layout),
    id: createSlideId(),
    layout,
    title,
    body,
    bullets,
    imageUrl,
    imageAlt: title ? `${title} image` : '',
  };
}

/**
 * Turn pasted lesson notes into a clean deck:
 * - blank-line / --- / "Slide N" blocks become slides
 * - first line → title, bullets → list, image URLs → media
 */
export function structurePastedContent(raw: string): PresentationDeck {
  const text = raw.replace(/\u00a0/g, ' ').trim();
  if (!text) return createEmptyDeck();

  const chunks = text
    .split(/\n\s*(?:---+|===+|\*{3,})\s*\n|\n(?=\s*(?:#{1,3}\s+|slide\s*\d+\s*[:.-]))/i)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  // Fallback: paragraph groups split by blank lines
  const blocks =
    chunks.length > 1
      ? chunks
      : text
          .split(/\n\s*\n+/)
          .map((chunk) => chunk.trim())
          .filter(Boolean);

  const slides = blocks.map((chunk, index) => parseSlideChunk(chunk, index));

  // Deck title/subtitle from first title slide when possible
  const first = slides[0];
  let deckTitle = '';
  let deckSubtitle = '';

  if (first?.layout === 'title') {
    deckTitle = first.title;
    deckSubtitle = first.body.split('\n')[0]?.trim() || '';
    if (deckSubtitle && first.body.includes('\n')) {
      first.body = first.body.split('\n').slice(1).join('\n').trim();
    } else if (deckSubtitle && !first.body.includes('\n')) {
      // subtitle lives on the title slide body as single line
    }
  } else if (first) {
    deckTitle = first.title || 'Untitled presentation';
  }

  // Ensure title slide at front mirrors deck meta
  if (slides[0]?.layout === 'title') {
    slides[0] = {
      ...slides[0],
      title: deckTitle || slides[0].title,
      body: deckSubtitle || slides[0].body,
    };
  } else {
    slides.unshift({
      ...createEmptySlide('title'),
      title: deckTitle || 'Untitled presentation',
      body: deckSubtitle,
    });
  }

  // Guarantee at least one content slide after title
  if (slides.length === 1) {
    slides.push(createEmptySlide('content'));
  }

  return {
    id: createEmptyDeck().id,
    title: deckTitle || 'Untitled presentation',
    subtitle: deckSubtitle,
    slides,
    updatedAt: new Date().toISOString(),
  };
}

export function cleanSlideText(value: string): string {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
