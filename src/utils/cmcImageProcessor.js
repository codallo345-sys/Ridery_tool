// src/utils/cmcImageProcessor.js
// Procesa una File/Image y devuelve { buffer, width, height, mime }
// - processImageForReport(file, rotation, orientation, targetDims)

export async function processImageForReport(file, rotation = 0, orientation = 'horizontal', targetDims = { width: 800, height: 600, minWidth: 1920, minHeight: 1080 }) {
  if (!file) throw new Error('No file provided');

  const loadImage = (file) => new Promise((resolve, reject) => {
    if (typeof createImageBitmap === 'function') {
      createImageBitmap(file).then(resolve).catch(() => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
        img.src = url;
      });
    } else {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      img.src = url;
    }
  });

  const img = await loadImage(file);

  const displayWidth = Math.max(1, Math.round(targetDims?.displayWidth || targetDims?.width || 800));
  const displayHeight = Math.max(1, Math.round(targetDims?.displayHeight || targetDims?.height || 600));
  const rot = ((rotation || 0) % 360 + 360) % 360;
  const srcWidth = img.width || img.naturalWidth || displayWidth;
  const srcHeight = img.height || img.naturalHeight || displayHeight;
  const needsRotation = rot !== 0;

  // If no rotation and the source is already within target display size, reuse it to avoid recompression.
  if (!needsRotation && srcWidth <= displayWidth && srcHeight <= displayHeight) {
    const mime = file.type && file.type.includes('png') ? 'image/png' : file.type || 'image/png';
    const arrayBuffer = await file.arrayBuffer();
    return {
      buffer: arrayBuffer,
      width: displayWidth,
      height: displayHeight,
      mime
    };
  }

  // Otherwise, fit the image into the target display box without upscaling.
  const fitScale = Math.min(1, displayWidth / srcWidth, displayHeight / srcHeight);
  const targetWidth = Math.max(1, Math.round(srcWidth * fitScale));
  const targetHeight = Math.max(1, Math.round(srcHeight * fitScale));
  const swap = rot === 90 || rot === 270;
  const canvasWidth = swap ? targetHeight : targetWidth;
  const canvasHeight = swap ? targetWidth : targetHeight;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d', { alpha: false });

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (rot !== 0) {
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.drawImage(img, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
    ctx.restore();
  } else {
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  }

  const mime = 'image/png';
  const blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), mime));
  const arrayBuffer = await blob.arrayBuffer();

  return {
    buffer: arrayBuffer,
    width: displayWidth,
    height: displayHeight,
    mime
  };
}
