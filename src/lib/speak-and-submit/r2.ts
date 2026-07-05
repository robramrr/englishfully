import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

function getR2Client(): S3Client {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 storage credentials are not configured');
  }

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function getBucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error('R2_BUCKET_NAME is not configured');
  }
  return bucket;
}

function getPublicBaseUrl(): string {
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');
  if (publicUrl) {
    return publicUrl;
  }

  const endpoint = process.env.R2_ENDPOINT?.replace(/\/$/, '');
  if (endpoint && !endpoint.includes('.r2.cloudflarestorage.com')) {
    return endpoint;
  }

  throw new Error('R2_PUBLIC_URL is not configured');
}

export function buildPublicUrl(key: string): string {
  return `${getPublicBaseUrl()}/${key}`;
}

export function extractKeyFromUrl(url: string): string | null {
  try {
    const publicBase = getPublicBaseUrl();
    if (url.startsWith(`${publicBase}/`)) {
      return url.slice(publicBase.length + 1);
    }
  } catch {
    // Fall through to pathname parsing.
  }

  try {
    const pathname = new URL(url).pathname.replace(/^\//, '');
    return pathname || null;
  } catch {
    return null;
  }
}

function extensionForContentType(contentType: string): string {
  if (contentType.includes('mp4') || contentType.includes('m4a')) return 'mp4';
  if (contentType.includes('mpeg') || contentType.includes('mp3')) return 'mp3';
  if (contentType.includes('ogg')) return 'ogg';
  return 'webm';
}

export function sanitizePathSegment(value: string, maxLen = 48): string {
  return (
    value
      .trim()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, maxLen)
      .replace(/^-+|-+$/g, '') || 'unknown'
  );
}

export interface AudioUploadContext {
  taskId: string;
  classNumber: string;
  studentNumber: string;
  studentName: string;
  itemIndex: number;
}

export function buildAudioObjectKey(context: AudioUploadContext, extension: string): string {
  const classFolder = sanitizePathSegment(context.classNumber);
  const studentFolder = `${sanitizePathSegment(context.studentNumber)}_${sanitizePathSegment(context.studentName)}`;
  const itemLabel = String(context.itemIndex + 1).padStart(2, '0');
  const fileName = `${sanitizePathSegment(context.studentNumber)}_item-${itemLabel}.${extension}`;

  return `speak-and-submit/${context.taskId}/class-${classFolder}/${studentFolder}/${fileName}`;
}

export async function uploadAudioToR2(
  context: AudioUploadContext,
  buffer: Buffer,
  contentType: string
): Promise<{ key: string; url: string }> {
  const extension = extensionForContentType(contentType);
  const key = buildAudioObjectKey(context, extension);
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: buffer,
      ContentType: contentType || 'audio/webm',
      Metadata: {
        'student-name': context.studentName.trim(),
        'student-number': context.studentNumber.trim(),
        'class-number': context.classNumber.trim(),
        'item-index': String(context.itemIndex + 1),
        'task-id': context.taskId,
      },
    })
  );

  return {
    key,
    url: buildPublicUrl(key),
  };
}

export async function getAudioFromR2(key: string): Promise<Buffer> {
  const client = getR2Client();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    })
  );

  const bytes = await response.Body?.transformToByteArray();
  if (!bytes) {
    throw new Error('Failed to read audio from R2');
  }

  return Buffer.from(bytes);
}

export async function fetchAudioBuffer(audioUrl: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(audioUrl);
    if (response.ok) {
      return response.arrayBuffer();
    }
  } catch {
    // Fall back to authenticated R2 read.
  }

  try {
    const key = extractKeyFromUrl(audioUrl);
    if (!key) return null;
    const buffer = await getAudioFromR2(key);
    return buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;
  } catch {
    return null;
  }
}
