import { NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { getProjectByIdOrSlug, updateComponentSettings } from '@/lib/projects/db';
import { uploadProjectTeacherFile, validateImageFile, validateWorksheetFile } from '@/lib/projects/storage';
import { asArtworkSettings, asWorksheetSettings } from '@/lib/projects/types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { projectId: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const project = await getProjectByIdOrSlug(params.projectId);
    if (!project) return jsonError('Project not found', 404);

    const formData = await request.formData();
    const file = formData.get('file');
    const kind = String(formData.get('kind') ?? '').trim();

    if (!file || !(file instanceof Blob)) {
      return jsonError('A file is required', 400);
    }

    if (kind !== 'worksheet' && kind !== 'artwork-example') {
      return jsonError('Upload kind must be worksheet or artwork-example', 400);
    }

    const validationError =
      kind === 'worksheet' ? validateWorksheetFile(file) : validateImageFile(file);
    if (validationError) return jsonError(validationError, 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType =
      file.type || (kind === 'worksheet' ? 'application/pdf' : 'image/jpeg');
    const fileName = 'name' in file && typeof file.name === 'string' ? file.name : `${kind}`;
    const uploaded = await uploadProjectTeacherFile({
      projectId: project.id,
      kind,
      fileName,
      buffer,
      contentType,
    });

    const stored = {
      url: uploaded.url,
      key: uploaded.key,
      file_name: uploaded.file_name,
      content_type: uploaded.content_type,
      source: 'upload' as const,
    };

    if (kind === 'worksheet') {
      const component = project.components.find((item) => item.type === 'worksheet');
      if (!component) return jsonError('Worksheet component not found', 404);
      const settings = asWorksheetSettings(component.settings);
      await updateComponentSettings(component.id, { ...settings, file: stored });
    } else {
      const component = project.components.find((item) => item.type === 'artwork');
      if (!component) return jsonError('Artwork component not found', 404);
      const settings = asArtworkSettings(component.settings);
      await updateComponentSettings(component.id, { ...settings, example_image: stored });
    }

    const updated = await getProjectByIdOrSlug(project.id);
    return NextResponse.json({ file: stored, project: updated });
  } catch (error) {
    console.error('Teacher project upload error:', error);
    return jsonError(error instanceof Error ? error.message : 'Failed to upload file', 500);
  }
}
