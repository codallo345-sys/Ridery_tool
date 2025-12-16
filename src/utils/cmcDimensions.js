// src/utils/cmcDimensions.js
// Dimensiones y utilidades para imágenes / tablas en reportes.
//
// Exportados:
// - CM_TO_PIXELS
// - CM_TO_TWIPS
// - HORIZONTAL_SIZES_CM, VERTICAL_SIZES_CM
// - getDimensionsFor(size, orientation, scale)
// - getWordDimensions(orientation)
// - getCellTargetDimensions(cols, orientation, leftTwips, rightTwips, scale)

export const CM_TO_PIXELS = 37.7952755906; // aproximado: px por cm para canvas
export const CM_TO_TWIPS = 1440 / 2.54;   // twips por cm (1in=1440 twips, 1in=2.54cm)

export const HORIZONTAL_SIZES_CM = {
  normal: { width: 11.0, height: 5.56 },
  mediana: { width: 8.11, height: 3.96 },
  grande: { width: 15.7, height: 4.46 }
};

export const VERTICAL_SIZES_CM = {
  normal: { width: 2.97, height: 6.17 },
  mediana: { width: 3.5, height: 7.86 },
  grande: { width: 4.96, height: 11.15 }
};

/**
 * getDimensionsFor(size, orientation, scale)
 * - size: 'normal'|'mediana'|'grande'
 * - orientation: 'horizontal'|'vertical'
 * - scale: multiplicador (1 = 100%)
 *
 * Retorna: { width: <px>, height: <px>, widthCm: <cm>, heightCm: <cm> }
 */
export const getDimensionsFor = (size = 'normal', orientation = 'horizontal', scale = 1) => {
  const key = size || 'normal';
  const base = orientation === 'vertical' ? (VERTICAL_SIZES_CM[key] || VERTICAL_SIZES_CM.normal) : (HORIZONTAL_SIZES_CM[key] || HORIZONTAL_SIZES_CM.normal);
  const widthCm = Number((base.width * Number(scale || 1)).toFixed(3));
  const heightCm = Number((base.height * Number(scale || 1)).toFixed(3));
  return {
    width: Math.max(1, Math.round(widthCm * CM_TO_PIXELS)),
    height: Math.max(1, Math.round(heightCm * CM_TO_PIXELS)),
    widthCm,
    heightCm
  };
};

/**
 * getWordDimensions(orientation)
 * - Compatibilidad con código antiguo: devuelve ancho/alto en px usando la "normal" box
 */
export const getWordDimensions = (orientation = 'horizontal') => {
  const base = orientation === 'vertical' ? VERTICAL_SIZES_CM.normal : HORIZONTAL_SIZES_CM.normal;
  return {
    width: Math.round(base.width * CM_TO_PIXELS),
    height: Math.round(base.height * CM_TO_PIXELS)
  };
};

/**
 * getCellTargetDimensions(cols, orientation, leftTwips = 720, rightTwips = 720, scale = 1)
 * - Calcula dimensiones (px) sugeridas para colocar en una celda de tabla que está dividida
 *   en `cols` columnas, teniendo en cuenta márgenes (twips) y el ancho de página A4 (21 cm).
 *
 * - leftTwips / rightTwips: margenes en twips (por defecto 720 = 0.5in)
 * - scale: multiplica el ancho de la celda (por si quieres ocupar más espacio)
 *
 * Retorna: { width, height } en píxeles
 */
export const getCellTargetDimensions = (cols = 1, orientation = 'horizontal', leftTwips = 720, rightTwips = 720, scale = 1) => {
  const PAGE_WIDTH_CM = 21.0; // A4 width approx usable
  const TWIPS_TO_CM = 2.54 / 1440; // cm per twip

  const leftCm = leftTwips * TWIPS_TO_CM;
  const rightCm = rightTwips * TWIPS_TO_CM;
  const usableWidthCm = Math.max(0.1, PAGE_WIDTH_CM - (leftCm + rightCm));

  const baseCellCm = usableWidthCm / Math.max(1, cols);
  const cellWidthCm = Math.min(baseCellCm * Math.max(1, scale), usableWidthCm);

  const base = orientation === 'vertical' ? VERTICAL_SIZES_CM.normal : HORIZONTAL_SIZES_CM.normal;
  const heightRatio = base.height / base.width;
  const widthPx = Math.max(1, Math.round(cellWidthCm * CM_TO_PIXELS));
  const heightPx = Math.max(1, Math.round(cellWidthCm * heightRatio * CM_TO_PIXELS));

  return { width: widthPx, height: heightPx };
};