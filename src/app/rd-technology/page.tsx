"use client";

import ComicCard from "../../components/ComicCard";
import ComicTitle from "../../components/ComicTitle";
import ComicText from "../../components/ComicText";
import Footer from "../../components/Footer";
const AI_SYSTEMS = [
  {
    title: "🎙️ Speech Recognition & Pronunciation Intelligence",
    desc: "AI systems for sentence-level speaking practice, scoring, and coaching.",
    items: [
      "Audio capture and speech-to-text pronunciation checks",
      "Word-level correctness feedback against lesson target sentences",
      "Optional extended accent insight layer for deeper guidance",
      "Integrated recording/playback loops for rapid retry practice",
    ],
    applied: "Applied in: Pronunciation Practice · AI Tutor · AI Flashcards (speak step)",
  },
  {
    title: "💬 Language Understanding & Generation",
    desc: "Language models that power context-grounded tutoring and learning content.",
    items: [
      "Role-play tutor responses grounded in lesson title, description, topic, tags, and subtitle snippet",
      "AI-generated practice quizzes (grammar, vocabulary, comprehension) from lesson context",
      "AI-assisted vocabulary enrichment (definitions, examples, synonyms)",
      "Spelling-validation and response quality checks in tutor flow",
    ],
    applied: "Applied in: AI Tutor · AI Quiz · Tap-a-word vocabulary panel",
  },
  {
    title: "🎯 Personalization & Learning Intelligence",
    desc: "Adaptive feed and study pathways based on behavior and preferences.",
    items: [
      "Engagement-based lesson ranking signals",
      "Topic-preference boosts for logged-in users",
      "Level-based filtering (Beginner / Intermediate / Advanced)",
      "User-state persistence for more consistent progression",
    ],
    applied: "Applied across: Home feed · Profile learning flows · Practice surfaces",
  },
  {
    title: "📊 Analytics & Assessment Systems",
    desc: "Data infrastructure that tracks learning behavior and supports product optimization.",
    items: [
      "Event collection for views, completions, likes, saves, and practice interactions",
      "Engagement scoring pipeline to improve feed ordering",
      "Feature-level telemetry for pronunciation, quizzes, tutor, and flashcards",
      "Foundations for longitudinal progress and effectiveness reporting",
    ],
  },
];

const ROADMAP = [
  {
    quarter: "Q1 2026",
    title: "Community Learning Layer",
    desc: "Build social learning foundations around user-generated progress.",
    items: [
      "User profiles for learning goals and study journey sharing",
      "Optional posting of challenge videos (e.g., 1-minute topic speaking)",
      "Private/public controls for learner-generated recordings",
      "Structured Feed + Your Feed + Peers’ Feed architecture",
    ],
  },
  {
    quarter: "Q2 2026",
    title: "Practice Capture & Creator Workflow",
    desc: "Expand learner-created practice content and discoverability.",
    items: [
      "Recording pipeline for practice drills (including AI Flashcards sessions)",
      "Personal feed organization for self-review and progress storytelling",
      "Sharing flows designed for educational safety and consent",
      "Engagement signals extended to learner-created content",
    ],
  },
  {
    quarter: "Q3 2026",
    title: "Live Learning Events",
    desc: "Introduce webinar-style synchronous learning experiences for students.",
    items: [
      "Zoom-like live session infrastructure inside EnglishFeed ecosystem",
      "Instructor-led workshops for EnglishFully cohorts",
      "Live practice formats tied to lesson themes and goals",
      "Session analytics to evaluate participation and learning impact",
    ],
  },
  {
    quarter: "Q4 2026",
    title: "Social Audio & Peer Conversation",
    desc: "Add real-time conversational community features inspired by language-exchange models.",
    items: [
      "Audio-first peer communication for spoken practice",
      "Guided conversation spaces with learning prompts",
      "Community safety, moderation, and reporting systems",
      "Integration with learner goals, feed identity, and progress systems",
    ],
  },
];

const HIGHLIGHTS = [
  {
    title: "⚡ Context-Grounded AI Learning",
    desc: "AI outputs are tied to the exact lesson the learner is watching, not generic chat.",
    items: [
      "Lesson-linked tutor, quiz, vocabulary, and pronunciation workflows",
      "Shared context layer across multiple AI features",
      "Faster transfer from input to active language use",
    ],
  },
  {
    title: "🧩 Multimodal Learning Experience",
    desc: "A single platform combining video, subtitles, touch, voice, and camera.",
    items: [
      "Interactive subtitles with word-level actions",
      "Speak-and-score pronunciation loops",
      "Camera-based flashcard gameplay with timed responses",
      "Seamless transitions between passive and active practice",
    ],
  },
  {
    title: "🇹🇭 Bilingual Support for Thai Learners",
    desc: "Localized support where it improves comprehension and confidence.",
    items: [
      "Thai translation support in selected learning surfaces",
      "Tutor-line Thai assistance where enabled",
      "Bilingual scaffolding without replacing English immersion",
    ],
  },
  {
    title: "📱 Mobile-First EdTech Infrastructure",
    desc: "Engineered for real-world app usage and scalable feature growth.",
    items: [
      "Efficient APIs, caching, and reusable learning services",
      "Production-ready architecture for high-frequency interactions",
      "Design tuned for short-session, repeatable daily learning habits",
    ],
  },
  {
    title: "🔒 Privacy & Data Protection",
    desc: "Learner trust is a core product requirement.",
    items: [
      "Secure handling of user and event data across learning features",
      "Access controls for personal activity and saved learning content",
      "Privacy-aware design for recordings and future social sharing",
      "Ongoing governance aligned with education and platform standards",
    ],
  },
];

export default function RDTechnology() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <section className="flex flex-col items-center justify-center text-center py-24 px-4 comic-bg-accent relative overflow-hidden comic-pattern-zigzag">
        <div className="absolute top-10 left-10 w-24 h-24 comic-bg-warning rounded-full comic-border-thick comic-shadow-xl comic-bounce" />
        <div
          className="absolute top-20 right-20 w-20 h-20 comic-bg-success rounded-full comic-border-thick comic-shadow-xl comic-bounce"
          style={{ animationDelay: "0.5s" }}
        />
        <div
          className="absolute bottom-20 left-20 w-16 h-16 comic-bg-danger rounded-full comic-border-thick comic-shadow-xl comic-bounce"
          style={{ animationDelay: "1s" }}
        />
        <div className="relative z-0 max-w-5xl">
          <ComicTitle level={1} className="comic-text-white mb-8 comic-wiggle">
            🔬 R&amp;D / Technology
          </ComicTitle>
          <ComicText size="xl" className="comic-text-white font-bold">
            Explore the applied AI systems, product architecture, and research roadmap powering
            EnglishFully&apos;s EnglishFeed. This page reflects the current production-ready app and
            the 2026 innovation pipeline.
          </ComicText>
        </div>
      </section>

      <section className="max-w-6xl mx-auto py-24 px-4">
        <div className="text-center mb-12">
          <ComicTitle level={2} className="mb-6 text-[var(--comic-accent)]">
            🤖 AI Models &amp; Architecture
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold">
            EnglishFeed uses a modular AI stack for video-based English learning, combining speech,
            language, personalization, and analytics in one mobile-first workflow.
          </ComicText>
        </div>

        <div className="space-y-8">
          {AI_SYSTEMS.map((section) => (
            <ComicCard key={section.title} className="comic-shadow-xl">
              <ComicTitle level={3} className="mb-4 text-[var(--comic-warning)]">
                {section.title}
              </ComicTitle>
              <ComicText className="text-[var(--comic-dark)] font-bold mb-4">{section.desc}</ComicText>
              <ul className="text-[var(--comic-dark)] space-y-2 mb-4">
                {section.items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
              {section.applied && (
                <ComicText className="text-[var(--comic-dark)] font-bold">{section.applied}</ComicText>
              )}
            </ComicCard>
          ))}
        </div>
      </section>

      <section className="comic-bg-primary py-24 px-4 comic-pattern-stripes">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <ComicTitle level={2} className="comic-text-white mb-6">
              📚 Research Methodology
            </ComicTitle>
            <ComicText size="lg" className="comic-text-white font-bold">
              Our product R&amp;D combines language pedagogy with measurable in-app behavior to
              continuously improve outcomes for English learners, including Thai-speaking users.
            </ComicText>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <ComicCard className="comic-shadow-xl">
              <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
                🎓 Pedagogy-Driven Product Design
              </ComicTitle>
              <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
                Evidence-informed learning flows built into everyday app usage.
              </ComicText>
              <ul className="text-[var(--comic-dark)] space-y-2">
                <li>• Comprehensible input via short contextual video lessons</li>
                <li>• Active recall through quizzes and flashcard-style challenges</li>
                <li>• Retrieval and reinforcement via saved vocabulary, clips, and review loops</li>
                <li>• Blended skill training: listening, reading, speaking, and guided writing in context</li>
              </ul>
            </ComicCard>

            <ComicCard className="comic-shadow-xl">
              <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
                🔬 Data-Guided Iteration
              </ComicTitle>
              <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
                Continuous improvement through product telemetry and learner feedback.
              </ComicText>
              <ul className="text-[var(--comic-dark)] space-y-2">
                <li>• Experimentation on interaction design and learning sequence</li>
                <li>• Analysis of completion, retry, and retention behaviors</li>
                <li>• Calibration of quiz/tutor difficulty and response quality</li>
                <li>• Performance tuning for latency, stability, and mobile experience</li>
              </ul>
            </ComicCard>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto py-24 px-4">
        <div className="text-center mb-12">
          <ComicTitle level={2} className="mb-6 text-[var(--comic-accent)]">
            🗺️ Technology Roadmap
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold">
            Applied R&amp;D roadmap for EnglishFeed expansion in 2026.
          </ComicText>
        </div>
        <div className="space-y-8">
          {ROADMAP.map((item, index) => (
            <ComicCard key={item.quarter} className="comic-shadow-xl">
              <ComicTitle level={3} className="mb-3 text-[var(--comic-warning)]">
                {item.quarter} — {item.title}
              </ComicTitle>
              <ComicText className="text-[var(--comic-dark)] font-bold mb-3">{item.desc}</ComicText>
              <ul className="text-[var(--comic-dark)] space-y-2">
                {item.items.map((point) => (
                  <li key={point}>• {point}</li>
                ))}
              </ul>
            </ComicCard>
          ))}
        </div>
      </section>

      <section className="comic-bg-warning py-24 px-4 comic-pattern-dots">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <ComicTitle level={2} className="comic-text-white mb-6">
              🏆 Innovation Highlights
            </ComicTitle>
            <ComicText size="lg" className="comic-text-white font-bold">
              What makes EnglishFeed technologically distinct today.
            </ComicText>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {HIGHLIGHTS.map((item) => (
              <ComicCard key={item.title} className="comic-shadow-xl">
                <ComicTitle level={3} className="mb-4 text-[var(--comic-accent)]">
                  {item.title}
                </ComicTitle>
                <ComicText className="text-[var(--comic-dark)] font-bold mb-4">{item.desc}</ComicText>
                <ul className="text-[var(--comic-dark)] space-y-2">
                  {item.items.map((point) => (
                    <li key={point}>• {point}</li>
                  ))}
                </ul>
              </ComicCard>
            ))}
          </div>
        </div>
      </section>

      <div className="flex-grow" />
      <Footer />
    </div>
  );
}

