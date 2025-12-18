// src/utils/cmcImageProcessor.js
// Processes an image File and returns { buffer, width, height, mime }
// - processImageForReport(file, rotation, orientation, targetDims?)

const MIN_JPEG_QUALITY = 0.3;
const MIN_RENDER_SCALE = 0.1;

export async function processImageForReport(file, rotation = 0, orientation = 'horizontal', targetDims = {}) {
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

  const {
    width = 800,
    height = 600,
    renderScale = 1,
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.72,
    displayWidth: displayWidthOverride,
    displayHeight: displayHeightOverride
  } = targetDims || {};

  const displayWidth = Math.max(1, Math.round(displayWidthOverride || width));
  const displayHeight = Math.max(1, Math.round(displayHeightOverride || height));
  const maxWidthPx = Math.max(1, Math.round(maxWidth));
  const maxHeightPx = Math.max(1, Math.round(maxHeight));
  const parsedRenderScale = parseFloat(renderScale);
  const renderScalePx = Math.max(MIN_RENDER_SCALE, Number.isFinite(parsedRenderScale) ? parsedRenderScale : 1);
  const qualityClamped = Math.min(1, Math.max(MIN_JPEG_QUALITY, quality));

  const rot = ((rotation || 0) % 360 + 360) % 360;
  const srcWidth = img.width || img.naturalWidth || displayWidth;
  const srcHeight = img.height || img.naturalHeight || displayHeight;
  const safeSrcWidth = Math.max(1, srcWidth);
  const safeSrcHeight = Math.max(1, srcHeight);

  // Limit rendering to keep .docx outputs lightweight; cap at 1920x1080.
  const scaleFactor = Math.min(maxWidthPx / safeSrcWidth, maxHeightPx / safeSrcHeight, 1);
  const targetWidth = Math.max(1, Math.round(safeSrcWidth * scaleFactor * renderScalePx));
  const targetHeight = Math.max(1, Math.round(safeSrcHeight * scaleFactor * renderScalePx));
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
  const blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), mime, qualityClamped));
  const arrayBuffer = await blob.arrayBuffer();

  return {
    buffer: arrayBuffer,
    width: displayWidth,
    height: displayHeight,
    mime
  };
}
