// Compresión de imágenes en el navegador antes de subirlas (P3), sin librerías.
export const MAX_ORIGINAL_BYTES = 8 * 1024 * 1024;
export const MAX_SIDE = 1024;
export const WEBP_QUALITY = 0.8;

// Devuelve un mensaje de error en español, o null si el archivo se puede procesar
export function validateImageFile(file) {
  if (!file) return 'Elige una imagen';
  if (!file.type?.startsWith('image/')) return 'El archivo debe ser una imagen';
  if (file.size > MAX_ORIGINAL_BYTES) return 'La imagen pesa más de 8 MB. Elige una más liviana';
  return null;
}

// Tamaño final: el lado mayor queda en MAX_SIDE como máximo, sin agrandar imágenes pequeñas
export function fitWithin(width, height, max = MAX_SIDE) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

// Redimensiona y convierte a WebP. Si el navegador no codifica WebP, cae a JPEG.
export async function compressImage(file) {
  const error = validateImageFile(file);
  if (error) throw new Error(error);

  const bitmap = await createImageBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const toBlob = (type) => new Promise((resolve) => canvas.toBlob(resolve, type, WEBP_QUALITY));
  let blob = await toBlob('image/webp');
  if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/jpeg');
  if (!blob) throw new Error('No pudimos procesar la imagen');
  return blob;
}
