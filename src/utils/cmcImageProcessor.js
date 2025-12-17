// src/utils/cmcImageProcessor.js
// Procesa una File/Image y devuelve { buffer, width, height, mime }
// - processImageForReport(file, rotation, orientation, targetDims)

export async function processImageForReport(file, rotation = 0, orientation = 'horizontal', targetDims = { width: 800, height: 600, renderScale: 1 }) {
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
  const renderScale = Math.max(1, Math.round(targetDims?.renderScale || 1));
  const targetWidth = Math.max(1, displayWidth * renderScale);
  const targetHeight = Math.max(1, displayHeight * renderScale);

  const rot = ((rotation || 0) % 360 + 360) % 360;
  const swap = rot === 90 || rot === 270;
  const canvasWidth = swap ? targetHeight : targetWidth;
  const canvasHeight = swap ? targetWidth : targetHeight;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d', { alpha: false });

  // Fill white background for better quality
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const srcWidth = img.width || img.naturalWidth || targetWidth;
  const srcHeight = img.height || img.naturalHeight || targetHeight;
  const scale = Math.min(canvasWidth / srcWidth, canvasHeight / srcHeight);
  const drawW = Math.round(srcWidth * scale);
  const drawH = Math.round(srcHeight * scale);
  const dx = Math.round((canvasWidth - drawW) / 2);
  const dy = Math.round((canvasHeight - drawH) / 2);

  // Enable image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (rot !== 0) {
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  } else {
    ctx.drawImage(img, dx, dy, drawW, drawH);
  }

  // Use JPEG with high quality (0.95) for better file size/quality balance
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
