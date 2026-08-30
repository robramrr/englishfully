import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faCircleCheck,
  faHeart,
  faUserGraduate,
} from '@fortawesome/free-solid-svg-icons';
import EnglishFeedIphoneMock from './EnglishFeedIphoneMock';
import HomeroomTabletMock from './HomeroomTabletMock';

const AI_STACK = [
  { name: 'OpenAI', mark: 'openai' as const },
  { name: 'Whisper', mark: null },
  { name: 'GPT-4o-mini', mark: null },
  { name: 'DALL·E', mark: null },
  { name: 'MediaPipe Face Landmarker', mark: null },
  { name: 'Google MediaPipe', mark: 'google' as const },
];

const LEARNER_POINTS = ['Engage', 'Build Skills', 'Gain Confidence'] as const;
const TEACHER_POINTS = ['Create', 'Assign', 'Assess', 'Save Time'] as const;

const ANALYTICS_TUBES = [
  { label: 'Progress', fill: 86 },
  { label: 'Speaking', fill: 72 },
  { label: 'Listening', fill: 64 },
] as const;

const ANALYTICS_METRICS = [
  { icon: faHeart, label: 'Engagement' },
  { icon: faUserGraduate, label: 'Personalized' },
  { icon: faChartLine, label: 'Improvement' },
] as const;

function OpenAiMark() {
  return (
    <svg className="pitch-deck-tech-flow-mark-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.373 7.317a4.482 4.482 0 0 1 2.365-1.972V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.373 7.317zm16.451 3.14-5.836-3.393 2.006-1.158a.091.091 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.108-3.09-.141-.085-4.775-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.504 4.504 0 0 1 6.68 4.66zm-12.54 4.195-2.01-1.174a.081.081 0 0 1-.038-.052V6.026a4.499 4.499 0 0 1 7.375-3.453l-.142.08L8.704 5.41a.795.795 0 0 0-.393.681zm1.097-2.28 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"
      />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg className="pitch-deck-tech-flow-mark-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.86-.07-1.49-.22-2.14H12v3.89h6.58c-.13 1.09-.84 2.73-2.42 3.83l-.02.14 3.52 2.68.24.02c2.24-2.07 3.62-5.12 3.62-8.42z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.79-2.88c-1.02.71-2.39 1.21-4.16 1.21-3.18 0-5.88-2.09-6.84-4.99l-.14.01-3.7 2.82-.05.13C3.22 21.35 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.16 14.43A7.2 7.2 0 0 1 4.78 12c0-.85.15-1.67.41-2.43l-.01-.15-3.75-2.86-.12.06A11.97 11.97 0 0 0 0 12c0 1.94.46 3.78 1.31 5.38l3.85-2.95z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c2.25 0 3.77.97 4.64 1.78l3.39-3.31C17.95 1.19 15.24 0 12 0 7.31 0 3.22 2.65 1.31 6.62l3.88 2.95C6.12 6.67 8.82 4.75 12 4.75z"
      />
    </svg>
  );
}

function FlowHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="pitch-deck-tech-flow-head">
      <h3 className="pitch-deck-tech-flow-title">{title}</h3>
      {sub ? <p className="pitch-deck-tech-flow-sub">{sub}</p> : null}
    </header>
  );
}

function RoleShot({
  src,
  heading,
  points,
  imageClassName,
}: {
  src: string;
  heading: string;
  points: readonly string[];
  imageClassName?: string;
}) {
  return (
    <div className="pitch-deck-tech-flow-shot">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className={`pitch-deck-tech-flow-shot-image${imageClassName ? ` ${imageClassName}` : ''}`}
      />
      <div className="pitch-deck-tech-flow-shot-card">
        <p className="pitch-deck-tech-flow-shot-heading">{heading}</p>
        <ul className="pitch-deck-tech-flow-checks">
          {points.map((point) => (
            <li key={point}>
              <FontAwesomeIcon icon={faCircleCheck} />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function TechInnovationFlow() {
  return (
    <div className="pitch-deck-tech-flow-shell">
      <div className="pitch-deck-tech-flow-closer">
        <h3 className="pitch-deck-tech-flow-closer-title">
          AI-Powered. Human-Centered. Real Impact.
        </h3>
        <p className="pitch-deck-tech-flow-closer-sub">
          Technology that helps learners go further and teachers do more.
        </p>
      </div>

      <div className="pitch-deck-tech-flow">
        <section className="pitch-deck-tech-flow-col pitch-deck-tech-flow-col--ai">
          <FlowHead title="Artificial Intelligence (AI)" />
          <ul className="pitch-deck-tech-flow-ai">
            {AI_STACK.map((item) => (
              <li key={item.name}>
                {item.mark === 'openai' ? <OpenAiMark /> : null}
                {item.mark === 'google' ? <GoogleMark /> : null}
                <span>{item.name}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="pitch-deck-tech-flow-main">
          <section className="pitch-deck-tech-flow-col pitch-deck-tech-flow-col--app">
            <div className="pitch-deck-tech-flow-app-stage">
              <div className="pitch-deck-tech-devices">
                <figure className="pitch-deck-iphone-figure">
                  <EnglishFeedIphoneMock />
                </figure>
                <figure className="pitch-deck-tablet-figure">
                  <div className="pitch-deck-tech-flow-head">
                    <p className="pitch-deck-callout-heading">Applications</p>
                  </div>
                  <HomeroomTabletMock />
                </figure>
              </div>
            </div>
          </section>

          <section className="pitch-deck-tech-flow-col pitch-deck-tech-flow-col--roles">
            <FlowHead title="Learner / Teacher" />
            <div className="pitch-deck-tech-flow-shots">
              <RoleShot
                src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788073388/student-using-app_b4roc9.jpg"
                heading="Learners"
                points={LEARNER_POINTS}
              />
              <RoleShot
                src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788073389/teacher-using-tools_vvrrvr.jpg"
                heading="Teachers"
                points={TEACHER_POINTS}
                imageClassName="pitch-deck-tech-flow-shot-image--teacher"
              />
            </div>
          </section>

          <section className="pitch-deck-tech-flow-col pitch-deck-tech-flow-col--analytics">
            <FlowHead title="Analytics" />
            <div className="pitch-deck-tech-flow-chart">
              <ul className="pitch-deck-tech-flow-metrics">
                {ANALYTICS_METRICS.map((item) => (
                  <li key={item.label}>
                    <FontAwesomeIcon icon={item.icon} />
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
              <svg viewBox="0 0 120 72" className="pitch-deck-tech-flow-chart-svg" aria-hidden="true">
                <polyline
                  fill="none"
                  stroke="var(--brand-navy)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points="8,62 28,50 48,46 68,30 88,22 112,8"
                />
                <rect x="10" y="50" width="10" height="16" rx="2" fill="var(--brand-navy)" />
                <rect x="30" y="40" width="10" height="26" rx="2" fill="var(--brand-navy)" />
                <rect x="50" y="34" width="10" height="32" rx="2" fill="var(--brand-navy)" />
                <rect x="70" y="22" width="10" height="44" rx="2" fill="var(--brand-red)" />
                <rect x="90" y="12" width="10" height="54" rx="2" fill="var(--brand-red)" />
              </svg>
            </div>
            <div className="pitch-deck-tech-flow-tubes">
              {ANALYTICS_TUBES.map((tube) => (
                <div key={tube.label}>
                  <p className="pitch-deck-tech-flow-block-label">{tube.label}</p>
                  <div className="pitch-deck-tech-flow-tube">
                    <span
                      className="pitch-deck-tech-flow-tube-fill"
                      style={{ width: `${tube.fill}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
