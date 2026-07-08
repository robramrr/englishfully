/**
 * Centralized static image URLs.
 * Logo is served directly from Cloudinary (no next/image / Vercel optimization).
 */
export const LOGO_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/v1779780445/englishfully/logo/englishfully-01.png";

/** Homepage hero slide 1 background (CSS url) — not passed through next/image. */
export const HERO_BACKGROUND_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/v1777748303/englishfully/service/english-speaking-practic-1-and-1-coaching.png";

/** Homepage hero slide 1 — CTA row circle (group session) */
export const HERO_CIRCLE_IMAGE_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/v1779865297/englishfully/hero/group-session.png";

/** Homepage hero slide 2 — EnglishFeed background video */
export const ENGLISHFEED_HERO_VIDEO_URL =
  "https://res.cloudinary.com/dkbf7tvcx/video/upload/v1779796420/englishfully/hero/englishfeed-hero-video-1.mp4";

/** Onsite 1-on-1 native practice photo (in-person learning pricing card). */
export const ONSITE_ONE_ON_ONE_PRACTICE_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/v1777748303/englishfully/service/english-speaking-practic-1-and-1-coaching.png";

/** Onsite small group speaking lab photo (in-person learning pricing card). */
export const ONSITE_SMALL_GROUP_SPEAKING_LAB_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/v1777748303/englishfully/service/english-speaking-lab-small-group.png";

/** “How It Works” hero illustrations (slideshow, in-person learning). */
export const HOW_IT_WORKS_SLIDE_APP_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/c_crop,g_north,h_0.92/v1777756763/englishfully/service/english-learning-app.png";

export const HOW_IT_WORKS_SLIDE_ONE_ON_ONE_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/c_crop,g_north,h_0.92/v1777823232/englishfully/service/1-on-1-english-learning.png";

export const HOW_IT_WORKS_SLIDE_GOAL_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/c_crop,g_north,h_0.92/v1777756763/englishfully/service/english-learning-goal.png";

export const HOW_IT_WORKS_SLIDE_URLS = [
  HOW_IT_WORKS_SLIDE_APP_URL,
  HOW_IT_WORKS_SLIDE_ONE_ON_ONE_URL,
  HOW_IT_WORKS_SLIDE_GOAL_URL,
] as const;

/** Online-learning subscription tiers (pricing cards). */
export const ONLINE_SUBSCRIPTION_APP_MEMBER_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/c_crop,g_north,h_0.92/v1777821289/englishfully/service/app-member-2.png";

/** Lite Member subscription card & online-learning hero slide (pricing / carousel). */
export const ONLINE_SUBSCRIPTION_ONE_ON_ONE_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/c_crop,g_north,h_0.92/v1777821288/englishfully/service/1-on-1-online.png";

/** Homepage-only visual for the 1-on-1 online coaching promo block (not used on /online-learning). */
export const HOME_ONLINE_ONE_ON_ONE_COACHING_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/v1777851566/englishfully/service/english-learning-1-on-1.png";

/** Homepage AI video-lesson card: phone showing an in-app vertical video lesson. */
export const HOME_VIDEO_LESSON_PROMO_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/c_crop,x_0.15,y_0.15,w_0.7,h_0.7/v1777960128/englishfully/service/english-video-lesson-2.png";

/** Homepage AI speech practice card: EnglishFeed voice recording and feedback on a phone. */
export const HOME_AI_SPEECH_PRACTICE_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/c_crop,x_0.2,y_0.05,w_0.7,h_0.73/v1777929406/englishfully/service/english-learning-voice-recording-feedback.png";

/** Homepage AI Vocabulary card: tap subtitles / word meanings in context. */
export const HOME_AI_VOCABULARY_SUBTITLE_IMAGE_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/c_crop,x_0.15,y_0.15,w_0.7,h_0.7/v1777956190/englishfully/service/English-Learning-Subtitle-Meaning.png";

/** Pro Member subscription card. */
export const ONLINE_SUBSCRIPTION_PRO_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/c_crop,g_north,h_0.92/v1777822990/englishfully/service/1-on-1-english-online-success.png";

/** Online-learning hero carousel (subscription tier imagery). */
export const ONLINE_LEARNING_HERO_SLIDE_URLS = [
  ONLINE_SUBSCRIPTION_APP_MEMBER_URL,
  ONLINE_SUBSCRIPTION_ONE_ON_ONE_URL,
  ONLINE_SUBSCRIPTION_PRO_URL,
] as const;

/** Contact page — Englishfully office location photo. */
export const CONTACT_OFFICE_IMAGE_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/l_text:montserrat_40_style_light:Englishfully%20Located%20at%2011th%20Floor,co_rgb:ffffff,g_center/v1783520856/englishfully/company/englishfully-office.jpg";
