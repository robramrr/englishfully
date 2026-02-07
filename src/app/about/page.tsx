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
    <section className="flex flex-col items-center justify-center text-center py-24 px-4 comic-bg-primary relative overflow-hidden comic-pattern-zigzag">
      {/* Enhanced comic book style background elements */}
      <div className="absolute top-10 left-10 w-24 h-24 comic-bg-warning rounded-full comic-border-thick comic-shadow-xl comic-bounce"></div>
      <div className="absolute top-20 right-20 w-20 h-20 comic-bg-success rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '0.5s'}}></div>
      <div className="absolute bottom-20 left-20 w-16 h-16 comic-bg-danger rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 right-10 w-12 h-12 comic-bg-secondary rounded-full comic-border-thick comic-shadow-lg comic-bounce" style={{animationDelay: '1.5s'}}></div>
      <div className="absolute bottom-1/3 right-1/3 w-14 h-14 bg-[var(--comic-yellow)] rounded-full comic-border-thick comic-shadow-lg comic-bounce" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-0">
        <ComicTitle level={1} className="comic-text-white mb-8 comic-wiggle">
          {t.about.heroTitle}
        </ComicTitle>
        <ComicText size="xl" className="comic-text-white mb-12 font-bold max-w-3xl mx-auto">
          {t.about.heroDesc}
        </ComicText>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/online-learning">
            <ComicButton 
              variant="warning" 
              size="lg"
              className="comic-wiggle"
            >
              {t.about.startLearning}
            </ComicButton>
          </Link>
          <Link href="/contact">
            <ComicButton 
              variant="secondary" 
              size="lg"
              className="comic-wiggle"
            >
              {t.about.contactUs}
            </ComicButton>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Our Story Section
function OurStorySection() {
  const { t } = useI18n();
  
  return (
    <section className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-primary)]">
          {t.about.ourStoryTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.about.ourStoryDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 gap-12 mb-16">
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-6 text-[var(--comic-primary)]">
            {t.about.ourMissionTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.about.ourMissionDesc1}
          </ComicText>
          <ComicText className="text-[var(--comic-dark)] font-bold">
            {t.about.ourMissionDesc2}
          </ComicText>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-6 text-[var(--comic-secondary)]">
            {t.about.localImpactTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.about.localImpactDesc}
          </ComicText>
          <ul className="text-[var(--comic-dark)] space-y-2">
            <li>{t.about.localImpactItem1}</li>
            <li>{t.about.localImpactItem2}</li>
            <li>{t.about.localImpactItem3}</li>
          </ul>
        </ComicCard>
      </div>
    </section>
  );
}

// Team Section
function TeamSection() {
  const { t } = useI18n();
  
  return (
    <section className="comic-bg-accent py-24 px-4 comic-pattern-stripes">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            {t.about.meetTeamTitle}
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            {t.about.meetTeamDesc}
          </ComicText>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <ComicCard className="comic-shadow-lg text-center">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-secondary)]">
              {t.about.teachingTeamTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.about.teachingTeamDesc}
            </ComicText>
            <ul className="text-left text-[var(--comic-dark)] space-y-2">
              <li>{t.about.teachingTeamItem1}</li>
              <li>{t.about.teachingTeamItem2}</li>
              <li>{t.about.teachingTeamItem3}</li>
              <li>{t.about.teachingTeamItem4}</li>
            </ul>
          </ComicCard>
          
          <ComicCard className="comic-shadow-lg text-center">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-success)]">
              {t.about.techTeamTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.about.techTeamDesc}
            </ComicText>
            <ul className="text-left text-[var(--comic-dark)] space-y-2">
              <li>{t.about.techTeamItem1}</li>
              <li>{t.about.techTeamItem2}</li>
              <li>{t.about.techTeamItem3}</li>
              <li>{t.about.techTeamItem4}</li>
            </ul>
          </ComicCard>
        </div>
      </div>
    </section>
  );
}

// Values Section
function ValuesSection() {
  const { t } = useI18n();
  
  return (
    <section className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-success)]">
          {t.about.valuesTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.about.valuesDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={4} className="mb-4 text-[var(--comic-primary)]">
            {t.about.innovateTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold">
            {t.about.innovateDesc}
          </ComicText>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={4} className="mb-4 text-[var(--comic-success)]">
            {t.about.accessibleTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold">
            {t.about.accessibleDesc}
          </ComicText>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={4} className="mb-4 text-[var(--comic-warning)]">
            {t.about.completeTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold">
            {t.about.completeDesc}
          </ComicText>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={4} className="mb-4 text-[var(--comic-danger)]">
            {t.about.funTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold">
            {t.about.funDesc}
          </ComicText>
        </ComicCard>
      </div>
    </section>
  );
}

export default function About() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <HeroSection />
      <OurStorySection />
      <TeamSection />
      <ValuesSection />
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
