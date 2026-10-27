'use client';

import { useParams } from 'next/navigation';
import VocabFlashcardStage from '../../../components/vocabulary/VocabFlashcardStage';

export default function VocabularyStudyPage() {
  const params = useParams();
  const id = String(params?.id || '');
  if (!id) return null;
  return <VocabFlashcardStage deckId={id} />;
}
