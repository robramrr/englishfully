'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import { useAutoSave } from '../listen-and-answer/useAutoSave';
import SegmentReviewTable, { type ClientLearnSegment } from './SegmentReviewTable';
import SegmentAudioPlayer from './SegmentAudioPlayer';
import VocabularyReview, { type ClientLearnVocabulary } from './VocabularyReview';
import { generateQrDataUrl, getStudentLearnUrl } from '@/lib/listen-and-learn/qr';
import type {
  GeneratedLearnQuestion,
  GeneratedVocabularyItem,
  LearnAssignmentWithDetails,
  LearnDifficulty,
  LearnTranscriptSource,
  SaveLearnAssignmentPayload,
} from '@/lib/listen-and-learn/types';
import {
  CEFR_LEVELS,
  DEFAULT_QUESTION_FRAMEWORK,
  LEARN_DIFFICULTIES,
  LEARN_DIFFICULTY_LABELS,
  stripChoiceLetterPrefix,
} from '@/lib/listen-and-learn/types';
import type { CefrLevel } from '@/lib/listen-and-answer/types';

interface ClientLearnQuestion {
  clientId: string;
  id?: string;
  segment_id?: string | null;
  segmentClientId?: string | null;
  question_text: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
  keep_question: boolean;
}

interface AssignmentEditorProps {
  assignmentId: string;
  initialAssignment: LearnAssignmentWithDetails;
}

function toClientSegments(assignment: LearnAssignmentWithDetails): ClientLearnSegment[] {
  return assignment.segments.map((segment) => ({
    clientId: segment.id,
    id: segment.id,
    sentence_text: segment.sentence_text,
    start_seconds: segment.start_seconds,
    end_seconds: segment.end_seconds,
    selected: segment.selected,
  }));
}

function toClientVocabulary(assignment: LearnAssignmentWithDetails): ClientLearnVocabulary[] {
  return (assignment.vocabulary ?? []).map((item) => ({
    clientId: item.id,
    id: item.id,
    word: item.word,
    definition: item.definition,
    image_url: item.image_url ?? '',
    start_seconds: item.start_seconds,
    end_seconds: item.end_seconds,
    keep_word: item.keep_word,
  }));
}

function toClientQuestions(assignment: LearnAssignmentWithDetails): ClientLearnQuestion[] {
  return assignment.questions.map((question) => {
    const choices = (
      question.choices.length >= 4
        ? question.choices.slice(0, 4)
        : [...question.choices, '', '', '', ''].slice(0, 4)
    ).map((choice) => stripChoiceLetterPrefix(choice));
    const correctAnswer = stripChoiceLetterPrefix(question.correct_answer);
    const matched =
      choices.find((choice) => choice.toLowerCase() === correctAnswer.toLowerCase()) ||
      correctAnswer;
    return {
      clientId: question.id,
      id: question.id,
      segment_id: question.segment_id,
      segmentClientId: question.segment_id,
      question_text: question.question_text,
      choices,
      correct_answer: matched,
      explanation: question.explanation,
      keep_question: question.keep_question,
    };
  });
}

function buildPayload(
  values: {
    teacherName: string;
    title: string;
    className: string;
    dueDate: string;
    audioUrl: string;
    thumbnailUrl: string;
    transcript: string;
    transcriptSource: LearnTranscriptSource;
    cefrLevel: CefrLevel;
    questionCountTarget: number;
    difficulty: LearnDifficulty;
    questionFramework: string;
    attemptsAllowed: number;
    passingScore: number;
    maxReplays: number;
    randomizeQuestions: boolean;
    randomizeAnswers: boolean;
    status: 'draft' | 'published';
    makeupEnabled: boolean;
    makeupListenAssignmentId: string;
    makeupClassNames: string[];
  },
  vocabulary: ClientLearnVocabulary[],
  segments: ClientLearnSegment[],
  questions: ClientLearnQuestion[]
): SaveLearnAssignmentPayload {
  return {
    teacher_name: values.teacherName,
    title: values.title,
    class_name: values.className,
    due_date: values.dueDate || null,
    audio_url: values.audioUrl,
    thumbnail_url: values.thumbnailUrl,
    transcript: values.transcript,
    transcript_source: values.transcriptSource,
    cefr_level: values.cefrLevel,
    question_count_target: values.questionCountTarget,
    difficulty: values.difficulty,
    question_framework: values.questionFramework,
    attempts_allowed: values.attemptsAllowed,
    passing_score: values.passingScore,
    max_replays: values.maxReplays,
    randomize_questions: values.randomizeQuestions,
    randomize_answers: values.randomizeAnswers,
    status: values.status,
    makeup_enabled: values.makeupEnabled,
    makeup_listen_assignment_id: values.makeupListenAssignmentId,
    makeup_class_names: values.makeupClassNames,
    vocabulary: vocabulary.map((item) => ({
      id: item.id || item.clientId,
      word: item.word,
      definition: item.definition,
      image_url: item.image_url ?? '',
      clear_image: Boolean(item.clear_image),
      start_seconds: item.start_seconds,
      end_seconds: item.end_seconds,
      keep_word: item.keep_word,
    })),
    segments: segments.map((segment) => ({
      // Prefer persisted id; otherwise keep the client id so questions can link before first save.
      id: segment.id || segment.clientId,
      sentence_text: segment.sentence_text,
      start_seconds: segment.start_seconds,
      end_seconds: segment.end_seconds,
      selected: segment.selected,
    })),
    questions: questions.map((question) => {
      const linkedSegment = segments.find(
        (segment) =>
          segment.clientId === question.segmentClientId ||
          segment.id === question.segment_id ||
          segment.clientId === question.segment_id
      );
      return {
        id: question.id,
        segment_id: linkedSegment
          ? linkedSegment.id || linkedSegment.clientId
          : question.segment_id ?? question.segmentClientId ?? null,
        question_text: question.question_text,
        choices: question.choices,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        keep_question: question.keep_question,
      };
    }),
  };
}

export default function AssignmentEditor({
  assignmentId,
  initialAssignment,
}: AssignmentEditorProps) {
  const router = useRouter();
  const [teacherName, setTeacherName] = useState(initialAssignment.teacher_name);
  const [title, setTitle] = useState(initialAssignment.title);
  const [className, setClassName] = useState(initialAssignment.class_name);
  const [dueDate, setDueDate] = useState(initialAssignment.due_date ?? '');
  const [audioUrl, setAudioUrl] = useState(initialAssignment.audio_url);
  const [thumbnailUrl, setThumbnailUrl] = useState(initialAssignment.thumbnail_url ?? '');
  const [transcript, setTranscript] = useState(initialAssignment.transcript);
  const [transcriptSource, setTranscriptSource] = useState<LearnTranscriptSource>(
    initialAssignment.transcript_source
  );
  const [cefrLevel, setCefrLevel] = useState<CefrLevel>(initialAssignment.cefr_level);
  const [questionCountTarget, setQuestionCountTarget] = useState(
    initialAssignment.question_count_target
  );
  const [difficulty, setDifficulty] = useState<LearnDifficulty>(initialAssignment.difficulty);
  const [questionFramework, setQuestionFramework] = useState(
    initialAssignment.question_framework || DEFAULT_QUESTION_FRAMEWORK
  );
  const [attemptsAllowed, setAttemptsAllowed] = useState(initialAssignment.attempts_allowed);
  const [passingScore, setPassingScore] = useState(initialAssignment.passing_score);
  const [maxReplays, setMaxReplays] = useState(initialAssignment.max_replays);
  const [randomizeQuestions, setRandomizeQuestions] = useState(
    initialAssignment.randomize_questions
  );
  const [randomizeAnswers, setRandomizeAnswers] = useState(initialAssignment.randomize_answers);
  const [status, setStatus] = useState<'draft' | 'published'>(initialAssignment.status);
  const [makeupEnabled, setMakeupEnabled] = useState(
    Boolean(initialAssignment.makeup_enabled)
  );
  const [makeupListenAssignmentId, setMakeupListenAssignmentId] = useState(
    initialAssignment.makeup_listen_assignment_id || ''
  );
  const [makeupClassNames, setMakeupClassNames] = useState<string[]>(
    initialAssignment.makeup_class_names || []
  );
  const [listenAssessments, setListenAssessments] = useState<
    Array<{ id: string; title: string; class_name: string }>
  >([]);
  const [speakClasses, setSpeakClasses] = useState<Array<{ id: string; label: string }>>([]);
  const [vocabulary, setVocabulary] = useState<ClientLearnVocabulary[]>(() =>
    toClientVocabulary(initialAssignment)
  );
  const [segments, setSegments] = useState<ClientLearnSegment[]>(() =>
    toClientSegments(initialAssignment)
  );
  const [questions, setQuestions] = useState<ClientLearnQuestion[]>(() =>
    toClientQuestions(initialAssignment)
  );
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState('');
  const [generatingSegments, setGeneratingSegments] = useState(false);
  const [generatingVocabulary, setGeneratingVocabulary] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [qrPreview, setQrPreview] = useState('');
  const [studentUrl, setStudentUrl] = useState('');
  const statusRef = useRef(status);
  const skipAutoSaveRef = useRef(false);
  const saveChainRef = useRef(Promise.resolve<LearnAssignmentWithDetails | null>(null));
  const saveRequestedRef = useRef(false);
  const pendingStatusRef = useRef<'draft' | 'published' | null>(null);
  const vocabularyRef = useRef(vocabulary);
  const segmentsRef = useRef(segments);
  const questionsRef = useRef(questions);
  const formValuesRef = useRef({
    teacherName,
    title,
    className,
    dueDate,
    audioUrl,
    thumbnailUrl,
    transcript,
    transcriptSource,
    cefrLevel,
    questionCountTarget,
    difficulty,
    questionFramework,
    attemptsAllowed,
    passingScore,
    maxReplays,
    randomizeQuestions,
    randomizeAnswers,
    status,
    makeupEnabled,
    makeupListenAssignmentId,
    makeupClassNames,
  });

  const formValues = useMemo(
    () => ({
      teacherName,
      title,
      className,
      dueDate,
      audioUrl,
      thumbnailUrl,
      transcript,
      transcriptSource,
      cefrLevel,
      questionCountTarget,
      difficulty,
      questionFramework,
      attemptsAllowed,
      passingScore,
      maxReplays,
      randomizeQuestions,
      randomizeAnswers,
      status,
      makeupEnabled,
      makeupListenAssignmentId,
      makeupClassNames,
    }),
    [
      teacherName,
      title,
      className,
      dueDate,
      audioUrl,
      thumbnailUrl,
      transcript,
      transcriptSource,
      cefrLevel,
      questionCountTarget,
      difficulty,
      questionFramework,
      attemptsAllowed,
      passingScore,
      maxReplays,
      randomizeQuestions,
      randomizeAnswers,
      status,
      makeupEnabled,
      makeupListenAssignmentId,
      makeupClassNames,
    ]
  );

  // Keep refs in sync during render so saves never read a stale useEffect snapshot.
  statusRef.current = status;
  vocabularyRef.current = vocabulary;
  segmentsRef.current = segments;
  questionsRef.current = questions;
  formValuesRef.current = formValues;

  const payload = useMemo(
    () => buildPayload(formValues, vocabulary, segments, questions),
    [formValues, vocabulary, segments, questions]
  );

  const buildLatestPayload = useCallback((nextStatus?: 'draft' | 'published') => {
    return buildPayload(
      {
        ...formValuesRef.current,
        status: nextStatus ?? statusRef.current,
      },
      vocabularyRef.current,
      segmentsRef.current,
      questionsRef.current
    );
  }, []);

  const applySavedChildren = useCallback((assignment: LearnAssignmentWithDetails) => {
    // Never sync title/teacher/class from save responses — that was resetting the form to
    // “Untitled Listen & Learn” / “T Robert” after vocab saves, then re-publishing those defaults.
    setVocabulary((previous) => {
      const fromServer = toClientVocabulary(assignment);
      return fromServer.map((item) => {
        if (item.image_url?.trim()) return item;
        const local = previous.find(
          (entry) =>
            entry.id === item.id ||
            entry.clientId === item.clientId ||
            entry.word.trim().toLowerCase() === item.word.trim().toLowerCase()
        );
        if (!local?.image_url?.trim()) return item;
        return { ...item, image_url: local.image_url, clear_image: false };
      });
    });
    setSegments(toClientSegments(assignment));
    setQuestions(toClientQuestions(assignment));
    setThumbnailUrl(assignment.thumbnail_url ?? '');
  }, []);

  const saveAssignment = useCallback(
    async (data: SaveLearnAssignmentPayload, nextStatus?: 'draft' | 'published') => {
      const resolvedStatus = nextStatus ?? data.status;
      const response = await fetch(`/api/listen-and-learn/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, status: resolvedStatus }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save assessment');
      }
      return result.assignment as LearnAssignmentWithDetails;
    },
    [assignmentId]
  );

  // Serialize + coalesce writes so an older in-flight autosave cannot overwrite
  // newer vocabulary images/timestamps in the database.
  const flushSave = useCallback(
    async (nextStatus?: 'draft' | 'published') => {
      if (nextStatus) {
        pendingStatusRef.current = nextStatus;
        statusRef.current = nextStatus;
      }
      saveRequestedRef.current = true;

      const run = async (): Promise<LearnAssignmentWithDetails | null> => {
        let lastSaved: LearnAssignmentWithDetails | null = null;
        setSaving(true);
        setError('');
        try {
          while (saveRequestedRef.current) {
            saveRequestedRef.current = false;
            const resolvedStatus = pendingStatusRef.current ?? statusRef.current;
            pendingStatusRef.current = null;
            // Always rebuild from live refs (not a possibly-stale payload snapshot).
            const latest = buildLatestPayload(resolvedStatus);
            const saved = await saveAssignment(
              { ...latest, status: resolvedStatus },
              resolvedStatus
            );
            lastSaved = saved;
            statusRef.current = saved.status;
            setStatus(saved.status);
          }
          return lastSaved;
        } finally {
          setSaving(false);
          window.setTimeout(() => {
            skipAutoSaveRef.current = false;
          }, 800);
        }
      };

      const chained = saveChainRef.current.then(run, run);
      saveChainRef.current = chained.then(
        () => null,
        () => null
      );
      return chained;
    },
    [buildLatestPayload, saveAssignment]
  );

  const handleAutoSave = useCallback(
    async (_data: SaveLearnAssignmentPayload) => {
      if (skipAutoSaveRef.current) return;
      try {
        await flushSave();
        setSaveMessage(`Auto-saved ${new Date().toLocaleTimeString()}`);
        setError('');
        // Do NOT applySavedChildren here — remapping local state mid-edit was dropping
        // freshly generated images and edited vocab audio clips.
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Auto-save failed');
      }
    },
    [flushSave]
  );

  useAutoSave(payload, handleAutoSave, autoSaveEnabled);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = getStudentLearnUrl(assignmentId, window.location.origin);
    setStudentUrl(url);
    if (status !== 'published') {
      setQrPreview('');
      return;
    }
    let cancelled = false;
    void generateQrDataUrl(url).then((dataUrl) => {
      if (!cancelled) setQrPreview(dataUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [assignmentId, status]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      fetch('/api/listen-and-answer/assignments', { cache: 'no-store' }),
      fetch('/api/speak-and-submit/settings', { cache: 'no-store' }),
    ])
      .then(async ([listenResponse, settingsResponse]) => {
        if (cancelled) return;
        if (listenResponse.ok) {
          const data = await listenResponse.json();
          const next = ((data.assignments || []) as Array<{
            id: string;
            title: string;
            class_name: string;
          }>).map((item) => ({
            id: item.id,
            title: item.title || 'Untitled assessment',
            class_name: item.class_name || '',
          }));
          setListenAssessments(next);
        }
        if (settingsResponse.ok) {
          const data = await settingsResponse.json();
          const classes = (data.config?.classes || []) as Array<{
            id: string;
            label: string;
          }>;
          setSpeakClasses(
            classes
              .map((item) => ({ id: item.id, label: item.label || '' }))
              .filter((item) => item.label.trim())
          );
        }
      })
      .catch(() => {
        // Makeup options are optional — keep editor usable if these fail.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveIdentity() {
    const nextTitle = title.trim();
    const nextTeacher = teacherName.trim();
    if (!nextTitle || nextTitle === 'Untitled Listen & Learn') {
      setError(
        'Type a real Assessment Title above (not “Untitled Listen & Learn”), then click Save title & teacher now.'
      );
      return;
    }
    if (!nextTeacher) {
      setError('Type a Teacher Name above, then click Save title & teacher now.');
      return;
    }

    // Cancel any queued full autosave so it cannot overwrite this identity write.
    skipAutoSaveRef.current = true;
    saveRequestedRef.current = false;
    pendingStatusRef.current = null;
    saveChainRef.current = Promise.resolve(null);

    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/listen-and-learn/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity_only: true,
          title: nextTitle,
          teacher_name: nextTeacher,
          class_name: className,
        }),
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save title/teacher');
      const savedTitle = String(data.identity?.title || nextTitle).trim();
      const savedTeacher = String(data.identity?.teacher_name || nextTeacher).trim();
      const savedClass = String(data.identity?.class_name ?? className).trim();
      if (savedTitle === 'Untitled Listen & Learn') {
        throw new Error(
          'Server still has Untitled Listen & Learn — save did not stick. Try again after refresh.'
        );
      }
      setTitle(savedTitle);
      setTeacherName(savedTeacher);
      setClassName(savedClass);
      formValuesRef.current = {
        ...formValuesRef.current,
        title: savedTitle,
        teacherName: savedTeacher,
        className: savedClass,
      };

      // Double-check what students will actually receive (same public API as the link).
      const publicResponse = await fetch(
        `/api/listen-and-learn/public/${assignmentId}?t=${Date.now()}`,
        { cache: 'no-store' }
      );
      const publicData = await publicResponse.json();
      const publicTitle = String(publicData.assignment?.title || '').trim();
      const publicTeacher = String(publicData.assignment?.teacher_name || '').trim();
      if (publicTitle !== savedTitle || publicTeacher !== savedTeacher) {
        throw new Error(
          `Saved in editor DB as “${savedTitle}” / “${savedTeacher}”, but student API still returns “${publicTitle}” / “${publicTeacher}”. Tell Rob — this is not a browser cache issue.`
        );
      }

      setSaveMessage(
        `Verified student API: “${publicTitle}” · Teacher: ${publicTeacher}. Open the student link in a new tab.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save title/teacher');
    } finally {
      setSaving(false);
      window.setTimeout(() => {
        skipAutoSaveRef.current = false;
      }, 8000);
    }
  }

  async function handleManualSave(nextStatus: 'draft' | 'published' = status) {
    // Pin identity fields from React state at click time (don’t trust a stale autosave ref).
    formValuesRef.current = {
      ...formValuesRef.current,
      title,
      teacherName,
      className,
      status: nextStatus,
    };
    statusRef.current = nextStatus;
    setStatus(nextStatus);
    skipAutoSaveRef.current = true;
    try {
      const saved = await flushSave(nextStatus);
      if (!saved) return;
      applySavedChildren(saved);
      // Keep the identity fields the teacher just saved — never let children sync overwrite them.
      const savedTitle = saved.title?.trim() || title.trim();
      const savedTeacher = saved.teacher_name?.trim() || teacherName.trim();
      setTitle(savedTitle);
      setTeacherName(savedTeacher);
      formValuesRef.current = {
        ...formValuesRef.current,
        title: savedTitle,
        teacherName: savedTeacher,
      };
      const savedVocabCount = (saved.vocabulary ?? []).filter(
        (item) => item.keep_word !== false && item.word.trim()
      ).length;
      if (saved.status === 'published' && savedVocabCount === 0) {
        setError(
          'Published, but no vocabulary words were saved. Generate vocabulary again, wait for “saved”, then Update published.'
        );
      }
      setSaveMessage(
        saved.status === 'published'
          ? savedVocabCount > 0
            ? `Published “${savedTitle}” (Teacher: ${savedTeacher || '—'}) with ${savedVocabCount} vocabulary word(s). Open the student link in a fresh tab.`
            : `Published “${savedTitle}”, but vocabulary is empty on the server.`
          : `Saved “${savedTitle}” · ${savedTeacher || 'no teacher name'} · ${new Date().toLocaleTimeString()}`
      );
      if (saved.status === 'published' && typeof window !== 'undefined') {
        const url = getStudentLearnUrl(assignmentId, window.location.origin);
        setStudentUrl(url);
        const dataUrl = await generateQrDataUrl(url);
        setQrPreview(dataUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  async function handlePersistVocabulary(nextVocabulary: ClientLearnVocabulary[]) {
    vocabularyRef.current = nextVocabulary;
    setVocabulary(nextVocabulary);
    skipAutoSaveRef.current = true;
    try {
      const saved = await flushSave();
      if (saved) {
        // Sync server ids/image_urls so student proxy paths resolve correctly.
        applySavedChildren(saved);
      }
      setSaveMessage(`Vocabulary saved ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vocabulary');
    }
  }

  async function handleGenerateSegments(forceAuto = false) {
    const useManual = !forceAuto && transcriptSource === 'manual' && transcript.trim().length > 0;
    if (!useManual && !audioUrl.trim()) {
      setError('Enter an audio URL before auto-transcribing.');
      return;
    }

    setGeneratingSegments(true);
    setError('');
    try {
      const response = await fetch('/api/listen-and-learn/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_url: audioUrl.trim(),
          transcript: useManual ? transcript : '',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to process transcript');

      const nextSegments: ClientLearnSegment[] = (data.segments || []).map(
        (segment: { sentence_text: string; start_seconds: number; end_seconds: number }) => ({
          clientId: crypto.randomUUID(),
          sentence_text: segment.sentence_text,
          start_seconds: segment.start_seconds,
          end_seconds: segment.end_seconds,
          selected: true,
        })
      );

      setTranscript(data.transcript || transcript);
      setTranscriptSource(data.source === 'manual' ? 'manual' : 'auto');
      setSegments(nextSegments);
      setQuestions([]);
      setSaveMessage(
        `Created ${nextSegments.length} listening segment${nextSegments.length === 1 ? '' : 's'} (min ~5s each). Review and select which to use.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process transcript');
    } finally {
      setGeneratingSegments(false);
    }
  }

  function handleSelectAutoTranscribe() {
    setTranscriptSource('auto');
    if (audioUrl.trim()) {
      void handleGenerateSegments(true);
    }
  }

  async function handleGenerateVocabulary() {
    if (!transcript.trim()) {
      setError('Generate or enter a transcript before creating vocabulary.');
      return;
    }
    setGeneratingVocabulary(true);
    setError('');
    try {
      const response = await fetch('/api/listen-and-learn/generate-vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          framework: questionFramework,
          cefr_level: cefrLevel,
          transcript,
          audio_url: audioUrl.trim(),
          count: 5,
          segments: segments.map((segment) => ({
            sentence_text: segment.sentence_text,
            start_seconds: segment.start_seconds,
            end_seconds: segment.end_seconds,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Vocabulary generation failed');

      const generated = (data.vocabulary || []) as GeneratedVocabularyItem[];
      const nextVocabulary: ClientLearnVocabulary[] = generated.map((item) => ({
        clientId: crypto.randomUUID(),
        word: item.word,
        definition: item.definition,
        image_url: '',
        start_seconds: item.start_seconds,
        end_seconds: item.end_seconds,
        keep_word: true,
      }));
      vocabularyRef.current = nextVocabulary;
      setVocabulary(nextVocabulary);
      skipAutoSaveRef.current = true;
      const saved = await flushSave();
      if (saved) applySavedChildren(saved);
      setSaveMessage(
        `Generated ${generated.length} vocabulary word(s) and saved. Review before publishing.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vocabulary generation failed');
    } finally {
      setGeneratingVocabulary(false);
    }
  }

  async function handleGenerateQuestions() {
    const selected = segments.filter(
      (segment) => segment.selected && segment.sentence_text.trim()
    );
    if (selected.length === 0) {
      setError('Select at least one listening segment before generating questions.');
      return;
    }

    setGeneratingQuestions(true);
    setError('');
    try {
      const response = await fetch('/api/listen-and-learn/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          framework: questionFramework,
          cefr_level: cefrLevel,
          difficulty,
          question_count: questionCountTarget,
          segments: selected.map((segment) => ({
            sentence_text: segment.sentence_text,
            selected: true,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Question generation failed');

      const generated = (data.questions || []) as GeneratedLearnQuestion[];
      const nextQuestions: ClientLearnQuestion[] = generated.map((question, index) => {
        const segment = selected[question.segment_index] ?? selected[index];
        const choices = (
          question.choices.length >= 4
            ? question.choices.slice(0, 4)
            : [...question.choices, '', '', '', ''].slice(0, 4)
        ).map((choice) => stripChoiceLetterPrefix(choice));
        const correctAnswer = stripChoiceLetterPrefix(question.correct_answer);
        const matched =
          choices.find((choice) => choice.toLowerCase() === correctAnswer.toLowerCase()) ||
          correctAnswer;
        return {
          clientId: crypto.randomUUID(),
          segmentClientId: segment?.clientId ?? null,
          segment_id: segment?.id ?? null,
          question_text: question.question_text,
          choices,
          correct_answer: matched,
          explanation: question.explanation,
          keep_question: true,
        };
      });
      setQuestions(nextQuestions);
      setSaveMessage(`Generated ${nextQuestions.length} question(s). Review before publishing.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Question generation failed');
    } finally {
      setGeneratingQuestions(false);
    }
  }

  function updateQuestion(clientId: string, updates: Partial<ClientLearnQuestion>) {
    setQuestions((current) =>
      current.map((question) =>
        question.clientId === clientId ? { ...question, ...updates } : question
      )
    );
  }

  async function handleDelete() {
    if (!window.confirm('Delete this Listen & Learn assessment?')) return;
    const response = await fetch(`/api/listen-and-learn/assignments/${assignmentId}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      router.push('/teacher-resources/listen-and-learn');
    }
  }

  const segmentByClientId = useMemo(() => {
    const map = new Map<string, ClientLearnSegment>();
    for (const segment of segments) map.set(segment.clientId, segment);
    for (const segment of segments) {
      if (segment.id) map.set(segment.id, segment);
    }
    return map;
  }, [segments]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <Link href="/teacher-resources/listen-and-learn">
          <ComicButton variant="accent" size="sm">
            ← Back to Listen &amp; Learn
          </ComicButton>
        </Link>
        <Link href={`/teacher-resources/listen-and-learn/${assignmentId}/results`}>
          <ComicButton variant="warning" size="sm">
            View results
          </ComicButton>
        </Link>
      </div>

      <ComicCard className="comic-shadow-xl space-y-4">
        <ComicTitle level={3} className="text-[var(--comic-primary)]">
          Assessment settings
        </ComicTitle>
        <ComicText className="text-sm font-bold text-[var(--comic-dark)] break-all">
          Assignment ID: {assignmentId}
        </ComicText>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="space-y-1">
            <ComicText className="font-black">Assessment Title</ComicText>
            <input
              value={title}
              onChange={(event) => {
                const next = event.target.value;
                setTitle(next);
                formValuesRef.current = { ...formValuesRef.current, title: next };
              }}
              className="w-full comic-border-thick rounded-md p-3 font-bold"
            />
          </label>
          <label className="space-y-1">
            <ComicText className="font-black">Teacher Name</ComicText>
            <input
              value={teacherName}
              onChange={(event) => {
                const next = event.target.value;
                setTeacherName(next);
                formValuesRef.current = { ...formValuesRef.current, teacherName: next };
              }}
              className="w-full comic-border-thick rounded-md p-3 font-bold"
            />
          </label>
          <label className="space-y-1">
            <ComicText className="font-black">Class</ComicText>
            <input
              value={className}
              onChange={(event) => {
                const next = event.target.value;
                setClassName(next);
                formValuesRef.current = { ...formValuesRef.current, className: next };
              }}
              className="w-full comic-border-thick rounded-md p-3 font-bold"
            />
          </label>
          <div className="md:col-span-2">
            <ComicButton
              type="button"
              variant="success"
              size="sm"
              disabled={saving}
              onClick={() => void handleSaveIdentity()}
            >
              {saving ? 'Saving…' : 'Save title & teacher now'}
            </ComicButton>
            <ComicText className="text-xs mt-2 text-[var(--comic-dark)]">
              Saves only Assessment Title, Teacher Name, and Class — use this if the student page
              still shows Untitled / old teacher.
            </ComicText>
          </div>
          <label className="space-y-1">
            <ComicText className="font-black">Due Date</ComicText>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="w-full comic-border-thick rounded-md p-3 font-bold"
            />
          </label>
          <label className="space-y-1">
            <ComicText className="font-black">Attempts Allowed</ComicText>
            <input
              type="number"
              min={1}
              value={attemptsAllowed}
              onChange={(event) => setAttemptsAllowed(Math.max(1, Number(event.target.value) || 1))}
              className="w-full comic-border-thick rounded-md p-3 font-bold"
            />
          </label>
          <label className="space-y-1">
            <ComicText className="font-black">Passing Score (%)</ComicText>
            <input
              type="number"
              min={0}
              max={100}
              value={passingScore}
              onChange={(event) =>
                setPassingScore(Math.min(100, Math.max(0, Number(event.target.value) || 0)))
              }
              className="w-full comic-border-thick rounded-md p-3 font-bold"
            />
          </label>
          <label className="space-y-1">
            <ComicText className="font-black">Max Audio Replays (0 = unlimited)</ComicText>
            <input
              type="number"
              min={0}
              value={maxReplays}
              onChange={(event) => setMaxReplays(Math.max(0, Number(event.target.value) || 0))}
              className="w-full comic-border-thick rounded-md p-3 font-bold"
            />
          </label>
          <div className="space-y-3 pt-6">
            <label className="flex items-center gap-2 font-bold text-[var(--comic-dark)]">
              <input
                type="checkbox"
                checked={randomizeQuestions}
                onChange={(event) => setRandomizeQuestions(event.target.checked)}
              />
              Randomize Questions
            </label>
            <label className="flex items-center gap-2 font-bold text-[var(--comic-dark)]">
              <input
                type="checkbox"
                checked={randomizeAnswers}
                onChange={(event) => setRandomizeAnswers(event.target.checked)}
              />
              Randomize Answers
            </label>
            <label className="flex items-center gap-2 font-bold text-[var(--comic-dark)]">
              <input
                type="checkbox"
                checked={autoSaveEnabled}
                onChange={(event) => setAutoSaveEnabled(event.target.checked)}
              />
              Auto-save
            </label>
          </div>
        </div>

        <div className="rounded-lg border-2 border-[var(--comic-dark)] p-4 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={makeupEnabled}
              onChange={(event) => setMakeupEnabled(event.target.checked)}
            />
            <span>
              <ComicText className="font-black">Makeup for failed Listen &amp; Answer</ComicText>
              <ComicText className="text-sm mt-1 text-[var(--comic-dark)]">
                Students who failed the tied assessment see this on their grades page. When they
                pass this Listen &amp; Learn, they get a separate makeup score (same max points as
                the assessment). The original failed test stays failed.
              </ComicText>
            </span>
          </label>

          {makeupEnabled ? (
            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <label className="space-y-1 md:col-span-2">
                <ComicText className="font-black">Tied assessment</ComicText>
                <select
                  className="w-full comic-border-thick rounded-md p-3 font-bold"
                  value={makeupListenAssignmentId}
                  onChange={(event) => setMakeupListenAssignmentId(event.target.value)}
                >
                  <option value="">Select a Listen &amp; Answer assessment…</option>
                  {listenAssessments.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                      {item.class_name ? ` (${item.class_name})` : ''}
                    </option>
                  ))}
                </select>
                {!makeupListenAssignmentId ? (
                  <ComicText className="text-sm mt-1 font-bold text-[var(--comic-danger)]">
                    Required: pick the failed assessment (e.g. English Listening). Until this is
                    set and the Learn assignment is Published, students will not see a makeup row
                    on their grades page.
                  </ComicText>
                ) : status !== 'published' ? (
                  <ComicText className="text-sm mt-1 font-bold text-[var(--comic-danger)]">
                    Publish this Listen &amp; Learn assignment so the makeup link appears for
                    students who failed the tied assessment.
                  </ComicText>
                ) : (
                  <ComicText className="text-sm mt-1 font-bold text-[var(--comic-success)]">
                    Makeup is active. Failers on that assessment will see this row on their grades
                    page (after you save).
                  </ComicText>
                )}
              </label>
              <div className="space-y-2 md:col-span-2">
                <ComicText className="font-black">Classes who can earn makeup</ComicText>
                <ComicText className="text-sm text-[var(--comic-dark)]">
                  Leave all unchecked for every class. Or pick specific classes (from Speak &amp;
                  Submit class list).
                </ComicText>
                {speakClasses.length === 0 ? (
                  <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                    No classes found yet. Add classes in Speak &amp; Submit settings.
                  </ComicText>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {speakClasses.map((item) => {
                      const checked = makeupClassNames.includes(item.label);
                      return (
                        <label
                          key={item.id}
                          className="flex items-center gap-2 font-bold text-[var(--comic-dark)]"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              setMakeupClassNames((current) => {
                                if (event.target.checked) {
                                  return current.includes(item.label)
                                    ? current
                                    : [...current, item.label];
                                }
                                return current.filter((label) => label !== item.label);
                              });
                            }}
                          />
                          {item.label}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </ComicCard>

      <ComicCard className="comic-shadow-xl space-y-4">
        <ComicTitle level={3} className="text-[var(--comic-secondary)]">
          Audio &amp; transcript
        </ComicTitle>
        <div className="grid lg:grid-cols-2 gap-4">
          <label className="space-y-1 block">
            <ComicText className="font-black">Audio URL</ComicText>
            <input
              value={audioUrl}
              onChange={(event) => setAudioUrl(event.target.value)}
              placeholder="https://..."
              className="w-full comic-border-thick rounded-md p-3 font-bold"
            />
          </label>
          <label className="space-y-1 block">
            <ComicText className="font-black">Thumbnail URL</ComicText>
            <input
              value={thumbnailUrl}
              onChange={(event) => setThumbnailUrl(event.target.value)}
              placeholder="https://..."
              className="w-full comic-border-thick rounded-md p-3 font-bold"
            />
          </label>
        </div>

        {thumbnailUrl.trim() ? (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl.trim()}
              alt="Assessment thumbnail preview"
              className="max-h-40 comic-border rounded-lg object-cover"
            />
          </div>
        ) : null}

        <div className="grid md:grid-cols-3 gap-4">
          <label className="space-y-1">
            <ComicText className="font-black">CEFR Level</ComicText>
            <select
              value={cefrLevel}
              onChange={(event) => setCefrLevel(event.target.value as CefrLevel)}
              className="w-full comic-border-thick rounded-md p-3 font-bold"
            >
              {CEFR_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <ComicText className="font-black">Question Difficulty</ComicText>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as LearnDifficulty)}
              className="w-full comic-border-thick rounded-md p-3 font-bold"
            >
              {LEARN_DIFFICULTIES.map((item) => (
                <option key={item} value={item}>
                  {LEARN_DIFFICULTY_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <ComicText className="font-black">Number of Questions</ComicText>
            <input
              type="number"
              min={1}
              value={questionCountTarget}
              onChange={(event) =>
                setQuestionCountTarget(Math.max(1, Number(event.target.value) || 1))
              }
              className="w-full comic-border-thick rounded-md p-3 font-bold"
            />
          </label>
        </div>

        <label className="space-y-1 block">
          <ComicText className="font-black">Framework</ComicText>
          <input
            value={questionFramework}
            onChange={(event) => setQuestionFramework(event.target.value)}
            className="w-full comic-border-thick rounded-md p-3 font-bold"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <ComicButton
            variant={transcriptSource === 'auto' ? 'secondary' : 'accent'}
            size="sm"
            disabled={generatingSegments}
            onClick={handleSelectAutoTranscribe}
          >
            {generatingSegments && transcriptSource === 'auto'
              ? 'Transcribing…'
              : '● Auto-transcribe from audio'}
          </ComicButton>
          <ComicButton
            variant={transcriptSource === 'manual' ? 'secondary' : 'accent'}
            size="sm"
            onClick={() => setTranscriptSource('manual')}
          >
            ○ Enter transcript manually
          </ComicButton>
        </div>
        <ComicText className="text-[var(--comic-dark)] text-sm font-bold">
          Auto-transcribe downloads the audio, runs Whisper with timestamps, then builds segments of
          at least ~5 seconds each. Click the button above (with an audio URL set) to start.
        </ComicText>

        <label className="space-y-1 block">
          <ComicText className="font-black">
            {transcriptSource === 'manual'
              ? 'Manual transcript'
              : 'Transcript (filled by auto-transcribe)'}
          </ComicText>
          <textarea
            value={transcript}
            onChange={(event) => {
              setTranscript(event.target.value);
              if (event.target.value.trim()) setTranscriptSource('manual');
            }}
            rows={5}
            className="w-full comic-border-thick rounded-md p-3 font-bold"
            placeholder="Paste a transcript to split manually, or use Auto-transcribe from audio."
          />
        </label>

        <ComicButton
          variant="primary"
          size="sm"
          disabled={generatingSegments}
          onClick={() => void handleGenerateSegments(false)}
        >
          {generatingSegments
            ? 'Processing segments…'
            : transcriptSource === 'manual' && transcript.trim()
              ? 'Split transcript into listening segments'
              : 'Transcribe audio & create segments'}
        </ComicButton>
      </ComicCard>

      <ComicCard className="comic-shadow-xl space-y-4">
        <ComicTitle level={3} className="text-[var(--comic-primary)]">
          Vocabulary from the audio
        </ComicTitle>
        <VocabularyReview
          assignmentId={assignmentId}
          audioUrl={audioUrl}
          vocabulary={vocabulary}
          onChange={setVocabulary}
          onPersistVocabulary={(next) => void handlePersistVocabulary(next)}
          onGenerate={() => void handleGenerateVocabulary()}
          generating={generatingVocabulary}
          canGenerate={Boolean(transcript.trim())}
        />
      </ComicCard>

      <ComicCard className="comic-shadow-xl space-y-4">
        <ComicTitle level={3} className="text-[var(--comic-success)]">
          Teacher review — listening segments
        </ComicTitle>
        <ComicText className="text-[var(--comic-dark)] font-bold">
          Select the segments to turn into assessment questions. Edit sentence text or timestamps as
          needed. Students only hear the selected segment for each question.
        </ComicText>
        <SegmentReviewTable audioUrl={audioUrl} segments={segments} onChange={setSegments} />
        <ComicButton
          variant="secondary"
          size="sm"
          disabled={generatingQuestions}
          onClick={() => void handleGenerateQuestions()}
        >
          {generatingQuestions ? 'Generating questions…' : 'Generate questions for selected segments'}
        </ComicButton>
      </ComicCard>

      <ComicCard className="comic-shadow-xl space-y-4">
        <ComicTitle level={3} className="text-[var(--comic-warning)]">
          Questions ({questions.filter((q) => q.keep_question).length} kept)
        </ComicTitle>
        {questions.length === 0 ? (
          <ComicText className="text-[var(--comic-dark)] font-bold">
            No questions yet. Select segments and generate questions.
          </ComicText>
        ) : (
          <div className="space-y-6">
            {questions.map((question, index) => {
              const segment =
                (question.segmentClientId && segmentByClientId.get(question.segmentClientId)) ||
                (question.segment_id && segmentByClientId.get(question.segment_id)) ||
                null;
              return (
                <div
                  key={question.clientId}
                  className="comic-border-thick rounded-lg p-4 bg-white space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <ComicTitle level={4} className="text-[var(--comic-primary)]">
                      Question {index + 1}
                    </ComicTitle>
                    <label className="flex items-center gap-2 font-bold">
                      <input
                        type="checkbox"
                        checked={question.keep_question}
                        onChange={(event) =>
                          updateQuestion(question.clientId, {
                            keep_question: event.target.checked,
                          })
                        }
                      />
                      Keep question
                    </label>
                  </div>

                  {segment ? (
                    <div className="space-y-2">
                      <ComicText className="text-[var(--comic-dark)] text-sm font-bold">
                        Segment: “{segment.sentence_text}”
                      </ComicText>
                      <SegmentAudioPlayer
                        audioUrl={audioUrl}
                        startSeconds={segment.start_seconds}
                        endSeconds={segment.end_seconds}
                        maxReplays={null}
                      />
                    </div>
                  ) : null}

                  <label className="space-y-1 block">
                    <ComicText className="font-black">Question</ComicText>
                    <textarea
                      value={question.question_text}
                      onChange={(event) =>
                        updateQuestion(question.clientId, {
                          question_text: event.target.value,
                        })
                      }
                      rows={2}
                      className="w-full comic-border-thick rounded-md p-3 font-bold"
                    />
                  </label>

                  <div className="grid md:grid-cols-2 gap-3">
                    {question.choices.map((choice, choiceIndex) => (
                      <label key={choiceIndex} className="space-y-1">
                        <ComicText className="font-black">
                          {String.fromCharCode(65 + choiceIndex)}
                        </ComicText>
                        <input
                          value={choice}
                          onChange={(event) => {
                            const next = [...question.choices];
                            next[choiceIndex] = event.target.value;
                            updateQuestion(question.clientId, { choices: next });
                          }}
                          className="w-full comic-border-thick rounded-md p-2 font-bold"
                        />
                      </label>
                    ))}
                  </div>

                  <label className="space-y-1 block">
                    <ComicText className="font-black">Correct answer</ComicText>
                    <select
                      value={question.correct_answer}
                      onChange={(event) =>
                        updateQuestion(question.clientId, {
                          correct_answer: event.target.value,
                        })
                      }
                      className="w-full comic-border-thick rounded-md p-3 font-bold"
                    >
                      <option value="">Select correct choice</option>
                      {question.choices
                        .filter((choice) => choice.trim())
                        .map((choice) => (
                          <option key={choice} value={choice}>
                            {choice}
                          </option>
                        ))}
                    </select>
                  </label>

                  <label className="space-y-1 block">
                    <ComicText className="font-black">Teacher explanation</ComicText>
                    <textarea
                      value={question.explanation}
                      onChange={(event) =>
                        updateQuestion(question.clientId, {
                          explanation: event.target.value,
                        })
                      }
                      rows={2}
                      className="w-full comic-border-thick rounded-md p-3 font-bold"
                    />
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </ComicCard>

      <ComicCard className="comic-shadow-xl space-y-4">
        <ComicTitle level={3} className="text-[var(--comic-primary)]">
          Publish &amp; QR code
        </ComicTitle>
        <ComicText className="text-[var(--comic-dark)] font-bold">
          Status:{' '}
          <span
            className={`uppercase ${
              status === 'published' ? 'text-[var(--comic-success)]' : 'text-[var(--comic-warning)]'
            }`}
          >
            {status}
          </span>
          {' · '}
          {vocabulary.filter((item) => item.keep_word && item.word.trim()).length} vocabulary word
          {vocabulary.filter((item) => item.keep_word && item.word.trim()).length === 1 ? '' : 's'} in
          editor
        </ComicText>
        <ComicText className="text-[var(--comic-dark)] font-bold">
          Student page will show:{' '}
          <span className="text-[var(--comic-primary)]">
            “{title.trim() || 'Untitled Listen & Learn'}”
          </span>
          {' · Teacher: '}
          <span className="text-[var(--comic-primary)]">{teacherName.trim() || '—'}</span>
          {className.trim() ? ` · ${className.trim()}` : ''}
        </ComicText>
        {(title.trim() === 'Untitled Listen & Learn' || !title.trim() || teacherName.trim() === 'T Robert') && (
          <ComicText className="text-[var(--comic-danger)] font-bold">
            Tip: scroll up to Assessment settings and set Assessment Title / Teacher Name, then click
            Update published again. Those fields are what students see.
          </ComicText>
        )}
        {vocabulary.filter((item) => item.keep_word && item.word.trim()).length === 0 ? (
          <ComicText className="text-[var(--comic-danger)] font-bold">
            No vocabulary in the editor — students will not see a Vocabulary section. Generate words
            above before publishing.
          </ComicText>
        ) : null}
        {status === 'published' ? (
          <div className="space-y-3">
            <ComicText className="text-[var(--comic-dark)] font-bold break-all">
              Student link: {studentUrl || getStudentLearnUrl(assignmentId)}
            </ComicText>
            {qrPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrPreview}
                alt="Student assessment QR code"
                className="w-48 h-48 comic-border-thick rounded-md bg-white"
              />
            ) : (
              <ComicText className="text-[var(--comic-dark)] font-bold">
                Generating QR code…
              </ComicText>
            )}
          </div>
        ) : (
          <ComicText className="text-[var(--comic-dark)] font-bold">
            Publish to generate the student link and QR code. Auto-save will keep the published
            status once live.
          </ComicText>
        )}

        <div className="flex flex-wrap gap-3">
          <ComicButton
            variant="accent"
            size="sm"
            disabled={saving}
            onClick={() => void handleManualSave('draft')}
          >
            {saving ? 'Saving…' : 'Save draft'}
          </ComicButton>
          <ComicButton
            variant="success"
            size="sm"
            disabled={saving}
            onClick={() => void handleManualSave('published')}
          >
            {saving ? 'Publishing…' : status === 'published' ? 'Update published' : 'Publish assessment'}
          </ComicButton>
          {status === 'published' ? (
            <ComicButton
              variant="warning"
              size="sm"
              disabled={saving}
              onClick={() => void handleManualSave('draft')}
            >
              Unpublish
            </ComicButton>
          ) : null}
          <ComicButton variant="danger" size="sm" onClick={() => void handleDelete()}>
            Delete
          </ComicButton>
        </div>

        {saveMessage ? (
          <ComicText className="text-[var(--comic-success)] font-bold">{saveMessage}</ComicText>
        ) : null}
        {error ? (
          <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText>
        ) : null}
      </ComicCard>
    </div>
  );
}
