import {
  HOME_AI_SPEECH_PRACTICE_URL,
  HOME_AI_VOCABULARY_SUBTITLE_IMAGE_URL,
  HOME_VIDEO_LESSON_PROMO_URL,
} from "../constants/images";
import type { Translations } from "../i18n/types";

export type EnglishFeedInnovativeFeatureBlock = {
  id: string;
  title: string;
  desc: string;
  /** Optional hero image shown after the description and before bullet items (homepage cards). */
  imageAfterDesc?: { src: string; alt: string };
  items: string[];
};

type Feed = Translations["englishFeed"];

/** Full “Innovative Features” list in the same order as /app (accordion). */
export function buildEnglishFeedInnovativeFeatureBlocks(f: Feed): EnglishFeedInnovativeFeatureBlock[] {
  const featureBlocks: EnglishFeedInnovativeFeatureBlock[] = [
    {
      id: "feature-ai-quiz",
      title: f.featureQuizTitle,
      desc: f.featureQuizDesc,
      items: [f.featureQuizItem1, f.featureQuizItem2, f.featureQuizItem3, f.featureQuizItem4],
    },
    {
      id: "feature-pronunciation",
      title: f.featurePronTitle,
      desc: f.featurePronDesc,
      items: [f.featurePronItem1, f.featurePronItem2, f.featurePronItem3, f.featurePronItem4],
    },
    {
      id: "feature-ai-vocabulary",
      title: f.featureVocabTitle,
      desc: f.featureVocabDesc,
      items: [f.featureVocabItem1, f.featureVocabItem2, f.featureVocabItem3, f.featureVocabItem4],
    },
    {
      id: "feature-ai-tutor",
      title: f.featureTutorTitle,
      desc: f.featureTutorDesc,
      items: [f.featureTutorItem1, f.featureTutorItem2, f.featureTutorItem3, f.featureTutorItem4],
    },
    {
      id: "feature-ai-flashcards",
      title: f.featureFlashTitle,
      desc: f.featureFlashDesc,
      items: [f.featureFlashItem1, f.featureFlashItem2, f.featureFlashItem3, f.featureFlashItem4],
    },
    {
      id: "feature-like-save",
      title: f.featureSaveTitle,
      desc: f.featureSaveDesc,
      items: [f.featureSaveItem1, f.featureSaveItem2, f.featureSaveItem3, f.featureSaveItem4],
    },
    {
      id: "feature-tags",
      title: f.featureTagsTitle,
      desc: f.featureTagsDesc,
      items: [f.featureTagsItem1, f.featureTagsItem2, f.featureTagsItem3, f.featureTagsItem4],
    },
    {
      id: "feature-ai-grammar",
      title: f.featureGrammarTitle,
      desc: f.featureGrammarDesc,
      items: [f.featureGrammarItem1, f.featureGrammarItem2, f.featureGrammarItem3, f.featureGrammarItem4],
    },
    {
      id: "feature-thai-support",
      title: f.featureThaiTitle,
      desc: f.featureThaiDesc,
      items: [f.featureThaiItem1, f.featureThaiItem2, f.featureThaiItem3, f.featureThaiItem4],
    },
    {
      id: "feature-personalization",
      title: f.featurePersonalTitle,
      desc: f.featurePersonalDesc,
      items: [f.featurePersonalItem1, f.featurePersonalItem2, f.featurePersonalItem3, f.featurePersonalItem4],
    },
    {
      id: "feature-analytics",
      title: f.featureAnalyticsTitle,
      desc: f.featureAnalyticsDesc,
      items: [
        f.featureAnalyticsItem1,
        f.featureAnalyticsItem2,
        f.featureAnalyticsItem3,
        f.featureAnalyticsItem4,
      ],
    },
  ];

  const accordionLead: EnglishFeedInnovativeFeatureBlock[] = [
    {
      id: "feature-video-lessons",
      title: f.videoLessonTitle,
      desc: f.videoLessonDesc,
      items: [f.videoLessonItem1, f.videoLessonItem2, f.videoLessonItem3, f.videoLessonItem4],
    },
    {
      id: "feature-interactive-subtitles",
      title: f.featuresInteractiveSubtitlesTitle,
      desc: f.featuresInteractiveSubtitlesDesc,
      items: [
        f.featuresInteractiveSubtitlesItem1,
        f.featuresInteractiveSubtitlesItem2,
        f.featuresInteractiveSubtitlesItem3,
        f.featuresInteractiveSubtitlesItem4,
      ],
    },
    {
      id: "feature-tap-word",
      title: f.tapTitle,
      desc: f.tapDesc,
      items: [f.tapItem1, f.tapItem2, f.tapItem3, f.tapItem4],
    },
  ];

  return [...accordionLead, ...featureBlocks];
}

/** First three Innovative Features (Video Lesson → Interactive Subtitles → Tap a word). */
export function getEnglishFeedInnovativeFeatureHighlights(f: Feed): EnglishFeedInnovativeFeatureBlock[] {
  return buildEnglishFeedInnovativeFeatureBlocks(f).slice(0, 3);
}

type Home = Translations["home"];

/**
 * Homepage “AI-Powered Features” trio: Video Lesson from the feed, plus two compact cards
 * whose copy lives in `home` (unified headers + max four bullets each).
 */
export function getHomepageAiPoweredFeatureBlocks(fe: Feed, home: Home): EnglishFeedInnovativeFeatureBlock[] {
  const all = buildEnglishFeedInnovativeFeatureBlocks(fe);
  const videoBase = all.find((b) => b.id === "feature-video-lessons");
  if (!videoBase) {
    throw new Error("englishFeedInnovativeFeatures: missing video lesson block");
  }

  const video: EnglishFeedInnovativeFeatureBlock = {
    ...videoBase,
    imageAfterDesc: {
      src: HOME_VIDEO_LESSON_PROMO_URL,
      alt: home.aiPoweredVideoLessonPhotoAlt,
    },
  };

  const speak: EnglishFeedInnovativeFeatureBlock = {
    id: "home-ai-powered-speak",
    title: home.aiPoweredSpeakTitle,
    desc: home.aiPoweredSpeakDesc,
    imageAfterDesc: { src: HOME_AI_SPEECH_PRACTICE_URL, alt: home.aiPoweredSpeakPhotoAlt },
    items: [
      home.aiPoweredSpeakItem1,
      home.aiPoweredSpeakItem2,
      home.aiPoweredSpeakItem3,
      home.aiPoweredSpeakItem4,
      home.aiPoweredSpeakItem5,
    ],
  };

  const interact: EnglishFeedInnovativeFeatureBlock = {
    id: "home-ai-powered-interact",
    title: home.aiPoweredInteractTitle,
    desc: home.aiPoweredInteractDesc,
    imageAfterDesc: {
      src: HOME_AI_VOCABULARY_SUBTITLE_IMAGE_URL,
      alt: home.aiPoweredInteractPhotoAlt,
    },
    items: [
      home.aiPoweredInteractItem1,
      home.aiPoweredInteractItem2,
      home.aiPoweredInteractItem3,
      home.aiPoweredInteractItem4,
      home.aiPoweredInteractItem5,
    ],
  };

  return [video, speak, interact];
}
