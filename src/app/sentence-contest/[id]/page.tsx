'use client';

import { useParams } from 'next/navigation';
import SentenceContestStage from '../../../components/sentence-contest/SentenceContestStage';

export default function SentenceContestPlayPage() {
  const params = useParams();
  const id = String(params?.id || '');
  if (!id) return null;
  return <SentenceContestStage activityId={id} />;
}
