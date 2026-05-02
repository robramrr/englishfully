const FEATURE_BADGE_COLORS = [
  "var(--comic-primary)",
  "var(--comic-secondary)",
  "var(--comic-warning)",
  "var(--comic-accent)",
  "var(--comic-success)",
  "var(--comic-purple)",
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
}: {
  items: readonly string[];
  /** Label before first ":" is bold; rest wraps on the next line with normal weight. */
  splitLabelAfterColon?: boolean;
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
                backgroundColor:
                  FEATURE_BADGE_COLORS[i % FEATURE_BADGE_COLORS.length],
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
