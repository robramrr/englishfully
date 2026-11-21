export type SlideTextPart =
  | { type: 'text'; value: string }
  | { type: 'link'; href: string; label: string };

const LINK_TOKEN =
  /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|www\.[^\s)]+)\)|(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeHref(raw: string): string | null {
  const trimmed = raw.trim();
  const href = /^www\./i.test(trimmed) ? `https://${trimmed}` : trimmed;
  try {
    const url = new URL(href);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.href;
  } catch {
    return null;
  }
}

/** Pull trailing punctuation off a raw URL, keeping a balanced closing parenthesis. */
function stripTrail(url: string): { url: string; trail: string } {
  let trail = '';
  while (url.length > 0 && /[),.;:!?»]/.test(url[url.length - 1])) {
    const last = url[url.length - 1];
    if (last === ')') {
      const opens = (url.match(/\(/g) || []).length;
      const closes = (url.match(/\)/g) || []).length;
      if (opens >= closes) break;
    }
    trail = last + trail;
    url = url.slice(0, -1);
  }
  return { url, trail };
}

/** Split slide text into plain runs and clickable http(s) links, including [label](url). */
export function splitSlideLinks(input: string): SlideTextPart[] {
  const text = String(input ?? '');
  if (!text) return [];
  const parts: SlideTextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK_TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ type: 'text', value: text.slice(last, index) });
    if (match[1] && match[2]) {
      const href = normalizeHref(match[2]);
      if (href) parts.push({ type: 'link', href, label: match[1] });
      else parts.push({ type: 'text', value: match[0] });
    } else if (match[3]) {
      const stripped = stripTrail(match[3]);
      const href = normalizeHref(stripped.url);
      if (href && stripped.url) {
        parts.push({ type: 'link', href, label: stripped.url });
        if (stripped.trail) parts.push({ type: 'text', value: stripped.trail });
      } else {
        parts.push({ type: 'text', value: match[3] });
      }
    }
    last = index + match[0].length;
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
  return parts;
}

const ANAGRAM_PATH = /^\/anagram\/([^/]+)\/?$/;

/** Play-page id from an anagram URL. Teacher editor links are ignored. */
export function anagramActivityIdFromHref(href: string): string | null {
  try {
    const url = new URL(href, 'https://englishfully.local');
    const match = url.pathname.match(ANAGRAM_PATH);
    if (!match) return null;
    const id = decodeURIComponent(match[1]).trim();
    return id || null;
  } catch {
    return null;
  }
}

export function anagramActivityIdsInText(input: string): string[] {
  const ids: string[] = [];
  for (const part of splitSlideLinks(input)) {
    if (part.type !== 'link') continue;
    const id = anagramActivityIdFromHref(part.href);
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

/** True when the visible text is the address itself, not a written label. */
export function anagramLinkLabelIsRaw(href: string, label: string): boolean {
  const visible = label.trim();
  if (!visible) return true;
  if (visible === href.trim()) return true;
  return anagramActivityIdFromHref(visible) !== null;
}

/** Escaped HTML with real anchor tags for slide export. */
export function linkifyHtml(input: string): string {
  return splitSlideLinks(input)
    .map((part) => {
      if (part.type === 'text') return escapeHtml(part.value);
      const safeHref = escapeHtml(part.href).replace(/'/g, '&#39;');
      return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" style="color:#ea1225;font-weight:800;text-decoration:underline;">${escapeHtml(part.label)}</a>`;
    })
    .join('');
}
