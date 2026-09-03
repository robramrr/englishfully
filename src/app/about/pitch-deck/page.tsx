'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import ComicButton from '../../../components/ComicButton';
import ComicCard from '../../../components/ComicCard';
import ComicText from '../../../components/ComicText';
import ComicTitle from '../../../components/ComicTitle';
import Footer from '../../../components/Footer';
import HomeroomCaseStudy from '../../../components/pitch-deck/HomeroomCaseStudy';
import MarketingSalesVisual, {
  MarketAudienceStamps,
  MarketChannelStamps,
  StampFlow,
} from '../../../components/pitch-deck/MarketingSalesVisual';
import TechInnovationFlow from '../../../components/pitch-deck/TechInnovationFlow';
import ThailandBenefitVisual from '../../../components/pitch-deck/ThailandBenefitVisual';
import { ENGLISHFEED_APP_HERO_CIRCLE_URLS } from '../../../constants/englishfeed';

const TOC = [
  { id: 'executive-summary', label: 'a. Executive Summary' },
  { id: 'company-background', label: 'b. The Company / Background' },
  { id: 'mission-vision', label: 'c. Mission & Vision' },
  { id: 'management-team', label: 'd. Management Team' },
  { id: 'products', label: 'e. Products' },
  { id: 'technology', label: 'f. Technology and Innovation' },
  { id: 'industry', label: 'g. Industry / Competition / Trends' },
  { id: 'marketing-sales', label: 'h. Marketing & Sales Strategy' },
  { id: 'financial-plan', label: 'i. Financial Plan' },
  { id: 'revenue-model', label: 'j. Revenue Model' },
  { id: 'growth-strategy', label: 'k. Growth Strategy' },
  { id: 'future', label: 'l. Future (2-Year Milestones)' },
  { id: 'thailand-benefit', label: "m. Thailand's Benefit" },
] as const;

function SectionHeading({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-28">
      <ComicTitle level={2} className="comic-title-no-shadow mb-6 text-[var(--comic-primary)]">
        {children}
      </ComicTitle>
    </div>
  );
}

function SubHeading({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ComicTitle
      level={4}
      className={`comic-title-no-shadow mb-3 mt-8 text-[var(--comic-secondary)] ${className}`.trim()}
    >
      {children}
    </ComicTitle>
  );
}

function Body({ children }: { children: ReactNode }) {
  return (
    <ComicText
      weight="normal"
      className="pitch-deck-body text-[var(--comic-dark)] mb-4 leading-relaxed"
    >
      {children}
    </ComicText>
  );
}

export default function PitchDeckPage() {
  return (
    <div className="pitch-deck-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <section className="pitch-deck-hero comic-bg-secondary py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-4">
          <ComicText className="comic-text-white font-bold text-sm uppercase tracking-wide">
            Englishfully Co., Ltd. · Digital Industry · BOI Smart Visa
          </ComicText>
          <ComicTitle level={1} className="comic-title-no-shadow comic-text-white">
            Pitch Deck
          </ComicTitle>
          <div className="flex flex-wrap justify-center gap-3 pt-2 print:hidden">
            <Link href="/about">
              <ComicButton variant="warning" size="sm">
                ← About Us
              </ComicButton>
            </Link>
            <Link href="/about/company-profile">
              <ComicButton variant="secondary" size="sm">
                Company Profile
              </ComicButton>
            </Link>
            <ComicButton
              variant="accent"
              size="sm"
              type="button"
              onClick={() => window.print()}
            >
              Print / Save PDF
            </ComicButton>
          </div>
          <p className="print:hidden text-white/90 text-sm font-bold">
            In the print dialog, turn on Background graphics and use A4 at 100% scale.
          </p>
        </div>
      </section>

      <div className="pitch-deck-content max-w-4xl mx-auto w-full px-4 py-10 space-y-10">
        <ComicCard className="pitch-deck-toc print:hidden">
          <ComicTitle level={3} className="comic-title-no-shadow mb-4 text-[var(--comic-secondary)]">
            Contents
          </ComicTitle>
          <nav aria-label="Pitch deck contents">
            <ol className="grid sm:grid-cols-2 gap-2 text-left">
              {TOC.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="font-bold text-[var(--comic-dark)] hover:text-[var(--comic-primary)] underline-offset-2 hover:underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </ComicCard>

        {/* a. Executive Summary */}
        <ComicCard className="pitch-deck-section">
          <SectionHeading id="executive-summary">a. Executive Summary</SectionHeading>
          <div className="pitch-deck-exec-summary clearfix">
            <div className="pitch-deck-exec-summary-image float-right ml-6 mb-3 w-[11.5rem] sm:w-[13rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/ktg8khoq/image/upload/v1787822534/englishfeed-login_ojxbnl.jpg"
                alt="EnglishFeed app"
                className="w-full h-auto object-contain border-2 border-[var(--comic-black)] rounded-xl"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/dkbf7tvcx/image/upload/v1783143201/englishfeed/logo/englishfeed-logo.png"
                alt="EnglishFeed"
                className="mt-3 mx-auto block h-10 w-auto object-contain"
              />
            </div>
            <Body>
              Englishfully Co., Ltd. is a Thailand-based education technology startup founded in 2026.
              The company builds a complete English-learning ecosystem centered on{' '}
              <strong>EnglishFeed</strong>, the learner-facing digital learning application, a
              swipe-based learning feed for immersive, skill-focused English without distractions.
            </Body>
            <Body>
              Our mission is to make English learning complete—covering fundamentals, skills practice,
              assessment, and classroom management—through innovative and engaging digital products designed for Thai
              and regional learners, and for teachers who need practical EdTech that fits real
              classrooms.
            </Body>
            <Body>
              The business operates in the Digital Industry. Core offerings include free and paid
              EnglishFeed app access with online and offline membership support plans, and{' '}
              <strong>Homeroom Tools</strong>, a membership suite of teacher-facing EdTech
              workflow tools. Initial capital is provided from personal funds.
              Over the next two years, Englishfully will deepen product capability; grow learner and
              teacher adoption in Thailand; hire local staff; partner with private schools, small
              language schools, and government schools to introduce a more effective way to deliver and
              present English learning; and build an independently operable platform suitable for
              long-term growth or acquisition.
            </Body>
          </div>
        </ComicCard>

        {/* b. Company */}
        <ComicCard className="pitch-deck-section">
          <SectionHeading id="company-background">b. The Company / Background</SectionHeading>
          <div className="pitch-deck-company clearfix">
            <div className="pitch-deck-company-image float-right ml-6 mb-3 w-[11.5rem] sm:w-[14rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788104162/students-using-englishfully_atx3yu.jpg"
                alt="Students using Englishfully"
                className="w-full h-auto object-cover border-2 border-[var(--comic-black)] rounded-xl"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/dkbf7tvcx/image/upload/v1779780445/englishfully/logo/englishfully-01.png"
                alt="Englishfully"
                className="mt-3 mx-auto block h-10 w-auto object-contain"
              />
            </div>
            <Body>
              Englishfully Co., Ltd. was established in 2026 in Thailand to address a persistent gap:
              English education is widely available, but few solutions provide an innovative platform
              for structured learning, teacher workflow, and measurable classroom outcomes within one
              coherent system.
            </Body>
            <figure className="pitch-deck-company-thai">
              <div className="pitch-deck-company-thai-flag" aria-hidden="true">
                <svg viewBox="0 0 90 60" xmlns="http://www.w3.org/2000/svg">
                  <rect width="90" height="10" y="0" fill="#A51931" />
                  <rect width="90" height="10" y="10" fill="#FFFFFF" />
                  <rect width="90" height="20" y="20" fill="#2D2A4A" />
                  <rect width="90" height="10" y="40" fill="#FFFFFF" />
                  <rect width="90" height="10" y="50" fill="#A51931" />
                </svg>
              </div>
              <figcaption>
                <p className="pitch-deck-company-thai-stamp">Thailand</p>
                <p className="pitch-deck-company-thai-copy">EdTech</p>
              </figcaption>
            </figure>
            <Body>
              The company develops and operates digital learning and teaching products. On the learner
              side, EnglishFeed provides AI-powered, interactive and immersive English learning in a
              structured swipe-based format. Its content delivers engaging video and audio designed for
              today&apos;s social media user. On the teacher side, Homeroom Tools
              provides a Classroom System—tools for class management, lesson and presentation creation,
              speaking and listening assessment, and interactive practice activities—so schools and
              independent teachers can run modern English instruction without assembling disconnected
              apps.
            </Body>
            <Body>
              Englishfully’s headquarters and primary market focus are in Thailand, with a product
              roadmap oriented toward Thai-language learner backgrounds, local classroom realities, and
              the country’s digital education priorities.
            </Body>
          </div>
        </ComicCard>

        {/* c. Mission & Vision */}
        <ComicCard className="pitch-deck-section">
          <SectionHeading id="mission-vision">c. Mission &amp; Vision</SectionHeading>
          <SubHeading>Mission</SubHeading>
          <Body>
            To deliver complete English learning through innovative digital tools that transform
            familiar digital habits into structured, immersive, and skill-focused learning experiences,
            and practical classroom systems that help learners build real communication skills and help
            teachers create, assign, assess, and manage learning with clarity and ease.
          </Body>
          <SubHeading>Vision</SubHeading>
          <Body>
            To become Thailand’s trusted English learning and teaching platform where learners
            progress from fundamentals to fluent use through engaging, personalized, and interactive
            learning, and teachers run engaging, effective classes end to end through one integrated
            EdTech ecosystem.
          </Body>
        </ComicCard>

        {/* d. Management Team */}
        <ComicCard className="pitch-deck-section pitch-deck-print-break">
          <SectionHeading id="management-team">d. Management Team</SectionHeading>
          <div className="pitch-deck-founder grid items-start gap-8 md:grid-cols-[auto_1fr]">
            <div className="mx-auto flex flex-col items-center gap-4 md:mx-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/dkbf7tvcx/image/upload/v1783439716/englishfully/company/Robert.jpg"
                alt="Robert, founder of Englishfully"
                className="h-40 w-40 rounded-xl border-2 border-[var(--brand-navy)] object-cover object-top md:h-48 md:w-48"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788097274/university-csuf_ycyyv7.png"
                alt="California State University, Fullerton"
                className="h-20 w-20 object-contain"
              />
            </div>
            <div>
              <SubHeading>Robert — Founder</SubHeading>
              <div className="pitch-deck-founder-bio">
                <figure className="pitch-deck-founder-teaching">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://res.cloudinary.com/ktg8khoq/image/upload/v1787643151/teaching_tyrmwq.jpg"
                    alt="Robert teaching English in the classroom"
                  />
                  <figcaption>Thai Government Primary School</figcaption>
                </figure>
                <Body>
                  Robert leads product strategy, technology development, and business operations for
                  Englishfully. He combines classroom teaching experience with education-technology and
                  web development expertise. A certified English instructor who has taught learners across
                  ages and levels, he also works as a developer and business consultant building digital
                  tools for learning.
                </Body>
                <Body>
                  He holds degrees in Sociology and Business Administration from California State
                  University, Fullerton. Originally from California, USA, and a fluent Spanish speaker, he
                  lived in Monterrey, Mexico before making Thailand home. That international path informs
                  Englishfully’s emphasis on accessible language learning, cultural connection, and
                  products designed for real classrooms.
                </Body>
              </div>
            </div>
          </div>
        </ComicCard>

        {/* e. Products */}
        <ComicCard className="pitch-deck-section pitch-deck-section--products">
          <SectionHeading id="products">e. Products</SectionHeading>
          <Body>
            Englishfully’s products fall into two complementary lines. Features create clear learner
            and teacher benefits: faster preparation, better practice, measurable outcomes, and a more
            complete English journey.
          </Body>

          <SubHeading>
            1.{' '}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://res.cloudinary.com/dkbf7tvcx/image/upload/v1783143201/englishfeed/logo/englishfeed-logo.png"
              alt="EnglishFeed"
              className="mx-1 inline-block h-9 w-auto align-middle object-contain sm:h-11"
            />
          </SubHeading>
          <div className="pitch-deck-product-englishfeed">
            <Body>
              EnglishFeed is a swipe-based digital English learning app built for productive habit
              learning—familiar feed flow, but structured and interactive to keep learners focused,
              progressing, and coming back daily. Membership tiers (such as App,
              Lite, and Pro) unlock app practice and, at higher tiers, live online coaching and onsite
              practice.
            </Body>
            <Body>
              <strong>Benefit:</strong> learners practice in the app and can add mentor-led online or
              onsite support through the same membership path.
            </Body>
            <div className="mb-4 flex justify-center pitch-deck-englishfeed-hero">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/ktg8khoq/image/upload/v1787847387/prototype-englishfeed_o62i1e.jpg"
                alt="EnglishFeed prototype"
                className="mx-auto block w-full max-w-3xl h-auto object-contain border-2 border-[var(--comic-black)] rounded-xl"
              />
            </div>
            <Body>Key features include:</Body>
            <div className="pitch-deck-feature-table-wrap mb-4 overflow-x-auto">
                <table className="pitch-deck-feature-table w-full border-collapse text-left text-[var(--comic-dark)]">
                  <thead>
                    <tr className="bg-[#d0d0d0]">
                      <th className="border border-[var(--comic-black)] px-3 py-2 font-black whitespace-nowrap">
                        Feature
                      </th>
                      <th className="border border-[var(--comic-black)] px-3 py-2 font-black">
                        What it does
                      </th>
                    </tr>
                  </thead>
                  <tbody className="pitch-deck-body">
                    <tr>
                      <td className="border border-[var(--comic-black)] px-3 py-2 font-bold align-top">
                        Six-skill English immersion
                      </td>
                      <td className="border border-[var(--comic-black)] px-3 py-2 align-top">
                        Listening, speaking, reading, writing, grammar, and vocabulary practice that
                        adapts and evolves with learner progress.
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--comic-black)] px-3 py-2 font-bold align-top">
                        Video lessons
                      </td>
                      <td className="border border-[var(--comic-black)] px-3 py-2 align-top">
                        Immersive video learning with AI visuals, interactivity, and content spanning
                        foundations, daily life, business, and culture.
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--comic-black)] px-3 py-2 font-bold align-top">
                        Interactive subtitles
                      </td>
                      <td className="border border-[var(--comic-black)] px-3 py-2 align-top">
                        Tap any word for instant meaning, pronunciation, examples, synonyms, and
                        save-to-vocabulary while watching.
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--comic-black)] px-3 py-2 font-bold align-top">
                        Pronunciation practice
                      </td>
                      <td className="border border-[var(--comic-black)] px-3 py-2 align-top">
                        Speak target lesson sentences with speech recognition, word-level scoring, and
                        real-time correction feedback.
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--comic-black)] px-3 py-2 font-bold align-top">
                        AI Quiz
                      </td>
                      <td className="border border-[var(--comic-black)] px-3 py-2 align-top">
                        Lesson-grounded multiple-choice checks covering grammar, vocabulary, and
                        comprehension with fast feedback.
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--comic-black)] px-3 py-2 font-bold align-top">
                        AI Vocabulary &amp; Grammar
                      </td>
                      <td className="border border-[var(--comic-black)] px-3 py-2 align-top">
                        Lesson-based vocabulary cards and grammar practice with smart AI feedback and
                        clear explanations.
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--comic-black)] px-3 py-2 font-bold align-top">
                        AI Tutor
                      </td>
                      <td className="border border-[var(--comic-black)] px-3 py-2 align-top">
                        Lesson-grounded role-play dialogue with guided responses, spelling/pronunciation
                        checks, and adaptive conversational difficulty.
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--comic-black)] px-3 py-2 font-bold align-top">
                        AI Flashcards
                      </td>
                      <td className="border border-[var(--comic-black)] px-3 py-2 align-top">
                        Camera-based image-word challenges with timed rounds and speak-the-word checks.
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--comic-black)] px-3 py-2 font-bold align-top">
                        Like, Save &amp; Tags
                      </td>
                      <td className="border border-[var(--comic-black)] px-3 py-2 align-top">
                        Save lessons, follow topics, and discover content by interest for faster, more
                        intentional review.
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--comic-black)] px-3 py-2 font-bold align-top">
                        Thai support
                      </td>
                      <td className="border border-[var(--comic-black)] px-3 py-2 align-top">
                        Bilingual help with Thai translations where available, so learners confirm
                        meaning without leaving the lesson.
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--comic-black)] px-3 py-2 font-bold align-top">
                        AI personalization &amp; learning analytics
                      </td>
                      <td className="border border-[var(--comic-black)] px-3 py-2 align-top">
                        Level filters, engagement-based feed ranking, topic preferences, and activity
                        tracking for smarter progress insights.
                      </td>
                    </tr>
                  </tbody>
                </table>
            </div>
            <div className="mt-4 rounded-2xl border-2 border-[var(--comic-black)] comic-bg-purple comic-pattern-zigzag p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-start pitch-deck-product-tools">
                <div className="space-y-4">
                  <div className="text-sm font-bold leading-snug text-white pitch-deck-body space-y-2">
                    <div className="pitch-deck-callout-row">
                      <div className="pitch-deck-logo-stamp">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="https://res.cloudinary.com/dkbf7tvcx/image/upload/v1783143201/englishfeed/logo/englishfeed-logo.png"
                          alt="EnglishFeed"
                        />
                      </div>
                      <p className="pitch-deck-callout-heading">How It Works</p>
                    </div>
                    <ul className="m-0 list-disc space-y-1.5 pl-5 pt-3">
                      <li>Swipe a structured video feed of lessons at your level</li>
                      <li>Lesson practice: tap vocab, speak, quiz, role-play with AI</li>
                      <li>Personalized learning feed with instant feedback</li>
                    </ul>
                  </div>
                  <div className="flex flex-nowrap items-start justify-between gap-1.5 sm:gap-2">
                    {(
                      [
                        { src: ENGLISHFEED_APP_HERO_CIRCLE_URLS[0], label: 'Speak' },
                        { src: ENGLISHFEED_APP_HERO_CIRCLE_URLS[1], label: 'Practice' },
                        { src: ENGLISHFEED_APP_HERO_CIRCLE_URLS[2], label: 'Feedback' },
                        { src: ENGLISHFEED_APP_HERO_CIRCLE_URLS[3], label: 'Assess' },
                      ] as const
                    ).map((item) => (
                      <div key={item.src} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full comic-border-thick comic-shadow-sm sm:h-14 sm:w-14">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.src}
                            alt={item.label}
                            className="h-full w-full object-cover object-center"
                          />
                        </div>
                        <ComicText className="text-center text-[10px] font-bold leading-tight text-white sm:text-xs">
                          {item.label}
                        </ComicText>
                      </div>
                    ))}
                  </div>
                </div>
                <figure className="m-0">
                  <div className="pitch-deck-image-overlay relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://res.cloudinary.com/ktg8khoq/image/upload/c_crop,w_500,h_703,y_50,g_north/v1787821272/englishfeed-app_enivsd.png"
                      alt="EnglishFeed interactive subtitles on phone"
                      className="w-full h-auto object-contain border-2 border-[var(--comic-black)] rounded-xl bg-white"
                    />
                    <div
                      className="pitch-deck-image-badge pitch-deck-image-badge--sm pitch-deck-image-badge--red"
                      aria-hidden="true"
                    >
                      Interactive
                      <span>Subtitles</span>
                    </div>
                  </div>
                  <figcaption className="mt-2 text-sm font-bold leading-snug text-white pitch-deck-body">
                    Tap any word to understand it in context.
                  </figcaption>
                </figure>
                <div>
                  <figure className="m-0">
                    <div className="pitch-deck-image-overlay relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788003701/ai-tutor-01_bmlwdf.png"
                        alt="EnglishFeed AI tutor role-play"
                        className="w-full h-auto object-contain border-2 border-[var(--comic-black)] rounded-xl bg-white"
                      />
                      <div
                        className="pitch-deck-image-badge pitch-deck-image-badge--sm pitch-deck-image-badge--nudge-top"
                        aria-hidden="true"
                      >
                        AI Roleplay Tutor
                      </div>
                    </div>
                  </figure>
                  <div className="pitch-deck-also-included pitch-deck-also-included--column">
                    <p className="pitch-deck-also-included-label">Also included:</p>
                    <div className="pitch-deck-also-included-stamps">
                      {[
                        'Immersive Video',
                        'AI Flashcards',
                        'Like, Save, Tags',
                        'Thai Support',
                      ].map((label) => (
                        <span key={label} className="pitch-deck-feature-stamp">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3 pitch-deck-product-tools">
                <figure className="m-0">
                  <div className="pitch-deck-image-overlay relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788002412/pronunciation-01_m9ctrx.png"
                      alt="EnglishFeed pronunciation practice"
                      className="w-full h-auto object-contain border-2 border-[var(--comic-black)] rounded-xl bg-white"
                    />
                    <div className="pitch-deck-image-badge pitch-deck-image-badge--sm" aria-hidden="true">
                      Pronunciation
                    </div>
                  </div>
                  <figcaption className="mt-2 text-sm font-bold leading-snug text-white pitch-deck-body">
                    Practice on terms with instant feedback.
                  </figcaption>
                </figure>
                <figure className="m-0">
                  <div className="pitch-deck-image-overlay relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788003630/vocab-02_jbppku.png"
                      alt="EnglishFeed AI vocabulary"
                      className="w-full h-auto object-contain border-2 border-[var(--comic-black)] rounded-xl bg-white"
                    />
                    <div className="pitch-deck-image-badge pitch-deck-image-badge--sm" aria-hidden="true">
                      Vocabulary
                    </div>
                  </div>
                  <figcaption className="mt-2 text-sm font-bold leading-snug text-white pitch-deck-body">
                    Drill vocab meaning, form, and examples.
                  </figcaption>
                </figure>
                <figure className="m-0">
                  <div className="pitch-deck-image-overlay relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788002412/quiz-01_ehz92q.png"
                      alt="EnglishFeed interactive quiz"
                      className="w-full h-auto object-contain border-2 border-[var(--comic-black)] rounded-xl bg-white"
                    />
                    <div className="pitch-deck-image-badge pitch-deck-image-badge--sm" aria-hidden="true">
                      Quiz
                    </div>
                  </div>
                  <figcaption className="mt-2 text-sm font-bold leading-snug text-white pitch-deck-body">
                    AI-powered, level-adaptive quizzes.
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>

          <div className="pitch-deck-homeroom-intro">
          <SubHeading>
            2.{' '}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://res.cloudinary.com/ktg8khoq/image/upload/f_png/v1788022325/homeroomtools4_oacwhe.psd"
              alt="Homeroom Tools"
              className="mx-1 inline-block h-12 w-auto align-middle object-contain sm:h-14"
            />
          </SubHeading>
          <div className="pitch-deck-product-homeroom clearfix">
            <div className="pitch-deck-product-homeroom-image float-right ml-6 mb-3 w-[11.5rem] sm:w-[13rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/ktg8khoq/image/upload/v1787836741/exercises_uljmwm.jpg"
                alt="Homeroom Tools classroom exercises"
                className="w-full h-auto object-contain border-2 border-[var(--comic-black)] rounded-xl"
              />
            </div>
            <Body>
              Homeroom Tools is Englishfully’s teacher resources product—an EdTech classroom system
              built for real English teaching workflows. A membership for teachers and schools to
              use Englishfully’s classroom tools.
            </Body>
            <Body>
              <strong>Benefit:</strong> teachers reduce prep time, deliver more interactive lessons, and keep grading
              and assessment in one system aligned to Digital Industry education goals. What makes
              Homeroom Tools powerful is adaptability—AI assistance across quizzes, Listen &amp;
              Learn, Escape Room, and related generators can target teaching methodology and precise
              English levels from A1 through C2, so every activity fits the class in front of you.
            </Body>
            <Body>Key features include:</Body>
            <div className="pitch-deck-feature-table-wrap pitch-deck-feature-table-wrap--split mb-4 overflow-x-auto clear-both">
              <table className="pitch-deck-feature-table w-full border-collapse text-left text-[var(--comic-dark)]">
                <thead>
                  <tr className="bg-[#d0d0d0]">
                    <th className="border border-[var(--comic-black)] px-3 py-2 font-black whitespace-nowrap">
                      Feature
                    </th>
                    <th className="border border-[var(--comic-black)] px-3 py-2 font-black">
                      What it does
                    </th>
                  </tr>
                </thead>
                <tbody className="pitch-deck-body">
                  <tr>
                    <td className="border border-[var(--comic-black)] px-3 py-2 font-bold align-top">
                      Gradebook
                    </td>
                    <td className="border border-[var(--comic-black)] px-3 py-2 align-top">
                      The classroom hub for tracking student progress across speaking and listening
                      assessments, with clear grade views and PDF/Excel export.
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[var(--comic-black)] px-3 py-2 font-bold align-top">
                      Presentation Generator
                    </td>
                    <td className="border border-[var(--comic-black)] px-3 py-2 align-top">
                      Turn lesson notes into interactive slides: multi-track audio–image matching
                      quizzes, AI grammar highlighting for explanations, describe-the-image practice
                      with word banks, built-in timers for classroom games, QR share for student
                      devices, and PDF/PPTX export.
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[var(--comic-black)] px-3 py-2 font-bold align-top">
                      QR Speaking Assessment (Speak &amp; Submit)
                    </td>
                    <td className="border border-[var(--comic-black)] px-3 py-2 align-top">
                      Assign speaking homework students complete on their phones via QR; teachers
                      review recordings and assess fluency and accuracy.
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[var(--comic-black)] px-3 py-2 font-bold align-top">
                      Listen &amp; Learn
                    </td>
                    <td className="border border-[var(--comic-black)] px-3 py-2 align-top">
                      Turn audio into phone-ready listening quizzes with AI vocabulary and
                      comprehension questions grounded in real clips.
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[var(--comic-black)] px-3 py-2 font-bold align-top">
                      Listen &amp; Answer
                    </td>
                    <td className="border border-[var(--comic-black)] px-3 py-2 align-top">
                      Build printable multi-part listening worksheets with AI-assisted questions,
                      answer keys, and scantron-ready formats.
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[var(--comic-black)] px-3 py-2 font-bold align-top">
                      Escape Room Generator
                    </td>
                    <td className="border border-[var(--comic-black)] px-3 py-2 align-top">
                      Create topic-based classroom escape missions with mixed interactive
                      challenges.
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[var(--comic-black)] px-3 py-2 font-bold align-top">
                      Lesson Plan Generator
                    </td>
                    <td className="border border-[var(--comic-black)] px-3 py-2 align-top">
                      Customizable plans by teaching method, topic, and level, linked to the
                      classroom tools above.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          </div>
            <div className="pitch-deck-homeroom-demos mt-4 clear-both p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-start pitch-deck-product-tools pitch-deck-homeroom-tools">
                <div className="space-y-4 sm:row-span-2">
                  <div className="text-sm font-bold leading-snug text-white pitch-deck-body space-y-2">
                    <div className="pitch-deck-callout-row">
                      <div className="pitch-deck-logo-stamp">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="https://res.cloudinary.com/ktg8khoq/image/upload/f_png/v1788022325/homeroomtools4_oacwhe.psd"
                          alt="Homeroom Tools"
                        />
                      </div>
                      <p className="pitch-deck-callout-heading">How It Works</p>
                    </div>
                    <ul className="m-0 list-disc space-y-1.5 pl-5 pt-3">
                      <li>Create listening, speaking, and slide activities with AI assist</li>
                      <li>Assign practice to student phones or tablets via QR for class, homework</li>
                      <li>Track and export results from one classroom Gradebook</li>
                    </ul>
                  </div>
                  <figure className="m-0">
                    <div className="pitch-deck-image-overlay relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788093490/listen-learn-test_iynlhw.png"
                        alt="Homeroom Tools Listen and Learn on tablet"
                        className="w-full h-auto object-contain bg-transparent"
                      />
                      <div className="pitch-deck-image-badge pitch-deck-image-badge--sm pitch-deck-image-badge--navy pitch-deck-image-badge--bottom-right" aria-hidden="true">
                        Listen &amp; Learn
                      </div>
                    </div>
                    <figcaption className="mt-2 text-sm font-bold leading-snug text-white pitch-deck-body">
                      Mobile-ready listening quizzes, reviews.
                    </figcaption>
                  </figure>
                  <div className="pitch-deck-also-included pitch-deck-also-included--column">
                    <p className="pitch-deck-also-included-label">Also included:</p>
                    <div className="pitch-deck-also-included-stamps">
                      {['Escape Room', 'Lesson Plans'].map((label) => (
                        <span key={label} className="pitch-deck-feature-stamp">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <figure className="m-0">
                  <div className="pitch-deck-image-overlay relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://res.cloudinary.com/ktg8khoq/image/upload/v1787851330/grades-demo-1_kuddy9.png"
                      alt="Homeroom Tools gradebook class overview"
                      className="w-full h-auto object-contain border-2 border-[var(--comic-black)] rounded-xl bg-white"
                    />
                    <div className="pitch-deck-image-badge pitch-deck-image-badge--sm pitch-deck-image-badge--navy pitch-deck-image-badge--top-right" aria-hidden="true">
                      Gradebook
                    </div>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788017614/grade-01_hzlh2c.png"
                    alt="Homeroom Tools gradebook export and detail"
                    className="mt-3 w-full h-auto object-contain border-2 border-[var(--comic-black)] rounded-xl bg-white"
                  />
                  <figcaption className="mt-2 text-sm font-bold leading-snug text-white pitch-deck-body">
                    Manage classes, assignments, and grades
                  </figcaption>
                </figure>
                <figure className="m-0">
                  <div className="pitch-deck-image-overlay relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788092380/listen-answer-2_rphg4a.png"
                      alt="Homeroom Tools Listen and Answer teacher assessment"
                      className="w-full h-auto object-contain border-2 border-[var(--comic-black)] rounded-xl bg-white"
                    />
                    <div className="pitch-deck-image-badge pitch-deck-image-badge--sm pitch-deck-image-badge--navy pitch-deck-image-badge--bottom-right" aria-hidden="true">
                      Listen &amp; Answer
                    </div>
                  </div>
                  <figcaption className="mt-2 text-sm font-bold leading-snug text-white pitch-deck-body">
                    Teachers build printable listening tests with AI-assisted questions, CEFR levels, frameworks, and answer formats.
                  </figcaption>
                </figure>
                <figure className="m-0">
                  <div className="pitch-deck-image-overlay relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://res.cloudinary.com/ktg8khoq/image/upload/v1787850604/presentation-demo_jcwzqr.png"
                      alt="Homeroom Tools presentation demo"
                      className="w-full h-auto object-contain border-2 border-[var(--comic-black)] rounded-xl bg-white"
                    />
                    <div className="pitch-deck-image-badge pitch-deck-image-badge--sm pitch-deck-image-badge--navy" aria-hidden="true">
                      Presentation
                    </div>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788021420/presentation-04_eyrkzc.png"
                    alt="Homeroom Tools presentation slide activity demo"
                    className="mt-3 w-full h-auto object-contain border-2 border-[var(--comic-black)] rounded-xl bg-white"
                  />
                  <figcaption className="mt-2 text-sm font-bold leading-snug text-white pitch-deck-body">
                    Interactive slides with multi-track audio and built-in assessment questions.
                  </figcaption>
                </figure>
                <figure className="m-0">
                  <div className="pitch-deck-image-overlay relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788018163/speak-04_bfm2gd.png"
                      alt="Homeroom Tools speaking practice demo"
                      className="w-full h-auto object-contain border-2 border-[var(--comic-black)] rounded-xl bg-white"
                    />
                    <div className="pitch-deck-image-badge pitch-deck-image-badge--sm pitch-deck-image-badge--navy" aria-hidden="true">
                      Speak &amp; Submit
                    </div>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788017445/speak-02_xzq9g0.png"
                    alt="Homeroom Tools speaking submission demo"
                    className="mt-3 w-full h-auto object-contain border-2 border-[var(--comic-black)] rounded-xl bg-white"
                  />
                  <figcaption className="mt-2 text-sm font-bold leading-snug text-white pitch-deck-body">
                    Interactive speaking exercises designed to build confidence and for feedback.
                  </figcaption>
                </figure>
              </div>
            </div>
            <SubHeading className="pitch-deck-print-break">Real-World Classroom Validation</SubHeading>
            <p className="pitch-deck-case-subhead">Founder-Led Product Demo</p>
            <HomeroomCaseStudy />
        </ComicCard>

        {/* f. Technology */}
        <ComicCard className="pitch-deck-section">
          <SectionHeading id="technology">f. Technology and Innovation Applied</SectionHeading>
          <Body>
            Englishfully applies modern web and AI technologies across its learner and teacher
            products. Innovation is integrated directly into learning and teaching workflows—not
            simply added as a standalone AI feature. Each capability serves a practical purpose
            tied to self-study, classroom engagement, assessment, or learning outcomes.
          </Body>

          <SubHeading>EnglishFeed</SubHeading>
          <div className="pitch-deck-tech-englishfeed">
            <Body>
              EnglishFeed combines video content delivery, artificial intelligence (AI), computer
              vision, cloud infrastructure, and data analytics to automate lesson creation,
              personalize learning, and measure learner engagement at scale.
            </Body>
            <div className="pitch-deck-tech-stack pitch-deck-tech-stack--panel">
              <article className="pitch-deck-tech-stack-card">
                <h5 className="pitch-deck-tech-stack-title">
                  Artificial Intelligence (AI) and Machine Learning
                </h5>
                <p className="pitch-deck-tech-stack-copy">
                  OpenAI Whisper, GPT-4o-mini, and DALL·E, plus browser speech recognition, power
                  transcription, tutoring dialogue, content generation, and speaking feedback.
                </p>
              </article>
              <article className="pitch-deck-tech-stack-card">
                <h5 className="pitch-deck-tech-stack-title">
                  Computer Vision and Augmented Reality (AR)
                </h5>
                <p className="pitch-deck-tech-stack-copy">
                  Google MediaPipe Face Landmarker and the device camera enable face-aware
                  interactive practice such as camera-based flashcard challenges.
                </p>
              </article>
              <article className="pitch-deck-tech-stack-card">
                <h5 className="pitch-deck-tech-stack-title">
                  Cloud Infrastructure and Media Delivery
                </h5>
                <p className="pitch-deck-tech-stack-copy">
                  Cloudflare R2 (S3-compatible object storage) and the AWS SDK deliver lesson media
                  at scale, with Next.js hosted on Vercel.
                </p>
              </article>
              <article className="pitch-deck-tech-stack-card">
                <h5 className="pitch-deck-tech-stack-title">
                  Database, Authentication, and Analytics Platform
                </h5>
                <p className="pitch-deck-tech-stack-copy">
                  Supabase (PostgreSQL, authentication, and Row Level Security) supports secure
                  learner accounts, progress data, and engagement analytics.
                </p>
              </article>
              <article className="pitch-deck-tech-stack-card">
                <h5 className="pitch-deck-tech-stack-title">Modern Web Application Platform</h5>
                <p className="pitch-deck-tech-stack-copy">
                  Next.js (App Router), React, TypeScript, and Tailwind CSS deliver a fast,
                  mobile-first learning experience.
                </p>
              </article>
              <article className="pitch-deck-tech-stack-card">
                <h5 className="pitch-deck-tech-stack-title">
                  Automated Content Production Pipeline
                </h5>
                <p className="pitch-deck-tech-stack-copy">
                  Node.js CLI scripts with OpenAI APIs and R2 storage automate lesson creation and
                  media preparation for the feed.
                </p>
              </article>
            </div>
          </div>

          <SubHeading className="pitch-deck-print-break">Homeroom Tools</SubHeading>
          <Body>
            Homeroom Tools uses AI, cloud media storage, and a modern web platform so teachers
            can create, assign, assess, and export interactive lessons—reducing manual workload
            while improving learner engagement and measurement.
          </Body>
          <div className="pitch-deck-tech-stack pitch-deck-tech-stack--panel">
            <article className="pitch-deck-tech-stack-card">
              <h5 className="pitch-deck-tech-stack-title">
                Artificial Intelligence (AI) and Machine Learning
              </h5>
              <p className="pitch-deck-tech-stack-copy">
                OpenAI Whisper and GPT-4o-mini transcribe lesson audio, clip listening segments,
                generate comprehension questions and vocabulary from source audio, support
                presentation grammar highlighting and image-describe practice, and assist
                escape-room and worksheet content creation.
              </p>
            </article>
            <article className="pitch-deck-tech-stack-card">
              <h5 className="pitch-deck-tech-stack-title">Speech Capture and Media Storage</h5>
              <p className="pitch-deck-tech-stack-copy">
                Browser recording on student phones, with Cloudflare R2 (S3-compatible) storing
                speaking submissions and listening media for teacher review and replay.
              </p>
            </article>
            <article className="pitch-deck-tech-stack-card">
              <h5 className="pitch-deck-tech-stack-title">Classroom Data and Access Control</h5>
              <p className="pitch-deck-tech-stack-copy">
                PostgreSQL-backed class rosters, assignments, grades, and results, with
                authenticated teacher tools and public QR student links for phone-ready
                participation.
              </p>
            </article>
            <article className="pitch-deck-tech-stack-card">
              <h5 className="pitch-deck-tech-stack-title">Modern Web Application Platform</h5>
              <p className="pitch-deck-tech-stack-copy">
                Next.js, React, TypeScript, and Tailwind CSS deliver present-mode slides, QR
                speaking/listening flows, and gradebook workflows on phones and classroom
                devices—no complex student installs.
              </p>
            </article>
            <article className="pitch-deck-tech-stack-card">
              <h5 className="pitch-deck-tech-stack-title">Document and Export Pipelines</h5>
              <p className="pitch-deck-tech-stack-copy">
                PDF, PowerPoint, and Excel export turn digital lessons, worksheets, and grade
                records into printable and shareable class assets.
              </p>
            </article>
          </div>

          <TechInnovationFlow />
        </ComicCard>

        {/* g. Industry */}
        <ComicCard className="pitch-deck-section pitch-deck-print-break">
          <SectionHeading id="industry">g. Industry Description / Competition / Trends</SectionHeading>

          <SubHeading>Industry Description</SubHeading>
          <Body>
            Englishfully operates in the <strong>Digital Industry</strong>, specifically digital
            education and language-learning technology. The startup impacts the industry by pairing
            consumer-style learning software with teacher-operated classroom systems—strengthening
            both self-study and institutional English instruction in Thailand’s digital economy.
          </Body>

          <SubHeading>Competition</SubHeading>
          <Body>
            Competitors include global language apps (for example, Duolingo and similar consumer
            platforms), general learning management systems used by schools, and local tutoring
            businesses that rely on offline-only delivery. Englishfully products differ by:
          </Body>
          <div className="pitch-deck-compete">
            <article className="pitch-deck-compete-card">
              <p className="pitch-deck-compete-typical">
                <span>Typical language apps</span>
                Gamified vocab drills and entertainment feeds—not a full skills path.
              </p>
              <div className="pitch-deck-compete-win">
                <p className="pitch-deck-compete-stamp">EnglishFeed wins</p>
                <p className="pitch-deck-compete-copy">
                  EnglishFeed is designed around how students already consume digital media,
                  transforming familiar formats into structured, engaging, and challenging learning
                  with six-skill practice.
                </p>
              </div>
            </article>
            <article className="pitch-deck-compete-card">
              <p className="pitch-deck-compete-typical">
                <span>Apps vs tutoring</span>
                Practice stays on-screen. Speaking with a real teacher is a separate product.
              </p>
              <div className="pitch-deck-compete-win">
                <p className="pitch-deck-compete-stamp">Coaching wins</p>
                <p className="pitch-deck-compete-copy">
                  EnglishFeed members can extend learning beyond the screen through online and
                  onsite coaching, building confidence with native English speakers—from digital
                  learning to real-world communication.
                </p>
              </div>
            </article>
            <article className="pitch-deck-compete-card">
              <p className="pitch-deck-compete-typical">
                <span>Student apps + school LMS</span>
                Teachers work across disconnected tools, making lesson prep and student practice less seamless.
              </p>
              <div className="pitch-deck-compete-win">
                <p className="pitch-deck-compete-stamp">One ecosystem</p>
                <p className="pitch-deck-compete-copy">
                  Homeroom Tools brings teacher tools and student practice into one ecosystem,
                  helping teachers quickly create structured, engaging activities and assessments
                  while reducing preparation time.
                </p>
              </div>
            </article>
            <article className="pitch-deck-compete-card">
              <p className="pitch-deck-compete-typical">
                <span>Global one-size products</span>
                Built for everywhere, so Thai learners get generic content and weak local support.
              </p>
              <div className="pitch-deck-compete-win">
                <p className="pitch-deck-compete-stamp">Thailand-first</p>
                <p className="pitch-deck-compete-copy">
                  Thailand-focused product design, including Thai-language learner support.
                </p>
              </div>
            </article>
          </div>
          <Body>
            What matters to customers and profitability is daily learner engagement and clearer
            outcomes in the app, time saved for teachers in the classroom, and recurring membership
            revenue across learner and teacher segments.
          </Body>

          <SubHeading className="pitch-deck-print-break">Trends</SubHeading>
          <Body>
            Current social-media trends show Thai students already learn on the same
            phones they scroll for entertainment. A 2023 northern Thailand university smartphone
            study found social networking (~93%), education (~90%), and entertainment (~90%) as the
            top reasons for use—evidence that learning intent sits next to distraction on the same
            device, so attention fragments. EnglishFeed is designed for that reality: it keeps the
            habit-forming swipe-and-scroll delivery people already know, while replacing irrelevant
            feed noise with structured, skill-focused English practice—so daily mobile use becomes
            productive learning instead of a distraction loop.
          </Body>
          <Body>
            In the classroom, a major trend in Thailand is the rapid adoption of tablets and laptops in
            government secondary schools. Under the Ministry of Education’s{' '}
            <strong>Anywhere Anytime</strong> program, Cabinet-approved funding supports large-scale
            device distribution so students and teachers can learn and teach digitally beyond the
            chalkboard. Public reporting indicates roughly <strong>608,000 devices</strong> for upper
            secondary students and teachers in the first major wave (2025), with plans to expand by
            about <strong>1.2 million</strong> more learners in 2026 and a multi-year pathway toward
            roughly <strong>2.6 million</strong> tablets/laptops across public schools.
          </Body>
          <div className="pitch-deck-device-rollout mb-4 flex flex-col items-stretch gap-4 lg:flex-row lg:items-end lg:gap-6">
            <div className="w-full shrink-0 rounded-xl border-2 border-[var(--comic-black)] bg-white p-3 comic-shadow-sm lg:w-72">
              <ComicText className="mb-1 text-center text-sm font-black text-[var(--comic-secondary)]">
                Classroom device rollout
              </ComicText>
              <ComicText className="mb-3 text-center text-[10px] font-bold text-[var(--comic-dark)]">
                Thailand public schools · Anywhere Anytime (approx. devices)
              </ComicText>
              <div className="flex h-44 items-end justify-between gap-2 px-1">
                {(
                  [
                    {
                      label: 'Before',
                      sub: '~limited',
                      height: '10%',
                      color: 'var(--comic-secondary)',
                    },
                    {
                      label: '2025',
                      sub: '~0.6M',
                      height: '28%',
                      color: 'var(--comic-primary)',
                    },
                    {
                      label: '2026',
                      sub: '~1.8M',
                      height: '68%',
                      color: 'var(--comic-secondary)',
                    },
                    {
                      label: '2031',
                      sub: '~2.6M',
                      height: '100%',
                      color: 'var(--comic-primary)',
                    },
                  ] as const
                ).map((bar) => (
                  <div
                    key={bar.label}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                  >
                    <span className="text-[9px] font-black text-[var(--comic-dark)]">{bar.sub}</span>
                    <div
                      className="w-full max-w-[3rem] rounded-lg border-2 border-[var(--comic-black)]"
                      style={{
                        height: bar.height,
                        backgroundColor: bar.color,
                        boxShadow: 'var(--comic-shadow-sm)',
                      }}
                      title={`${bar.label}: ${bar.sub}`}
                    />
                    <span className="w-full text-center text-[9px] font-black leading-tight text-[var(--comic-dark)] sm:text-[10px]">
                      {bar.label}
                    </span>
                  </div>
                ))}
              </div>
              <ComicText className="mt-2 text-center text-[9px] font-bold text-[var(--comic-dark)]">
                Source: MoE / Cabinet reporting on Anywhere Anytime (2025–2031)
              </ComicText>
            </div>
            <div className="min-w-0 flex-1 space-y-0">
              <Body>
                As government secondary classrooms move onto tablets, demand shifts from device
                access alone to <strong>what students and teachers do on those devices</strong>.
                Englishfully’s two offerings complement this trend directly:
              </Body>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-[var(--comic-dark)] pitch-deck-body">
                <li>
                  <strong>EnglishFeed</strong> — swipe-based, skill-focused English practice designed
                  for phone and tablet habits, so secondary learners can use school devices for daily
                  immersive learning, not only content consumption
                </li>
                <li>
                  <strong>Homeroom Tools</strong> — teacher-facing classroom workflow (presentations,
                  QR speaking, listening tasks, gradebook, interactive missions) that turns tablet
                  classrooms into structured English lessons with measurable outcomes
                </li>
              </ul>
              <Body>
                Together, learner practice and teacher systems turn Thailand’s classroom iPad/tablet
                wave into a complete English-learning stack for public and private secondary
                settings—aligned with Digital Industry education goals.
              </Body>
            </div>
          </div>
        </ComicCard>

        {/* h. Marketing & Sales */}
        <ComicCard className="pitch-deck-section pitch-deck-print-break">
          <SectionHeading id="marketing-sales">h. Marketing &amp; Sales Strategy</SectionHeading>

          <SubHeading>Marketing Strategy</SubHeading>
          <Body>
            <strong>Target customers:</strong> (1) English learners in Thailand seeking structured
            digital practice through EnglishFeed, with optional online/onsite coaching; (2) English
            teachers, tutors, and schools (government, international, private)
            needing classroom EdTech for lessons, assessments, and grade
            management; (3) parents and adult professionals seeking measurable
            progress.
          </Body>
          <MarketAudienceStamps />
          <Body>
            <strong>Promotion and distribution:</strong> digital channels (website, social media,
            content marketing) that showcase EnglishFeed’s swipe-based practice and AI features;
            teacher community outreach and school partnerships; and product-led demos of teacher
            resources tools. Distribution is primarily online via englishfully.com, with onsite
            support services delivered in Thailand for EnglishFeed membership customers who choose
            offline practice.
          </Body>
          <MarketChannelStamps />
          <div className="pitch-deck-market-presence clearfix">
            <figure className="pitch-deck-market-location">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788108390/location_ep5nnq.png"
                alt="Illustrative location concept"
              />
              <figcaption>Illustrative Location Concept</figcaption>
            </figure>
            <div className="pitch-deck-market-presence-copy">
              <Body>
                Englishfully plans to establish an initial physical location in a high-traffic
                commercial area. The location would provide onsite practice and coaching for members
                while also serving as a product demonstration and customer-acquisition center. As the
                business grows, additional locations may be considered based on demand and
                performance.
              </Body>
              <StampFlow
                steps={[
                  'EnglishFeed coaching / practice center',
                  'High-traffic location',
                  'Product demonstration',
                  'Customer acquisition',
                  'Membership conversion',
                ]}
              />
            </div>
          </div>

          <SubHeading className="pitch-deck-print-break">Sales Strategy</SubHeading>
          <Body>
            Customers convert through freemium or trial access where appropriate, clear EnglishFeed
            and Homeroom Tools membership plans on the website, direct consultation via contact
            and messaging channels, and teacher-led adoption when classroom tools prove immediate
            value (for example, QR speaking homework or listening assessments). Sales emphasize
            outcomes: daily learner engagement and clearer skill progress in EnglishFeed, plus
            faster prep and simpler grading for teachers—then expand into higher EnglishFeed tiers
            (with coaching support) and Homeroom Tools memberships.
          </Body>
          <MarketingSalesVisual />
        </ComicCard>

        {/* i. Financial Plan */}
        <ComicCard className="pitch-deck-section pitch-deck-print-break">
          <SectionHeading id="financial-plan">i. Financial Plan</SectionHeading>

          <SubHeading>Funds Required</SubHeading>
          <Body>
            Initial funding required is <strong>325,000 THB</strong>, sourced from{' '}
            <strong>personal funds</strong>. The company may later pursue additional capital through
            competitive startup funds, grants, and investor channels as product traction grows; the
            present plan is self-funded at launch.
          </Body>

          <SubHeading>Financial Plan (Income Generation &amp; Capital Expenditure)</SubHeading>
          <Body>
            Income is generated through: (1) EnglishFeed memberships (app access, with higher tiers
            including online and onsite coaching support as part of the same membership); and (2)
            Homeroom Tools memberships for EdTech classroom tools.
          </Body>
          <Body>
            Capital and operating expenditure priorities include technology development and
            infrastructure, advertising and customer acquisition, hiring Thai staff, and securing
            suitable prime locations for onsite coaching tied to EnglishFeed membership delivery.
          </Body>

          <SubHeading>Financial Projection</SubHeading>
          <Body>
            We forecast revenue growth from EnglishFeed memberships and from Homeroom Tools EdTech
            tools as learner and teacher adoption expand. Projected expenses will concentrate on
            operating overhead, technology upgrades, and staffing. Detailed multi-year numeric
            schedules will be maintained internally and updated as membership metrics mature.
          </Body>

          <SubHeading>Exit Strategy</SubHeading>
          <Body>
            Englishfully intends to build a cohesive, independently operable ecosystem—EnglishFeed
            plus Homeroom Tools EdTech tools—that can run with clear processes and recurring
            revenue. This design makes the business an attractive candidate for strategic investment
            or acquisition by an appropriate investor seeking a Thailand-ready digital education
            platform.
          </Body>
        </ComicCard>

        {/* j. Revenue Model */}
        <ComicCard className="pitch-deck-section pitch-deck-print-break">
          <SectionHeading id="revenue-model">j. Revenue Model</SectionHeading>
          <Body>
            Englishfully generates revenue primarily through recurring memberships and subscriptions:
          </Body>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-[var(--comic-dark)] pitch-deck-body">
            <li>
              <strong>EnglishFeed memberships</strong> — learners pay for app access (and, on Lite/Pro
              tiers, live online coaching and onsite practice included with EnglishFeed Pro access).
            </li>
            <li>
              <strong>Homeroom Tools memberships</strong> — teachers and institutions pay for
              EdTech classroom tools (assessment, presentation, gradebook, games, and related
              workflows).
            </li>
          </ul>
          <Body>
            Revenue is received from learners, parents (for younger students), independent teachers,
            and schools. Average revenue depends on EnglishFeed plan tier and Homeroom Tools
            adoption; the model prioritizes predictable recurring income over one-off content sales.
          </Body>
        </ComicCard>

        {/* k. Growth Strategy */}
        <div className="pitch-deck-print-flow">
        <ComicCard className="pitch-deck-section">
          <SectionHeading id="growth-strategy">k. Growth Strategy</SectionHeading>
          <Body>
            Growth objectives focus on three tracks: (1) deepen product quality across learner and
            teacher tools; (2) expand paying memberships among Thai learners and teachers; and (3)
            build local operational capacity (Thai staff and service locations) to support blended
            online/offline delivery.
          </Body>
          <Body>
            Development priorities include strengthening EnglishFeed’s AI practice, personalization,
            and engagement loops; growing App, Lite, and Pro memberships (including online/onsite
            coaching); completing high-demand teacher tools (such as Lesson Plan Generator);
            improving AI-assisted creation and assessment flows; strengthening Gradebook as the
            classroom hub; and packaging Homeroom Tools as a clear membership offering.
            Go-to-market growth will use EnglishFeed product marketing, Homeroom Tools demos,
            school partnerships, and digital campaigns targeted at English learners, teachers, and
            adult professionals in Thailand.
          </Body>
        </ComicCard>

        {/* l. Future */}
        <ComicCard className="pitch-deck-section">
          <SectionHeading id="future">l. Future — Expected Milestones (Next 2 Years)</SectionHeading>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-[var(--comic-dark)] pitch-deck-body">
            <li>
              <strong>Year 1:</strong> Strengthen EnglishFeed’s core practice experience and grow
              App, Lite, and Pro memberships; stabilize the Homeroom Tools suite; refine
              AI-assisted learning, lesson creation, listening, and speaking workflows; establish
              marketing channels and customer support processes in Thailand.
            </li>
            <li>
              <strong>Year 2:</strong> Scale EnglishFeed engagement and memberships; expand Thai
              staffing; invest in technology upgrades and advertising; open or secure prime
              locations for EnglishFeed onsite coaching where demand justifies; broaden school
              partnerships for both learner and teacher products; advance toward a fully
              independent, investable platform operations model.
            </li>
          </ul>
          <Body>
            Across both years, success is measured by product reliability, EnglishFeed learner
            engagement and recurring membership growth, teacher adoption of classroom tools, and
            clearer learning outcomes.
          </Body>
        </ComicCard>
        </div>

        {/* m. Thailand */}
        <ComicCard className="pitch-deck-section">
          <SectionHeading id="thailand-benefit">m. Thailand&apos;s Benefit</SectionHeading>

          <SubHeading>Thailand Destination</SubHeading>
          <div className="pitch-deck-thailand clearfix">
            <div className="pitch-deck-thailand-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788105535/thailand_dyknr2.png"
                alt="Thailand"
              />
            </div>
            <Body>
              Thailand is Englishfully’s home market and destination by design. The founder is based in
              Thailand and builds EnglishFeed and Homeroom Tools for Thai learner needs, classroom
              conditions, and digital infrastructure. Thailand offers a large demand for English
              improvement, a growing digital economy, and a policy environment that supports innovative
              Digital Industry startups through mechanisms such as the BOI Smart Visa.
            </Body>
          </div>

          <SubHeading>Benefit to Thailand</SubHeading>
          <Body>
            Englishfully benefits Thailand by: strengthening English proficiency—an economic and
            educational priority—through EnglishFeed’s accessible digital practice and optional
            coaching; supporting Thai teachers with modern classroom systems; creating demand for
            local talent in technology, education operations, and customer support; and contributing
            to the Digital Industry through software products developed and operated in Thailand.
            Improved English capability for students and professionals supports Thailand’s
            competitiveness in tourism, services, trade, and international collaboration.
          </Body>
          <ThailandBenefitVisual />
        </ComicCard>

        <div className="flex flex-wrap gap-3 print:hidden pb-8">
          <Link href="/about">
            <ComicButton variant="secondary" size="sm">
              ← Back to About
            </ComicButton>
          </Link>
          <Link href="/about/company-profile">
            <ComicButton variant="secondary" size="sm">
              Company Profile
            </ComicButton>
          </Link>
          <Link href="/contact">
            <ComicButton variant="primary" size="sm">
              Contact
            </ComicButton>
          </Link>
        </div>
      </div>

      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
