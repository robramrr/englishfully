"use client";

import { useState, type CSSProperties } from "react";
import ComicButton from "../../components/ComicButton";
import ComicCard from "../../components/ComicCard";
import ComicTitle from "../../components/ComicTitle";
import ComicText from "../../components/ComicText";
import {
  ENGLISHFEED_APP_HERO_CIRCLE_URLS,
  ENGLISHFEED_DEMO_URL,
  ENGLISHFEED_HOMEPAGE_VIMEO_EMBED_SRC,
} from "../../constants/englishfeed";
import Footer from "../../components/Footer";
import LessonTypesSection from "../../components/LessonTypesSection";
import { buildEnglishFeedInnovativeFeatureBlocks } from "../../data/englishFeedInnovativeFeatures";
import { useI18n } from "../../i18n/I18nProvider";

const APP_HERO_CIRCLE_DELAYS = ["0s", "0.5s", "1s", "1.5s"] as const;

function AppHeroPhotoCircle({
  src,
  className = "",
  style,
}: {
  src: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-full comic-border-thick comic-shadow-xl comic-bounce sm:h-24 sm:w-24 md:h-32 md:w-32 ${className}`}
      style={style}
      aria-hidden
    >
      <img src={src} alt="" className="h-full w-full object-cover object-center" />
    </div>
  );
}

function HeroSection() {
  const { t } = useI18n();

  return (
    <section
      id="app-englishfeed-hero"
      className="relative overflow-hidden comic-bg-purple comic-pattern-zigzag py-10 max-md:py-12 md:min-h-[560px] md:py-16"
    >
      <div className="relative z-10 mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 gap-7 px-2 max-md:gap-5 max-md:px-3 md:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] md:gap-x-10 md:gap-y-6 md:items-start md:px-4">
        <div className="min-w-0 text-center md:col-start-1 md:row-start-1 md:max-w-3xl md:text-left">
          <ComicTitle
            level={1}
            className="comic-text-white comic-wiggle mb-0 max-md:text-2xl max-md:leading-tight sm:max-md:text-3xl"
          >
            {t.englishFeed.heroTitle}
          </ComicTitle>
        </div>

        <div className="flex min-w-0 flex-col items-center gap-2 text-center sm:gap-2.5 md:col-start-1 md:row-start-2 md:items-stretch md:text-left">
          <div className="inline-block max-w-full rounded-md bg-red-500/70 px-3 py-2 max-md:px-3 md:px-4 md:py-3 [&_.comic-text]:inline [&_.comic-text]:align-middle">
            <ComicText size="xl" weight="normal" className="comic-text-white mb-0 max-md:!text-base">
              {t.englishFeed.heroPunch}{" "}
            </ComicText>
            <ComicButton
              variant="warning"
              size="sm"
              className="comic-wiggle ml-2 inline-block align-middle !px-4 !py-1.5 max-md:!text-base"
              href={ENGLISHFEED_DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.nav.downloadApp}
            </ComicButton>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:justify-start">
            {ENGLISHFEED_APP_HERO_CIRCLE_URLS.map((src, index) => (
              <AppHeroPhotoCircle
                key={src}
                src={src}
                style={{ animationDelay: APP_HERO_CIRCLE_DELAYS[index] }}
              />
            ))}
          </div>
        </div>

        <div className="w-full min-w-0 md:col-start-2 md:row-start-2 md:self-start">
          <div className="overflow-hidden rounded-2xl comic-border-thick comic-shadow-xl bg-[var(--comic-black)]">
            <div className="relative aspect-video w-full min-h-[220px]">
              <iframe
                src={ENGLISHFEED_HOMEPAGE_VIMEO_EMBED_SRC}
                className="absolute inset-0 h-full w-full"
                frameBorder={0}
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                title="EnglishFeed promo video"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowSection() {
  const { t } = useI18n();
  return (
    <section className="comic-bg-edtech relative w-full overflow-hidden py-24">
      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-title-no-shadow mb-8 text-[var(--comic-primary)]">
            {t.englishFeed.howTitle}
          </ComicTitle>
          <ComicText size="lg" className="text-[var(--brand-navy)] font-bold max-w-4xl mx-auto">
            {t.englishFeed.howDesc}
          </ComicText>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <ComicCard className="comic-shadow-xl text-left">
            <ComicTitle
              level={3}
              className="comic-title-no-shadow mb-4 text-center text-[var(--comic-pink)] md:text-left"
            >
              {t.englishFeed.howStep1Title}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4 text-center">
              {t.englishFeed.howStep1Desc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 font-bold">
              <li>• {t.englishFeed.howStep1Item1}</li>
              <li>• {t.englishFeed.howStep1Item2}</li>
              <li>• {t.englishFeed.howStep1Item3}</li>
              <li>• {t.englishFeed.howStep1Item4}</li>
            </ul>
          </ComicCard>
          <ComicCard className="comic-shadow-xl text-left">
            <ComicTitle
              level={3}
              className="comic-title-no-shadow mb-4 text-center text-[var(--comic-secondary)] md:text-left"
            >
              {t.englishFeed.howStep2Title}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4 text-center">
              {t.englishFeed.howStep2Desc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 font-bold">
              <li>• {t.englishFeed.howStep2Item1}</li>
              <li>• {t.englishFeed.howStep2Item2}</li>
              <li>• {t.englishFeed.howStep2Item3}</li>
              <li>• {t.englishFeed.howStep2Item4}</li>
              <li>• {t.englishFeed.howStep2Item5}</li>
            </ul>
          </ComicCard>
          <ComicCard className="comic-shadow-xl text-left">
            <ComicTitle
              level={3}
              className="comic-title-no-shadow mb-4 text-center text-[var(--comic-success)] md:text-left"
            >
              {t.englishFeed.howStep3Title}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4 text-center">
              {t.englishFeed.howStep3Desc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 font-bold">
              <li>• {t.englishFeed.howStep3Item1}</li>
              <li>• {t.englishFeed.howStep3Item2}</li>
              <li>• {t.englishFeed.howStep3Item3}</li>
              <li>• {t.englishFeed.howStep3Item4}</li>
              <li>• {t.englishFeed.howStep3Item5}</li>
            </ul>
          </ComicCard>
        </div>
      </div>
    </section>
  );
}

function VideoSection() {
  const { t } = useI18n();
  const [openFeatureId, setOpenFeatureId] = useState<string>("feature-video-lessons");
  const accordionFeatures = buildEnglishFeedInnovativeFeatureBlocks(t.englishFeed);

  return (
    <section id="englishfeed-innovative-features" className="comic-bg-accent py-24 px-4 comic-pattern-stripes">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white comic-title-no-shadow mb-8 text-5xl md:text-6xl">
            {t.englishFeed.videoTitle}
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            {t.englishFeed.videoDesc}
          </ComicText>
        </div>

        <div className="space-y-4">
          {accordionFeatures.map((block) => {
            const isOpen = openFeatureId === block.id;
            return (
              <div key={block.id} id={block.id}>
                <button
                  type="button"
                  onClick={() => setOpenFeatureId(isOpen ? "" : block.id)}
                  className="w-full text-left"
                  aria-expanded={isOpen}
                >
                  <ComicCard className="comic-shadow-xl">
                    <div className="flex items-center justify-between gap-4">
                      <ComicTitle
                        level={3}
                        className="comic-title-no-shadow leading-tight break-words text-[var(--comic-primary)] [overflow-wrap:anywhere]"
                      >
                        {block.title}
                      </ComicTitle>
                      <ComicText className="text-[var(--comic-dark)] font-black text-2xl">
                        {isOpen ? "−" : "+"}
                      </ComicText>
                    </div>
                  </ComicCard>
                </button>
                {isOpen && (
                  <ComicCard className="comic-shadow-xl mt-2">
                    <ComicText className="text-[var(--comic-dark)] font-bold mb-4">{block.desc}</ComicText>
                    <ul className="text-left text-[var(--comic-dark)] space-y-2">
                      {block.items.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                    {block.id === "feature-pronunciation" && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
                        <div className="rounded-lg comic-border comic-shadow-md comic-bg-primary p-3">
                          <ComicText className="comic-text-white font-black text-base mb-1">
                            {t.englishFeed.speakingFlowStep2Title}
                          </ComicText>
                          <ComicText className="comic-text-white text-sm font-bold hidden sm:block">
                            {t.englishFeed.speakingFlowStep2Desc}
                          </ComicText>
                        </div>
                        <div className="rounded-lg comic-border comic-shadow-md comic-bg-secondary p-3">
                          <ComicText className="comic-text-white font-black text-base mb-1">
                            {t.englishFeed.speakingFlowStep3Title}
                          </ComicText>
                          <ComicText className="comic-text-white text-sm font-bold hidden sm:block">
                            {t.englishFeed.speakingFlowStep3Desc}
                          </ComicText>
                        </div>
                        <div className="rounded-lg comic-border comic-shadow-md comic-bg-success p-3">
                          <ComicText className="comic-text-white font-black text-base mb-1">
                            {t.englishFeed.speakingFlowStep4Title}
                          </ComicText>
                          <ComicText className="comic-text-white text-sm font-bold hidden sm:block">
                            {t.englishFeed.speakingFlowStep4Desc}
                          </ComicText>
                        </div>
                      </div>
                    )}
                  </ComicCard>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function EnglishFeedPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <HeroSection />
      <HowSection />
      <LessonTypesSection variant="englishFeed" />
      <VideoSection />
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
