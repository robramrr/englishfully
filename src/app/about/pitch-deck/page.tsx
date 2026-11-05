import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import PitchDeckAccess from './PitchDeckAccess';

export const dynamic = 'force-dynamic';

export default async function PitchDeckPage() {
  if (!(await isTeacherAuthenticated())) {
    return <PitchDeckAccess />;
  }

  const { default: PitchDeckContent } = await import('./PitchDeckContent');
  return <PitchDeckContent />;
}
