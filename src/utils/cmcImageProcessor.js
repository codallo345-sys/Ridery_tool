// src/utils/cmcImageProcessor.js
// Procesa una File/Image y devuelve { buffer, width, height, mime }
// - processImageForReport(file, rotation, orientation, targetDims)
const DEFAULT_RENDER_SCALE = 2;
const MAX_BLOB_SIZE_BYTES = Infinity; // no size cap per request for maximum HD quality
const MIN_JPEG_QUALITY = 0.55;
const AGGRESSIVE_QUALITY_STEP = 0.6;
const NORMAL_QUALITY_STEP = 0.8;
const MAX_COMPRESSION_STEPS = 8;
const AGGRESSIVE_THRESHOLD_MULTIPLIER = 2;
const MIN_RATIO_DIVISOR = 1.1;

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
  const maxRenderWidth = Math.max(minRenderWidth, Math.round(displayWidth * renderScale), displayWidth);
  const maxRenderHeight = Math.max(minRenderHeight, Math.round(displayHeight * renderScale), displayHeight);

  const rot = ((rotation || 0) % 360 + 360) % 360;
  const srcWidth = img.width || img.naturalWidth || displayWidth;
  const srcHeight = img.height || img.naturalHeight || displayHeight;
  const needsRotation = rot !== 0;
  const limitedScale = (srcWidth > 0 && srcHeight > 0)
    ? Math.min(maxRenderWidth / srcWidth, maxRenderHeight / srcHeight)
    : 1;
  const MAX_UPSCALE_FACTOR = Math.max(
    maxRenderWidth / Math.max(srcWidth, 1),
    maxRenderHeight / Math.max(srcHeight, 1)
  ); // ratio-bound cap derived from 4K limits
  const scaleFactor = Math.min(limitedScale, MAX_UPSCALE_FACTOR); // allows upscaling to 4K while still downscaling when inputs exceed the bounds
  const targetWidth = Math.max(1, Math.round(Math.min(maxRenderWidth, srcWidth * scaleFactor)));
  const targetHeight = Math.max(1, Math.round(Math.min(maxRenderHeight, srcHeight * scaleFactor)));
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
  const toBlobOrThrow = async (q) => {
    const b = await new Promise((resolve, reject) => canvas.toBlob((blobResult) => {
      if (blobResult) resolve(blobResult); else reject(new Error('Unable to process image'));
    }, mime, q));
    return b;
  };
  const computeNextQuality = (currentQuality, sizeRatio) => {
    const step = sizeRatio > AGGRESSIVE_THRESHOLD_MULTIPLIER ? AGGRESSIVE_QUALITY_STEP : NORMAL_QUALITY_STEP;
    const projectedQuality = Math.max(MIN_JPEG_QUALITY, currentQuality / Math.max(MIN_RATIO_DIVISOR, sizeRatio));
    return Math.max(MIN_JPEG_QUALITY, Math.min(projectedQuality, currentQuality * step));
  };
  let quality = 0.9;
  let blob = await toBlobOrThrow(quality);
  let attempts = 0;
  while (blob.size > MAX_BLOB_SIZE_BYTES && quality > MIN_JPEG_QUALITY && attempts < MAX_COMPRESSION_STEPS) {
    const ratio = blob.size / MAX_BLOB_SIZE_BYTES;
    quality = computeNextQuality(quality, ratio);
    blob = await toBlobOrThrow(quality);
    attempts += 1;
  }
  const arrayBuffer = await blob.arrayBuffer();

  // Adjust display dimensions respecting the real aspect ratio to avoid distortion
  const aspectRatio = canvasHeight / canvasWidth;
  let displayW = displayWidth;
  let displayH = Math.max(1, Math.round(displayW * aspectRatio));
  if (displayH > displayHeight) {
    displayH = displayHeight;
    displayW = Math.max(1, Math.round(displayH / aspectRatio));
  }

  return {
    buffer: arrayBuffer,
    width: displayW,
    height: displayH,
    renderWidth: canvasWidth,
    renderHeight: canvasHeight,
    mime
  };
}
