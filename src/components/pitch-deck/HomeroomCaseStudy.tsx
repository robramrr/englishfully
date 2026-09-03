import QRCode from 'qrcode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faLayerGroup, faClipboardCheck } from '@fortawesome/free-solid-svg-icons';
import { StampFlow } from './MarketingSalesVisual';

const AFTER_FLOW = [
  'Input',
  'Create',
  'Present',
  'Assign',
  'Assess',
  'Track',
] as const;

const PRACTICE_STAMPS = [
  'Presentation',
  'Listening',
  'Gradebook',
] as const;

const CHALLENGE_POINTS = [
  { key: 'time', icon: faClock, copy: 'Limited prep' },
  { key: 'levels', icon: faLayerGroup, copy: 'Mixed levels' },
  { key: 'assess', icon: faClipboardCheck, copy: 'Unstructured' },
] as const;

const METRICS = [
  { value: '100+', label: 'Students reached', fill: 100 },
  { value: '100+', label: 'Speaking submissions', fill: 100 },
  { value: '5+', label: 'Activities created', fill: 18 },
  { value: '2', label: 'Assessments', fill: 12 },
  { value: '5+', label: 'Live classroom', fill: 8 },
] as const;

export default async function HomeroomCaseStudy() {
  const qrSrc = await QRCode.toDataURL(
    'https://englishfully.com/teacher-resources/listen-and-answer',
    {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 320,
      color: { dark: '#001a48', light: '#ffffff' },
    }
  );

  return (
    <div className="pitch-deck-case">
      <div className="pitch-deck-case-setup">
        <article className="pitch-deck-case-card pitch-deck-case-card--environment">
          <p className="pitch-deck-case-stamp">Environment</p>
          <p className="pitch-deck-case-copy">Thai secondary-school English classroom.</p>
          <figure className="pitch-deck-case-class-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://res.cloudinary.com/ktg8khoq/image/upload/v1788166619/robert-in-class_xeiyg0.png"
              alt="Founder teaching a Thai secondary-school English class"
            />
            <div className="pitch-deck-case-handout" aria-hidden="true">
              <div className="pitch-deck-case-handout-page">
                <p className="pitch-deck-case-handout-head">Listen &amp; Answer</p>
                <div className="pitch-deck-case-handout-qr">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrSrc} alt="" className="pitch-deck-case-handout-qr-img" />
                  <span>Scan to listen</span>
                </div>
                <ol className="pitch-deck-case-handout-questions">
                  <li>
                    <strong>Question 1.</strong> What time do they agree to meet?
                    <span>A) 6.30</span>
                    <span>B) 7.00</span>
                    <span>C) 7.30</span>
                    <span>D) 8.00</span>
                  </li>
                </ol>
              </div>
            </div>
          </figure>
        </article>
        <article className="pitch-deck-case-card pitch-deck-case-card--combo">
          <p className="pitch-deck-case-stamp">Challenge</p>
          <p className="pitch-deck-case-copy">
            Limited preparation time, mixed proficiency levels, and the need for engaging
            speaking/listening activities and structured assessment.
          </p>
          <ul className="pitch-deck-case-challenge-points">
            {CHALLENGE_POINTS.map((point) => (
              <li key={point.key} className="pitch-deck-case-challenge-point">
                <span className="pitch-deck-case-challenge-circle" aria-hidden="true">
                  <FontAwesomeIcon icon={point.icon} />
                </span>
                <p className="pitch-deck-case-challenge-copy">{point.copy}</p>
              </li>
            ))}
          </ul>
          <p className="pitch-deck-case-stamp pitch-deck-case-stamp--combo-follow">Solution</p>
          <p className="pitch-deck-case-copy">
            <strong>Homeroom Tools</strong> — a unified workflow:
          </p>
          <ul className="pitch-deck-case-practice">
            {PRACTICE_STAMPS.map((label) => (
              <li key={label} className="pitch-deck-market-flow-stamp">
                {label}
              </li>
            ))}
          </ul>
          <blockquote className="pitch-deck-case-quote">
            <span className="pitch-deck-market-flow-stamp pitch-deck-case-quote-stamp">
              QR Speaking
            </span>
            <span className="pitch-deck-case-quote-text">
              With 40–45 students, giving everyone speaking time is hard. Speak
              &amp; Submit lets every student speak for teacher review.
            </span>
          </blockquote>
        </article>
      </div>

      <section className="pitch-deck-case-band">
        <p className="pitch-deck-case-label">Workflow</p>
        <div className="pitch-deck-case-workflow">
          <article className="pitch-deck-case-card pitch-deck-case-card--before">
            <p className="pitch-deck-case-stamp pitch-deck-case-stamp--muted">Before</p>
            <p className="pitch-deck-case-copy">
              Multiple resources · Manual preparation · Separate assessment
            </p>
          </article>
          <article className="pitch-deck-case-card">
            <div className="pitch-deck-case-card-head">
              <p className="pitch-deck-case-stamp">After</p>
              <p className="pitch-deck-case-copy">
                <strong>Homeroom Tools</strong>
              </p>
            </div>
            <StampFlow steps={AFTER_FLOW} />
          </article>
          <article className="pitch-deck-case-card">
            <p className="pitch-deck-case-stamp">Result</p>
            <p className="pitch-deck-case-copy">
              More structured lessons · Easier student participation · Centralized assessment
            </p>
          </article>
        </div>
      </section>

      <section className="pitch-deck-case-band">
        <p className="pitch-deck-case-label">Evidence</p>
        <ul className="pitch-deck-case-metrics">
          {METRICS.map((metric) => (
            <li key={metric.label} className="pitch-deck-case-metric comic-bg-header-stripes">
              <p className="pitch-deck-case-metric-value">{metric.value}</p>
              <p className="pitch-deck-case-metric-label">{metric.label}</p>
              <div className="pitch-deck-case-metric-bar" aria-hidden="true">
                <span style={{ width: `${metric.fill}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
