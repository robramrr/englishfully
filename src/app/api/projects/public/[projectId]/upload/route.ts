import { NextResponse } from 'next/server';
import { jsonError } from '@/lib/speak-and-submit/api';
import {
  getProjectByIdOrSlug,
  getPublicProject,
  saveComponentProgress,
} from '@/lib/projects/db';
import {
  uploadProjectStudentFile,
  validateAudioFile,
  validateImageFile,
  validateWorksheetFile,
} from '@/lib/projects/storage';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { projectId: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const publicProject = await getPublicProject(params.projectId);
    if (!publicProject) return jsonError('This project is not available yet.', 404);
    const project = await getProjectByIdOrSlug(publicProject.id);
    if (!project) return jsonError('Project not found', 404);

    const formData = await request.formData();
    const file = formData.get('file');
    const componentId = String(formData.get('component_id') ?? '').trim();
    const kind = String(formData.get('kind') ?? '').trim();
    const studentName = String(formData.get('student_name') ?? '').trim();
    const studentNumber = String(formData.get('student_number') ?? '').trim();
    const classNumber = String(formData.get('class_number') ?? '').trim();
    const durationRaw = formData.get('duration_seconds');

    if (!file || !(file instanceof Blob)) return jsonError('A file is required', 400);
    if (!componentId || !studentNumber || !classNumber) {
      return jsonError('Student number, class, and component are required', 400);
    }
    if (kind !== 'worksheet' && kind !== 'artwork' && kind !== 'audio') {
      return jsonError('Upload kind must be worksheet, artwork, or audio', 400);
    }

    const component = project.components.find((item) => item.id === componentId && item.enabled);
    if (!component) return jsonError('Component not found', 404);

    const validationError =
      kind === 'audio'
        ? validateAudioFile(file)
        : kind === 'artwork'
          ? validateImageFile(file)
          : validateWorksheetFile(file);
    if (validationError) return jsonError(validationError, 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType =
      file.type ||
      (kind === 'audio' ? 'audio/webm' : kind === 'artwork' ? 'image/jpeg' : 'application/pdf');
    const fileName = 'name' in file && typeof file.name === 'string' ? file.name : `${kind}`;
    const uploaded = await uploadProjectStudentFile({
      projectId: project.id,
      classNumber,
      studentNumber,
      studentName,
      kind,
      fileName,
      buffer,
      contentType,
    });

    const durationSeconds = Number.parseFloat(String(durationRaw ?? ''));
    const submission = await saveComponentProgress(project, {
      student_number: studentNumber,
      class_number: classNumber,
      component_id: componentId,
      ...(kind === 'audio'
        ? {
            audio_url: uploaded.url,
            audio_key: uploaded.key,
            duration_seconds: Number.isFinite(durationSeconds) ? durationSeconds : undefined,
            speaking_method: 'online' as const,
          }
        : {
            file_url: uploaded.url,
            file_key: uploaded.key,
            file_name: uploaded.file_name,
            content_type: uploaded.content_type,
          }),
    });

    return NextResponse.json({
      url: uploaded.url,
      key: uploaded.key,
      file_name: uploaded.file_name,
      content_type: uploaded.content_type,
      submission,
    });
  } catch (error) {
    console.error('Student project upload error:', error);
    return jsonError(error instanceof Error ? error.message : 'Failed to upload file', 500);
  }
}
