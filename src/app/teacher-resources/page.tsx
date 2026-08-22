"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBagShopping,
  faBook,
  faChalkboard,
  faChartColumn,
  faDoorOpen,
  faEarListen,
  faGamepad,
  faHeadphones,
  faLock,
  faMicrophone,
  faStar,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import ComicButton from "../../components/ComicButton";
import ComicCard from "../../components/ComicCard";
import ComicTitle from "../../components/ComicTitle";
import ComicText from "../../components/ComicText";
import Footer from "../../components/Footer";
import { useI18n } from "../../i18n/I18nProvider";

function TitleWithIcon({
  icon,
  children,
}: {
  icon: IconDefinition;
  children: ReactNode;
}) {
  return (
    <>
      <FontAwesomeIcon
        icon={icon}
        aria-hidden
        className="mr-2 inline-block h-[0.85em] w-[0.85em] shrink-0 align-[-0.1em]"
      />
      {children}
    </>
  );
}

function ButtonWithIcon({
  icon,
  children,
}: {
  icon: IconDefinition;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <FontAwesomeIcon
        icon={icon}
        aria-hidden
        className="h-[1em] w-[1em] shrink-0"
      />
      <span>{children}</span>
    </span>
  );
}

// Hero Section
function HeroSection() {
  const { t } = useI18n();
  return (
    <section className="flex flex-col items-center justify-center text-center py-24 px-4 comic-bg-danger relative overflow-hidden comic-pattern-zigzag">
      <div className="absolute top-10 left-10 w-24 h-24 comic-bg-warning rounded-full comic-border-thick comic-shadow-xl comic-bounce"></div>
      <div className="absolute top-20 right-20 w-20 h-20 comic-bg-success rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '0.5s'}}></div>
      <div className="absolute bottom-20 left-20 w-16 h-16 comic-bg-primary rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 right-10 w-12 h-12 comic-bg-secondary rounded-full comic-border-thick comic-shadow-lg comic-bounce" style={{animationDelay: '1.5s'}}></div>
      <div className="absolute bottom-1/3 right-1/3 w-14 h-14 bg-[var(--comic-yellow)] rounded-full comic-border-thick comic-shadow-lg comic-bounce" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-0">
        <ComicTitle level={1} className="comic-title-no-shadow text-[var(--comic-yellow)] mb-8 comic-wiggle">
          <TitleWithIcon icon={faBagShopping}>
            {t.teacherResources.heroTitle}
          </TitleWithIcon>
        </ComicTitle>
        <ComicText size="xl" className="comic-text-white mb-12 font-bold max-w-3xl mx-auto">
          {t.teacherResources.heroDesc}
        </ComicText>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/teacher-resources/gradebook">
            <ComicButton 
              variant="secondary" 
              size="lg"
              className="comic-wiggle"
            >
              <ButtonWithIcon icon={faLock}>
                {t.teacherResources.openGradebookCta}
              </ButtonWithIcon>
            </ComicButton>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Resource Categories Section
function ResourceCategoriesSection() {
  const { t } = useI18n();
  return (
    <section className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="comic-title-no-shadow mb-8 text-[var(--comic-primary)]">
          <TitleWithIcon icon={faBook}>
            {t.teacherResources.categoriesTitle}
          </TitleWithIcon>
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.teacherResources.categoriesDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <ComicCard className="text-center flex flex-col">
          <ComicTitle level={4} className="comic-title-no-shadow mb-4 text-[var(--comic-success)]">
            <TitleWithIcon icon={faChartColumn}>
              {t.teacherResources.audioVideoTitle}
            </TitleWithIcon>
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.teacherResources.audioVideoDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6 flex-grow">
            <li>• {t.teacherResources.audioVideoItem1}</li>
            <li>• {t.teacherResources.audioVideoItem2}</li>
            <li>• {t.teacherResources.audioVideoItem3}</li>
            <li>• {t.teacherResources.audioVideoItem4}</li>
            <li>• {t.teacherResources.audioVideoItem5}</li>
          </ul>
          <ComicButton
            href="/teacher-resources/gradebook"
            variant="success"
            size="sm"
            className="!inline-flex items-center justify-center"
          >
            <ButtonWithIcon icon={faChartColumn}>
              {t.teacherResources.exploreMedia}
            </ButtonWithIcon>
          </ComicButton>
        </ComicCard>

        <ComicCard className="text-center flex flex-col">
          <ComicTitle level={4} className="comic-title-no-shadow mb-4 text-[var(--comic-primary)]">
            <TitleWithIcon icon={faWandMagicSparkles}>
              {t.teacherResources.lessonPlansTitle}
            </TitleWithIcon>
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.teacherResources.lessonPlansDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6 flex-grow">
            <li>• {t.teacherResources.lessonPlansItem1}</li>
            <li>• {t.teacherResources.lessonPlansItem2}</li>
            <li>• {t.teacherResources.lessonPlansItem3}</li>
            <li>• {t.teacherResources.lessonPlansItem4}</li>
            <li>• {t.teacherResources.lessonPlansItem5}</li>
          </ul>
          <ComicButton variant="primary" size="sm">
            {t.teacherResources.browseLessonPlans}
            <br />
            {t.teacherResources.comingSoon}
          </ComicButton>
        </ComicCard>
        
        <ComicCard className="text-center flex flex-col">
          <ComicTitle level={4} className="comic-title-no-shadow mb-4 text-[var(--comic-secondary)]">
            <TitleWithIcon icon={faChalkboard}>
              {t.teacherResources.worksheetsTitle}
            </TitleWithIcon>
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.teacherResources.worksheetsDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6 flex-grow">
            <li>• {t.teacherResources.worksheetsItem1}</li>
            <li>• {t.teacherResources.worksheetsItem2}</li>
            <li>• {t.teacherResources.worksheetsItem3}</li>
            <li>• {t.teacherResources.worksheetsItem4}</li>
            <li>• {t.teacherResources.worksheetsItem5}</li>
          </ul>
          <div className="flex flex-col gap-3 items-center">
            <ComicButton
              href="/teacher-resources/presentation"
              variant="secondary"
              size="sm"
              className="!inline-flex items-center justify-center"
            >
              <ButtonWithIcon icon={faChalkboard}>
                {t.teacherResources.viewWorksheets}
              </ButtonWithIcon>
            </ComicButton>
          </div>
        </ComicCard>
      </div>
    </section>
  );
}

// Featured Resources Section
function FeaturedResourcesSection() {
  const { t } = useI18n();
  return (
    <section className="comic-bg-secondary py-24 px-4 comic-pattern-stripes">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-title-no-shadow mb-8 text-[var(--comic-yellow)]">
            <TitleWithIcon icon={faStar}>
              {t.teacherResources.featuredTitle}
            </TitleWithIcon>
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            {t.teacherResources.featuredDesc}
          </ComicText>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <ComicCard className="flex flex-col">
            <ComicTitle level={4} className="comic-title-no-shadow mb-4 text-[var(--comic-primary)]">
              <TitleWithIcon icon={faMicrophone}>
                {t.teacherResources.grammarSeriesTitle}
              </TitleWithIcon>
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.teacherResources.grammarSeriesDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-1 mb-6 text-sm flex-grow">
              <li>• {t.teacherResources.grammarSeriesItem1}</li>
              <li>• {t.teacherResources.grammarSeriesItem2}</li>
              <li>• {t.teacherResources.grammarSeriesItem3}</li>
              <li>• {t.teacherResources.grammarSeriesItem4}</li>
            </ul>
            <ComicButton
              href="/teacher-resources/speak-and-submit"
              variant="primary"
              size="sm"
              className="w-full !inline-flex items-center justify-center"
            >
              <ButtonWithIcon icon={faMicrophone}>
                {t.teacherResources.openSpeakAndSubmit}
              </ButtonWithIcon>
            </ComicButton>
          </ComicCard>
          
          <ComicCard className="flex flex-col">
            <ComicTitle level={4} className="comic-title-no-shadow mb-4 text-[var(--comic-secondary)]">
              <TitleWithIcon icon={faHeadphones}>
                {t.teacherResources.businessToolkitTitle}
              </TitleWithIcon>
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.teacherResources.businessToolkitDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-1 mb-6 text-sm flex-grow">
              <li>• {t.teacherResources.businessToolkitItem1}</li>
              <li>• {t.teacherResources.businessToolkitItem2}</li>
              <li>• {t.teacherResources.businessToolkitItem3}</li>
              <li>• {t.teacherResources.businessToolkitItem4}</li>
            </ul>
            <div className="flex flex-col gap-2">
              <ComicButton
                href="/teacher-resources/listen-and-learn"
                variant="secondary"
                size="sm"
                className="w-full !inline-flex items-center justify-center"
              >
                <ButtonWithIcon icon={faHeadphones}>
                  {t.teacherResources.listenAndLearnButton}
                </ButtonWithIcon>
              </ComicButton>
              <ComicButton
                href="/teacher-resources/listen-and-answer"
                variant="accent"
                size="sm"
                className="w-full !inline-flex items-center justify-center"
              >
                <ButtonWithIcon icon={faEarListen}>
                  {t.teacherResources.listenAndAnswerButton}
                </ButtonWithIcon>
              </ComicButton>
            </div>
          </ComicCard>
          
          <ComicCard className="flex flex-col">
            <ComicTitle level={4} className="comic-title-no-shadow mb-4 text-[var(--comic-success)]">
              <TitleWithIcon icon={faGamepad}>
                {t.teacherResources.gamesPackTitle}
              </TitleWithIcon>
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.teacherResources.gamesPackDesc}
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-1 mb-6 text-sm flex-grow">
              <li>• {t.teacherResources.gamesPackItem1}</li>
              <li>• {t.teacherResources.gamesPackItem2}</li>
              <li>• {t.teacherResources.gamesPackItem3}</li>
              <li>• {t.teacherResources.gamesPackItem4}</li>
            </ul>
            <ComicButton
              href="/teacher-resources/escape-room"
              variant="danger"
              size="sm"
              className="w-full !inline-flex items-center justify-center"
            >
              <ButtonWithIcon icon={faDoorOpen}>
                {t.teacherResources.openEscapeRoom}
              </ButtonWithIcon>
            </ComicButton>
          </ComicCard>
        </div>
      </div>
    </section>
  );
}

export default function TeacherResources() {
  return (
    <div className="teacher-resources-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <HeroSection />
      <ResourceCategoriesSection />
      <FeaturedResourcesSection />
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
