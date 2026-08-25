'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import ComicButton from '../../../components/ComicButton';
import ComicCard from '../../../components/ComicCard';
import ComicText from '../../../components/ComicText';
import ComicTitle from '../../../components/ComicTitle';
import Footer from '../../../components/Footer';
import TeacherAuthGate from '../../../components/speak-and-submit/TeacherAuthGate';

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

function SubHeading({ children }: { children: ReactNode }) {
  return (
    <ComicTitle level={4} className="comic-title-no-shadow mb-3 mt-8 text-[var(--comic-secondary)]">
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
      <TeacherAuthGate>
      <section className="pitch-deck-hero comic-bg-secondary py-16 px-4 text-center print:py-8">
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
            <ComicButton
              variant="accent"
              size="sm"
              type="button"
              onClick={() => window.print()}
            >
              Print / Save PDF
            </ComicButton>
          </div>
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
            <strong>Englishfully&apos;s Teacher Resources</strong> membership, a suite of
            teacher-facing EdTech classroom tools. Initial capital is provided from personal funds.
            Over the next two years, Englishfully will deepen product capability; grow learner and
            teacher adoption in Thailand; hire local staff; partner with private schools, small
            language schools, and government schools to introduce a more effective way to deliver and
            present English learning; and build an independently operable platform suitable for
            long-term growth or acquisition.
          </Body>
        </ComicCard>

        {/* b. Company */}
        <ComicCard className="pitch-deck-section">
          <SectionHeading id="company-background">b. The Company / Background</SectionHeading>
          <Body>
            Englishfully Co., Ltd. was established in 2026 in Thailand to address a persistent gap:
            English education is widely available, but few solutions provide an innovative platform
            for structured learning, teacher workflow, and measurable classroom outcomes within one
            coherent system.
          </Body>
          <Body>
            The company develops and operates digital learning and teaching products. On the learner
            side, EnglishFeed provides AI-powered, interactive and immersive English learning in a
            structured swipe-based format. Its content delivers engaging video and audio designed for
            today&apos;s social media user. On the teacher side, Teacher Resources
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
        </ComicCard>

        {/* c. Mission & Vision */}
        <ComicCard className="pitch-deck-section">
          <SectionHeading id="mission-vision">c. Mission &amp; Vision</SectionHeading>
          <SubHeading>Mission</SubHeading>
          <Body>
            To deliver complete English learning through innovative digital tools and practical
            classroom systems that help learners build real communication skills and help teachers
            create, assign, assess, and manage learning with clarity and ease.
          </Body>
          <SubHeading>Vision</SubHeading>
          <Body>
            To become Thailand’s trusted English learning and teaching platform—where learners
            progress from fundamentals to fluent use, and teachers run engaging, effective classes
            end to end through one integrated EdTech ecosystem.
          </Body>
        </ComicCard>

        {/* d. Management Team */}
        <ComicCard className="pitch-deck-section">
          <SectionHeading id="management-team">d. Management Team</SectionHeading>
          <SubHeading>Robert — Founder</SubHeading>
          <div className="pitch-deck-founder clearfix">
            <div className="pitch-deck-founder-photos float-right ml-6 mb-3 flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/dkbf7tvcx/image/upload/v1783439716/englishfully/company/Robert.jpg"
                alt="Robert, founder of Englishfully"
                className="h-36 w-36 object-cover object-top border-2 border-[var(--comic-black)]"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/dkbf7tvcx/image/upload/v1783440767/englishfully/company/university.jpg"
                alt="California State University, Fullerton"
                className="h-16 w-16 object-contain"
              />
            </div>
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
              products designed for real classrooms—not only consumer apps.
            </Body>
          </div>
        </ComicCard>

        {/* e. Products */}
        <ComicCard className="pitch-deck-section">
          <SectionHeading id="products">e. Products</SectionHeading>
          <Body>
            Englishfully’s products fall into two complementary lines. Features create clear learner
            and teacher benefits: faster preparation, better practice, measurable outcomes, and a more
            complete English journey.
          </Body>

          <SubHeading>1. EnglishFeed (Learner Application &amp; Memberships)</SubHeading>
          <Body>
            EnglishFeed is a swipe-based digital English learning app built for productive habit
            learning—familiar feed flow, but structured and interactive to keep learners focused,
            progressing, and coming back daily. Membership tiers (such as App,
            Lite, and Pro) unlock app practice and, at higher tiers, live online coaching and onsite
            practice.
          </Body>
          <Body>Key features include:</Body>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-[var(--comic-dark)] pitch-deck-body">
            <li>
              <strong>Six-skill English immersion</strong> — listening, speaking, reading, writing,
              grammar, and vocabulary practice that adapts and evolves with learner progress.
            </li>
            <li>
              <strong>Video lessons</strong> — immersive video learning with AI visuals,
              interactivity, and content spanning foundations, daily life, business, and culture.
            </li>
            <li>
              <strong>Interactive subtitles</strong> — tap any word for instant meaning,
              pronunciation, examples, synonyms, and save-to-vocabulary while watching.
            </li>
            <li>
              <strong>Pronunciation practice</strong> — speak target lesson sentences with speech
              recognition, word-level scoring, and real-time correction feedback.
            </li>
            <li>
              <strong>AI Quiz</strong> — lesson-grounded multiple-choice checks covering grammar,
              vocabulary, and comprehension with fast feedback.
            </li>
            <li>
              <strong>AI Vocabulary &amp; Grammar</strong> — lesson-based vocabulary cards and
              grammar practice with smart AI feedback and clear explanations.
            </li>
            <li>
              <strong>AI Tutor</strong> — lesson-grounded role-play dialogue with guided responses,
              spelling/pronunciation checks, and adaptive conversational difficulty.
            </li>
            <li>
              <strong>AI Flashcards</strong> — camera-based image-word challenges with timed rounds
              and speak-the-word checks.
            </li>
            <li>
              <strong>Like, Save &amp; Tags</strong> — save lessons, follow topics, and discover
              content by interest for faster, more intentional review.
            </li>
            <li>
              <strong>Thai support</strong> — bilingual help with Thai translations where available,
              so learners confirm meaning without leaving the lesson.
            </li>
            <li>
              <strong>AI personalization &amp; learning analytics</strong> — level filters,
              engagement-based feed ranking, topic preferences, and activity tracking for smarter
              progress insights.
            </li>
          </ul>
          <Body>
            Benefit: learners practice in the app and can add mentor-led online or onsite support
            through the same membership path.
          </Body>

          <SubHeading>2. Teacher Resources (EdTech Classroom System)</SubHeading>
          <Body>
            A membership for teachers and schools to use Englishfully’s classroom tools, including:
          </Body>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-[var(--comic-dark)] pitch-deck-body">
            <li>
              <strong>Gradebook</strong> — the classroom hub for tracking student progress across
              speaking and listening assessments, with clear grade views and PDF/Excel export.
            </li>
            <li>
              <strong>Presentation Generator</strong> — turn lesson notes into interactive slides:
              multi-track audio–image matching quizzes, AI grammar highlighting for explanations,
              describe-the-image practice with word banks, built-in timers for classroom games, QR
              share for student devices, and PDF/PPTX export.
            </li>
            <li>
              <strong>QR Speaking Assessment (Speak &amp; Submit)</strong> — assign speaking
              homework students complete on their phones via QR; teachers review recordings and
              assess fluency and accuracy.
            </li>
            <li>
              <strong>Listen &amp; Learn</strong> — turn audio into phone-ready listening quizzes
              with AI vocabulary and comprehension questions grounded in real clips.
            </li>
            <li>
              <strong>Listen &amp; Answer</strong> — build printable multi-part listening
              worksheets with AI-assisted questions, answer keys, and scantron-ready formats.
            </li>
            <li>
              <strong>Escape Room Generator</strong> — create topic-based classroom escape
              missions with mixed challenges (vocabulary, listening, matching, code locks, and
              more) that students play through to a final escape.
            </li>
            <li>
              <strong>Lesson Plan Generator</strong> (roadmap) — customizable plans by teaching
              method, topic, and level, linked to the classroom tools above.
            </li>
          </ul>
          <Body>
            Benefit: teachers reduce prep time, deliver more interactive lessons, and keep grading
            and assessment in one system aligned to Digital Industry education goals.
          </Body>
        </ComicCard>

        {/* f. Technology */}
        <ComicCard className="pitch-deck-section">
          <SectionHeading id="technology">f. Technology and Innovation Applied</SectionHeading>
          <Body>
            Englishfully applies modern web and AI technologies across learner and teacher products.
            Innovation is practical: each capability is tied to self-study or classroom outcomes.
          </Body>

          <SubHeading>EnglishFeed</SubHeading>
          <Body>
            EnglishFeed combines video content delivery, artificial intelligence (AI), computer
            vision, cloud infrastructure, and data analytics to automate lesson creation,
            personalize learning, and measure learner engagement at scale.
          </Body>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-[var(--comic-dark)] pitch-deck-body">
            <li>
              <strong>Artificial Intelligence (AI) and Machine Learning</strong> — OpenAI Whisper,
              GPT-4o-mini, and DALL·E, plus browser speech recognition, power transcription,
              tutoring dialogue, content generation, and speaking feedback.
            </li>
            <li>
              <strong>Computer Vision and Augmented Reality (AR)</strong> — Google MediaPipe Face
              Landmarker and the device camera enable face-aware interactive practice such as
              camera-based flashcard challenges.
            </li>
            <li>
              <strong>Cloud Infrastructure and Media Delivery</strong> — Cloudflare R2
              (S3-compatible object storage) and the AWS SDK deliver lesson media at scale, with
              Next.js hosted on Vercel.
            </li>
            <li>
              <strong>Database, Authentication, and Analytics Platform</strong> — Supabase
              (PostgreSQL, authentication, and Row Level Security) supports secure learner accounts,
              progress data, and engagement analytics.
            </li>
            <li>
              <strong>Modern Web Application Platform</strong> — Next.js (App Router), React,
              TypeScript, and Tailwind CSS deliver a fast, mobile-first learning experience.
            </li>
            <li>
              <strong>Automated Content Production Pipeline</strong> — Node.js CLI scripts with
              OpenAI APIs and R2 storage automate lesson creation and media preparation for the
              feed.
            </li>
          </ul>

          <SubHeading>Teacher Resources</SubHeading>
          <Body>
            Teacher Resources uses AI, cloud media storage, and a modern web platform so teachers
            can create, assign, assess, and export interactive lessons—reducing manual workload
            while improving learner engagement and measurement.
          </Body>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-[var(--comic-dark)] pitch-deck-body">
            <li>
              <strong>Artificial Intelligence (AI) and Machine Learning</strong> — OpenAI Whisper
              and GPT-4o-mini transcribe lesson audio, clip listening segments, generate
              comprehension questions and vocabulary from source audio, support presentation
              grammar highlighting and image-describe practice, and assist escape-room and
              worksheet content creation.
            </li>
            <li>
              <strong>Speech Capture and Media Storage</strong> — browser recording on student
              phones, with Cloudflare R2 (S3-compatible) storing speaking submissions and listening
              media for teacher review and replay.
            </li>
            <li>
              <strong>Classroom Data and Access Control</strong> — PostgreSQL-backed class rosters,
              assignments, grades, and results, with authenticated teacher tools and public QR
              student links for phone-ready participation.
            </li>
            <li>
              <strong>Modern Web Application Platform</strong> — Next.js, React, TypeScript, and
              Tailwind CSS deliver present-mode slides, QR speaking/listening flows, and gradebook
              workflows on phones and classroom devices—no complex student installs.
            </li>
            <li>
              <strong>Document and Export Pipelines</strong> — PDF, PowerPoint, and Excel export
              turn digital lessons, worksheets, and grade records into printable and shareable class
              assets.
            </li>
          </ul>
        </ComicCard>

        {/* g. Industry */}
        <ComicCard className="pitch-deck-section">
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
            businesses that rely on offline-only delivery. Englishfully differs by integrating:
          </Body>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-[var(--comic-dark)] pitch-deck-body">
            <li>
              EnglishFeed’s swipe-based six-skill practice (listening, speaking, reading, writing,
              grammar, vocabulary) with AI tutoring, interactive video lessons, and progress
              personalization—not only gamified vocabulary drills
            </li>
            <li>
              Teacher classroom tools teachers can run immediately (QR speaking, audio clipping,
              gradebook, presentations, escape-room missions)
            </li>
            <li>Learner practice and teacher systems in one ecosystem, with shared membership paths</li>
            <li>
              Thailand-focused product design, including Thai-language learner support and
              online/onsite coaching options through EnglishFeed memberships
            </li>
          </ul>
          <Body>
            What matters to customers and profitability is daily learner engagement and clearer
            outcomes in the app, time saved for teachers in the classroom, and recurring membership
            revenue across learner and teacher segments.
          </Body>

          <SubHeading>Trends</SubHeading>
          <Body>
            Relevant trends include rising demand for mobile, habit-forming language learning;
            AI-assisted practice, tutoring, and assessment; personalized content feeds; digital
            classroom tools that are easy to deploy (not only content libraries); and Thailand’s
            continued push for digital skills and English capability as economic infrastructure.
            Learners want daily practice that feels modern and measurable, while schools and
            independent teachers need tools they can run immediately in real classrooms.
          </Body>
        </ComicCard>

        {/* h. Marketing & Sales */}
        <ComicCard className="pitch-deck-section">
          <SectionHeading id="marketing-sales">h. Marketing &amp; Sales Strategy</SectionHeading>

          <SubHeading>Marketing Strategy</SubHeading>
          <Body>
            <strong>Target customers:</strong> (1) English learners in Thailand seeking structured
            digital practice through EnglishFeed, with optional online/onsite coaching; (2) English
            teachers, tutors, and schools needing classroom EdTech for lessons, assessments, and
            grade management; (3) parents and adult professionals seeking measurable progress.
          </Body>
          <Body>
            <strong>Promotion and distribution:</strong> digital channels (website, social media,
            content marketing) that showcase EnglishFeed’s swipe-based practice and AI features;
            teacher community outreach and school partnerships; and product-led demos of Teacher
            Resources tools. Distribution is primarily online via englishfully.com, with onsite
            support services delivered in Thailand for EnglishFeed membership customers who choose
            offline practice.
          </Body>

          <SubHeading>Sales Strategy</SubHeading>
          <Body>
            Customers convert through freemium or trial access where appropriate, clear EnglishFeed
            and Teacher Resources membership plans on the website, direct consultation via contact
            and messaging channels, and teacher-led adoption when classroom tools prove immediate
            value (for example, QR speaking homework or listening assessments). Sales emphasize
            outcomes: daily learner engagement and clearer skill progress in EnglishFeed, plus
            faster prep and simpler grading for teachers—then expand into higher EnglishFeed tiers
            (with coaching support) and Teacher Resources memberships.
          </Body>
        </ComicCard>

        {/* i. Financial Plan */}
        <ComicCard className="pitch-deck-section">
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
            Teacher Resources memberships for EdTech classroom tools.
          </Body>
          <Body>
            Capital and operating expenditure priorities include technology development and
            infrastructure, advertising and customer acquisition, hiring Thai staff, and securing
            suitable prime locations for onsite coaching tied to EnglishFeed membership delivery.
          </Body>

          <SubHeading>Financial Projection</SubHeading>
          <Body>
            We forecast revenue growth from EnglishFeed memberships and from Teacher Resources EdTech
            tools as learner and teacher adoption expand. Projected expenses will concentrate on
            operating overhead, technology upgrades, and staffing. Detailed multi-year numeric
            schedules will be maintained internally and updated as membership metrics mature.
          </Body>

          <SubHeading>Exit Strategy</SubHeading>
          <Body>
            Englishfully intends to build a cohesive, independently operable ecosystem—EnglishFeed
            plus Teacher Resources EdTech tools—that can run with clear processes and recurring
            revenue. This design makes the business an attractive candidate for strategic investment
            or acquisition by an appropriate investor seeking a Thailand-ready digital education
            platform.
          </Body>
        </ComicCard>

        {/* j. Revenue Model */}
        <ComicCard className="pitch-deck-section">
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
              <strong>Teacher Resources memberships</strong> — teachers and institutions pay for
              EdTech classroom tools (assessment, presentation, gradebook, games, and related
              workflows).
            </li>
          </ul>
          <Body>
            Revenue is received from learners, parents (for younger students), independent teachers,
            and schools. Average revenue depends on EnglishFeed plan tier and Teacher Resources
            adoption; the model prioritizes predictable recurring income over one-off content sales.
          </Body>
        </ComicCard>

        {/* k. Growth Strategy */}
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
            classroom hub; and packaging Teacher Resources as a clear membership offering.
            Go-to-market growth will use EnglishFeed product marketing, Teacher Resources demos,
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
              App, Lite, and Pro memberships; stabilize the Teacher Resources suite; refine
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

        {/* m. Thailand */}
        <ComicCard className="pitch-deck-section">
          <SectionHeading id="thailand-benefit">m. Thailand&apos;s Benefit</SectionHeading>

          <SubHeading>Thailand Destination</SubHeading>
          <Body>
            Thailand is Englishfully’s home market and destination by design. The founder is based in
            Thailand and builds EnglishFeed and Teacher Resources for Thai learner needs, classroom
            conditions, and digital infrastructure. Thailand offers a large demand for English
            improvement, a growing digital economy, and a policy environment that supports innovative
            Digital Industry startups through mechanisms such as the BOI Smart Visa.
          </Body>

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
        </ComicCard>

        <div className="flex flex-wrap gap-3 print:hidden pb-8">
          <Link href="/about">
            <ComicButton variant="secondary" size="sm">
              ← Back to About
            </ComicButton>
          </Link>
          <Link href="/contact">
            <ComicButton variant="primary" size="sm">
              Contact
            </ComicButton>
          </Link>
        </div>
      </div>

      </TeacherAuthGate>

      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
