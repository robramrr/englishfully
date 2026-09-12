const MAX_EDGE = 1600;
const TARGET_BYTES = 400 * 1024;
const MIN_QUALITY = 0.45;

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((result) => resolve(result), 'image/jpeg', quality);
  });
}

export async function compressArtworkImage(source: Blob): Promise<File> {
  const bitmap = await createImageBitmap(source);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error('Could not prepare the photo');
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.78;
  let blob: Blob | null = null;
  while (quality >= MIN_QUALITY) {
    blob = await canvasToJpeg(canvas, quality);
    if (blob && blob.size <= TARGET_BYTES) break;
    quality -= 0.1;
  }

  if (!blob) throw new Error('Could not compress the photo');
  return new File([blob], 'artwork.jpg', { type: 'image/jpeg' });
}
