'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import ComicButton from '../../../components/ComicButton';
import ComicCard from '../../../components/ComicCard';
import ComicText from '../../../components/ComicText';
import ComicTitle from '../../../components/ComicTitle';
import Footer from '../../../components/Footer';
import TechInnovationFlow from '../../../components/pitch-deck/TechInnovationFlow';
import {
  COMPANY_PROFILE_ONLINE_COACHING_URL,
  LOGO_URL,
  ONSITE_ONE_ON_ONE_PRACTICE_URL,
} from '../../../constants/images';

const TOC = [
  { id: 'identification', label: 'a. Document / Company Identification' },
  { id: 'overview', label: 'b. Company Overview' },
  { id: 'history', label: 'c. Business History' },
  { id: 'mission-vision-values', label: 'd. Mission, Vision & Values' },
  { id: 'products', label: 'e. Products & Services' },
  { id: 'achievements', label: 'f. Key Achievements' },
  { id: 'leadership', label: 'g. Leadership' },
  { id: 'thailand-contact', label: 'h. Contact' },
  { id: 'brochure', label: 'i. Product Brochure' },
  { id: 'website', label: 'j. Website' },
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
      <ComicTitle level={2} className="comic-title-no-shadow mb-4 text-[var(--brand-navy)]">
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
      className={`comic-title-no-shadow mb-3 mt-8 text-[var(--brand-navy)] ${className}`.trim()}
    >
      {children}
    </ComicTitle>
  );
}

function Body({ children }: { children: ReactNode }) {
  return (
    <ComicText
      weight="normal"
      className="company-profile-body text-[var(--brand-navy)] mb-4 leading-relaxed"
    >
      {children}
    </ComicText>
  );
}

export default function CompanyProfilePage() {
  return (
    <div className="company-profile-page flex flex-col min-h-screen bg-white">
      <section className="company-profile-toolbar print:hidden py-8 px-4 text-center bg-[var(--brand-navy)]">
        <div className="max-w-4xl mx-auto space-y-4">
          <ComicText className="comic-text-white font-bold text-sm uppercase tracking-wide">
            Englishfully Co., Ltd. · Digital Industry · BOI Smart Visa
          </ComicText>
          <ComicTitle level={1} className="comic-title-no-shadow comic-text-white">
            Company Profile
          </ComicTitle>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/about">
              <ComicButton variant="warning" size="sm">
                ← About Us
              </ComicButton>
            </Link>
            <Link href="/about/pitch-deck">
              <ComicButton variant="warning" size="sm">
                Pitch Deck
              </ComicButton>
            </Link>
            <ComicButton
              variant="primary"
              size="sm"
              type="button"
              onClick={() => window.print()}
            >
              Print / Save PDF
            </ComicButton>
          </div>
        </div>
      </section>

      <div className="company-profile-content max-w-4xl mx-auto w-full px-4 py-10 space-y-10">
        <ComicCard className="company-profile-toc print:hidden">
          <ComicTitle level={3} className="comic-title-no-shadow mb-4 text-[var(--brand-navy)]">
            Contents
          </ComicTitle>
          <nav aria-label="Company profile contents">
            <ol className="grid sm:grid-cols-2 gap-2 text-left">
              {TOC.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="font-medium text-[var(--brand-navy)] hover:text-[var(--brand-red)] underline-offset-2 hover:underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </ComicCard>

        {/* a. Identification / letterhead */}
        <ComicCard className="company-profile-section company-profile-letterhead">
          <SectionHeading id="identification">
            a. Document / Company Identification
          </SectionHeading>
          <header className="company-profile-masthead">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_URL} alt="Englishfully" className="company-profile-masthead-logo" />
            <div className="company-profile-masthead-copy">
              <p className="company-profile-legal-name">Englishfully Co., Ltd.</p>
              <p className="company-profile-doc-title">Company Profile</p>
              <p className="company-profile-doc-meta">
                September 2026 · Prepared for BOI Thailand Smart Visa / Digital Industry
              </p>
            </div>
          </header>
          <dl className="company-profile-meta-table">
            <div>
              <dt>Legal name</dt>
              <dd>Englishfully Co., Ltd.</dd>
            </div>
            <div>
              <dt>Industry classification</dt>
              <dd>Digital Industry (education technology)</dd>
            </div>
            <div>
              <dt>Year established</dt>
              <dd>2026</dd>
            </div>
            <div>
              <dt>Headquarters</dt>
              <dd>Bangkok, Thailand</dd>
            </div>
            <div>
              <dt>Registered address</dt>
              <dd>Level 11 540 Phloen Chit Rd, Lumphini, Pathum Wan, Bangkok 10330</dd>
            </div>
            <div>
              <dt>Website</dt>
              <dd>englishfully.com</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>hello@englishfully.com</dd>
            </div>
            <div>
              <dt>Document date</dt>
              <dd>September 2026</dd>
            </div>
            <div>
              <dt>Prepared for</dt>
              <dd>Board of Investment of Thailand — Smart Visa (Digital Industry)</dd>
            </div>
          </dl>
          <Body>
            This document provides a formal overview of Englishfully Co., Ltd.: business history,
            mission, products and services, and key achievements. It is prepared as a company
            profile / catalogue for official use.
          </Body>
        </ComicCard>

        {/* b. Overview */}
        <ComicCard className="company-profile-section">
          <SectionHeading id="overview">b. Company Overview</SectionHeading>
          <div className="company-profile-overview">
            <figure className="company-profile-overview-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788104162/students-using-englishfully_atx3yu.jpg"
                alt="Students using Englishfully learning products"
              />
              <figcaption>Learners using Englishfully digital products</figcaption>
            </figure>
            <div>
              <Body>
                Englishfully Co., Ltd. is a Thailand-based education technology company in the
                Digital Industry. The company develops and operates a complete English-learning
                ecosystem for Thai and regional learners and for teachers who need practical
                classroom technology.
              </Body>
              <Body>
                The learner-facing product is <strong>EnglishFeed</strong>, a swipe-based digital
                learning application for structured English practice. The teacher-facing product is{' '}
                <strong>Homeroom Tools</strong>, a classroom system for lesson creation, speaking
                and listening assessment, interactive practice, and grade management. Higher
                EnglishFeed memberships include live 1-on-1 online coaching and onsite coaching in
                Thailand.
              </Body>
              <Body>
                Products are designed for Thai-language learner backgrounds and for classroom
                conditions typical of Thai secondary schools.
              </Body>
            </div>
          </div>
        </ComicCard>

        {/* c. History */}
        <ComicCard className="company-profile-section">
          <SectionHeading id="history">c. Business History</SectionHeading>
          <Body>
            Englishfully Co., Ltd. was established in 2026 in Thailand. The company was founded to
            address a persistent gap: English education is widely available, yet few solutions
            provide structured learner practice, teacher workflow, and measurable classroom
            outcomes within one coherent system.
          </Body>
          <Body>
            From establishment, the company has developed live digital products rather than a
            concept-only offering. EnglishFeed delivers AI-supported, interactive English learning
            in a structured swipe-based format. Homeroom Tools provides a classroom system so
            schools and independent teachers can create, assign, assess, and manage English
            instruction without assembling disconnected applications.
          </Body>
          <Body>
            Establishment capital of <strong>325,000 THB</strong> was provided from personal funds.
            Headquarters and primary market focus are in Bangkok, Thailand, with a product roadmap
            oriented toward Thai-language learner backgrounds, local classroom realities, and the
            country’s digital education priorities.
          </Body>
        </ComicCard>

        {/* d. Mission, vision, values */}
        <ComicCard className="company-profile-section">
          <SectionHeading id="mission-vision-values">
            d. Mission, Vision &amp; Values
          </SectionHeading>
          <SubHeading>Mission</SubHeading>
          <Body>
            To deliver complete English learning—fundamentals, skills practice, assessment, and
            classroom management—through innovative digital products designed for Thai and regional
            learners, and for teachers who need practical education technology that fits real
            classrooms.
          </Body>
          <SubHeading>Vision</SubHeading>
          <Body>
            To become Thailand’s trusted English learning and teaching platform, where learners
            progress from fundamentals to confident use through structured, personalized, and
            interactive practice, and teachers run effective classes end to end through one
            integrated education-technology ecosystem.
          </Body>
          <SubHeading>Values</SubHeading>
          <div className="company-profile-values">
            <article>
              <h5>Innovate</h5>
              <p>
                Apply current digital and AI capabilities directly to learning and teaching
                workflows, rather than as disconnected features.
              </p>
            </article>
            <article>
              <h5>Access</h5>
              <p>
                Design quality English education so it can reach learners and teachers regardless of
                background or location.
              </p>
            </article>
            <article>
              <h5>Complete</h5>
              <p>
                Cover the full English journey: fundamentals, skills practice, assessment, and
                classroom management.
              </p>
            </article>
            <article>
              <h5>Engage</h5>
              <p>
                Make learning involving and sustainable through structured, interactive practice
                that holds attention without sacrificing educational purpose.
              </p>
            </article>
          </div>
        </ComicCard>

        {/* e. Products */}
        <ComicCard className="company-profile-section company-profile-section--products">
          <SectionHeading id="products">e. Products &amp; Services</SectionHeading>
          <Body>
            Englishfully’s catalogue comprises two complementary digital product lines and coaching
            services delivered through EnglishFeed memberships.
          </Body>

          <SubHeading>
            1.{' '}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://res.cloudinary.com/dkbf7tvcx/image/upload/v1783143201/englishfeed/logo/englishfeed-logo.png"
              alt="EnglishFeed"
              className="company-profile-inline-logo"
            />
          </SubHeading>
          <Body>
            EnglishFeed is a swipe-based English learning application. Learners move through a
            structured video feed of lessons at their level, then practice in context: tap
            vocabulary in subtitles, speak target sentences, complete quizzes, and role-play with
            an AI tutor. Membership tiers are <strong>App</strong>, <strong>Lite</strong>, and{' '}
            <strong>Pro</strong>. App covers digital practice; higher tiers add live 1-on-1 online
            coaching and, at Pro, onsite coaching in Thailand.
          </Body>

          <SubHeading>
            2.{' '}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://res.cloudinary.com/ktg8khoq/image/upload/f_png/v1788022325/homeroomtools4_oacwhe.psd"
              alt="Homeroom Tools"
              className="company-profile-inline-logo company-profile-inline-logo--homeroom"
            />
          </SubHeading>
          <Body>
            Homeroom Tools is Englishfully’s teacher suite—an education-technology classroom system
            for English teaching workflows, offered as a membership for teachers and schools.
            Teachers create listening, speaking, and slide activities with AI assistance; assign
            practice to student phones or tablets via QR code; and track results in one Gradebook.
          </Body>

          <SubHeading>3. Coaching services</SubHeading>
          <div className="company-profile-coaching">
            <div className="company-profile-coaching-photos">
              <figure className="company-profile-overview-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={COMPANY_PROFILE_ONLINE_COACHING_URL}
                  alt="1-on-1 online English coaching"
                />
                <figcaption>1-on-1 online coaching</figcaption>
              </figure>
              <figure className="company-profile-overview-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ONSITE_ONE_ON_ONE_PRACTICE_URL}
                  alt="1-on-1 onsite English coaching"
                />
                <figcaption>1-on-1 onsite coaching</figcaption>
              </figure>
            </div>
            <Body>
              Coaching is not a separate product line. It is included with higher EnglishFeed
              memberships: live 1-on-1 online coaching on Lite and Pro, and onsite coaching in
              Thailand on Pro. Learners practice in the application and may add mentor-led
              speaking support through the same membership path.
            </Body>
          </div>
        </ComicCard>

        <ComicCard className="company-profile-section company-profile-section--tech-flow">
          <div className="company-profile-tech-flow pitch-deck-page">
            <TechInnovationFlow showAiStack={false} />
          </div>
        </ComicCard>

        {/* f. Achievements */}
        <ComicCard className="company-profile-section company-profile-section--achievements">
          <SectionHeading id="achievements">f. Key Achievements</SectionHeading>
          <div className="company-profile-achievements">
            <figure className="company-profile-overview-photo company-profile-achievements-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788166619/robert-in-class_xeiyg0.png"
                alt="Founder teaching a Thai secondary-school English class"
              />
              <figcaption>
                Founder-led classroom demonstration, Thai secondary-school English class
              </figcaption>
            </figure>
            <Body>
              As a company established in 2026, Englishfully’s achievements to date are the launch of
              live digital products and classroom validation of Homeroom Tools in a Thai
              secondary-school English classroom (founder-led product demonstration).
            </Body>
            <Body>
              The demonstration setting was a Thai secondary-school English classroom of
              approximately 40–45 students. In classes of that size, giving every student speaking
              time during a lesson is difficult. Speak &amp; Submit allows each student to record
              speaking for teacher review; Listen &amp; Answer and related tools support listening
              assessment and activity creation under limited preparation time and mixed
              proficiency levels.
            </Body>
          </div>
          <div className="company-profile-table-wrap">
            <table className="company-profile-table">
              <caption>Classroom validation — recorded outcomes</caption>
              <thead>
                <tr>
                  <th scope="col">Measure</th>
                  <th scope="col">Result</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Students reached</td>
                  <td>100+</td>
                </tr>
                <tr>
                  <td>Speaking submissions</td>
                  <td>100+</td>
                </tr>
                <tr>
                  <td>Activities created</td>
                  <td>5+</td>
                </tr>
                <tr>
                  <td>Assessments</td>
                  <td>2</td>
                </tr>
                <tr>
                  <td>Live classroom sessions</td>
                  <td>5+</td>
                </tr>
              </tbody>
            </table>
          </div>
        </ComicCard>

        {/* g. Leadership */}
        <ComicCard className="company-profile-section">
          <SectionHeading id="leadership">g. Leadership</SectionHeading>
          <div className="company-profile-founder">
            <div className="company-profile-founder-photos">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/dkbf7tvcx/image/upload/v1783439716/englishfully/company/Robert.jpg"
                alt="Robert, founder of Englishfully"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788097274/university-csuf_ycyyv7.png"
                alt="California State University, Fullerton"
                className="company-profile-founder-seal"
              />
            </div>
            <div>
              <SubHeading className="mt-0">Robert — Founder</SubHeading>
              <figure className="company-profile-founder-teaching">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://res.cloudinary.com/ktg8khoq/image/upload/v1787643151/teaching_tyrmwq.jpg"
                  alt="Robert teaching English in the classroom"
                />
                <figcaption>Teaching at a Thai government primary school</figcaption>
              </figure>
              <Body>
                Robert leads product strategy, technology development, and business operations. He
                is a certified English instructor with classroom experience across ages and levels,
                and he works as a developer and business consultant building digital tools for
                learning.
              </Body>
              <Body>
                He holds degrees in Sociology and Business Administration from California State
                University, Fullerton. Originally from California, United States, and a fluent
                Spanish speaker, he lived in Monterrey, Mexico before making Thailand home. That
                international path informs Englishfully’s emphasis on accessible language learning
                and products designed for real classrooms.
              </Body>
            </div>
          </div>
        </ComicCard>

        {/* h. Contact */}
        <ComicCard className="company-profile-section">
          <SectionHeading id="thailand-contact">h. Contact</SectionHeading>
          <div className="company-profile-overview">
            <figure className="company-profile-overview-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/dkbf7tvcx/image/upload/v1783520856/englishfully/company/englishfully-office.jpg"
                alt="Englishfully office location in Bangkok"
              />
              <figcaption>Registered office, Pathum Wan, Bangkok</figcaption>
            </figure>
            <div>
              <dl className="company-profile-meta-table company-profile-meta-table--contact">
                <div>
                  <dt>Legal name</dt>
                  <dd>Englishfully Co., Ltd.</dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>Level 11 540 Phloen Chit Rd, Lumphini, Pathum Wan, Bangkok 10330</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>hello@englishfully.com</dd>
                </div>
                <div>
                  <dt>Website</dt>
                  <dd>englishfully.com</dd>
                </div>
              </dl>
            </div>
          </div>
          <p className="company-profile-endorsement">
            Englishfully Co., Ltd. · Company Profile · September 2026
          </p>
        </ComicCard>

        {/* i. Product brochure */}
        <ComicCard className="company-profile-section company-profile-section--brochure">
          <SectionHeading id="brochure">i. Product Brochure</SectionHeading>
          <div className="company-profile-brochure">
            <article className="company-profile-brochure-sheet company-profile-brochure-sheet--englishfully">
              <header className="company-profile-brochure-top">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={LOGO_URL} alt="Englishfully" className="company-profile-brochure-logo" />
                <p className="company-profile-brochure-folio">01 / 03</p>
              </header>
              <div className="company-profile-brochure-body">
                <p className="company-profile-brochure-kicker">Digital Industry · Bangkok</p>
                <h3 className="company-profile-brochure-headline">
                  Complete English learning.
                  <span>One ecosystem.</span>
                </h3>
                <p className="company-profile-brochure-deck">
                  Englishfully Co., Ltd. develops live digital products for Thai-language learners and
                  for teachers who need classroom technology that fits real lessons—structured
                  practice, assessment, and grade management in one system.
                </p>
                <figure className="company-profile-brochure-hero">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788104162/students-using-englishfully_atx3yu.jpg"
                    alt="Students using Englishfully learning products"
                  />
                </figure>
                <ul className="company-profile-brochure-lanes">
                  <li>
                    <span>Learner application</span>
                    <strong>EnglishFeed</strong>
                    <p>Swipe-based English practice with AI support and live coaching at higher tiers.</p>
                  </li>
                  <li>
                    <span>Teacher suite</span>
                    <strong>Homeroom Tools</strong>
                    <p>Create, assign, assess, and manage English classes from one classroom system.</p>
                  </li>
                </ul>
                <footer className="company-profile-brochure-foot">
                  <span>Established 2026</span>
                  <span>englishfully.com</span>
                </footer>
              </div>
            </article>

            <article className="company-profile-brochure-sheet company-profile-brochure-sheet--englishfeed">
              <header className="company-profile-brochure-top">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://res.cloudinary.com/dkbf7tvcx/image/upload/v1783143201/englishfeed/logo/englishfeed-logo.png"
                  alt="EnglishFeed"
                  className="company-profile-brochure-logo"
                />
                <p className="company-profile-brochure-folio">02 / 03</p>
              </header>
              <div className="company-profile-brochure-body">
                <p className="company-profile-brochure-kicker">Learner application</p>
                <h3 className="company-profile-brochure-headline">
                  English in a structured
                  <span>swipe feed.</span>
                </h3>
                <div className="company-profile-brochure-lead">
                  <figure className="company-profile-brochure-hero company-profile-brochure-hero--app">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://res.cloudinary.com/ktg8khoq/image/upload/v1787847387/prototype-englishfeed_o62i1e.jpg"
                      alt="EnglishFeed application"
                    />
                  </figure>
                  <p className="company-profile-brochure-deck">
                    Learners move through video lessons at their level, then practice in context: tap
                    vocabulary, speak target sentences, complete quizzes, and role-play with an AI
                    tutor. Memberships: App, Lite, and Pro.
                  </p>
                </div>
                <ul className="company-profile-brochure-features">
                  <li>Six-skill immersion</li>
                  <li>Interactive subtitles</li>
                  <li>Pronunciation scoring</li>
                  <li>AI tutor &amp; quizzes</li>
                  <li>Thai-language support</li>
                  <li>Online &amp; onsite coaching</li>
                </ul>
                <div className="company-profile-brochure-thumbs">
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788002412/pronunciation-01_m9ctrx.png"
                      alt="EnglishFeed pronunciation practice"
                    />
                    <figcaption>Pronunciation</figcaption>
                  </figure>
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788003630/vocab-02_jbppku.png"
                      alt="EnglishFeed vocabulary practice"
                    />
                    <figcaption>Vocabulary</figcaption>
                  </figure>
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788002412/quiz-01_ehz92q.png"
                      alt="EnglishFeed quiz"
                    />
                    <figcaption>AI Quiz</figcaption>
                  </figure>
                </div>
                <footer className="company-profile-brochure-foot">
                  <span>App · Lite · Pro</span>
                  <span>englishfeed.com</span>
                </footer>
              </div>
            </article>

            <article className="company-profile-brochure-sheet company-profile-brochure-sheet--homeroom">
              <header className="company-profile-brochure-top">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://res.cloudinary.com/ktg8khoq/image/upload/f_png/v1788022325/homeroomtools4_oacwhe.psd"
                  alt="Homeroom Tools"
                  className="company-profile-brochure-logo"
                />
                <p className="company-profile-brochure-folio">03 / 03</p>
              </header>
              <div className="company-profile-brochure-body">
                <p className="company-profile-brochure-kicker">Teacher suite</p>
                <h3 className="company-profile-brochure-headline">
                  Teacher tools that
                  <span>fit real classrooms.</span>
                </h3>
                <p className="company-profile-brochure-deck">
                  Homeroom Tools is Englishfully’s classroom system for teachers and schools. Create
                  listening, speaking, and slide activities with AI assistance; assign practice via QR
                  code; and track results in one Gradebook.
                </p>
                <div className="company-profile-brochure-thumbs company-profile-brochure-thumbs--four">
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://res.cloudinary.com/ktg8khoq/image/upload/v1787851330/grades-demo-1_kuddy9.png"
                      alt="Homeroom Tools Gradebook"
                    />
                    <figcaption>Gradebook</figcaption>
                  </figure>
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788018163/speak-04_bfm2gd.png"
                      alt="Homeroom Tools Speak and Submit"
                    />
                    <figcaption>Speak &amp; Submit</figcaption>
                  </figure>
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788092380/listen-answer-2_rphg4a.png"
                      alt="Homeroom Tools Listen and Answer"
                    />
                    <figcaption>Listen &amp; Answer</figcaption>
                  </figure>
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://res.cloudinary.com/ktg8khoq/image/upload/v1787850604/presentation-demo_jcwzqr.png"
                      alt="Homeroom Tools Presentation Generator"
                    />
                    <figcaption>Presentation</figcaption>
                  </figure>
                </div>
                <ul className="company-profile-brochure-steps">
                  <li>
                    <strong>01</strong>
                    <span>Create</span>
                    <p>Build activities with AI assist, by topic and level.</p>
                  </li>
                  <li>
                    <strong>02</strong>
                    <span>Assign</span>
                    <p>Share to student phones or tablets with a QR code.</p>
                  </li>
                  <li>
                    <strong>03</strong>
                    <span>Assess</span>
                    <p>Review speaking, listening, and grades in one place.</p>
                  </li>
                </ul>
                <footer className="company-profile-brochure-foot">
                  <span>Membership for teachers &amp; schools</span>
                  <span>englishfully.com</span>
                </footer>
              </div>
            </article>
          </div>
        </ComicCard>

        <ComicCard className="company-profile-section">
          <SectionHeading id="website">j. Website</SectionHeading>
          <figure className="company-profile-website-shot">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788441567/Website-1_nvugg9.png"
              alt="englishfully.com/app EnglishFeed page"
            />
            <figcaption>englishfully.com/app</figcaption>
          </figure>
        </ComicCard>

        <div className="flex flex-wrap gap-3 print:hidden pb-8">
          <Link href="/about">
            <ComicButton variant="secondary" size="sm">
              ← Back to About
            </ComicButton>
          </Link>
          <Link href="/about/pitch-deck">
            <ComicButton variant="secondary" size="sm">
              Pitch Deck
            </ComicButton>
          </Link>
          <Link href="/contact">
            <ComicButton variant="primary" size="sm">
              Contact
            </ComicButton>
          </Link>
        </div>
      </div>

      <div className="flex-grow print:hidden" />
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
