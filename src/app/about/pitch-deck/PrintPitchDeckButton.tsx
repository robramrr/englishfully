'use client';

import ComicButton from '../../../components/ComicButton';

export default function PrintPitchDeckButton() {
  return (
    <ComicButton variant="accent" size="sm" type="button" onClick={() => window.print()}>
      Print / Save PDF
    </ComicButton>
  );
}
