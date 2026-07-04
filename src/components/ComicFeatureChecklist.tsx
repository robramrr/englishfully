/** Alternating red / navy — white checkmark must not sit on light backgrounds. */
const FEATURE_BADGE_COLORS = ["var(--brand-red)", "var(--brand-navy)"] as const;

/** Multi-hue badges for warm yellow cards (homepage 1-on-1 support, etc.). */
export const COLORFUL_CHECKLIST_BADGE_COLORS = [
  "#ea1225",
  "#001a48",
  "#ff9500",
  "#00b8b9",
  "#2ed573",
  "#6b4ce6",
] as const;

/** Homepage 1-on-1 Support — navy first, then red, alternating. */
export const ONE_ON_ONE_HOME_CHECKLIST_BADGE_COLORS = [
  "#001a48",
  "#ea1225",
] as const;

/** First colon splits label (bold) from body (normal weight); label includes the ":". */
function splitAfterFirstColon(text: string): {
  headline: string;
  body: string;
} | null {
  const idx = text.indexOf(":");
  if (idx === -1) return null;
  const headline = text.slice(0, idx + 1).trim();
  const body = text.slice(idx + 1).trim();
  if (!headline) return null;
  return { headline, body };
}

export default function ComicFeatureChecklist({
  items,
  splitLabelAfterColon = false,
  badgeColors = FEATURE_BADGE_COLORS,
}: {
  items: readonly string[];
  /** Label before first ":" is bold; rest wraps on the next line with normal weight. */
  splitLabelAfterColon?: boolean;
  /** Checkmark badge backgrounds; defaults to red / navy alternation. */
  badgeColors?: readonly string[];
}) {
  return (
    <ul className="list-none space-y-3.5 mb-6 flex-grow m-0 p-0 text-left">
      {items.map((text, i) => {
        const parts =
          splitLabelAfterColon === true ? splitAfterFirstColon(text) : null;

        const textInner =
          parts != null ? (
            <span className="flex flex-col gap-0.5 text-left">
              <span className="font-bold">{parts.headline}</span>
              {parts.body.length > 0 ? (
                <span className="font-normal">{parts.body}</span>
              ) : null}
            </span>
          ) : (
            text
          );

        const textClass =
          parts != null
            ? "comic-text block text-[var(--comic-dark)] text-base md:text-lg leading-snug text-left flex-1 min-w-0 font-normal"
            : "comic-text block text-[var(--comic-dark)] font-semibold md:font-bold text-base md:text-lg leading-snug pt-1 text-left flex-1 min-w-0";

        return (
          <li key={`${i}-${text.slice(0, 48)}`} className="flex gap-3 items-start">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-4 border-[var(--comic-black)] text-base font-black text-white comic-shadow-sm leading-none pt-px"
              style={{
                backgroundColor: badgeColors[i % badgeColors.length],
              }}
              aria-hidden
            >
              ✓
            </span>
            <span className={textClass}>{textInner}</span>
          </li>
        );
      })}
    </ul>
  );
}
