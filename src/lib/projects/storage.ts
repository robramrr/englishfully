import {
  sanitizePathSegment,
  uploadBinaryToR2,
  deleteAudioFromR2,
} from '@/lib/speak-and-submit/r2';

const WORKSHEET_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const AUDIO_TYPES = new Set([
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/ogg',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
]);

const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

function extensionForContentType(contentType: string, fallback: string): string {
  if (contentType.includes('pdf')) return 'pdf';
  if (contentType.includes('wordprocessingml') || contentType.includes('msword')) {
    return contentType.includes('openxml') ? 'docx' : 'doc';
  }
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  if (contentType.includes('mp4') || contentType.includes('m4a')) return 'mp4';
  if (contentType.includes('mpeg') || contentType.includes('mp3')) return 'mp3';
  if (contentType.includes('ogg')) return 'ogg';
  if (contentType.includes('wav')) return 'wav';
  if (contentType.includes('aac')) return 'aac';
  return fallback;
}

function normalizeContentType(file: Blob, fallback: string): string {
  return file.type || fallback;
}

export function validateWorksheetFile(file: Blob): string | null {
  const contentType = normalizeContentType(file, 'application/pdf');
  if (!WORKSHEET_TYPES.has(contentType) && !contentType.startsWith('image/')) {
    return 'Worksheet must be a PDF, Word document, or image.';
  }
  if (file.size === 0) return 'Worksheet file is empty.';
  if (file.size > MAX_DOCUMENT_BYTES) return 'Worksheet file must be 20 MB or smaller.';
  return null;
}

export function validateImageFile(file: Blob): string | null {
  const contentType = normalizeContentType(file, 'image/jpeg');
  if (!IMAGE_TYPES.has(contentType)) {
    return 'Please upload a JPG, PNG, WEBP, or GIF image.';
  }
  if (file.size === 0) return 'Image file is empty.';
  if (file.size > MAX_IMAGE_BYTES) return 'Image must be 10 MB or smaller.';
  return null;
}

export function validateAudioFile(file: Blob): string | null {
  const contentType = normalizeContentType(file, 'audio/webm');
  const allowed =
    AUDIO_TYPES.has(contentType) ||
    contentType.startsWith('audio/');
  if (!allowed) return 'Please upload a valid audio recording.';
  if (file.size === 0) return 'Audio file is empty.';
  if (file.size > MAX_AUDIO_BYTES) return 'Audio must be 25 MB or smaller.';
  return null;
}

export async function uploadProjectTeacherFile(params: {
  projectId: string;
  kind: 'worksheet' | 'artwork-example' | 'upload-example';
  fileName: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ key: string; url: string; file_name: string; content_type: string }> {
  const fallback = params.kind === 'worksheet' ? 'pdf' : 'jpg';
  const extension = extensionForContentType(params.contentType, fallback);
  const safeName = sanitizePathSegment(params.fileName.replace(/\.[^.]+$/, '') || params.kind, 40);
  const key = `projects/${sanitizePathSegment(params.projectId)}/teacher/${params.kind}-${safeName}-${Date.now()}.${extension}`;
  const uploaded = await uploadBinaryToR2({
    key,
    buffer: params.buffer,
    contentType: params.contentType,
  });
  return {
    ...uploaded,
    file_name: params.fileName || `${params.kind}.${extension}`,
    content_type: params.contentType,
  };
}

export async function uploadProjectStudentFile(params: {
  projectId: string;
  classNumber: string;
  studentNumber: string;
  studentName: string;
  kind: 'worksheet' | 'artwork' | 'upload' | 'audio';
  fileName: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ key: string; url: string; file_name: string; content_type: string }> {
  const fallback =
    params.kind === 'audio' ? 'webm' : params.kind === 'artwork' ? 'jpg' : 'pdf';
  const extension = extensionForContentType(params.contentType, fallback);
  const classFolder = sanitizePathSegment(params.classNumber);
  const studentFolder = `${sanitizePathSegment(params.studentNumber)}_${sanitizePathSegment(params.studentName)}`;
  const key = `projects/${sanitizePathSegment(params.projectId)}/submissions/class-${classFolder}/${studentFolder}/${params.kind}-${Date.now()}.${extension}`;
  const uploaded = await uploadBinaryToR2({
    key,
    buffer: params.buffer,
    contentType: params.contentType,
  });
  return {
    ...uploaded,
    file_name: params.fileName || `${params.kind}.${extension}`,
    content_type: params.contentType,
  };
}

export async function deleteProjectFileFromR2(key: string): Promise<void> {
  const trimmed = key.trim();
  if (!trimmed) return;
  await deleteAudioFromR2(trimmed);
}
