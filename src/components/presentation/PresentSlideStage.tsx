'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Design size for present mode — scales up/down to fit any screen (classroom TVs included). */
export const PRESENT_SLIDE_WIDTH = 1280;
export const PRESENT_SLIDE_HEIGHT = 720;

interface PresentSlideStageProps {
  children: ReactNode;
  className?: string;
}

/**
 * Fits a fixed 16:9 slide canvas into the available area by scaling.
 * Fonts, padding, and layout grow together on large TVs instead of leaving
 * empty whitespace around fixed-px type.
 */
export default function PresentSlideStage({
  children,
  className = '',
}: PresentSlideStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const update = () => {
      const { width, height } = stage.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      const next = Math.min(width / PRESENT_SLIDE_WIDTH, height / PRESENT_SLIDE_HEIGHT);
      setScale(Number.isFinite(next) && next > 0 ? next : 1);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    window.addEventListener('orientationchange', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return (
    <div
      ref={stageRef}
      className={['flex h-full w-full min-h-0 items-center justify-center overflow-hidden', className].join(
        ' '
      )}
    >
      <div
        className="relative shrink-0"
        style={{
          width: PRESENT_SLIDE_WIDTH,
          height: PRESENT_SLIDE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <div className="absolute inset-0">{children}</div>
      </div>
    </div>
  );
}
