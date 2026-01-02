// src/utils/cmcImageProcessor.js
// Procesa una File/Image y devuelve { buffer, width, height, mime }
// - processImageForReport(file, rotation, orientation, targetDims)
import pica from 'pica';

const DEFAULT_RENDER_SCALE = 2.5;
const SAFE_MAX_DIMENSION = 10000;
const PNG_MIME = 'image/png';
const MIN_ASPECT_RATIO = 0.0001;
const NO_ALPHA = { alpha: false };
const PICA_QUALITY = 3;

export async function processImageForReport(file, rotation = 0, orientation = 'horizontal', targetDims = { width: 800, height: 600, renderScale: DEFAULT_RENDER_SCALE }) {
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
  const renderScale = Math.max(0.1, Number(targetDims?.renderScale || DEFAULT_RENDER_SCALE));
  const minRenderWidth = Math.round(targetDims?.minWidth || 0);
  const minRenderHeight = Math.round(targetDims?.minHeight || 0);
  const desiredWidth = Math.max(displayWidth, displayWidth * renderScale, minRenderWidth);
  const desiredHeight = Math.max(displayHeight, displayHeight * renderScale, minRenderHeight);

  const rot = ((rotation || 0) % 360 + 360) % 360;
  const srcWidth = img.width || img.naturalWidth || displayWidth;
  const srcHeight = img.height || img.naturalHeight || displayHeight;
  const fallbackWidth = orientation === 'vertical'
    ? Math.max(targetDims?.width || displayWidth, displayWidth)
    : Math.max(targetDims?.width || displayWidth, 1);
  const fallbackHeight = Math.max(targetDims?.height || displayHeight, displayHeight);
  const aspectRatio = (srcWidth > 0 && srcHeight > 0)
    ? srcHeight / srcWidth
    : (fallbackHeight / Math.max(fallbackWidth, 1));

  let targetWidth = Math.min(SAFE_MAX_DIMENSION, Math.round(Math.max(srcWidth, desiredWidth)));
  let targetHeight = Math.min(SAFE_MAX_DIMENSION, Math.round(targetWidth * aspectRatio));

  if (targetHeight < Math.min(SAFE_MAX_DIMENSION, Math.max(srcHeight, desiredHeight))) {
    targetHeight = Math.min(SAFE_MAX_DIMENSION, Math.round(Math.max(srcHeight, desiredHeight)));
    targetWidth = Math.min(SAFE_MAX_DIMENSION, Math.round(targetHeight / Math.max(aspectRatio, MIN_ASPECT_RATIO)));
  }

  const swap = rot === 90 || rot === 270;
  const canvasWidth = swap ? targetHeight : targetWidth;
  const canvasHeight = swap ? targetWidth : targetHeight;

  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = srcWidth;
  sourceCanvas.height = srcHeight;
  const sourceCtx = sourceCanvas.getContext('2d', NO_ALPHA);
  sourceCtx.drawImage(img, 0, 0);

  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = targetWidth;
  resizedCanvas.height = targetHeight;

  const resizer = pica();
  await resizer.resize(sourceCanvas, resizedCanvas, { alpha: false, quality: PICA_QUALITY });

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d', NO_ALPHA);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (rot !== 0) {
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.drawImage(resizedCanvas, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
    ctx.restore();
  } else {
    ctx.drawImage(resizedCanvas, 0, 0, targetWidth, targetHeight);
  }

  const mime = PNG_MIME;
  const toBlobOrThrow = async () => {
    const b = await new Promise((resolve, reject) => canvas.toBlob((blobResult) => {
      if (blobResult) resolve(blobResult); else reject(new Error('Unable to process image'));
    }, mime, 1));
    return b;
  };
  const blob = await toBlobOrThrow();
  const arrayBuffer = await blob.arrayBuffer();

  // Adjust display dimensions respecting the real aspect ratio to avoid distortion
  const canvasAspectRatio = canvasHeight / canvasWidth;
  let displayW = displayWidth;
  let displayH = Math.max(1, Math.round(displayW * canvasAspectRatio));
  if (displayH > displayHeight) {
    displayH = displayHeight;
    displayW = Math.max(1, Math.round(displayH / canvasAspectRatio));
  }

  return {
    buffer: arrayBuffer,
    width: displayW,
    height: displayH,
    renderWidth: canvasWidth,
    renderHeight: canvasHeight,
    mime,
    displayWidth,
    displayHeight
  };
}
