"use client";

import Link from "next/link";
import ComicButton from "./ComicButton";
import ComicCard from "./ComicCard";
import ComicTitle from "./ComicTitle";
import ComicText from "./ComicText";
import { useI18n } from "../i18n/I18nProvider";

type LessonTypesVariant = "lessonHub" | "englishFeed";

/** Same label → same ComicButton variant across Listening / Speaking / Reading on /app */
const ENGLISH_FEED_ACTION_VARIANTS = {
  videoLessons: "primary",
  aiTutor: "accent",
  tapAWord: "secondary",
  pronunciation: "danger",
  aiFlashcards: "warning",
  aiQuiz: "success",
  interactiveSubtitles: "accent",
  vocabulary: "secondary",
  aiVocabulary: "success",
} as const;

interface LessonTypesSectionProps {
  variant?: LessonTypesVariant;
}

export default function LessonTypesSection({
  variant = "lessonHub",
}: LessonTypesSectionProps) {
  const { t } = useI18n();
  return (
    <section className="comic-bg-primary py-24 px-4 comic-pattern-dots">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            {variant === "englishFeed"
              ? t.englishFeed.lessonTypesTitle
              : t.aiLessonGenerator.lessonTypesTitle}
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            {variant === "englishFeed"
              ? t.englishFeed.lessonTypesDesc
              : t.aiLessonGenerator.lessonTypesDesc}
          </ComicText>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-primary)]">
              {t.aiLessonGenerator.listeningTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.aiLessonGenerator.listeningDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• {t.aiLessonGenerator.listeningItem1}</li>
              <li>• {t.aiLessonGenerator.listeningItem2}</li>
              <li>• {t.aiLessonGenerator.listeningItem3}</li>
            </ul>
            <div className="flex flex-wrap gap-2">
              {variant === "englishFeed" ? (
                <>
                  <Link href="#feature-video-lessons">
                    <ComicButton
                      variant={ENGLISH_FEED_ACTION_VARIANTS.videoLessons}
                      size="sm"
                    >
                      {t.englishFeed.listeningActionVideoLessons}
                    </ComicButton>
                  </Link>
                  <Link href="#feature-ai-tutor">
                    <ComicButton
                      variant={ENGLISH_FEED_ACTION_VARIANTS.aiTutor}
                      size="sm"
                    >
                      {t.englishFeed.listeningActionAiTutor}
                    </ComicButton>
                  </Link>
                </>
              ) : (
                <>
                  <ComicButton variant="primary" size="sm">
                    {t.aiLessonGenerator.generateListeningLesson}
                  </ComicButton>
                  <Link href="/app">
                    <ComicButton variant="accent" size="sm">
                      {t.aiLessonGenerator.listeningVideoLearningButton}
                    </ComicButton>
                  </Link>
                </>
              )}
            </div>
          </ComicCard>

          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-secondary)]">
              {variant === "englishFeed"
                ? t.englishFeed.speakingTitle
                : t.aiLessonGenerator.speakingTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {variant === "englishFeed"
                ? t.englishFeed.speakingDesc
                : t.aiLessonGenerator.speakingDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              {variant === "englishFeed" ? (
                <>
                  <li>• {t.englishFeed.speakingItem1}</li>
                  <li>• {t.englishFeed.speakingItem2}</li>
                  <li>• {t.englishFeed.speakingItem3}</li>
                  <li>• {t.englishFeed.speakingItem4}</li>
                </>
              ) : (
                <>
                  <li>• {t.aiLessonGenerator.speakingItem1}</li>
                  <li>• {t.aiLessonGenerator.speakingItem2}</li>
                  <li>• {t.aiLessonGenerator.speakingItem3}</li>
                </>
              )}
            </ul>
            {variant === "englishFeed" ? (
              <div className="flex flex-wrap gap-2">
                <Link href="#feature-ai-tutor">
                  <ComicButton
                    variant={ENGLISH_FEED_ACTION_VARIANTS.aiTutor}
                    size="sm"
                  >
                    {t.englishFeed.listeningActionAiTutor}
                  </ComicButton>
                </Link>
                <Link href="#feature-pronunciation">
                  <ComicButton
                    variant={ENGLISH_FEED_ACTION_VARIANTS.pronunciation}
                    size="sm"
                  >
                    {t.englishFeed.speakingActionPronunciationPractice}
                  </ComicButton>
                </Link>
              </div>
            ) : (
              <ComicButton variant="primary" size="sm">
                {t.aiLessonGenerator.generateSpeakingLesson}
              </ComicButton>
            )}
          </ComicCard>

          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-success)]">
              {variant === "englishFeed"
                ? t.englishFeed.readingTitle
                : t.aiLessonGenerator.readingTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {variant === "englishFeed"
                ? t.englishFeed.readingDesc
                : t.aiLessonGenerator.readingDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              {variant === "englishFeed" ? (
                <>
                  <li>• {t.englishFeed.readingItem1}</li>
                  <li>• {t.englishFeed.readingItem2}</li>
                  <li>• {t.englishFeed.readingItem3}</li>
                  <li>• {t.englishFeed.readingItem4}</li>
                </>
              ) : (
                <>
                  <li>• {t.aiLessonGenerator.readingItem1}</li>
                  <li>• {t.aiLessonGenerator.readingItem2}</li>
                  <li>• {t.aiLessonGenerator.readingItem3}</li>
                </>
              )}
            </ul>
            {variant === "englishFeed" ? (
              <div className="flex flex-wrap gap-2">
                <Link href="#feature-video-lessons">
                  <ComicButton
                    variant={ENGLISH_FEED_ACTION_VARIANTS.videoLessons}
                    size="sm"
                  >
                    {t.englishFeed.listeningActionVideoLessons}
                  </ComicButton>
                </Link>
                <Link href="#feature-ai-tutor">
                  <ComicButton
                    variant={ENGLISH_FEED_ACTION_VARIANTS.aiTutor}
                    size="sm"
                  >
                    {t.englishFeed.listeningActionAiTutor}
                  </ComicButton>
                </Link>
                <Link href="#feature-interactive-subtitles">
                  <ComicButton
                    variant={ENGLISH_FEED_ACTION_VARIANTS.interactiveSubtitles}
                    size="sm"
                  >
                    {t.englishFeed.readingActionInteractiveSubtitles}
                  </ComicButton>
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <ComicButton variant="success" size="sm">
                  {t.aiLessonGenerator.generateReadingLesson}
                </ComicButton>
                <Link href="/app">
                  <ComicButton variant="accent" size="sm">
                    {t.aiLessonGenerator.readingVideoLabButton}
                  </ComicButton>
                </Link>
              </div>
            )}
          </ComicCard>

          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-warning)]">
              {variant === "englishFeed"
                ? t.englishFeed.writingTitle
                : t.aiLessonGenerator.writingTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {variant === "englishFeed"
                ? t.englishFeed.writingDesc
                : t.aiLessonGenerator.writingDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              {variant === "englishFeed" ? (
                <>
                  <li>• {t.englishFeed.writingItem1}</li>
                  <li>• {t.englishFeed.writingItem2}</li>
                  <li>• {t.englishFeed.writingItem3}</li>
                </>
              ) : (
                <>
                  <li>• {t.aiLessonGenerator.writingItem1}</li>
                  <li>• {t.aiLessonGenerator.writingItem2}</li>
                  <li>• {t.aiLessonGenerator.writingItem3}</li>
                </>
              )}
            </ul>
            {variant === "englishFeed" ? (
              <div className="flex flex-wrap gap-2">
                <Link href="#feature-ai-tutor">
                  <ComicButton
                    variant={ENGLISH_FEED_ACTION_VARIANTS.aiTutor}
                    size="sm"
                  >
                    {t.englishFeed.listeningActionAiTutor}
                  </ComicButton>
                </Link>
                <Link href="#feature-ai-quiz">
                  <ComicButton
                    variant={ENGLISH_FEED_ACTION_VARIANTS.aiQuiz}
                    size="sm"
                  >
                    {t.englishFeed.listeningActionAiQuiz}
                  </ComicButton>
                </Link>
              </div>
            ) : (
              <ComicButton variant="warning" size="sm">
                {t.aiLessonGenerator.generateWritingLesson}
              </ComicButton>
            )}
          </ComicCard>

          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-primary)]">
              {variant === "englishFeed"
                ? t.englishFeed.grammarTitle
                : t.aiLessonGenerator.grammarTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {variant === "englishFeed"
                ? t.englishFeed.grammarDesc
                : t.aiLessonGenerator.grammarDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              {variant === "englishFeed" ? (
                <>
                  <li>• {t.englishFeed.grammarItem1}</li>
                  <li>• {t.englishFeed.grammarItem2}</li>
                  <li>• {t.englishFeed.grammarItem3}</li>
                </>
              ) : (
                <>
                  <li>• {t.aiLessonGenerator.grammarItem1}</li>
                  <li>• {t.aiLessonGenerator.grammarItem2}</li>
                  <li>• {t.aiLessonGenerator.grammarItem3}</li>
                </>
              )}
            </ul>
            <div className="flex flex-wrap gap-2">
              {variant === "englishFeed" ? (
                <>
                  <Link href="#feature-ai-tutor">
                    <ComicButton
                      variant={ENGLISH_FEED_ACTION_VARIANTS.aiTutor}
                      size="sm"
                    >
                      {t.englishFeed.listeningActionAiTutor}
                    </ComicButton>
                  </Link>
                  <Link href="#feature-ai-grammar">
                    <ComicButton variant="secondary" size="sm">
                      {t.aiLessonGenerator.grammarGrammarButton}
                    </ComicButton>
                  </Link>
                  <Link href="#feature-ai-quiz">
                    <ComicButton
                      variant={ENGLISH_FEED_ACTION_VARIANTS.aiQuiz}
                      size="sm"
                    >
                      {t.englishFeed.listeningActionAiQuiz}
                    </ComicButton>
                  </Link>
                  <Link href="#feature-pronunciation">
                    <ComicButton
                      variant={ENGLISH_FEED_ACTION_VARIANTS.pronunciation}
                      size="sm"
                    >
                      {t.englishFeed.speakingActionPronunciationPractice}
                    </ComicButton>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/app">
                    <ComicButton variant="primary" size="sm">
                      {t.aiLessonGenerator.generateGrammarLesson}
                    </ComicButton>
                  </Link>
                  <ComicButton variant="secondary" size="sm">
                    {t.aiLessonGenerator.grammarGrammarButton}
                  </ComicButton>
                </>
              )}
            </div>
          </ComicCard>

          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-accent)]">
              {variant === "englishFeed"
                ? t.englishFeed.vocabularyTitle
                : t.aiLessonGenerator.vocabularyTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {variant === "englishFeed"
                ? t.englishFeed.vocabularyDesc
                : t.aiLessonGenerator.vocabularyDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              {variant === "englishFeed" ? (
                <>
                  <li>• {t.englishFeed.vocabularyItem1}</li>
                  <li>• {t.englishFeed.vocabularyItem2}</li>
                  <li>• {t.englishFeed.vocabularyItem3}</li>
                </>
              ) : (
                <>
                  <li>• {t.aiLessonGenerator.vocabularyItem1}</li>
                  <li>• {t.aiLessonGenerator.vocabularyItem2}</li>
                  <li>• {t.aiLessonGenerator.vocabularyItem3}</li>
                </>
              )}
            </ul>
            {variant === "englishFeed" ? (
              <div className="flex flex-wrap gap-2">
                <Link href="#feature-tap-word">
                  <ComicButton
                    variant={ENGLISH_FEED_ACTION_VARIANTS.tapAWord}
                    size="sm"
                  >
                    {t.englishFeed.listeningActionWordPlayback}
                  </ComicButton>
                </Link>
                <Link href="#feature-ai-vocabulary">
                  <ComicButton
                    variant={ENGLISH_FEED_ACTION_VARIANTS.aiVocabulary}
                    size="sm"
                  >
                    {t.englishFeed.writingActionVocabulary}
                  </ComicButton>
                </Link>
                <Link href="#feature-ai-flashcards">
                  <ComicButton
                    variant={ENGLISH_FEED_ACTION_VARIANTS.aiFlashcards}
                    size="sm"
                  >
                    {t.englishFeed.speakingActionAiFlashcards}
                  </ComicButton>
                </Link>
                <Link href="#feature-ai-quiz">
                  <ComicButton
                    variant={ENGLISH_FEED_ACTION_VARIANTS.aiQuiz}
                    size="sm"
                  >
                    {t.englishFeed.listeningActionAiQuiz}
                  </ComicButton>
                </Link>
                <Link href="#feature-interactive-subtitles">
                  <ComicButton
                    variant={ENGLISH_FEED_ACTION_VARIANTS.interactiveSubtitles}
                    size="sm"
                  >
                    {t.englishFeed.readingActionInteractiveSubtitles}
                  </ComicButton>
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <ComicButton variant="warning" size="sm">
                  {t.aiLessonGenerator.vocabularyFlashcardsButton}
                </ComicButton>
                <Link href="/app">
                  <ComicButton variant="accent" size="sm">
                    {t.aiLessonGenerator.vocabularyVideoLabButton}
                  </ComicButton>
                </Link>
              </div>
            )}
          </ComicCard>
        </div>
      </div>
    </section>
  );
}
