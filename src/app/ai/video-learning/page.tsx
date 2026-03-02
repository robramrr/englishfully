"use client";

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
    <section className="flex flex-col items-center justify-center text-center py-24 px-4 comic-bg-danger relative overflow-hidden comic-pattern-zigzag">
      <div className="absolute top-10 left-10 w-24 h-24 comic-bg-warning rounded-full comic-border-thick comic-shadow-xl comic-bounce"></div>
      <div className="absolute top-20 right-20 w-20 h-20 comic-bg-success rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '0.5s'}}></div>
      
      <div className="relative z-0">
        <ComicTitle level={1} className="comic-text-white mb-8 comic-wiggle">
          {t.aiVideoLearning.heroTitle}
        </ComicTitle>
        <ComicText size="xl" className="comic-text-white mb-12 font-bold max-w-3xl mx-auto">
          {t.aiVideoLearning.heroDesc}
        </ComicText>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <ComicButton variant="warning" size="lg" className="comic-wiggle">
            {t.aiVideoLearning.watchVideos}
          </ComicButton>
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
        <ComicTitle level={2} className="mb-8 text-[var(--comic-danger)]">
          {t.aiVideoLearning.featuresTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.aiVideoLearning.featuresDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-danger)]">
            {t.aiVideoLearning.subtitlesTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiVideoLearning.subtitlesDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>• {t.aiVideoLearning.subtitlesItem1}</li>
            <li>• {t.aiVideoLearning.subtitlesItem2}</li>
            <li>• {t.aiVideoLearning.subtitlesItem3}</li>
            <li>• {t.aiVideoLearning.subtitlesItem4}</li>
          </ul>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
            {t.aiVideoLearning.playlistsTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiVideoLearning.playlistsDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>• {t.aiVideoLearning.playlistsItem1}</li>
            <li>• {t.aiVideoLearning.playlistsItem2}</li>
            <li>• {t.aiVideoLearning.playlistsItem3}</li>
            <li>• {t.aiVideoLearning.playlistsItem4}</li>
          </ul>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-success)]">
            {t.aiVideoLearning.generatedTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiVideoLearning.generatedDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>• {t.aiVideoLearning.generatedItem1}</li>
            <li>• {t.aiVideoLearning.generatedItem2}</li>
            <li>• {t.aiVideoLearning.generatedItem3}</li>
            <li>• {t.aiVideoLearning.generatedItem4}</li>
          </ul>
        </ComicCard>
      </div>
    </section>
  );
}

// Video Categories Section
function VideoCategoriesSection() {
  const { t } = useI18n();
  return (
    <section className="comic-bg-accent py-24 px-4 comic-pattern-dots">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            {t.aiVideoLearning.categoriesTitle}
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            {t.aiVideoLearning.categoriesDesc}
          </ComicText>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-primary)]">
              {t.aiVideoLearning.educationalTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.aiVideoLearning.educationalDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• {t.aiVideoLearning.educationalItem1}</li>
              <li>• {t.aiVideoLearning.educationalItem2}</li>
              <li>• {t.aiVideoLearning.educationalItem3}</li>
              <li>• {t.aiVideoLearning.educationalItem4}</li>
            </ul>
            <ComicButton variant="primary" size="sm">
              {t.aiVideoLearning.watchEducational}
            </ComicButton>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-secondary)]">
              {t.aiVideoLearning.entertainmentTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.aiVideoLearning.entertainmentDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• {t.aiVideoLearning.entertainmentItem1}</li>
              <li>• {t.aiVideoLearning.entertainmentItem2}</li>
              <li>• {t.aiVideoLearning.entertainmentItem3}</li>
              <li>• {t.aiVideoLearning.entertainmentItem4}</li>
            </ul>
            <ComicButton variant="secondary" size="sm">
              {t.aiVideoLearning.watchEntertainment}
            </ComicButton>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-success)]">
              {t.aiVideoLearning.businessTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.aiVideoLearning.businessDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• {t.aiVideoLearning.businessItem1}</li>
              <li>• {t.aiVideoLearning.businessItem2}</li>
              <li>• {t.aiVideoLearning.businessItem3}</li>
              <li>• {t.aiVideoLearning.businessItem4}</li>
            </ul>
            <ComicButton variant="success" size="sm">
              {t.aiVideoLearning.watchBusiness}
            </ComicButton>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-warning)]">
              {t.aiVideoLearning.culturalTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.aiVideoLearning.culturalDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• {t.aiVideoLearning.culturalItem1}</li>
              <li>• {t.aiVideoLearning.culturalItem2}</li>
              <li>• {t.aiVideoLearning.culturalItem3}</li>
              <li>• {t.aiVideoLearning.culturalItem4}</li>
            </ul>
            <ComicButton variant="warning" size="sm">
              {t.aiVideoLearning.watchCultural}
            </ComicButton>
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
        <ComicTitle level={2} className="mb-8 text-[var(--comic-danger)]">
          {t.aiVideoLearning.techTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.aiVideoLearning.techDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 gap-12">
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-6 text-[var(--comic-danger)]">
            {t.aiVideoLearning.generationTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiVideoLearning.generationDesc}
          </ComicText>
          <ul className="text-[var(--comic-dark)] space-y-2">
            <li>• {t.aiVideoLearning.generationItem1}</li>
            <li>• {t.aiVideoLearning.generationItem2}</li>
            <li>• {t.aiVideoLearning.generationItem3}</li>
            <li>• {t.aiVideoLearning.generationItem4}</li>
          </ul>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-6 text-[var(--comic-primary)]">
            {t.aiVideoLearning.analyticsTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiVideoLearning.analyticsDesc}
          </ComicText>
          <ul className="text-[var(--comic-dark)] space-y-2">
            <li>• {t.aiVideoLearning.analyticsItem1}</li>
            <li>• {t.aiVideoLearning.analyticsItem2}</li>
            <li>• {t.aiVideoLearning.analyticsItem3}</li>
            <li>• {t.aiVideoLearning.analyticsItem4}</li>
          </ul>
        </ComicCard>
      </div>
    </section>
  );
}

export default function AIVideoLearning() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <HeroSection />
      <FeaturesSection />
      <VideoCategoriesSection />
      <AITechnologySection />
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
