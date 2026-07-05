import { v2 as cloudinary } from 'cloudinary';

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials are not configured');
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return cloudinary;
}

export function getCloudinaryUploadParams(taskId: string) {
  const cloudinaryInstance = configureCloudinary();
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `englishfully/speak-and-submit/${taskId}`;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (uploadPreset) {
    return {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
      uploadPreset,
      folder,
      resourceType: 'video' as const,
    };
  }

  const paramsToSign = {
    timestamp,
    folder,
    resource_type: 'video',
  };

  const signature = cloudinaryInstance.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET as string
  );

  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    timestamp,
    signature,
    folder,
    resourceType: 'video' as const,
  };
}

export async function deleteCloudinaryAsset(publicId: string): Promise<void> {
  const cloudinaryInstance = configureCloudinary();
  await cloudinaryInstance.uploader.destroy(publicId, { resource_type: 'video' });
}
