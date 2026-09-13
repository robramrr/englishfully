import { NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import {
  getProjectByIdOrSlug,
  updateComponentSettings,
  updateProjectWorksheetFiles,
} from '@/lib/projects/db';
import {
  uploadProjectTeacherFile,
  validateImageFile,
  validateWorksheetFile,
} from '@/lib/projects/storage';
import {
  asUploadTaskSettings,
  isUploadTaskType,
} from '@/lib/projects/types';

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
    const componentId = String(formData.get('component_id') ?? '').trim();

    if (!file || !(file instanceof Blob)) {
      return jsonError('A file is required', 400);
    }

    if (kind !== 'worksheet' && kind !== 'upload-example') {
      return jsonError('Upload kind must be worksheet or upload-example', 400);
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
      const title = String(formData.get('title') ?? '').trim() || 'Worksheet';
      const indexRaw = String(formData.get('handout_index') ?? '').trim();
      const index = indexRaw === '' ? -1 : Number(indexRaw);
      const current = [...(project.worksheet_files || [])];
      const handout = { ...stored, title };
      if (Number.isInteger(index) && index >= 0 && index < current.length) {
        handout.title = String(current[index]?.title || title).trim() || title;
        current[index] = handout;
      } else {
        current.push(handout);
      }
      const updated = await updateProjectWorksheetFiles(project.id, current);
      return NextResponse.json({ file: handout, project: updated });
    }

    const component = project.components.find(
      (item) => item.id === componentId && isUploadTaskType(item.type)
    );
    if (!component) return jsonError('Upload task not found', 404);
    const settings = asUploadTaskSettings(component.settings, 'Upload');
    await updateComponentSettings(component.id, {
      ...settings,
      example_image_enabled: true,
      example_image: stored,
    });

    const updated = await getProjectByIdOrSlug(project.id);
    return NextResponse.json({ file: stored, project: updated });
  } catch (error) {
    console.error('Teacher project upload error:', error);
    return jsonError(error instanceof Error ? error.message : 'Failed to upload file', 500);
  }
}
