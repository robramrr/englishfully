'use client';

import { useParams } from 'next/navigation';
import AnagramStage from '../../../components/anagram/AnagramStage';

export default function AnagramPlayPage() {
  const params = useParams();
  const id = String(params?.id || '');
  if (!id) return null;
  return <AnagramStage activityId={id} />;
}
