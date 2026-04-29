"use client";

import Link from "next/link";
import { useState } from "react";
import ComicButton from "../../components/ComicButton";
import ComicCard from "../../components/ComicCard";
import ComicTitle from "../../components/ComicTitle";
import ComicText from "../../components/ComicText";
import Footer from "../../components/Footer";
import LessonTypesSection from "../../components/LessonTypesSection";
import { useI18n } from "../../i18n/I18nProvider";

function HeroSection() {
  const { t } = useI18n();
  const heroHighlights = [
    { text: t.englishFeed.heroHighlight1, className: "comic-bg-warning" },
    { text: t.englishFeed.heroHighlight2, className: "comic-bg-secondary" },
    { text: t.englishFeed.heroHighlight3, className: "comic-bg-primary" },
    { text: t.englishFeed.heroHighlight4, className: "comic-bg-accent" },
  ];

  return (
    <section className="flex flex-col items-center justify-center text-center py-24 px-4 comic-bg-purple relative overflow-hidden comic-pattern-zigzag">
      <div className="absolute top-10 left-10 w-24 h-24 comic-bg-warning rounded-full comic-border-thick comic-shadow-xl comic-bounce" />
      <div className="absolute top-20 right-20 w-20 h-20 comic-bg-secondary rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{ animationDelay: "0.5s" }} />

      <div className="relative z-0 w-full max-w-5xl">
        <ComicTitle level={1} className="comic-text-white mb-8 comic-wiggle">
          {t.englishFeed.heroTitle}
        </ComicTitle>
        <ComicText size="xl" className="comic-text-white mb-4 font-bold max-w-3xl mx-auto">
          {t.englishFeed.heroPunch}
        </ComicText>
        <ComicText className="comic-text-white mb-10 max-w-2xl mx-auto">
          {t.englishFeed.heroDesc}
        </ComicText>

        <div className="grid sm:grid-cols-2 gap-4 mb-12 text-left">
          {heroHighlights.map((item) => (
            <ComicCard key={item.text} className={`${item.className} comic-shadow-lg`}>
              <ComicText className="comic-text-white font-bold">• {item.text}</ComicText>
            </ComicCard>
          ))}
        </div>

        <div className="flex justify-center">
          <Link href="/contact">
            <ComicButton variant="warning" size="lg" className="comic-wiggle">
              {t.nav.downloadApp}
            </ComicButton>
          </Link>
        </div>
      </div>
    </section>
  );
}

function HowSection() {
  const { t } = useI18n();
  return (
    <section className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-purple)]">
          {t.englishFeed.howTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.englishFeed.howDesc}
        </ComicText>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <ComicCard className="comic-shadow-xl text-left">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-pink)] text-center md:text-left">
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
          <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)] text-center md:text-left">
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
          </ul>
        </ComicCard>
        <ComicCard className="comic-shadow-xl text-left">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-success)] text-center md:text-left">
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
          </ul>
        </ComicCard>
      </div>
    </section>
  );
}

function VideoSection() {
  const { t } = useI18n();
  const [openFeatureId, setOpenFeatureId] = useState<string>("feature-video-lessons");
  const featureBlocks = [
    {
      id: "feature-ai-quiz",
      title: t.englishFeed.featureQuizTitle,
      desc: t.englishFeed.featureQuizDesc,
      items: [
        t.englishFeed.featureQuizItem1,
        t.englishFeed.featureQuizItem2,
        t.englishFeed.featureQuizItem3,
        t.englishFeed.featureQuizItem4,
      ],
    },
    {
      id: "feature-pronunciation",
      title: t.englishFeed.featurePronTitle,
      desc: t.englishFeed.featurePronDesc,
      items: [
        t.englishFeed.featurePronItem1,
        t.englishFeed.featurePronItem2,
        t.englishFeed.featurePronItem3,
        t.englishFeed.featurePronItem4,
      ],
    },
    {
      id: "feature-ai-vocabulary",
      title: t.englishFeed.featureVocabTitle,
      desc: t.englishFeed.featureVocabDesc,
      items: [
        t.englishFeed.featureVocabItem1,
        t.englishFeed.featureVocabItem2,
        t.englishFeed.featureVocabItem3,
        t.englishFeed.featureVocabItem4,
      ],
    },
    {
      id: "feature-ai-tutor",
      title: t.englishFeed.featureTutorTitle,
      desc: t.englishFeed.featureTutorDesc,
      items: [
        t.englishFeed.featureTutorItem1,
        t.englishFeed.featureTutorItem2,
        t.englishFeed.featureTutorItem3,
        t.englishFeed.featureTutorItem4,
      ],
    },
    {
      id: "feature-ai-flashcards",
      title: t.englishFeed.featureFlashTitle,
      desc: t.englishFeed.featureFlashDesc,
      items: [
        t.englishFeed.featureFlashItem1,
        t.englishFeed.featureFlashItem2,
        t.englishFeed.featureFlashItem3,
        t.englishFeed.featureFlashItem4,
      ],
    },
    {
      id: "feature-like-save",
      title: t.englishFeed.featureSaveTitle,
      desc: t.englishFeed.featureSaveDesc,
      items: [
        t.englishFeed.featureSaveItem1,
        t.englishFeed.featureSaveItem2,
        t.englishFeed.featureSaveItem3,
        t.englishFeed.featureSaveItem4,
      ],
    },
    {
      id: "feature-tags",
      title: t.englishFeed.featureTagsTitle,
      desc: t.englishFeed.featureTagsDesc,
      items: [
        t.englishFeed.featureTagsItem1,
        t.englishFeed.featureTagsItem2,
        t.englishFeed.featureTagsItem3,
        t.englishFeed.featureTagsItem4,
      ],
    },
    {
      id: "feature-ai-grammar",
      title: t.englishFeed.featureGrammarTitle,
      desc: t.englishFeed.featureGrammarDesc,
      items: [
        t.englishFeed.featureGrammarItem1,
        t.englishFeed.featureGrammarItem2,
        t.englishFeed.featureGrammarItem3,
        t.englishFeed.featureGrammarItem4,
      ],
    },
    {
      id: "feature-thai-support",
      title: t.englishFeed.featureThaiTitle,
      desc: t.englishFeed.featureThaiDesc,
      items: [
        t.englishFeed.featureThaiItem1,
        t.englishFeed.featureThaiItem2,
        t.englishFeed.featureThaiItem3,
        t.englishFeed.featureThaiItem4,
      ],
    },
    {
      id: "feature-personalization",
      title: t.englishFeed.featurePersonalTitle,
      desc: t.englishFeed.featurePersonalDesc,
      items: [
        t.englishFeed.featurePersonalItem1,
        t.englishFeed.featurePersonalItem2,
        t.englishFeed.featurePersonalItem3,
        t.englishFeed.featurePersonalItem4,
      ],
    },
    {
      id: "feature-analytics",
      title: t.englishFeed.featureAnalyticsTitle,
      desc: t.englishFeed.featureAnalyticsDesc,
      items: [
        t.englishFeed.featureAnalyticsItem1,
        t.englishFeed.featureAnalyticsItem2,
        t.englishFeed.featureAnalyticsItem3,
        t.englishFeed.featureAnalyticsItem4,
      ],
    },
  ];

  const accordionFeatures = [
    {
      id: "feature-video-lessons",
      title: t.englishFeed.videoLessonTitle,
      desc: t.englishFeed.videoLessonDesc,
      items: [
        t.englishFeed.videoLessonItem1,
        t.englishFeed.videoLessonItem2,
        t.englishFeed.videoLessonItem3,
        t.englishFeed.videoLessonItem4,
      ],
    },
    {
      id: "feature-interactive-subtitles",
      title: t.englishFeed.featuresInteractiveSubtitlesTitle,
      desc: t.englishFeed.featuresInteractiveSubtitlesDesc,
      items: [
        t.englishFeed.featuresInteractiveSubtitlesItem1,
        t.englishFeed.featuresInteractiveSubtitlesItem2,
        t.englishFeed.featuresInteractiveSubtitlesItem3,
        t.englishFeed.featuresInteractiveSubtitlesItem4,
      ],
    },
    {
      id: "feature-tap-word",
      title: t.englishFeed.tapTitle,
      desc: t.englishFeed.tapDesc,
      items: [t.englishFeed.tapItem1, t.englishFeed.tapItem2, t.englishFeed.tapItem3, t.englishFeed.tapItem4],
    },
    ...featureBlocks,
  ];
  return (
    <section className="comic-bg-accent py-24 px-4 comic-pattern-stripes">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8 text-5xl md:text-6xl">
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
                        className="text-[var(--comic-warning)] leading-tight break-words [overflow-wrap:anywhere]"
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
