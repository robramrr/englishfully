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
    <section className="flex flex-col items-center justify-center text-center py-24 px-4 comic-bg-purple relative overflow-hidden comic-pattern-zigzag">
      <div className="absolute top-10 left-10 w-24 h-24 comic-bg-warning rounded-full comic-border-thick comic-shadow-xl comic-bounce"></div>
      <div className="absolute top-20 right-20 w-20 h-20 comic-bg-success rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '0.5s'}}></div>
      
      <div className="relative z-0">
        <ComicTitle level={1} className="comic-text-white mb-8 comic-wiggle">
          {t.aiStoryLearning.heroTitle}
        </ComicTitle>
        <ComicText size="xl" className="comic-text-white mb-12 font-bold max-w-3xl mx-auto">
          {t.aiStoryLearning.heroDesc}
        </ComicText>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <ComicButton variant="warning" size="lg" className="comic-wiggle">
            {t.aiStoryLearning.startStoryAdventure}
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
        <ComicTitle level={2} className="mb-8 text-[var(--comic-purple)]">
          {t.aiStoryLearning.featuresTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.aiStoryLearning.featuresDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-purple)]">
            {t.aiStoryLearning.avatarsTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiStoryLearning.avatarsDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>• {t.aiStoryLearning.avatarsItem1}</li>
            <li>• {t.aiStoryLearning.avatarsItem2}</li>
          </ul>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
            {t.aiStoryLearning.choicesTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiStoryLearning.choicesDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>• {t.aiStoryLearning.choicesItem1}</li>
            <li>• {t.aiStoryLearning.choicesItem2}</li>
            <li>• {t.aiStoryLearning.choicesItem3}</li>
            <li>• {t.aiStoryLearning.choicesItem4}</li>
          </ul>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-success)]">
            {t.aiStoryLearning.integrationTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.aiStoryLearning.integrationDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>• {t.aiStoryLearning.integrationItem1}</li>
            <li>• {t.aiStoryLearning.integrationItem2}</li>
            <li>• {t.aiStoryLearning.integrationItem3}</li>
            <li>• {t.aiStoryLearning.integrationItem4}</li>
          </ul>
        </ComicCard>
      </div>
    </section>
  );
}

// Story Genres Section
function StoryGenresSection() {
  const { t } = useI18n();
  return (
    <section className="comic-bg-pink py-24 px-4 comic-pattern-stripes">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            {t.aiStoryLearning.genresTitle}
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            {t.aiStoryLearning.genresDesc}
          </ComicText>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-primary)]">
              {t.aiStoryLearning.businessTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.aiStoryLearning.businessDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• {t.aiStoryLearning.businessItem1}</li>
              <li>• {t.aiStoryLearning.businessItem2}</li>
              <li>• {t.aiStoryLearning.businessItem3}</li>
              <li>• {t.aiStoryLearning.businessItem4}</li>
            </ul>
            <ComicButton variant="primary" size="sm">
              {t.aiStoryLearning.startBusinessStory}
            </ComicButton>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-secondary)]">
              {t.aiStoryLearning.travelTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.aiStoryLearning.travelDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• {t.aiStoryLearning.travelItem1}</li>
              <li>• {t.aiStoryLearning.travelItem2}</li>
              <li>• {t.aiStoryLearning.travelItem3}</li>
              <li>• {t.aiStoryLearning.travelItem4}</li>
            </ul>
            <ComicButton variant="secondary" size="sm">
              {t.aiStoryLearning.startTravelStory}
            </ComicButton>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-success)]">
              {t.aiStoryLearning.academicTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.aiStoryLearning.academicDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• {t.aiStoryLearning.academicItem1}</li>
              <li>• {t.aiStoryLearning.academicItem2}</li>
              <li>• {t.aiStoryLearning.academicItem3}</li>
              <li>• {t.aiStoryLearning.academicItem4}</li>
            </ul>
            <ComicButton variant="success" size="sm">
              {t.aiStoryLearning.startAcademicStory}
            </ComicButton>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-warning)]">
              {t.aiStoryLearning.mysteryTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.aiStoryLearning.mysteryDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• {t.aiStoryLearning.mysteryItem1}</li>
              <li>• {t.aiStoryLearning.mysteryItem2}</li>
              <li>• {t.aiStoryLearning.mysteryItem3}</li>
              <li>• {t.aiStoryLearning.mysteryItem4}</li>
            </ul>
            <ComicButton variant="warning" size="sm">
              {t.aiStoryLearning.startAdventureStory}
            </ComicButton>
          </ComicCard>
        </div>
      </div>
    </section>
  );
}

// Avatar System Section
function AvatarSystemSection() {
  const { t } = useI18n();
  return (
    <section className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-purple)]">
          {t.aiStoryLearning.avatarSystemTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.aiStoryLearning.avatarSystemDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 gap-12">
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-6 text-[var(--comic-purple)]">
            {t.aiStoryLearning.aiCharactersTitle}
          </ComicTitle>
          <ul className="text-[var(--comic-dark)] space-y-2">
            <li>• {t.aiStoryLearning.aiCharactersItem1}</li>
            <li>• {t.aiStoryLearning.aiCharactersItem2}</li>
            <li>• {t.aiStoryLearning.aiCharactersItem3}</li>
          </ul>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-6 text-[var(--comic-primary)]">
            {t.aiStoryLearning.analyticsTitle}
          </ComicTitle>
          <ul className="text-[var(--comic-dark)] space-y-2">
            <li>• {t.aiStoryLearning.analyticsItem1}</li>
            <li>• {t.aiStoryLearning.analyticsItem2}</li>
            <li>• {t.aiStoryLearning.analyticsItem3}</li>
            <li>• {t.aiStoryLearning.analyticsItem4}</li>
          </ul>
        </ComicCard>
      </div>
    </section>
  );
}

export default function StoryLearning() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <HeroSection />
      <FeaturesSection />
      <StoryGenresSection />
      <AvatarSystemSection />
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
