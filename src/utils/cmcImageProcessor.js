// src/utils/cmcImageProcessor.js
// Procesa una File/Image y devuelve { buffer, width, height, mime }
// - processImageForReport(file, rotation, orientation, targetDims)

export async function processImageForReport(file, rotation = 0, orientation = 'horizontal', targetDims = { width: 800, height: 600, renderScale: 1, maxWidth: 1920, maxHeight: 1080, quality: 0.72 }) {
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
  const maxWidth = Math.max(1, Math.round(targetDims?.maxWidth || targetDims?.minWidth || 1920));
  const maxHeight = Math.max(1, Math.round(targetDims?.maxHeight || targetDims?.minHeight || 1080));
  const renderScale = Math.max(1, Math.round(targetDims?.renderScale || 1));
  const quality = Math.min(1, Math.max(0.3, targetDims?.quality ?? 0.72));

  const rot = ((rotation || 0) % 360 + 360) % 360;
  const srcWidth = img.width || img.naturalWidth || displayWidth;
  const srcHeight = img.height || img.naturalHeight || displayHeight;
  const needsRotation = rot !== 0;

  // Limit rendering to keep .docx outputs light; no scaling beyond ~1080p.
  const scaleFactor = Math.min(maxWidth / srcWidth, maxHeight / srcHeight, 1);
  const targetWidth = Math.max(1, Math.round(srcWidth * scaleFactor * renderScale));
  const targetHeight = Math.max(1, Math.round(srcHeight * scaleFactor * renderScale));
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

  const mime = 'image/jpeg';
  const blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), mime, quality));
  const arrayBuffer = await blob.arrayBuffer();

  return {
    buffer: arrayBuffer,
    width: displayWidth,
    height: displayHeight,
    mime
  };
}
