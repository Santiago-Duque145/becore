// Compresión de imágenes en el navegador antes de subirlas (P3), sin librerías.
export const MAX_ORIGINAL_BYTES = 8 * 1024 * 1024;
export const WEBP_QUALITY = 0.8;

// Tamaño máximo por uso (perf de Descubre): la portada se ve como franja ancha, así que manda el ancho (1200 px);
// el alto también se limita a 1200 para que una foto vertical no pese de más. El avatar se ve a ≤ 96 px: 256 basta.
export const IMAGE_PRESETS = {
  cover: { maxWidth: 1200, maxHeight: 1200 },
  avatar: { maxWidth: 256, maxHeight: 256 },
};

// Devuelve un mensaje de error en español, o null si el archivo se puede procesar
export function validateImageFile(file) {
  if (!file) return 'Elige una imagen';
  if (!file.type?.startsWith('image/')) return 'El archivo debe ser una imagen';
  if (file.size > MAX_ORIGINAL_BYTES) return 'La imagen pesa más de 8 MB. Elige una más liviana';
  return null;
}

// Tamaño final dentro de los máximos del preset, manteniendo la proporción y sin agrandar imágenes pequeñas
export function fitWithin(width, height, { maxWidth, maxHeight } = IMAGE_PRESETS.cover) {
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

// Redimensiona y convierte a WebP (calidad 0,8). Si el navegador no codifica WebP, cae a JPEG.
export async function compressImage(file, preset = 'cover') {
  const error = validateImageFile(file);
  if (error) throw new Error(error);

  const bitmap = await createImageBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height, IMAGE_PRESETS[preset]);
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
