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
    <section className="flex flex-col items-center justify-center text-center py-24 px-4 comic-bg-primary relative overflow-hidden comic-pattern-zigzag">
      <div className="absolute top-10 left-10 w-24 h-24 comic-bg-warning rounded-full comic-border-thick comic-shadow-xl comic-bounce"></div>
      <div className="absolute top-20 right-20 w-20 h-20 comic-bg-success rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '0.5s'}}></div>
      <div className="absolute bottom-20 left-20 w-16 h-16 comic-bg-danger rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '1s'}}></div>
      
      <div className="relative z-0">
        <ComicTitle level={1} className="comic-text-white mb-8 comic-wiggle">
          {t.aiVoiceCoach.heroTitle}
        </ComicTitle>
        <ComicText size="xl" className="comic-text-white mb-12 font-bold max-w-3xl mx-auto">
          {t.aiVoiceCoach.heroDesc}
        </ComicText>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <ComicButton variant="warning" size="lg" className="comic-wiggle">
            {t.aiVoiceCoach.tryNow}
          </ComicButton>
          <Link href="/ai/visual-phonics">
            <ComicButton variant="secondary" size="lg" className="comic-wiggle">
              {t.aiVoiceCoach.visualPhonics}
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
        <ComicTitle level={2} className="mb-8 text-[var(--comic-primary)]">
          {t.aiVoiceCoach.featuresTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.aiVoiceCoach.featuresDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
            {t.aiVoiceCoach.realtimeTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiVoiceCoach.realtimeDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>{t.aiVoiceCoach.realtimeItem1}</li>
            <li>{t.aiVoiceCoach.realtimeItem2}</li>
            <li>{t.aiVoiceCoach.realtimeItem3}</li>
            <li>{t.aiVoiceCoach.realtimeItem4}</li>
          </ul>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
            {t.aiVoiceCoach.accentTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiVoiceCoach.accentDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>{t.aiVoiceCoach.accentItem1}</li>
            <li>{t.aiVoiceCoach.accentItem2}</li>
            <li>{t.aiVoiceCoach.accentItem3}</li>
            <li>{t.aiVoiceCoach.accentItem4}</li>
          </ul>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-success)]">
            {t.aiVoiceCoach.progressTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiVoiceCoach.progressDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>{t.aiVoiceCoach.progressItem1}</li>
            <li>{t.aiVoiceCoach.progressItem2}</li>
            <li>{t.aiVoiceCoach.progressItem3}</li>
            <li>{t.aiVoiceCoach.progressItem4}</li>
          </ul>
        </ComicCard>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const { t } = useI18n();
  
  return (
    <section className="comic-bg-accent py-24 px-4 comic-pattern-stripes">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            {t.aiVoiceCoach.howItWorksTitle}
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            {t.aiVoiceCoach.howItWorksDesc}
          </ComicText>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8">
          <ComicCard className="comic-shadow-lg text-center">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-primary)]">
              {t.aiVoiceCoach.step1}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold">
              {t.aiVoiceCoach.step1Desc}
            </ComicText>
          </ComicCard>
          
          <ComicCard className="comic-shadow-lg text-center">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-secondary)]">
              {t.aiVoiceCoach.step2}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold">
              {t.aiVoiceCoach.step2Desc}
            </ComicText>
          </ComicCard>
          
          <ComicCard className="comic-shadow-lg text-center">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-success)]">
              {t.aiVoiceCoach.step3}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold">
              {t.aiVoiceCoach.step3Desc}
            </ComicText>
          </ComicCard>
          
          <ComicCard className="comic-shadow-lg text-center">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-warning)]">
              {t.aiVoiceCoach.step4}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold">
              {t.aiVoiceCoach.step4Desc}
            </ComicText>
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
        <ComicTitle level={2} className="mb-8 text-[var(--comic-primary)]">
          {t.aiVoiceCoach.technologyTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.aiVoiceCoach.technologyDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 gap-12">
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-6 text-[var(--comic-primary)]">
            {t.aiVoiceCoach.mlModelsTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiVoiceCoach.mlModelsDesc}
          </ComicText>
          <ul className="text-[var(--comic-dark)] space-y-2">
            <li>{t.aiVoiceCoach.mlItem1}</li>
            <li>{t.aiVoiceCoach.mlItem2}</li>
            <li>{t.aiVoiceCoach.mlItem3}</li>
            <li>{t.aiVoiceCoach.mlItem4}</li>
          </ul>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-6 text-[var(--comic-secondary)]">
            {t.aiVoiceCoach.accuracyTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiVoiceCoach.accuracyDesc}
          </ComicText>
          <ul className="text-[var(--comic-dark)] space-y-2">
            <li>{t.aiVoiceCoach.accuracyItem1}</li>
            <li>{t.aiVoiceCoach.accuracyItem2}</li>
            <li>{t.aiVoiceCoach.accuracyItem3}</li>
            <li>{t.aiVoiceCoach.accuracyItem4}</li>
          </ul>
        </ComicCard>
      </div>
    </section>
  );
}

export default function AIVoiceCoach() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TechnologySection />
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}

