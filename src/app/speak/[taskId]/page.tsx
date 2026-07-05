import StudentSpeakFlow from '@/components/speak-and-submit/StudentSpeakFlow';

interface SpeakPageProps {
  params: { taskId: string };
}

export default function SpeakPage({ params }: SpeakPageProps) {
  return <StudentSpeakFlow taskId={params.taskId} />;
}
