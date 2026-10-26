'use client';

import SlideCanvas from '@/components/presentation/SlideCanvas';
import { createEmptyDeck, createEmptyPieSlice, createEmptySlide } from '@/lib/presentation/types';

const deck = {
  ...createEmptyDeck(),
  title: 'Deck title should stay in the footer',
};

const slide = {
  ...createEmptySlide('pie_timer'),
  title: 'Speaking turns',
  pieSlices: [
    createEmptyPieSlice({ label: 'Partner A talks to Partner B', seconds: 60 }),
    createEmptyPieSlice({ label: 'Partner B talks to Partner A', seconds: 60 }),
  ],
};

export default function SlideCheckPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <SlideCanvas slide={slide} deck={deck} slideNumber={2} totalSlides={3} />
    </main>
  );
}
