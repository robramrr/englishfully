export type LearningModuleItem = {
  id: string;
  title: string;
  description: string;
};

export type LearningTrack = {
  id: string;
  title: string;
  focus: string;
  items: LearningModuleItem[];
};

/** Curricula for the online-learning module search (English copy). */
export const ENGLISH_LEARNING_TRACKS: readonly LearningTrack[] = [
  {
    id: "track-1",
    title: "Track 1: 🏗️ Foundational Pillars (Beginner)",
    focus:
      "Building a solid base for daily survival and confidence.",
    items: [
      {
        id: "t1-alphabetics",
        title: "Alphabetics & Phonics",
        description:
          "Mastering sounds, vowel stress, and the Roman alphabet.",
      },
      {
        id: "t1-survival",
        title: "Essential Survival English",
        description:
          "Greetings, introducing yourself, and asking for help.",
      },
      {
        id: "t1-daily",
        title: "Daily Routine Vocabulary",
        description: "Talking about your day, time, and hobbies.",
      },
      {
        id: "t1-sentences",
        title: "Sentence Structure 101",
        description:
          "Building simple, correct sentences (Subject + Verb + Object).",
      },
      {
        id: "t1-numbers",
        title: "Numbers & Money",
        description: "Shopping, ordering food, and handling transactions.",
      },
      {
        id: "t1-city",
        title: "Navigating Your City",
        description:
          "Giving and asking for directions and using public transport.",
      },
    ],
  },
  {
    id: "track-2",
    title: "Track 2: 📈 Fluency & Social Skills (Intermediate)",
    focus: "Moving beyond basic needs to real conversation.",
    items: [
      {
        id: "t2-drills",
        title: "Conversation Drills",
        description: "Keeping a chat going without awkward pauses.",
      },
      {
        id: "t2-tenses",
        title: "The Power of Tenses",
        description:
          "Mastering Past, Present, and Future for storytelling.",
      },
      {
        id: "t2-opinions",
        title: "Expressing Opinions",
        description:
          "How to agree, disagree, and give advice politely.",
      },
      {
        id: "t2-descriptive",
        title: "Descriptive Language",
        description:
          "Using adjectives and adverbs to sound more vivid.",
      },
      {
        id: "t2-travel",
        title: "Travel & Culture",
        description:
          "Navigating airports, hotels, and social etiquette abroad.",
      },
      {
        id: "t2-reading",
        title: "Reading for Life",
        description:
          "Understanding news articles, blogs, and social media.",
      },
    ],
  },
  {
    id: "track-3",
    title: "Track 3: 💼 Professional & Business Mastery (Advanced)",
    focus: "Career-ready English for the global workplace.",
    items: [
      {
        id: "t3-email",
        title: "The Professional Email",
        description:
          "Writing clear, punchy, and polite correspondence.",
      },
      {
        id: "t3-meetings",
        title: "Meeting Participation",
        description:
          "How to interrupt, clarify, and summarize in meetings.",
      },
      {
        id: "t3-negotiation",
        title: "Negotiation & Persuasion",
        description:
          "Language for closing deals and handling objections.",
      },
      {
        id: "t3-presentations",
        title: "Presentation Skills",
        description: "Structuring a deck and speaking with confidence.",
      },
      {
        id: "t3-job",
        title: "The Job Hunter",
        description:
          "Resume (CV) writing and mock job interview practice.",
      },
      {
        id: "t3-leadership",
        title: "Workplace Leadership",
        description:
          "Managing teams and giving constructive feedback.",
      },
    ],
  },
  {
    id: "track-4",
    title: "Track 4: 👁️ Precision & Specialized Skills (Technical)",
    focus:
      'Refining the details that separate "good" from native-level English.',
    items: [
      {
        id: "t4-phonics",
        title: "Visual Phonics Masterclass",
        description:
          "Positioning your mouth and tongue for difficult sounds (L vs R, Th, and more).",
      },
      {
        id: "t4-rhythm",
        title: "Rhythm & Intonation",
        description:
          'Mastering the "music" of English to sound more natural.',
      },
      {
        id: "t4-idioms",
        title: "Idioms & Slang",
        description:
          "Understanding what fluent speakers mean in casual settings.",
      },
      {
        id: "t4-public",
        title: "Public Speaking",
        description: "Managing stage fright and using body language.",
      },
      {
        id: "t4-debate",
        title: "Critical Thinking & Debate",
        description:
          "Discussing complex topics like tech, ethics, or news.",
      },
      {
        id: "t4-academic",
        title: "Academic Writing",
        description: "Essay structure and formal logic for students.",
      },
    ],
  },
  {
    id: "track-5",
    title: "Track 5: 💬 Real-World Scenarios (Practical)",
    focus: "Role-play situations based on the learner’s specific life.",
    items: [
      {
        id: "t5-doctor",
        title: "Doctor’s Appointments",
        description:
          "Explaining health issues and understanding instructions.",
      },
      {
        id: "t5-customer",
        title: "Customer Service Excellence",
        description: "Handling complaints and helping clients.",
      },
      {
        id: "t5-social",
        title: "Social Networking",
        description: "Making friends and small talk at events.",
      },
      {
        id: "t5-jargon",
        title: "Technical Jargon",
        description:
          "Specialized English for IT, Engineering, or Hospitality.",
      },
    ],
  },
] as const;

function normalizeForSearch(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export function moduleHaystack(
  track: LearningTrack,
  item: LearningModuleItem
): string {
  return normalizeForSearch(
    `${track.title} ${track.focus} ${item.title} ${item.description}`
  );
}

/** Match if full phrase is contained, or every significant token appears. */
export function matchesModuleSearch(query: string, haystack: string): boolean {
  const q = normalizeForSearch(query);
  if (!q) return false;
  if (haystack.includes(q)) return true;
  const tokens = q.split(" ").filter((w) => w.length >= 2);
  if (tokens.length === 0) return haystack.includes(q);
  return tokens.every((t) => haystack.includes(t));
}
