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
    <section className="flex flex-col items-center justify-center text-center py-24 px-4 comic-bg-secondary relative overflow-hidden comic-pattern-zigzag">
      <div className="absolute top-10 left-10 w-24 h-24 comic-bg-warning rounded-full comic-border-thick comic-shadow-xl comic-bounce"></div>
      <div className="absolute top-20 right-20 w-20 h-20 comic-bg-primary rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '0.5s'}}></div>
      
      <div className="relative z-0">
        <ComicTitle level={1} className="comic-text-white mb-8 comic-wiggle">
          {t.aiVisualPhonics.heroTitle}
        </ComicTitle>
        <ComicText size="xl" className="comic-text-white mb-12 font-bold max-w-3xl mx-auto">
          {t.aiVisualPhonics.heroDesc}
        </ComicText>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <ComicButton variant="warning" size="lg" className="comic-wiggle">
            {t.aiVisualPhonics.tryVisualPhonics}
          </ComicButton>
          <Link href="/ai/voice-coach">
            <ComicButton variant="primary" size="lg" className="comic-wiggle">
              {t.aiVisualPhonics.voiceCoach}
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
        <ComicTitle level={2} className="mb-8 text-[var(--comic-secondary)]">
          {t.aiVisualPhonics.featuresTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.aiVisualPhonics.featuresDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
            {t.aiVisualPhonics.mouthTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiVisualPhonics.mouthDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>• {t.aiVisualPhonics.mouthItem1}</li>
            <li>• {t.aiVisualPhonics.mouthItem2}</li>
            <li>• {t.aiVisualPhonics.mouthItem3}</li>
            <li>• {t.aiVisualPhonics.mouthItem4}</li>
          </ul>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
            {t.aiVisualPhonics.soundWaveTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiVisualPhonics.soundWaveDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>• {t.aiVisualPhonics.soundWaveItem1}</li>
            <li>• {t.aiVisualPhonics.soundWaveItem2}</li>
            <li>• {t.aiVisualPhonics.soundWaveItem3}</li>
            <li>• {t.aiVisualPhonics.soundWaveItem4}</li>
          </ul>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-success)]">
            {t.aiVisualPhonics.phoneticTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiVisualPhonics.phoneticDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>• {t.aiVisualPhonics.phoneticItem1}</li>
            <li>• {t.aiVisualPhonics.phoneticItem2}</li>
            <li>• {t.aiVisualPhonics.phoneticItem3}</li>
            <li>• {t.aiVisualPhonics.phoneticItem4}</li>
          </ul>
        </ComicCard>
      </div>
    </section>
  );
}

// Interactive Exercises Section
function InteractiveExercisesSection() {
  const { t } = useI18n();
  return (
    <section className="comic-bg-warning py-24 px-4 comic-pattern-dots">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            {t.aiVisualPhonics.exercisesTitle}
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            {t.aiVisualPhonics.exercisesDesc}
          </ComicText>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-primary)]">
              {t.aiVisualPhonics.matchingTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.aiVisualPhonics.matchingDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• {t.aiVisualPhonics.matchingItem1}</li>
              <li>• {t.aiVisualPhonics.matchingItem2}</li>
              <li>• {t.aiVisualPhonics.matchingItem3}</li>
              <li>• {t.aiVisualPhonics.matchingItem4}</li>
            </ul>
            <ComicButton variant="primary" size="sm">
              {t.aiVisualPhonics.playSoundMatching}
            </ComicButton>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-secondary)]">
              {t.aiVisualPhonics.studioTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.aiVisualPhonics.studioDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• {t.aiVisualPhonics.studioItem1}</li>
              <li>• {t.aiVisualPhonics.studioItem2}</li>
              <li>• {t.aiVisualPhonics.studioItem3}</li>
              <li>• {t.aiVisualPhonics.studioItem4}</li>
            </ul>
            <ComicButton variant="secondary" size="sm">
              {t.aiVisualPhonics.openStudio}
            </ComicButton>
          </ComicCard>
        </div>
      </div>
    </section>
  );
}

// Technology Section
function TechnologySection() {
  const { t } = useI18n();
  return (
    <section className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-secondary)]">
          {t.aiVisualPhonics.techTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.aiVisualPhonics.techDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 gap-12">
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-6 text-[var(--comic-secondary)]">
            {t.aiVisualPhonics.visualizationTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiVisualPhonics.visualizationDesc}
          </ComicText>
          <ul className="text-[var(--comic-dark)] space-y-2">
            <li>• {t.aiVisualPhonics.visualizationItem1}</li>
            <li>• {t.aiVisualPhonics.visualizationItem2}</li>
            <li>• {t.aiVisualPhonics.visualizationItem3}</li>
            <li>• {t.aiVisualPhonics.visualizationItem4}</li>
          </ul>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-6 text-[var(--comic-primary)]">
            {t.aiVisualPhonics.audioTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiVisualPhonics.audioDesc}
          </ComicText>
          <ul className="text-[var(--comic-dark)] space-y-2">
            <li>• {t.aiVisualPhonics.audioItem1}</li>
            <li>• {t.aiVisualPhonics.audioItem2}</li>
            <li>• {t.aiVisualPhonics.audioItem3}</li>
            <li>• {t.aiVisualPhonics.audioItem4}</li>
          </ul>
        </ComicCard>
      </div>
    </section>
  );
}

export default function VisualPhonics() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <HeroSection />
      <FeaturesSection />
      <InteractiveExercisesSection />
      <TechnologySection />
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
