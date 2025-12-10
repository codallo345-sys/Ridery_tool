// src/utils/cmcDimensions.js

// Factor de conversión cm -> pixels (referencia para docx transform)
export const CM_TO_PIXELS = 37.7952755906;

const PAGE_WIDTH_CM = 21.0; // A4 width in cm (si tu layout usa otra, ajustar)
const TWIPS_TO_CM = 2.54 / 1440; // 1 twip = 1/1440 in; convert to cm

const BASE_DIMS = {
  HORIZONTAL: { width: 11.0, height: 5.56 },
  VERTICAL: { width: 2.97, height: 6.17 }
};

/**
 * Devuelve dimensiones en PIXELES para ImageRun (docx).
 * orientation: 'horizontal' | 'vertical'
 */
export const getWordDimensions = (orientation = 'horizontal') => {
  const dims = orientation === 'horizontal' ? BASE_DIMS.HORIZONTAL : BASE_DIMS.VERTICAL;
  return {
    width: Math.round(dims.width * CM_TO_PIXELS),
    height: Math.round(dims.height * CM_TO_PIXELS)
  };
};

/**
 * Calcula dimensiones objetivo en PIXELES para una celda de tabla dividida en `cols` columnas,
 * teniendo en cuenta márgenes de página (en twips) y ancho de página A4 por defecto.
 *
 * leftTwips, rightTwips: márgenes de página usados en ReportGenerator (por defecto 720)
 * scale: factor opcional para ampliar la celda (1 = normal, >1 más ancho). Se aplica solo
 *        después de calcular el ancho utilizable por celda y está limitado al ancho utilizable total.
 *
 * Retorna: { width, height } en píxeles
 */
export const getCellTargetDimensions = (cols = 1, orientation = 'horizontal', leftTwips = 720, rightTwips = 720, scale = 1) => {
  const leftCm = leftTwips * TWIPS_TO_CM;
  const rightCm = rightTwips * TWIPS_TO_CM;
  const usableWidthCm = Math.max(0.1, PAGE_WIDTH_CM - (leftCm + rightCm));
  // ancho base por celda
  const cellWidthCmBase = usableWidthCm / Math.max(1, cols);

  // aplicar scale, pero no exceder el ancho utilizable total
  const cellWidthCmScaled = Math.min(cellWidthCmBase * scale, usableWidthCm);

  const targetWidthPx = Math.round(cellWidthCmScaled * CM_TO_PIXELS);

  const base = orientation === 'horizontal' ? BASE_DIMS.HORIZONTAL : BASE_DIMS.VERTICAL;
  const heightRatio = base.height / base.width; // mantener proporción del "base box"
  const targetHeightPx = Math.round(targetWidthPx * heightRatio);

  return { width: targetWidthPx, height: targetHeightPx };
};