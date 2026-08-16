import PptxGenJS from 'pptxgenjs';
import type { PresentationDeck } from './types';

const NAVY = '001a48';
const RED = 'EA1225';
const GRAY = 'E5E5E4';
const WHITE = 'FFFFFF';

function safeFilename(value: string): string {
  return (value || 'presentation').replace(/[^\w.-]+/g, '_').slice(0, 80);
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function downloadPresentationPptx(deck: PresentationDeck): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'EF_WIDE', width: 13.333, height: 7.5 });
  pptx.layout = 'EF_WIDE';
  pptx.author = 'Englishfully';
  pptx.title = deck.title || 'Presentation';

  for (const slide of deck.slides) {
    const page = pptx.addSlide();
    page.background = { color: WHITE };

    // Accent bar
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
      const subtitle = slide.body || deck.subtitle;
      if (subtitle) {
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
    } else {
      page.addText(slide.title || 'Untitled slide', {
        x: 0.6,
        y: 0.45,
        w: 12.1,
        h: 0.7,
        fontSize: 28,
        bold: true,
        color: NAVY,
        fontFace: 'Arial',
      });

      let y = 1.35;
      if (slide.body.trim()) {
        page.addText(slide.body, {
          x: 0.6,
          y,
          w: slide.imageUrl.trim() ? 6.8 : 12.1,
          h: 2.2,
          fontSize: 18,
          bold: true,
          color: NAVY,
          fontFace: 'Arial',
          valign: 'top',
        });
        y += 2.3;
      }

      const bullets = slide.bullets.filter((item) => item.trim());
      if (bullets.length > 0) {
        page.addText(
          bullets.map((item) => ({ text: item, options: { bullet: true } })),
          {
            x: 0.6,
            y,
            w: slide.imageUrl.trim() ? 6.8 : 12.1,
            h: Math.min(2.8, bullets.length * 0.45 + 0.3),
            fontSize: 18,
            bold: true,
            color: NAVY,
            fontFace: 'Arial',
            valign: 'top',
          }
        );
        y += Math.min(2.8, bullets.length * 0.45 + 0.4);
      }

      if (slide.grammarHighlighterEnabled && slide.grammarText.trim()) {
        page.addShape(pptx.ShapeType.roundRect, {
          x: 0.6,
          y: Math.min(y, 5.2),
          w: slide.imageUrl.trim() ? 6.8 : 12.1,
          h: 1.3,
          fill: { color: GRAY },
          line: { color: NAVY, width: 1.5 },
        });
        page.addText(slide.grammarText, {
          x: 0.75,
          y: Math.min(y, 5.2) + 0.15,
          w: slide.imageUrl.trim() ? 6.5 : 11.8,
          h: 1.0,
          fontSize: 16,
          bold: true,
          color: NAVY,
          fontFace: 'Arial',
          valign: 'top',
        });
      }

      if (slide.imageUrl.trim()) {
        try {
          const imageData = await fetchImageAsBase64(slide.imageUrl);
          if (imageData) {
            page.addImage({
              data: imageData,
              x: 7.8,
              y: 1.35,
              w: 4.8,
              h: 4.8,
            });
          } else {
            page.addText(slide.imageUrl, {
              x: 7.8,
              y: 1.35,
              w: 4.8,
              h: 1.2,
              fontSize: 11,
              color: NAVY,
              fontFace: 'Arial',
            });
          }
        } catch {
          page.addText(slide.imageUrl, {
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

  await pptx.writeFile({
    fileName: `${safeFilename(deck.title || 'Presentation')}.pptx`,
  });
}
