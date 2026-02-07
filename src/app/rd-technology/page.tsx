'use client';

import Link from "next/link";
import ComicButton from "../../components/ComicButton";
import ComicCard from "../../components/ComicCard";
import ComicTitle from "../../components/ComicTitle";
import ComicText from "../../components/ComicText";
import Footer from "../../components/Footer";
import { useI18n } from "../../i18n/I18nProvider";

// Hero Section
function HeroSection() {
  const { t } = useI18n();
  return (
    <section className="flex flex-col items-center justify-center text-center py-24 px-4 comic-bg-accent relative overflow-hidden comic-pattern-zigzag">
      <div className="absolute top-10 left-10 w-24 h-24 comic-bg-warning rounded-full comic-border-thick comic-shadow-xl comic-bounce"></div>
      <div className="absolute top-20 right-20 w-20 h-20 comic-bg-success rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '0.5s'}}></div>
      <div className="absolute bottom-20 left-20 w-16 h-16 comic-bg-danger rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '1s'}}></div>
      
      <div className="relative z-0">
        <ComicTitle level={1} className="comic-text-white mb-8 comic-wiggle">
          {t.rdTechnology.heroTitle}
        </ComicTitle>
        <ComicText size="xl" className="comic-text-white mb-12 font-bold max-w-3xl mx-auto">
          {t.rdTechnology.heroDesc}
        </ComicText>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/ai/voice-coach">
            <ComicButton variant="warning" size="lg" className="comic-wiggle">
              {t.rdTechnology.aiLearning}
            </ComicButton>
          </Link>
          <Link href="/about">
            <ComicButton variant="secondary" size="lg" className="comic-wiggle">
              {t.rdTechnology.aboutUs}
            </ComicButton>
          </Link>
        </div>
      </div>
    </section>
  );
}

// AI Models Section
function AIModelsSection() {
  const { t } = useI18n();
  
  return (
    <section className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-accent)]">
          {t.rdTechnology.aiModelsTitle}
        </ComicTitle>
        <ComicText className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.rdTechnology.aiModelsDesc}
        </ComicText>
      </div>
      
      <div className="space-y-8">
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-6 text-[var(--comic-accent)]">
            {t.rdTechnology.speechTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.rdTechnology.speechDesc}
          </ComicText>
          <ul className="text-[var(--comic-dark)] space-y-2 mb-4">
            <li>{t.rdTechnology.speechItem1}</li>
            <li>{t.rdTechnology.speechItem2}</li>
            <li>{t.rdTechnology.speechItem3}</li>
            <li>{t.rdTechnology.speechItem4}</li>
          </ul>
          <ComicText className="text-[var(--comic-dark)] font-bold">
            <strong>{t.rdTechnology.speechApplied}</strong>
          </ComicText>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-6 text-[var(--comic-primary)]">
            {t.rdTechnology.languageTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.rdTechnology.languageDesc}
          </ComicText>
          <ul className="text-[var(--comic-dark)] space-y-2 mb-4">
            <li>{t.rdTechnology.languageItem1}</li>
            <li>{t.rdTechnology.languageItem2}</li>
            <li>{t.rdTechnology.languageItem3}</li>
            <li>{t.rdTechnology.languageItem4}</li>
          </ul>
          <ComicText className="text-[var(--comic-dark)] font-bold">
            <strong>{t.rdTechnology.languageApplied}</strong>
          </ComicText>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-6 text-[var(--comic-secondary)]">
            {t.rdTechnology.personalizationTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.rdTechnology.personalizationDesc}
          </ComicText>
          <ul className="text-[var(--comic-dark)] space-y-2 mb-4">
            <li>{t.rdTechnology.personalizationItem1}</li>
            <li>{t.rdTechnology.personalizationItem2}</li>
            <li>{t.rdTechnology.personalizationItem3}</li>
            <li>{t.rdTechnology.personalizationItem4}</li>
          </ul>
          <ComicText className="text-[var(--comic-dark)] font-bold">
            <strong>{t.rdTechnology.personalizationApplied}</strong>
          </ComicText>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-6 text-[var(--comic-success)]">
            {t.rdTechnology.analyticsTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.rdTechnology.analyticsDesc}
          </ComicText>
          <ul className="text-[var(--comic-dark)] space-y-2 mb-4">
            <li>{t.rdTechnology.analyticsItem1}</li>
            <li>{t.rdTechnology.analyticsItem2}</li>
            <li>{t.rdTechnology.analyticsItem3}</li>
            <li>{t.rdTechnology.analyticsItem4}</li>
          </ul>
        </ComicCard>
      </div>
    </section>
  );
}

// Methodology Section
function MethodologySection() {
  const { t } = useI18n();
  
  return (
    <section className="comic-bg-primary py-24 px-4 comic-pattern-stripes">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            {t.rdTechnology.methodologyTitle}
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            {t.rdTechnology.methodologyDesc}
          </ComicText>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <ComicCard className="comic-shadow-xl text-center">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
              {t.rdTechnology.pedagogicalTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.rdTechnology.pedagogicalDesc}
            </ComicText>
            <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
              <li>{t.rdTechnology.pedagogicalItem1}</li>
              <li>{t.rdTechnology.pedagogicalItem2}</li>
              <li>{t.rdTechnology.pedagogicalItem3}</li>
              <li>{t.rdTechnology.pedagogicalItem4}</li>
            </ul>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl text-center">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
              {t.rdTechnology.dataDrivenTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.rdTechnology.dataDrivenDesc}
            </ComicText>
            <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
              <li>{t.rdTechnology.dataDrivenItem1}</li>
              <li>{t.rdTechnology.dataDrivenItem2}</li>
              <li>{t.rdTechnology.dataDrivenItem3}</li>
              <li>{t.rdTechnology.dataDrivenItem4}</li>
            </ul>
          </ComicCard>
        </div>
      </div>
    </section>
  );
}

// Roadmap Section
function RoadmapSection() {
  const { t } = useI18n();
  
  return (
    <section className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-accent)]">
          {t.rdTechnology.roadmapTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.rdTechnology.roadmapDesc}
        </ComicText>
      </div>
      
      <div className="space-y-8">
        <ComicCard className="comic-shadow-xl">
          <div className="flex items-start space-x-4">
            <div className="comic-bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
              Q1
            </div>
            <div>
              <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
                {t.rdTechnology.q1Title}
              </ComicTitle>
              <ComicText className="text-[var(--comic-dark)] font-bold mb-2">
                {t.rdTechnology.q1Desc}
              </ComicText>
              <ul className="text-[var(--comic-dark)] space-y-1 mb-4">
                <li>{t.rdTechnology.q1Item1}</li>
                <li>{t.rdTechnology.q1Item2}</li>
                <li>{t.rdTechnology.q1Item3}</li>
              </ul>
              <ComicText className="text-[var(--comic-dark)] font-bold">
                <strong>{t.rdTechnology.q1Supports}</strong>
              </ComicText>
            </div>
          </div>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl">
          <div className="flex items-start space-x-4">
            <div className="comic-bg-secondary text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
              Q2
            </div>
            <div>
              <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
                {t.rdTechnology.q2Title}
              </ComicTitle>
              <ComicText className="text-[var(--comic-dark)] font-bold mb-2">
                {t.rdTechnology.q2Desc}
              </ComicText>
              <ul className="text-[var(--comic-dark)] space-y-1 mb-4">
                <li>{t.rdTechnology.q2Item1}</li>
                <li>{t.rdTechnology.q2Item2}</li>
                <li>{t.rdTechnology.q2Item3}</li>
              </ul>
              <ComicText className="text-[var(--comic-dark)] font-bold">
                <strong>{t.rdTechnology.q2Supports}</strong>
              </ComicText>
            </div>
          </div>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl">
          <div className="flex items-start space-x-4">
            <div className="comic-bg-success text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
              Q3
            </div>
            <div>
              <ComicTitle level={3} className="mb-4 text-[var(--comic-success)]">
                {t.rdTechnology.q3Title}
              </ComicTitle>
              <ComicText className="text-[var(--comic-dark)] font-bold mb-2">
                {t.rdTechnology.q3Desc}
              </ComicText>
              <ul className="text-[var(--comic-dark)] space-y-1 mb-4">
                <li>{t.rdTechnology.q3Item1}</li>
                <li>{t.rdTechnology.q3Item2}</li>
                <li>{t.rdTechnology.q3Item3}</li>
              </ul>
              <ComicText className="text-[var(--comic-dark)] font-bold">
                <strong>{t.rdTechnology.q3Supports}</strong>
              </ComicText>
            </div>
          </div>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl">
          <div className="flex items-start space-x-4">
            <div className="comic-bg-warning text-black rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
              Q4
            </div>
            <div>
              <ComicTitle level={3} className="mb-4 text-[var(--comic-warning)]">
                {t.rdTechnology.q4Title}
              </ComicTitle>
              <ComicText className="text-[var(--comic-dark)] font-bold mb-2">
                {t.rdTechnology.q4Desc}
              </ComicText>
              <ul className="text-[var(--comic-dark)] space-y-1 mb-4">
                <li>{t.rdTechnology.q4Item1}</li>
                <li>{t.rdTechnology.q4Item2}</li>
                <li>{t.rdTechnology.q4Item3}</li>
              </ul>
              <ComicText className="text-[var(--comic-dark)] font-bold">
                <strong>{t.rdTechnology.q4Supports}</strong>
              </ComicText>
            </div>
          </div>
        </ComicCard>
      </div>
    </section>
  );
}

// Innovation Highlights Section
function InnovationHighlightsSection() {
  const { t } = useI18n();
  
  return (
    <section className="comic-bg-warning py-24 px-4 comic-pattern-dots">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            {t.rdTechnology.innovationTitle}
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            {t.rdTechnology.innovationDesc}
          </ComicText>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-primary)]">
              {t.rdTechnology.realtimeTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.rdTechnology.realtimeDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2">
              <li>{t.rdTechnology.realtimeItem1}</li>
              <li>{t.rdTechnology.realtimeItem2}</li>
              <li>{t.rdTechnology.realtimeItem3}</li>
            </ul>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-secondary)]">
              {t.rdTechnology.languageAwareTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.rdTechnology.languageAwareDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2">
              <li>{t.rdTechnology.languageAwareItem1}</li>
              <li>{t.rdTechnology.languageAwareItem2}</li>
              <li>{t.rdTechnology.languageAwareItem3}</li>
            </ul>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-success)]">
              {t.rdTechnology.mobileFirstTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.rdTechnology.mobileFirstDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2">
              <li>{t.rdTechnology.mobileFirstItem1}</li>
              <li>{t.rdTechnology.mobileFirstItem2}</li>
              <li>{t.rdTechnology.mobileFirstItem3}</li>
            </ul>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-warning)]">
              {t.rdTechnology.privacyTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.rdTechnology.privacyDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2">
              <li>{t.rdTechnology.privacyItem1}</li>
              <li>{t.rdTechnology.privacyItem2}</li>
              <li>{t.rdTechnology.privacyItem3}</li>
            </ul>
          </ComicCard>
        </div>
      </div>
    </section>
  );
}

export default function RDTechnology() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <HeroSection />
      <AIModelsSection />
      <MethodologySection />
      <RoadmapSection />
      <InnovationHighlightsSection />
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}

