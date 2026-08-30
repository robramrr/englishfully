import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChalkboard,
  faChartColumn,
  faListCheck,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';

const HOMEROOM_LOGO_URL =
  'https://res.cloudinary.com/ktg8khoq/image/upload/f_png/v1788022325/homeroomtools4_oacwhe.psd';

const TABLET_ITEMS = [
  { icon: faChalkboard, label: 'Create Lessons' },
  { icon: faListCheck, label: 'Assign Activities' },
  { icon: faChartColumn, label: 'Track Progress' },
  { icon: faWandMagicSparkles, label: 'AI Tools' },
] as const;

export default function HomeroomTabletMock() {
  return (
    <div className="pitch-deck-tablet" aria-hidden="true">
      <div className="pitch-deck-tablet-bezel">
        <div className="pitch-deck-tablet-camera" />

        <div className="pitch-deck-tablet-screen">
          <div className="pitch-deck-tablet-body">
            <div className="pitch-deck-tablet-logo-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HOMEROOM_LOGO_URL}
                alt=""
                className="pitch-deck-tablet-logo"
              />
              <p className="pitch-deck-tablet-kicker">Teacher Resources</p>
            </div>

            <ul className="pitch-deck-tablet-list">
              {TABLET_ITEMS.map((item) => (
                <li key={item.label} className="pitch-deck-tablet-item">
                  <span className="pitch-deck-tablet-item-icon">
                    <FontAwesomeIcon icon={item.icon} />
                  </span>
                  <span className="pitch-deck-tablet-item-label">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
