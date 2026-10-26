import 'server-only';
import PptxGenJS from 'pptxgenjs';
import type {
  PresentationDeck,
  PresentationFontColor,
  PresentationFontSize,
} from './types';
import { QUIZ_CHOICE_LETTERS, blankSentencePlain, getContentSlideImages } from './types';

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
    } else if (slide.layout === 'match_text_image') {
      const pairs = (slide.matchPairs || []).filter(
        (pair) => pair.word.trim() && pair.imageUrl.trim()
      );
      let y = 0.45;
      if (slide.showTitle !== false) {
        page.addText(slide.title || 'Match the words', {
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
          h: 0.5,
          fontSize: 16,
          bold: true,
          color: NAVY,
          fontFace: 'Arial',
        });
        y += 0.6;
      }
      page.addText(pairs.map((pair) => pair.word).join('  ·  ') || 'No pairs yet', {
        x: 0.6,
        y,
        w: 12.1,
        h: 0.5,
        fontSize: 18,
        bold: true,
        color: NAVY,
        fontFace: 'Arial',
      });
      y += 0.7;
      const cols = Math.min(3, Math.max(1, pairs.length));
      const cellW = 12.1 / cols;
      for (let i = 0; i < pairs.length; i += 1) {
        const pair = pairs[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = 0.6 + col * cellW;
        const imgY = y + row * 2.4;
        const imageData = await fetchImageAsBase64(pair.imageUrl);
        if (imageData) {
          page.addImage({
            data: imageData,
            x: x + 0.1,
            y: imgY,
            w: cellW - 0.3,
            h: 1.8,
          });
        }
        page.addText(pair.word, {
          x: x + 0.1,
          y: imgY + 1.85,
          w: cellW - 0.3,
          h: 0.35,
          fontSize: 14,
          bold: true,
          color: NAVY,
          fontFace: 'Arial',
        });
      }
    } else if (slide.layout === 'fill_blank') {
      let y = 0.45;
      if (slide.showTitle !== false) {
        page.addText(slide.title || 'Fill in the blank', {
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
      const groups = slide.blankGroups?.length
        ? slide.blankGroups
        : [{ heading: '', items: slide.blankItems || [] }];
      groups.forEach((group, groupIndex) => {
        const lines = (group.items || []).filter((item) => item.text.trim());
        if (groupIndex > 0 && (group.heading.trim() || lines.length > 0)) {
          page.addShape(pptx.ShapeType.line, {
            x: 0.6,
            y,
            w: 12.1,
            h: 0,
            line: { color: '001A48', width: 0.75, transparency: 80 },
          });
          y += 0.28;
        }
        if (group.heading.trim()) {
          page.addText(group.heading.trim(), {
            x: 0.6,
            y,
            w: 12.1,
            h: 0.45,
            fontSize: pptxFontSize(slide.bulletsFontSize, 24),
            bold: true,
            color: NAVY,
            fontFace: 'Arial',
          });
          y += 0.5;
        }
        lines.forEach((item) => {
          const line = blankSentencePlain(item.text, item.blankIndex);
          page.addText(`${slide.blankBullets ? '●  ' : ''}${line}`, {
            x: 0.8,
            y,
            w: 11.9,
            h: 0.42,
            fontSize: pptxFontSize(slide.bulletsFontSize, 20),
            bold: true,
            color: pptxFontColor(slide.bulletsColor),
            fontFace: 'Arial',
          });
          y += 0.55;
        });
        y += 0.2;
      });
    } else {
      const contentImages =
        slide.layout === 'content' ? getContentSlideImages(slide) : [];
      const multiImages = contentImages.length >= 2;
      const showTable = slide.layout === 'content' && Boolean(slide.tableEnabled);
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
          h: multiImages || showTable ? 1.4 : 2.2,
          fontSize: pptxFontSize(slide.bodyFontSize, 18),
          bold: true,
          color: pptxFontColor(slide.bodyColor),
          fontFace: 'Arial',
          valign: 'top',
        });
        y += multiImages || showTable ? 1.5 : 2.3;
      }

      if (showTable) {
        const headers = slide.tableHeaders?.length
          ? slide.tableHeaders
          : ['', ''];
        const rows = slide.tableRows?.length
          ? slide.tableRows
          : [headers.map(() => '')];
        const tableRows = [
          headers.map((cell) => ({
            text: cell || 'Heading',
            options: {
              bold: true,
              color: pptxFontColor(slide.tableColor),
              align: 'left' as const,
              fill: { color: 'D0D0D0' },
            },
          })),
          ...rows.map((row) =>
            headers.map((_, colIndex) => ({
              text: row[colIndex] || '',
              options: {
                color: pptxFontColor(slide.tableColor),
                align: 'left' as const,
                fill: { color: WHITE },
              },
            }))
          ),
        ];
        const tableWidth = Math.min(textWidth, 2.2 * headers.length);
        page.addTable(tableRows, {
          x: 0.6,
          y: Math.min(y, 4.0),
          w: tableWidth,
          colW: headers.map(() => tableWidth / headers.length),
          border: [
            { pt: 1.5, color: NAVY },
            { pt: 1.5, color: NAVY },
            { pt: 1.5, color: NAVY },
            { pt: 1.5, color: NAVY },
          ],
          fontFace: 'Arial',
          fontSize: pptxFontSize(slide.tableFontSize, 14),
          bold: true,
          color: pptxFontColor(slide.tableColor),
          valign: 'middle',
        });
        y = Math.min(y, 4.0) + 0.45 * (1 + rows.length) + 0.3;
      }

      const bullets = slide.bullets;
      if (bullets.some((item) => item.trim())) {
        page.addText(
          bullets.map((item) =>
            item.trim()
              ? { text: item, options: { bullet: true } }
              : { text: ' ', options: { bullet: false } }
          ),
          {
            x: 0.6,
            y,
            w: textWidth,
            h: Math.min(multiImages || showTable ? 1.2 : 2.8, bullets.length * 0.45 + 0.3),
            fontSize: pptxFontSize(slide.bulletsFontSize, 18),
            bold: true,
            color: pptxFontColor(slide.bulletsColor),
            fontFace: 'Arial',
            valign: 'top',
          }
        );
        y += Math.min(multiImages || showTable ? 1.2 : 2.8, bullets.length * 0.45 + 0.4);
      }

      if (slide.grammarHighlighterEnabled && slide.grammarText.trim()) {
        page.addShape(pptx.ShapeType.roundRect, {
          x: 0.6,
          y: Math.min(y, multiImages || showTable ? 3.2 : 5.2),
          w: textWidth,
          h: 1.0,
          fill: { color: GRAY },
          line: { color: NAVY, width: 1.5 },
        });
        page.addText(slide.grammarText, {
          x: 0.75,
          y: Math.min(y, multiImages || showTable ? 3.2 : 5.2) + 0.12,
          w: textWidth - 0.3,
          h: 0.75,
          fontSize: 16,
          bold: true,
          color: NAVY,
          fontFace: 'Arial',
          valign: 'top',
        });
        y = Math.min(y, multiImages || showTable ? 3.2 : 5.2) + 1.15;
      }

      if (multiImages) {
        const count = contentImages.length;
        const cols = count >= 4 ? 2 : count;
        const rows = count >= 4 ? 2 : 1;
        const gap = 0.18;
        const totalW = 12.1;
        const cellW = (totalW - gap * (cols - 1)) / cols;
        const bandH = rows === 2 ? 3.5 : 2.35;
        const startY = rows === 2 ? 3.45 : Math.min(Math.max(y, 4.15), 4.7);
        const cellH = (bandH - gap * (rows - 1)) / rows;
        for (let i = 0; i < count; i += 1) {
          const image = contentImages[i];
          const col = i % cols;
          const row = Math.floor(i / cols);
          const captionTitle = image.showTitle ? image.title.trim() : '';
          const captionSubtitle = image.showSubtitle ? image.subtitle.trim() : '';
          const captionH =
            (captionTitle ? 0.28 : 0) + (captionSubtitle ? 0.24 : 0);
          const x = 0.6 + col * (cellW + gap);
          const cellY = startY + row * (cellH + gap);
          const imgH = Math.max(0.7, cellH - captionH);
          const imageData = await fetchImageAsBase64(image.url);
          if (imageData) {
            page.addImage({
              data: imageData,
              x,
              y: cellY,
              w: cellW,
              h: imgH,
            });
          }
          let captionY = cellY + imgH;
          if (captionTitle) {
            page.addText(captionTitle, {
              x,
              y: captionY,
              w: cellW,
              h: 0.26,
              fontSize: rows === 2 ? 12 : 14,
              bold: true,
              color: NAVY,
              fontFace: 'Arial',
              align: 'center',
            });
            captionY += 0.26;
          }
          if (captionSubtitle) {
            page.addText(captionSubtitle, {
              x,
              y: captionY,
              w: cellW,
              h: 0.22,
              fontSize: rows === 2 ? 11 : 12,
              bold: true,
              color: NAVY,
              fontFace: 'Arial',
              align: 'center',
            });
          }
        }
      } else if (sideImage && (contentImages[0] || slide.imageUrl.trim() || String(slide.imageUrl2 ?? '').trim())) {
        const image = contentImages[0];
        const imageSrc =
          image?.url ||
          slide.imageUrl.trim() ||
          slide.imageUrl2.trim();
        const captionTitle = image?.showTitle ? image.title.trim() : '';
        const captionSubtitle = image?.showSubtitle ? image.subtitle.trim() : '';
        const captionH = (captionTitle ? 0.32 : 0) + (captionSubtitle ? 0.28 : 0);
        const imageData = await fetchImageAsBase64(imageSrc);
        const imageH = Math.max(1.6, (showTable ? 3.2 : 4.8) - captionH);
        if (imageData) {
          page.addImage({
            data: imageData,
            x: 7.8,
            y: 1.35,
            w: 4.8,
            h: imageH,
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
        let captionY = 1.35 + imageH;
        if (captionTitle) {
          page.addText(captionTitle, {
            x: 7.8,
            y: captionY,
            w: 4.8,
            h: 0.3,
            fontSize: 14,
            bold: true,
            color: NAVY,
            fontFace: 'Arial',
            align: 'center',
          });
          captionY += 0.3;
        }
        if (captionSubtitle) {
          page.addText(captionSubtitle, {
            x: 7.8,
            y: captionY,
            w: 4.8,
            h: 0.26,
            fontSize: 12,
            bold: true,
            color: NAVY,
            fontFace: 'Arial',
            align: 'center',
          });
        }
      }
    }

    if (slide.quizEnabled) {
      const lines = (slide.quizChoices || [])
        .map((choice, choiceIndex) => {
          const text = choice.text.trim();
          if (!text) return '';
          const letter = QUIZ_CHOICE_LETTERS[choiceIndex] || '';
          const mark = choiceIndex === slide.quizCorrectIndex ? ' ✓' : '';
          return `${letter}. ${text}${mark}`;
        })
        .filter(Boolean);
      if (slide.quizPrompt.trim() || lines.length > 0) {
        page.addText(
          [slide.quizPrompt.trim(), ...lines].filter(Boolean).join('\n'),
          {
            x: 0.6,
            y: 5.85,
            w: 12.1,
            h: 1.1,
            fontSize: 14,
            bold: true,
            color: NAVY,
            fontFace: 'Arial',
            valign: 'bottom',
          }
        );
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
