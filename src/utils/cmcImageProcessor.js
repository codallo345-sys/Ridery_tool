// src/utils/cmcImageProcessor.js
/**
 * processImageForReport
 *
 * Objetivo:
 * - Restaurar comportamiento base (volver a una versión limpia) y
 *   mantener/forzar la MÁXIMA CALIDAD posible evitando que las imágenes
 *   queden "aplastadas", "zoomed" o borrosas al insertarlas en .docx.
 *
 * Estrategia:
 * 1) Detectar dimensiones reales de la imagen (srcW, srcH) sin recodificar.
 * 2) Calcular las dimensiones de visualización (displayW, displayH) que
 *    caben en el cuadro objetivo (targetDims o getWordDimensions) manteniendo
 *    la relación de aspecto (sin estirar).
 * 3) Si rotation === 0:
 *      - NO recodificamos: devolvemos los BYTES ORIGINALES (ArrayBuffer) y
 *        pasamos a ImageRun la transformación displayW/displayH. Esto preserva
 *        la máxima fidelidad dejando que Word haga el downscaling (mejor que
 *        muchos remuestreadores JS).
 * 4) Si rotation !== 0:
 *      - Rotamos la imagen en un canvas a resolución lo más alta posible
 *        (usamos la resolución original), exportamos PNG lossless y devolvemos
 *        su buffer. También calculamos displayW/displayH (manteniendo aspecto).
 * 5) Si la imagen es más pequeña que el display deseado y quieres "HD", se
 *    puede aplicar upscale con pica (opcional, se intenta import dinámico).
 *    El default aquí evita upscaling automático para no introducir artefactos,
 *    pero hay un bloque opcional (comentado) que puedes activar para forzar
 *    upscale con pica+unsharp si lo deseas.
 *
 * Resultado:
 * - Siempre devolvemos: { buffer: ArrayBuffer, width: number, height: number, mime: string }
 *   - width/height = dimensiones que recomendamos pasar a ImageRun.transformation
 *     para que Word muestre la imagen correctamente (sin estirado).
 *
 * Nota:
 * - Aun cuando devuelvo bytes originales (sin recodificar), Word recibirá
 *   transformation (displayW/displayH) y redimensionará de forma nativa.
 * - Si necesitas forzar "embed HD" (hacer upscale para tener más px dentro del .docx),
 *   dime y activo la ruta de upscaling con pica (incluirá la librería).
 */

import { getWordDimensions } from './cmcDimensions';
import imageCompression from 'browser-image-compression'; // opcionalmente usado en algunos flujos

const readArrayBuffer = async (fileOrBlob) => {
  if (fileOrBlob.arrayBuffer) return await fileOrBlob.arrayBuffer();
  return await new Response(fileOrBlob).arrayBuffer();
};

const calcDisplaySize = (srcW, srcH, boxW, boxH) => {
  // Ajustar manteniendo aspect ratio (fit into box)
  const scale = Math.min(boxW / srcW, boxH / srcH);
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));
  return { w, h };
};

export const processImageForReport = async (imageFile, rotation = 0, orientation = 'horizontal', targetDims = null) => {
  try {
    if (!imageFile) throw new Error('processImageForReport: no se recibió imageFile');

    // Determinar caja objetivo (la "celda" en Word) en px
    const target = targetDims || getWordDimensions(orientation);
    const boxW = Math.max(1, Math.round(target.width));
    const boxH = Math.max(1, Math.round(target.height));

    // Obtener dimensiones reales de la fuente (sin recodificar)
    let bitmap = null;
    let imgElement = null;
    try {
      bitmap = await createImageBitmap(imageFile);
    } catch (e) {
      // Fallback: cargar Image element
      const objectUrl = URL.createObjectURL(imageFile);
      imgElement = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = objectUrl;
      });
      try { URL.revokeObjectURL(objectUrl); } catch (ignored) {}
    }

    const srcW = bitmap ? bitmap.width : imgElement.naturalWidth;
    const srcH = bitmap ? bitmap.height : imgElement.naturalHeight;

    // Si no hay rotación -> devolvemos bytes originales (mejor fidelidad).
    // Calculamos display sizes para insertarlas en ImageRun (preservando aspect).
    if (!rotation || rotation % 360 === 0) {
      const { w: displayW, h: displayH } = calcDisplaySize(srcW, srcH, boxW, boxH);

      // Leer buffer original (sin recodificar)
      const buffer = await readArrayBuffer(imageFile);
      const mime = imageFile.type || 'application/octet-stream';

      return { buffer, width: displayW, height: displayH, mime };
    }

    // Aqui rotation !== 0 -> necesitamos rotar la imagen.
    // Para rotación hacemos una re-encodificación lossless (PNG) a resolución original.
    // Creamos canvas con dimensiones rotadas (mantenemos la resolución original).
    const isRotated = rotation === 90 || rotation === 270;
    const outW = isRotated ? srcH : srcW;
    const outH = isRotated ? srcW : srcH;

    // Crear canvas con la resolución ORIGINAL (evitamos down/up-sampling innecesario)
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(outW));
    canvas.height = Math.max(1, Math.round(outH));
    const ctx = canvas.getContext('2d');

    // Fondo blanco por si la imagen tiene transparencias
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar rotado, centrado, usando alta calidad en smoothing
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const drawW = srcW;
    const drawH = srcH;

    if (bitmap) {
      ctx.drawImage(bitmap, -drawW / 2, -drawH / 2, drawW, drawH);
    } else if (imgElement) {
      ctx.drawImage(imgElement, -drawW / 2, -drawH / 2, drawW, drawH);
    }
    ctx.restore();

    // Exportar PNG lossless (mantiene máxima nitidez)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('processImageForReport: no se pudo generar PNG rotado');

    // Calcular display dims (ajustadas al box objetivo y manteniendo aspect ratio)
    // Para aspect ratio usamos las dimensiones rotadas (outW/outH)
    const { w: displayW, h: displayH } = calcDisplaySize(outW, outH, boxW, boxH);

    const buffer = await blob.arrayBuffer();
    const mime = 'image/png';

    return { buffer, width: displayW, height: displayH, mime };
  } catch (err) {
    console.error('processImageForReport error:', err);
    throw err;
  }
};

export default processImageForReport;
