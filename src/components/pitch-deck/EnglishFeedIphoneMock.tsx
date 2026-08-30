import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBookOpen,
  faChartColumn,
  faCommentDots,
  faPlay,
} from '@fortawesome/free-solid-svg-icons';
import { ENGLISHFEED_APP_HERO_CIRCLE_URLS } from '../../constants/englishfeed';

const ENGLISHFEED_LOGO_URL =
  'https://res.cloudinary.com/dkbf7tvcx/image/upload/v1783143201/englishfeed/logo/englishfeed-logo.png';

const ENGLISHFEED_DEMO_LESSON_URL = ENGLISHFEED_APP_HERO_CIRCLE_URLS[0];

const HERO_ACTIONS = [
  { icon: faPlay, label: 'Watch' },
  { icon: faBookOpen, label: 'Learn' },
  { icon: faCommentDots, label: 'Practice' },
  { icon: faChartColumn, label: 'Improve' },
] as const;

export default function EnglishFeedIphoneMock() {
  return (
    <div className="pitch-deck-iphone" aria-hidden="true">
      <div className="pitch-deck-iphone-bezel">
        <div className="pitch-deck-iphone-button pitch-deck-iphone-button--silent" />
        <div className="pitch-deck-iphone-button pitch-deck-iphone-button--volume-up" />
        <div className="pitch-deck-iphone-button pitch-deck-iphone-button--volume-down" />
        <div className="pitch-deck-iphone-button pitch-deck-iphone-button--power" />

        <div className="pitch-deck-iphone-screen">
          <div className="pitch-deck-iphone-island" />

          <div className="pitch-deck-iphone-status">
            <span className="pitch-deck-iphone-time">9:41</span>
            <div className="pitch-deck-iphone-status-icons">
              <span className="pitch-deck-iphone-signal" />
              <span className="pitch-deck-iphone-wifi" />
              <span className="pitch-deck-iphone-battery" />
            </div>
          </div>

          <header className="pitch-deck-iphone-site-header comic-bg-header-stripes">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ENGLISHFEED_LOGO_URL}
              alt=""
              className="pitch-deck-iphone-logo"
            />
            <div className="pitch-deck-iphone-burger" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </header>

          <div className="pitch-deck-iphone-hero">
            <p className="pitch-deck-iphone-hero-title">
              Master English With Confidence!
            </p>
            <div className="pitch-deck-iphone-demo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ENGLISHFEED_DEMO_LESSON_URL}
                alt=""
                className="pitch-deck-iphone-demo-image"
              />
            </div>
            <div className="pitch-deck-iphone-actions">
              {HERO_ACTIONS.map((action) => (
                <div key={action.label} className="pitch-deck-iphone-action">
                  <FontAwesomeIcon
                    icon={action.icon}
                    className="pitch-deck-iphone-action-icon"
                  />
                  <span className="pitch-deck-iphone-action-label">
                    {action.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pitch-deck-iphone-home-indicator" />
      </div>
    </div>
  );
}
