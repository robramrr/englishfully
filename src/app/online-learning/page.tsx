'use client';

import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import ComicButton from "../../components/ComicButton";
import ComicCard from "../../components/ComicCard";
import ComicFeatureChecklist from "../../components/ComicFeatureChecklist";
import ComicTitle from "../../components/ComicTitle";
import ComicText from "../../components/ComicText";
import Footer from "../../components/Footer";
import {
  ONLINE_LEARNING_HERO_SLIDE_URLS,
  ONLINE_SUBSCRIPTION_APP_MEMBER_URL,
  ONLINE_SUBSCRIPTION_ONE_ON_ONE_URL,
  ONLINE_SUBSCRIPTION_PRO_URL,
} from "../../constants/images";
import {
  ENGLISH_LEARNING_TRACKS,
  matchesModuleSearch,
  moduleHaystack,
  type LearningModuleItem,
  type LearningTrack,
} from "../../data/online-learning-modules";
import { useI18n } from "../../i18n/I18nProvider";


function OnlineLearningHeroCarousel({
  slideIndex,
  setSlideIndex,
  wrapperClassName = "",
}: {
  slideIndex: number;
  setSlideIndex: Dispatch<SetStateAction<number>>;
  wrapperClassName?: string;
}) {
  const { t } = useI18n();
  const ol = t.onlineLearning;

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % ONLINE_LEARNING_HERO_SLIDE_URLS.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [setSlideIndex]);

  const slideAlts = [ol.heroSlideAlt1, ol.heroSlideAlt2, ol.heroSlideAlt3] as const;
  const slideHeads = [ol.heroSlideHead1, ol.heroSlideHead2, ol.heroSlideHead3] as const;

  return (
    <div className={`mx-auto w-full max-w-[min(100%,560px)] ${wrapperClassName}`}>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={ol.heroCarouselAriaLabel}
        className="relative"
      >
        <figure className="relative mx-auto aspect-square w-full max-h-[min(330px,60vw)] overflow-hidden rounded-2xl border-4 border-[var(--comic-black)] bg-[var(--comic-white)] comic-shadow-xl sm:max-h-[345px]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(repeating-linear-gradient(135deg,#00000006_0_10px,#00000006_10px_20px))]" />
          {ONLINE_LEARNING_HERO_SLIDE_URLS.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={slideAlts[i]}
              width={900}
              height={900}
              className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ease-out motion-reduce:transition-none ${
                slideIndex === i ? "z-[1] opacity-100" : "z-0 opacity-0"
              }`}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          ))}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] bg-gradient-to-t from-black/80 via-black/45 to-transparent pt-16 sm:pt-[4.25rem]"
            aria-hidden
          />
          <p
            aria-live="polite"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] comic-title px-4 pb-4 pt-12 text-center text-2xl leading-tight tracking-tight text-[var(--comic-yellow)] sm:text-3xl md:pb-5 md:text-4xl"
          >
            {slideHeads[slideIndex]}
          </p>
        </figure>
        <div
          className="mt-5 flex justify-center gap-3"
          role="tablist"
          aria-label={ol.heroCarouselAriaLabel}
        >
          {ONLINE_LEARNING_HERO_SLIDE_URLS.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={slideIndex === i}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setSlideIndex(i)}
              className={`h-4 w-4 rounded-full border-2 border-[var(--comic-black)] transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--comic-accent)] ${
                slideIndex === i
                  ? "scale-110 comic-bg-primary comic-shadow-sm"
                  : "comic-bg-light"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Hero Section
function HeroSection() {
  const { t } = useI18n();
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);

  return (
    <section className="flex flex-col items-center justify-center text-center py-24 px-4 comic-bg-primary relative overflow-hidden comic-pattern-zigzag">
      {/* Enhanced comic book style background elements */}
      <div className="absolute top-10 left-10 w-24 h-24 comic-bg-warning rounded-full comic-border-thick comic-shadow-xl comic-bounce"></div>
      <div className="absolute top-20 right-20 w-20 h-20 comic-bg-success rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '0.5s'}}></div>
      <div className="absolute bottom-20 left-20 w-16 h-16 comic-bg-danger rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 right-10 w-12 h-12 comic-bg-secondary rounded-full comic-border-thick comic-shadow-lg comic-bounce" style={{animationDelay: '1.5s'}}></div>
      <div className="absolute bottom-1/3 right-1/3 w-14 h-14 bg-[var(--comic-yellow)] rounded-full comic-border-thick comic-shadow-lg comic-bounce" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-0">
        <ComicTitle level={1} className="comic-text-white mb-8 comic-wiggle">
          <span className="mx-auto flex w-max max-w-full flex-col items-center px-3 text-center">
            <span className="block">{t.onlineLearning.heroTitle}</span>
            <span
              className="mt-3 block max-w-full bg-[linear-gradient(135deg,var(--comic-warning)_0%,#ff9500_100%)] bg-clip-text text-center text-base leading-snug tracking-normal text-transparent [-webkit-text-fill-color:transparent] [text-shadow:none] sm:mt-3 sm:text-lg md:mt-4 md:text-xl lg:text-2xl lg:leading-tight"
              style={{ WebkitBackgroundClip: "text", backgroundClip: "text" }}
            >
              {t.onlineLearning.heroTitleTagline}
            </span>
          </span>
        </ComicTitle>
        <ComicText size="xl" className="comic-text-white mb-10 font-bold max-w-3xl mx-auto">
          {t.onlineLearning.heroDesc}
        </ComicText>
        <OnlineLearningHeroCarousel
          slideIndex={heroSlideIndex}
          setSlideIndex={setHeroSlideIndex}
          wrapperClassName="mb-10"
        />
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <ComicButton
            variant="secondary"
            size="lg"
            className="comic-wiggle"
            href="#subscription-plans"
          >
            {t.onlineLearning.explorePlans}
          </ComicButton>
          <ComicButton
            variant="warning"
            size="lg"
            className="comic-wiggle"
            href="https://calendly.com/hello-englishfully/1-hour-in-person-meeting"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.inPersonLearning.viewOnlineAvailability}
          </ComicButton>
        </div>
      </div>
    </section>
  );
}

function LearningModulesSearchSection() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [showAllTracks, setShowAllTracks] = useState(false);

  const groupedHits = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    const map = new Map<
      string,
      { track: LearningTrack; items: LearningModuleItem[] }
    >();
    for (const track of ENGLISH_LEARNING_TRACKS) {
      for (const item of track.items) {
        const hay = moduleHaystack(track, item);
        if (!matchesModuleSearch(q, hay)) continue;
        let group = map.get(track.id);
        if (!group) {
          group = { track, items: [] };
          map.set(track.id, group);
        }
        group.items.push(item);
      }
    }
    return [...map.values()];
  }, [query]);

  const allTracksGrouped = useMemo(
    () =>
      ENGLISH_LEARNING_TRACKS.map((track) => ({
        track,
        items: [...track.items],
      })),
    []
  );

  return (
    <section
      id="learning-modules"
      className="comic-bg-secondary py-24 px-4 comic-pattern-dots"
      aria-label={t.onlineLearning.modulesSearchTitle}
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <ComicTitle level={2} className="comic-text-white mb-6">
            {t.onlineLearning.modulesSearchTitle}
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold">
            {t.onlineLearning.modulesSearchDesc}
          </ComicText>
        </div>
        <ComicCard className="comic-shadow-xl">
          <input
            id="module-search"
            type="search"
            className="comic-input mb-4 w-full"
            placeholder={t.onlineLearning.modulesSearchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            aria-controls="module-search-results"
            aria-label={t.onlineLearning.modulesSearchLabel}
          />
          <div id="module-search-results" role="region" aria-live="polite">
            {!query.trim() ? (
              <div className="text-center">
                <p className="comic-text text-base font-semibold text-[var(--comic-dark)]">
                  {t.onlineLearning.modulesSearchEmptyQuery}
                </p>
                <button
                  type="button"
                  className="comic-text mt-4 inline-block border-0 bg-transparent text-base font-bold text-[var(--comic-primary)] underline decoration-2 underline-offset-2 hover:text-[var(--comic-danger)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--comic-accent)]"
                  onClick={() => setShowAllTracks((open) => !open)}
                  aria-expanded={showAllTracks}
                  aria-controls="all-tracks-panel"
                >
                  {showAllTracks
                    ? t.onlineLearning.modulesSearchHideAllTracks
                    : t.onlineLearning.modulesSearchShowAllTracks}
                </button>
                {showAllTracks ? (
                  <div
                    id="all-tracks-panel"
                    className="mt-8 border-t-2 border-[var(--comic-black)] pt-8 text-left"
                  >
                    <ul className="m-0 list-none space-y-8 p-0">
                      {allTracksGrouped.map(({ track, items }) => (
                        <li key={track.id}>
                          <h3 className="comic-title mb-2 text-left text-lg leading-tight text-[var(--comic-primary)] md:text-xl">
                            {track.title}
                          </h3>
                          <p className="comic-text mb-3 text-left text-sm font-bold leading-snug text-[var(--comic-accent)]">
                            <span className="text-[var(--comic-dark)]">
                              {t.onlineLearning.modulesSearchFocusLabel}:{" "}
                            </span>
                            {track.focus}
                          </p>
                          <ul className="m-0 list-none space-y-3 p-0">
                            {items.map((item) => (
                              <li
                                key={item.id}
                                className="rounded-lg border-2 border-[var(--comic-black)] bg-[var(--comic-light)] px-3 py-2"
                              >
                                <div className="comic-text font-bold text-[var(--comic-dark)]">
                                  {item.title}
                                </div>
                                <div className="comic-text mt-0.5 text-sm leading-snug text-[var(--comic-dark)]">
                                  {item.description}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : groupedHits.length === 0 ? (
              <p className="comic-text text-center text-base font-semibold text-[var(--comic-dark)]">
                {t.onlineLearning.modulesSearchNoResults}
              </p>
            ) : (
              <ul className="m-0 list-none space-y-8 p-0">
                {groupedHits.map(({ track, items }) => (
                  <li key={track.id}>
                    <h3 className="comic-title mb-2 text-left text-lg leading-tight text-[var(--comic-primary)] md:text-xl">
                      {track.title}
                    </h3>
                    <p className="comic-text mb-3 text-left text-sm font-bold leading-snug text-[var(--comic-accent)]">
                      <span className="text-[var(--comic-dark)]">
                        {t.onlineLearning.modulesSearchFocusLabel}:{" "}
                      </span>
                      {track.focus}
                    </p>
                    <ul className="m-0 list-none space-y-3 p-0">
                      {items.map((item) => (
                        <li
                          key={item.id}
                          className="rounded-lg border-2 border-[var(--comic-black)] bg-[var(--comic-light)] px-3 py-2"
                        >
                          <div className="comic-text font-bold text-[var(--comic-dark)]">
                            {item.title}
                          </div>
                          <div className="comic-text mt-0.5 text-sm leading-snug text-[var(--comic-dark)]">
                            {item.description}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ComicCard>
      </div>
    </section>
  );
}

const SESSION_TYPE_ENTRIES = [
  {
    titleKey: "sessionType1Title",
    focusKey: "sessionType1Focus",
    bodyKey: "sessionType1Body",
    accentClass: "text-[var(--comic-primary)]",
  },
  {
    titleKey: "sessionType2Title",
    focusKey: "sessionType2Focus",
    bodyKey: "sessionType2Body",
    accentClass: "text-[var(--comic-secondary)]",
  },
  {
    titleKey: "sessionType3Title",
    focusKey: "sessionType3Focus",
    bodyKey: "sessionType3Body",
    accentClass: "text-[var(--comic-warning)]",
  },
  {
    titleKey: "sessionType4Title",
    focusKey: "sessionType4Focus",
    bodyKey: "sessionType4Body",
    accentClass: "text-[var(--comic-success)]",
  },
  {
    titleKey: "sessionType5Title",
    focusKey: "sessionType5Focus",
    bodyKey: "sessionType5Body",
    accentClass: "text-[var(--comic-danger)]",
  },
  {
    titleKey: "sessionType6Title",
    focusKey: "sessionType6Focus",
    bodyKey: "sessionType6Body",
    accentClass: "text-[var(--comic-purple)]",
  },
] as const;

// Session Types (formerly AI Features on this route)
function SessionTypesSection() {
  const { t } = useI18n();
  const ol = t.onlineLearning;

  return (
    <section className="comic-bg-primary py-24 px-4 comic-pattern-dots">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            {ol.sessionTypesTitle}
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            {ol.sessionTypesDesc}
          </ComicText>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {SESSION_TYPE_ENTRIES.map(({ titleKey, focusKey, bodyKey, accentClass }) => (
            <ComicCard
              key={titleKey}
              className="comic-shadow-xl text-center flex flex-col h-full min-h-0 overflow-hidden min-w-0"
            >
              <ComicTitle
                level={4}
                className={`mb-3 w-full min-w-0 max-w-full px-1 leading-tight tracking-tight break-words [overflow-wrap:anywhere] hyphens-auto ${accentClass}`}
              >
                {ol[titleKey]}
              </ComicTitle>
              <ComicText
                weight="bold"
                size="sm"
                className={`mb-4 w-full min-w-0 max-w-full px-1 break-words [overflow-wrap:anywhere] leading-snug hyphens-auto ${accentClass}`}
              >
                {ol[focusKey]}
              </ComicText>
              <ComicText
                weight="normal"
                size="sm"
                className="text-[var(--comic-dark)] text-left leading-relaxed flex-grow min-w-0 px-1 break-words [overflow-wrap:anywhere]"
              >
                {ol[bodyKey]}
              </ComicText>
            </ComicCard>
          ))}
        </div>
      </div>
    </section>
  );
}

const PLAN_CHECKLIST_COLORS = [
  "var(--comic-primary)",
  "var(--comic-secondary)",
  "var(--comic-warning)",
] as const;

function splitPlanLineAfterColon(text: string): {
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

/** Pro tier first row links “specialized modules” to #learning-modules. */
function ProMemberFeatureList() {
  const { t } = useI18n();
  const rows = [
    t.onlineLearning.proItem1,
    t.onlineLearning.proItem2,
    t.onlineLearning.proItem3,
  ] as const;
  const linkPhrase = t.onlineLearning.proItem1LinkPhrase;

  return (
    <ul className="m-0 mb-6 list-none flex-grow space-y-3.5 p-0 text-left">
      {rows.map((text, i) => {
        const parts = splitPlanLineAfterColon(text);
        const textClass =
          parts != null
            ? "comic-text block min-w-0 flex-1 text-left text-base font-normal leading-snug text-[var(--comic-dark)] md:text-lg"
            : "comic-text block min-w-0 flex-1 pt-1 text-left text-base font-semibold leading-snug text-[var(--comic-dark)] md:text-lg md:font-bold";

        let bodyInner: ReactNode;
        if (i === 0 && parts && linkPhrase) {
          const b = parts.body;
          const hit = b.indexOf(linkPhrase);
          if (hit !== -1) {
            bodyInner = (
              <>
                {b.slice(0, hit)}
                <a
                  href="#learning-modules"
                  className="font-bold text-[var(--comic-primary)] underline decoration-2 underline-offset-2 hover:text-[var(--comic-danger)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--comic-accent)]"
                >
                  {linkPhrase}
                </a>
                {b.slice(hit + linkPhrase.length)}
              </>
            );
          } else {
            bodyInner = parts.body;
          }
        } else if (parts) {
          bodyInner = parts.body;
        } else {
          bodyInner = text;
        }

        const textInner =
          parts != null ? (
            <span className="flex flex-col gap-0.5 text-left">
              <span className="font-bold">{parts.headline}</span>
              {parts.body.length > 0 ? (
                <span className="font-normal">{bodyInner}</span>
              ) : null}
            </span>
          ) : (
            text
          );

        return (
          <li key={`pro-row-${i}`} className="flex items-start gap-3">
            <span
              className="comic-shadow-sm flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-4 border-[var(--comic-black)] pt-px text-base font-black leading-none text-white"
              style={{
                backgroundColor:
                  PLAN_CHECKLIST_COLORS[i % PLAN_CHECKLIST_COLORS.length],
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

function SubscriptionPlanPriceFooter({
  text,
  className,
}: {
  text: string;
  /** Text color utilities (tier accent). */
  className: string;
}) {
  const idx = text.indexOf(":");
  if (idx === -1) {
    return (
      <div className={`text-center comic-text font-bold text-2xl ${className}`}>
        {text}
      </div>
    );
  }
  const headline = text.slice(0, idx + 1).trim();
  const body = text.slice(idx + 1).trim();
  return (
    <div className={`text-center comic-text ${className}`}>
      <div className="font-bold text-2xl leading-tight">{headline}</div>
      {body ? (
        <div className="font-normal text-xl leading-snug mt-1">{body}</div>
      ) : null}
    </div>
  );
}

/** Same framing as in-person-learning “How it works” cards. */
function SubscriptionTierPhoto({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="mb-6 w-full shrink-0 overflow-hidden rounded-xl border-4 border-[var(--comic-black)] bg-[var(--comic-white)] shadow-[inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-2px_0_rgba(0,0,0,0.12)]">
      <img
        src={src}
        alt={alt}
        width={900}
        height={900}
        className="aspect-[4/3] w-full object-cover object-center"
        loading="lazy"
        decoding="async"
      />
    </figure>
  );
}

// Subscription Plans Section
function SubscriptionPlansSection() {
  const { t } = useI18n();
  
  return (
    <section id="subscription-plans" className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-primary)]">
          {t.onlineLearning.subscriptionTitle}
        </ComicTitle>
        <ComicText
          size="lg"
          className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto whitespace-pre-line"
        >
          {t.onlineLearning.subscriptionDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <ComicCard className="comic-shadow-lg text-center flex flex-col">
          <ComicTitle level={4} className="mb-3 pb-1 text-[var(--comic-primary)]">
            {t.onlineLearning.freeTitle}
          </ComicTitle>
          <SubscriptionTierPhoto
            src={ONLINE_SUBSCRIPTION_APP_MEMBER_URL}
            alt={String(t.onlineLearning.subscriptionAppPhotoAlt)}
          />
          <ComicFeatureChecklist
            splitLabelAfterColon
            items={[
              t.onlineLearning.freeItem1,
              t.onlineLearning.freeItem2,
              t.onlineLearning.freeItem3,
            ]}
          />
          <div className="mt-auto flex w-full flex-col items-center gap-3">
            <SubscriptionPlanPriceFooter
              text={t.onlineLearning.freeItem4}
              className="text-[var(--comic-dark)]"
            />
            <ComicButton variant="secondary" size="sm">
              {t.onlineLearning.freeButton}
            </ComicButton>
          </div>
        </ComicCard>

        <ComicCard className="comic-shadow-lg flex flex-col text-center !bg-[linear-gradient(135deg,var(--comic-yellow)_0%,#f39c12_100%)]">
          <ComicTitle
            level={4}
            className="mb-3 pb-1 text-[var(--comic-primary)]"
          >
            {t.onlineLearning.premiumTitle}
          </ComicTitle>
          <SubscriptionTierPhoto
            src={ONLINE_SUBSCRIPTION_ONE_ON_ONE_URL}
            alt={String(t.onlineLearning.subscriptionLitePhotoAlt)}
          />
          <ComicFeatureChecklist
            splitLabelAfterColon
            items={[
              t.onlineLearning.premiumItem1,
              t.onlineLearning.premiumItem2,
              t.onlineLearning.premiumItem3,
            ]}
          />
          <div className="mt-auto flex w-full flex-col items-center gap-3">
            <SubscriptionPlanPriceFooter
              text={t.onlineLearning.premiumItem4}
              className="text-[var(--comic-dark)]"
            />
            <ComicButton variant="warning" size="sm">
              {t.onlineLearning.premiumButton}
            </ComicButton>
          </div>
        </ComicCard>

        <ComicCard className="comic-shadow-lg text-center flex flex-col">
          <ComicTitle level={4} className="mb-3 pb-1 text-[var(--comic-danger)]">
            {t.onlineLearning.proTitle}
          </ComicTitle>
          <SubscriptionTierPhoto
            src={ONLINE_SUBSCRIPTION_PRO_URL}
            alt={String(t.onlineLearning.subscriptionProPhotoAlt)}
          />
          <ProMemberFeatureList />
          <div className="mt-auto flex w-full flex-col items-center gap-3">
            <SubscriptionPlanPriceFooter
              text={t.onlineLearning.proItem4}
              className="text-[var(--comic-danger)]"
            />
            <ComicButton variant="danger" size="sm">
              {t.onlineLearning.proButton}
            </ComicButton>
          </div>
        </ComicCard>
      </div>
    </section>
  );
}

export default function OnlineLearning() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <HeroSection />
      <SubscriptionPlansSection />
      <SessionTypesSection />
      <LearningModulesSearchSection />
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}

