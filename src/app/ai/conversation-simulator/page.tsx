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
    <section className="flex flex-col items-center justify-center text-center py-24 px-4 comic-bg-accent relative overflow-hidden comic-pattern-zigzag">
      <div className="absolute top-10 left-10 w-24 h-24 comic-bg-warning rounded-full comic-border-thick comic-shadow-xl comic-bounce"></div>
      <div className="absolute top-20 right-20 w-20 h-20 comic-bg-success rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '0.5s'}}></div>
      
      <div className="relative z-0">
        <ComicTitle level={1} className="comic-text-white mb-8 comic-wiggle">
          {t.aiConversationSimulator.heroTitle}
        </ComicTitle>
        <ComicText size="xl" className="comic-text-white mb-12 font-bold max-w-3xl mx-auto">
          {t.aiConversationSimulator.heroDesc}
        </ComicText>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <ComicButton variant="warning" size="lg" className="comic-wiggle">
            {t.aiConversationSimulator.startConversation}
          </ComicButton>
          <Link href="/ai/voice-coach">
            <ComicButton variant="primary" size="lg" className="comic-wiggle">
              {t.aiConversationSimulator.voiceCoach}
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
        <ComicTitle level={2} className="mb-8 text-[var(--comic-accent)]">
          {t.aiConversationSimulator.featuresTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.aiConversationSimulator.featuresDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
            {t.aiConversationSimulator.businessTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiConversationSimulator.businessDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>• {t.aiConversationSimulator.businessItem1}</li>
            <li>• {t.aiConversationSimulator.businessItem2}</li>
            <li>• {t.aiConversationSimulator.businessItem3}</li>
            <li>• {t.aiConversationSimulator.businessItem4}</li>
          </ul>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
            {t.aiConversationSimulator.dailyTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiConversationSimulator.dailyDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>• {t.aiConversationSimulator.dailyItem1}</li>
            <li>• {t.aiConversationSimulator.dailyItem2}</li>
            <li>• {t.aiConversationSimulator.dailyItem3}</li>
            <li>• {t.aiConversationSimulator.dailyItem4}</li>
          </ul>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-success)]">
            {t.aiConversationSimulator.academicTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiConversationSimulator.academicDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>• {t.aiConversationSimulator.academicItem1}</li>
            <li>• {t.aiConversationSimulator.academicItem2}</li>
            <li>• {t.aiConversationSimulator.academicItem3}</li>
            <li>• {t.aiConversationSimulator.academicItem4}</li>
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
    <section className="comic-bg-success py-24 px-4 comic-pattern-stripes">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            {t.aiConversationSimulator.howItWorksTitle}
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            {t.aiConversationSimulator.howItWorksDesc}
          </ComicText>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8">
          <ComicCard className="comic-shadow-lg text-center">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-primary)]">
              {t.aiConversationSimulator.step1Title}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold">
              {t.aiConversationSimulator.step1Desc}
            </ComicText>
          </ComicCard>
          
          <ComicCard className="comic-shadow-lg text-center">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-secondary)]">
              {t.aiConversationSimulator.step2Title}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold">
              {t.aiConversationSimulator.step2Desc}
            </ComicText>
          </ComicCard>
          
          <ComicCard className="comic-shadow-lg text-center">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-success)]">
              {t.aiConversationSimulator.step3Title}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold">
              {t.aiConversationSimulator.step3Desc}
            </ComicText>
          </ComicCard>
          
          <ComicCard className="comic-shadow-lg text-center">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-warning)]">
              {t.aiConversationSimulator.step4Title}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold">
              {t.aiConversationSimulator.step4Desc}
            </ComicText>
          </ComicCard>
        </div>
      </div>
    </section>
  );
}

// AI Technology Section
function AITechnologySection() {
  const { t } = useI18n();
  return (
    <section className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-accent)]">
          {t.aiConversationSimulator.techTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.aiConversationSimulator.techDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 gap-12">
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-6 text-[var(--comic-accent)]">
            {t.aiConversationSimulator.nluTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiConversationSimulator.nluDesc}
          </ComicText>
          <ul className="text-[var(--comic-dark)] space-y-2">
            <li>• {t.aiConversationSimulator.nluItem1}</li>
            <li>• {t.aiConversationSimulator.nluItem2}</li>
            <li>• {t.aiConversationSimulator.nluItem3}</li>
            <li>• {t.aiConversationSimulator.nluItem4}</li>
          </ul>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-6 text-[var(--comic-primary)]">
            {t.aiConversationSimulator.analysisTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiConversationSimulator.analysisDesc}
          </ComicText>
          <ul className="text-[var(--comic-dark)] space-y-2">
            <li>• {t.aiConversationSimulator.analysisItem1}</li>
            <li>• {t.aiConversationSimulator.analysisItem2}</li>
            <li>• {t.aiConversationSimulator.analysisItem3}</li>
            <li>• {t.aiConversationSimulator.analysisItem4}</li>
          </ul>
        </ComicCard>
      </div>
    </section>
  );
}

export default function ConversationSimulator() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AITechnologySection />
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}

