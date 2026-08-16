import type { PresentationDeck } from './types';

function safeFilename(value: string): string {
  return (value || 'presentation').replace(/[^\w.-]+/g, '_').slice(0, 80);
}

/** Open a print-friendly window (use browser Print → Save as PDF). */
export function downloadPresentationPdf(deck: PresentationDeck): void {
  const slidesHtml = deck.slides
    .map((slide, index) => {
      const title =
        slide.title ||
        (slide.layout === 'title' ? deck.title : `Slide ${index + 1}`);
      const body =
        slide.layout === 'title' ? slide.body || deck.subtitle : slide.body;
      const bullets = slide.bullets.filter((item) => item.trim());
      const brand = deck.brandLabel?.trim() || 'Englishfully';

      return `
        <section class="slide">
          <div class="slide-inner">
            ${
              slide.layout === 'title'
                ? `<p class="brand">${escapeHtml(brand)}</p>
                   <h1>${escapeHtml(title || 'Presentation')}</h1>
                   ${body ? `<p class="subtitle">${escapeHtml(body)}</p>` : ''}`
                : `<h2>${escapeHtml(title)}</h2>
                   ${body ? `<p class="body">${escapeHtml(body)}</p>` : ''}
                   ${
                     bullets.length
                       ? `<ul>${bullets
                           .map((item) => `<li>${escapeHtml(item)}</li>`)
                           .join('')}</ul>`
                       : ''
                   }
                   ${
                     slide.grammarHighlighterEnabled && slide.grammarText.trim()
                       ? `<div class="grammar"><strong>Practice:</strong> ${escapeHtml(
                           slide.grammarText
                         )}</div>`
                       : ''
                   }
                   ${
                     slide.imageUrl.trim()
                       ? `<img src="${escapeAttr(slide.imageUrl)}" alt="${escapeAttr(
                           slide.imageAlt || title
                         )}" />`
                       : ''
                   }`
            }
            <div class="footer">
              <span>${escapeHtml(deck.title || 'Presentation')}</span>
              <span>${index + 1} / ${deck.slides.length}</span>
            </div>
          </div>
        </section>
      `;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(deck.title || 'Presentation')}</title>
  <style>
    @page { size: landscape; margin: 0.4in; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      color: #001a48;
      background: #fff;
    }
    .no-print { text-align: center; padding: 16px; background: #e5e5e4; }
    .slide {
      page-break-after: always;
      break-after: page;
      width: 100%;
      min-height: 90vh;
      display: flex;
      align-items: stretch;
      padding: 8px 0;
    }
    .slide:last-child { page-break-after: auto; }
    .slide-inner {
      width: 100%;
      border: 4px solid #001a48;
      padding: 28px 32px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: linear-gradient(135deg, #e5e5e4 0%, #fff 45%, #f7f7f7 100%);
    }
    .brand {
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #ea1225;
      font-weight: 700;
      margin: 0;
    }
    h1 { font-size: 42px; margin: 0; color: #001a48; }
    h2 { font-size: 28px; margin: 0; border-bottom: 3px solid #001a48; padding-bottom: 8px; }
    .subtitle { font-size: 22px; font-weight: 700; }
    .body { font-size: 18px; font-weight: 600; white-space: pre-wrap; }
    ul { margin: 0; padding-left: 24px; font-size: 18px; font-weight: 600; }
    .grammar {
      border: 3px solid #001a48;
      background: #fff;
      padding: 10px 12px;
      white-space: pre-wrap;
      font-weight: 600;
    }
    img {
      max-width: 55%;
      max-height: 280px;
      object-fit: contain;
      border: 3px solid #001a48;
      align-self: flex-start;
    }
    .footer {
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 700;
      opacity: 0.7;
      border-top: 1px solid rgba(0,26,72,0.25);
      padding-top: 8px;
    }
    @media print {
      .no-print { display: none !important; }
      .slide { min-height: auto; height: 100vh; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()" style="padding:10px 18px;font-weight:700;cursor:pointer;">
      Print / Save as PDF
    </button>
  </div>
  ${slidesHtml}
  <script>window.onload = function () { setTimeout(function () { window.print(); }, 250); };</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    // Popup blocked — fall back to download HTML
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeFilename(deck.title)}_slides.html`;
    anchor.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, '&#39;');
}
