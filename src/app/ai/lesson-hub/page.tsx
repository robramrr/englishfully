"use client";

import Link from "next/link";
import ComicButton from "../../../components/ComicButton";
import ComicCard from "../../../components/ComicCard";
import ComicTitle from "../../../components/ComicTitle";
import ComicText from "../../../components/ComicText";
import Footer from "../../../components/Footer";
import { useI18n } from "../../../i18n/I18nProvider";

// Hero Section
function HeroSection() {
  const { t } = useI18n();
  return (
    <section className="flex flex-col items-center justify-center text-center py-24 px-4 comic-bg-warning relative overflow-hidden comic-pattern-zigzag">
      <div className="absolute top-10 left-10 w-24 h-24 comic-bg-primary rounded-full comic-border-thick comic-shadow-xl comic-bounce"></div>
      <div className="absolute top-20 right-20 w-20 h-20 comic-bg-success rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '0.5s'}}></div>
      
      <div className="relative z-0">
        <ComicTitle level={1} className="comic-text-white mb-8 comic-wiggle">
          {t.aiLessonGenerator.heroTitle}
        </ComicTitle>
        <ComicText size="xl" className="comic-text-white mb-12 font-bold max-w-3xl mx-auto">
          {t.aiLessonGenerator.heroDesc}
        </ComicText>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <ComicButton variant="primary" size="lg" className="comic-wiggle">
            {t.aiLessonGenerator.generateLesson}
          </ComicButton>
          <Link href="/ai/language-tutor">
            <ComicButton variant="accent" size="lg" className="comic-wiggle">
              {t.aiLessonGenerator.conversationSimulator}
            </ComicButton>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const { t } = useI18n();
  return (
    <section className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-warning)]">
          {t.aiLessonGenerator.howItWorksTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.aiLessonGenerator.howItWorksDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-warning)]">
            {t.aiLessonGenerator.personalizedTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiLessonGenerator.personalizedDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>• {t.aiLessonGenerator.personalizedItem1}</li>
            <li>• {t.aiLessonGenerator.personalizedItem2}</li>
            <li>• {t.aiLessonGenerator.personalizedItem3}</li>
            <li>• {t.aiLessonGenerator.personalizedItem4}</li>
            <li>• {t.aiLessonGenerator.personalizedItem5}</li>
          </ul>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
            {t.aiLessonGenerator.instantTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiLessonGenerator.instantDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>• {t.aiLessonGenerator.instantItem1}</li>
            <li>• {t.aiLessonGenerator.instantItem2}</li>
            <li>• {t.aiLessonGenerator.instantItem3}</li>
            <li>• {t.aiLessonGenerator.instantItem4}</li>
          </ul>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-success)]">
            {t.aiLessonGenerator.completeTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiLessonGenerator.completeDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>• {t.aiLessonGenerator.completeItem0}</li>
            <li>• {t.aiLessonGenerator.completeItem1}</li>
            <li>• {t.aiLessonGenerator.completeItem2}</li>
            <li>• {t.aiLessonGenerator.completeItem3}</li>
            <li>• {t.aiLessonGenerator.completeItem5}</li>
            <li>• {t.aiLessonGenerator.completeItem6}</li>
          </ul>
        </ComicCard>
      </div>
    </section>
  );
}

// Lesson Types Section
function LessonTypesSection() {
  const { t } = useI18n();
  return (
    <section className="comic-bg-primary py-24 px-4 comic-pattern-dots">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            {t.aiLessonGenerator.lessonTypesTitle}
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            {t.aiLessonGenerator.lessonTypesDesc}
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
              <ComicButton variant="primary" size="sm">
                {t.aiLessonGenerator.generateListeningLesson}
              </ComicButton>
              <Link href="/ai/video-lab">
                <ComicButton variant="accent" size="sm">
                  {t.aiLessonGenerator.listeningVideoLearningButton}
                </ComicButton>
              </Link>
            </div>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-secondary)]">
              {t.aiLessonGenerator.speakingTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.aiLessonGenerator.speakingDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• {t.aiLessonGenerator.speakingItem1}</li>
              <li>• {t.aiLessonGenerator.speakingItem2}</li>
              <li>• {t.aiLessonGenerator.speakingItem3}</li>
            </ul>
            <ComicButton variant="primary" size="sm">
              {t.aiLessonGenerator.generateSpeakingLesson}
            </ComicButton>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-success)]">
              {t.aiLessonGenerator.readingTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.aiLessonGenerator.readingDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• {t.aiLessonGenerator.readingItem1}</li>
              <li>• {t.aiLessonGenerator.readingItem2}</li>
              <li>• {t.aiLessonGenerator.readingItem3}</li>
            </ul>
            <div className="flex flex-wrap gap-2">
              <ComicButton variant="success" size="sm">
                {t.aiLessonGenerator.generateReadingLesson}
              </ComicButton>
              <Link href="/ai/video-lab">
                <ComicButton variant="accent" size="sm">
                  {t.aiLessonGenerator.readingVideoLabButton}
                </ComicButton>
              </Link>
            </div>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-warning)]">
              {t.aiLessonGenerator.writingTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.aiLessonGenerator.writingDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• {t.aiLessonGenerator.writingItem1}</li>
              <li>• {t.aiLessonGenerator.writingItem2}</li>
              <li>• {t.aiLessonGenerator.writingItem3}</li>
            </ul>
            <ComicButton variant="warning" size="sm">
              {t.aiLessonGenerator.generateWritingLesson}
            </ComicButton>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-primary)]">
              {t.aiLessonGenerator.grammarTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.aiLessonGenerator.grammarDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• {t.aiLessonGenerator.grammarItem1}</li>
              <li>• {t.aiLessonGenerator.grammarItem2}</li>
              <li>• {t.aiLessonGenerator.grammarItem3}</li>
            </ul>
            <div className="flex flex-wrap gap-2">
              <Link href="/ai/language-tutor">
                <ComicButton variant="primary" size="sm">
                  {t.aiLessonGenerator.generateGrammarLesson}
                </ComicButton>
              </Link>
              <ComicButton variant="secondary" size="sm">
                {t.aiLessonGenerator.grammarGrammarButton}
              </ComicButton>
            </div>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-accent)]">
              {t.aiLessonGenerator.vocabularyTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.aiLessonGenerator.vocabularyDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• {t.aiLessonGenerator.vocabularyItem1}</li>
              <li>• {t.aiLessonGenerator.vocabularyItem2}</li>
              <li>• {t.aiLessonGenerator.vocabularyItem3}</li>
            </ul>
            <div className="flex flex-wrap gap-2">
              <ComicButton variant="warning" size="sm">
                {t.aiLessonGenerator.vocabularyFlashcardsButton}
              </ComicButton>
              <Link href="/ai/video-lab">
                <ComicButton variant="accent" size="sm">
                  {t.aiLessonGenerator.vocabularyVideoLabButton}
                </ComicButton>
              </Link>
            </div>
          </ComicCard>
        </div>
      </div>
    </section>
  );
}

export default function AILessonHub() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <HeroSection />
      <FeaturesSection />
      <LessonTypesSection />
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
