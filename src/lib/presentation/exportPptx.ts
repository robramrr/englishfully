import 'server-only';
import PptxGenJS from 'pptxgenjs';
import type {
  PresentationDeck,
  PresentationFontColor,
  PresentationFontSize,
} from './types';
import { getContentSlideImages } from './types';

const NAVY = '001a48';
const RED = 'EA1225';
const GRAY = 'E5E5E4';
const WHITE = 'FFFFFF';

function pptxFontColor(color: PresentationFontColor | undefined): string {
  if (color === 'red') return RED;
  if (color === 'mediumGray') return '3F4A5C';
  if (color === 'softGray') return '6B7588';
  return NAVY;
}

function pptxFontSize(size: PresentationFontSize | undefined, base = 18): number {
  if (size === 'sm') return Math.max(12, base - 4);
  if (size === 'lg') return base + 6;
  if (size === 'xl') return base + 14;
  return base;
}

export function presentationPptxFilename(deck: PresentationDeck): string {
  return `${(deck.title || 'presentation').replace(/[^\w.-]+/g, '_').slice(0, 80)}.pptx`;
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

/** Build a PowerPoint file on the server (pptxgenjs is Node-only). */
export async function buildPresentationPptxBuffer(
  deck: PresentationDeck
): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'EF_WIDE', width: 13.333, height: 7.5 });
  pptx.layout = 'EF_WIDE';
  pptx.author = 'Englishfully';
  pptx.title = deck.title || 'Presentation';

  for (const slide of deck.slides) {
    const page = pptx.addSlide();
    page.background = { color: WHITE };

    page.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.333,
      h: 0.18,
      fill: { color: RED },
      line: { color: RED },
    });

    if (slide.layout === 'title') {
      page.addText(deck.brandLabel?.trim() || 'Englishfully', {
        x: 0.7,
        y: 2.0,
        w: 12,
        h: 0.5,
        fontSize: 16,
        bold: true,
        color: RED,
        fontFace: 'Arial',
      });
      if (slide.showTitle !== false) {
        page.addText(slide.title || deck.title || 'Presentation', {
          x: 0.7,
          y: 2.6,
          w: 12,
          h: 1.2,
          fontSize: 40,
          bold: true,
          color: NAVY,
          fontFace: 'Arial',
        });
      }
      const subtitle = slide.body || deck.subtitle;
      if (slide.showBody !== false && subtitle) {
        page.addText(subtitle, {
          x: 0.7,
          y: 4.0,
          w: 12,
          h: 1,
          fontSize: 22,
          bold: true,
          color: NAVY,
          fontFace: 'Arial',
        });
      }
    } else if (slide.layout === 'audio_image') {
      let y = 0.45;
      if (slide.showTitle !== false) {
        page.addText(slide.title || 'Listen and choose', {
          x: 0.6,
          y,
          w: 12.1,
          h: 0.7,
          fontSize: 28,
          bold: true,
          color: NAVY,
          fontFace: 'Arial',
        });
        y = 1.25;
      }
      if (slide.showBody !== false && slide.body.trim()) {
        page.addText(slide.body, {
          x: 0.6,
          y,
          w: 12.1,
          h: 0.6,
          fontSize: 16,
          bold: true,
          color: NAVY,
          fontFace: 'Arial',
        });
        y += 0.7;
      }
      page.addText(
        `Audio${slide.audioUrl ? '' : ' (missing URL)'} · ${
          (slide.audioTracks?.length || 1) > 1
            ? `${slide.audioTracks.length} tracks`
            : `${Number(slide.audioStartSeconds).toFixed(1)}s–${Number(
                slide.audioEndSeconds
              ).toFixed(1)}s`
        } · Correct: ${
          (slide.audioTracks || [])
            .map((track, i) => `T${i + 1}=${track.correctChoice}`)
            .join(', ') || slide.correctChoice
        }`,
        {
          x: 0.6,
          y,
          w: 12.1,
          h: 0.4,
          fontSize: 14,
          bold: true,
          color: NAVY,
          fontFace: 'Arial',
        }
      );
      y += 0.55;
      const choiceW = 2.8;
      const gap = 0.25;
      for (let i = 0; i < 4; i += 1) {
        const url = String(slide.choiceImages?.[i] ?? '').trim();
        if (!url) continue;
        const letter = ['A', 'B', 'C', 'D'][i];
        const x = 0.6 + i * (choiceW + gap);
        page.addText(`${letter}${slide.correctChoice === letter ? ' ✓' : ''}`, {
          x,
          y,
          w: choiceW,
          h: 0.35,
          fontSize: 14,
          bold: true,
          color: NAVY,
          fontFace: 'Arial',
        });
        const imageData = await fetchImageAsBase64(url);
        if (imageData) {
          page.addImage({
            data: imageData,
            x,
            y: y + 0.4,
            w: choiceW,
            h: 2.8,
          });
        }
      }
    } else if (slide.layout === 'describe_image') {
      let y = 0.45;
      if (slide.showTitle !== false) {
        page.addText(slide.title || 'Describe the image', {
          x: 0.6,
          y,
          w: 12.1,
          h: 0.7,
          fontSize: 28,
          bold: true,
          color: NAVY,
          fontFace: 'Arial',
        });
        y = 1.25;
      }
      if (slide.showBody !== false && slide.body.trim()) {
        page.addText(slide.body, {
          x: 0.6,
          y,
          w: slide.imageUrl.trim() ? 6.8 : 12.1,
          h: 0.6,
          fontSize: 16,
          bold: true,
          color: NAVY,
          fontFace: 'Arial',
        });
        y += 0.7;
      }
      page.addText(
        `Find ${slide.describeWordsNeeded || 10} matching words${
          slide.timerEnabled
            ? ` · ${slide.timerSeconds || 60}s timer`
            : ''
        }`,
        {
          x: 0.6,
          y,
          w: slide.imageUrl.trim() ? 6.8 : 12.1,
          h: 0.4,
          fontSize: 14,
          bold: true,
          color: NAVY,
          fontFace: 'Arial',
        }
      );
      y += 0.5;
      const wordLine = (slide.describeWords || [])
        .map((word) => `${word.text}${word.matches ? '' : ' (×)'}`)
        .join(', ');
      if (wordLine) {
        page.addText(wordLine, {
          x: 0.6,
          y,
          w: slide.imageUrl.trim() ? 6.8 : 12.1,
          h: 2.4,
          fontSize: 16,
          bold: true,
          color: NAVY,
          fontFace: 'Arial',
          valign: 'top',
        });
      }
      if (slide.imageUrl.trim()) {
        const imageData = await fetchImageAsBase64(slide.imageUrl);
        if (imageData) {
          page.addImage({
            data: imageData,
            x: 7.6,
            y: 1.25,
            w: 5.1,
            h: 4.2,
          });
        }
      }
    } else {
      const contentImages =
        slide.layout === 'content' ? getContentSlideImages(slide) : [];
      const multiImages = contentImages.length >= 2;
      const sideImage =
        !multiImages &&
        (contentImages.length === 1 ||
          Boolean(slide.imageUrl.trim() || String(slide.imageUrl2 ?? '').trim()));
      const textWidth = sideImage ? 6.8 : 12.1;
      const showTitle = slide.showTitle !== false;
      const showBody = slide.showBody !== false;

      let y = 0.45;
      if (showTitle) {
        page.addText(slide.title || 'Untitled slide', {
          x: 0.6,
          y,
          w: 12.1,
          h: 0.7,
          fontSize: 28,
          bold: true,
          color: NAVY,
          fontFace: 'Arial',
        });
        y = 1.35;
      }

      if (showBody && slide.body.trim()) {
        page.addText(slide.body, {
          x: 0.6,
          y,
          w: textWidth,
          h: multiImages ? 1.5 : 2.2,
          fontSize: pptxFontSize(slide.bodyFontSize, 18),
          bold: true,
          color: pptxFontColor(slide.bodyColor),
          fontFace: 'Arial',
          valign: 'top',
        });
        y += multiImages ? 1.6 : 2.3;
      }

      const bullets = slide.bullets.filter((item) => item.trim());
      if (bullets.length > 0) {
        page.addText(
          bullets.map((item) => ({ text: item, options: { bullet: true } })),
          {
            x: 0.6,
            y,
            w: textWidth,
            h: Math.min(multiImages ? 1.4 : 2.8, bullets.length * 0.45 + 0.3),
            fontSize: pptxFontSize(slide.bulletsFontSize, 18),
            bold: true,
            color: pptxFontColor(slide.bulletsColor),
            fontFace: 'Arial',
            valign: 'top',
          }
        );
        y += Math.min(multiImages ? 1.4 : 2.8, bullets.length * 0.45 + 0.4);
      }

      if (slide.grammarHighlighterEnabled && slide.grammarText.trim()) {
        page.addShape(pptx.ShapeType.roundRect, {
          x: 0.6,
          y: Math.min(y, multiImages ? 3.4 : 5.2),
          w: textWidth,
          h: 1.1,
          fill: { color: GRAY },
          line: { color: NAVY, width: 1.5 },
        });
        page.addText(slide.grammarText, {
          x: 0.75,
          y: Math.min(y, multiImages ? 3.4 : 5.2) + 0.15,
          w: textWidth - 0.3,
          h: 0.85,
          fontSize: 16,
          bold: true,
          color: NAVY,
          fontFace: 'Arial',
          valign: 'top',
        });
        y = Math.min(y, multiImages ? 3.4 : 5.2) + 1.25;
      }

      if (multiImages) {
        const imageY = Math.min(Math.max(y, 4.0), 4.4);
        const count = contentImages.length;
        const gap = 0.25;
        const totalW = 12.1;
        const imgW = (totalW - gap * (count - 1)) / count;
        for (let i = 0; i < count; i += 1) {
          const imageData = await fetchImageAsBase64(contentImages[i].url);
          if (imageData) {
            page.addImage({
              data: imageData,
              x: 0.6 + i * (imgW + gap),
              y: imageY,
              w: imgW,
              h: 2.4,
            });
          }
        }
      } else if (contentImages[0] || slide.imageUrl.trim() || String(slide.imageUrl2 ?? '').trim()) {
        const imageSrc =
          contentImages[0]?.url ||
          slide.imageUrl.trim() ||
          slide.imageUrl2.trim();
        const imageData = await fetchImageAsBase64(imageSrc);
        if (imageData) {
          page.addImage({
            data: imageData,
            x: 7.8,
            y: 1.35,
            w: 4.8,
            h: 4.8,
          });
        } else {
          page.addText(imageSrc, {
            x: 7.8,
            y: 1.35,
            w: 4.8,
            h: 1.2,
            fontSize: 11,
            color: NAVY,
            fontFace: 'Arial',
          });
        }
      }
    }

    page.addText(`${deck.title || 'Presentation'}  ·  slide`, {
      x: 0.6,
      y: 7.05,
      w: 10,
      h: 0.3,
      fontSize: 10,
      color: NAVY,
      fontFace: 'Arial',
    });
  }

  const output = await pptx.write({ outputType: 'nodebuffer' });
  return Buffer.from(output as ArrayBuffer);
}
