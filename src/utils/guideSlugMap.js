// Mapeo de nombres visibles en la UI -> slugs fijos en Firestore
const GUIDE_NAME_TO_SLUG = {
  'CAMBIO DE MONTO CASH (CMC)': 'cambio-de-monto-cash',
  'Cambio de Monto Cash (CMC)': 'cambio-de-monto-cash',

  'VIAJE REALIZADO': 'viaje-realizado',
  'Viaje Realizado': 'viaje-realizado',

  'VIAJE REALIZADO CASH': 'viaje-realizado-cash',
  'Viaje Realizado Cash': 'viaje-realizado-cash',

  'RECÁLCULO': 'recalculo',
  'RECALCULO': 'recalculo',
  'Recálculo': 'recalculo',

  'MOVIMIENTO CERO': 'movimiento-cero',
  'Movimiento Cero': 'movimiento-cero',

  'VIAJE UNO': 'viaje-uno',
  'VIAJE YUNO': 'viaje-uno',
  'Viaje Uno': 'viaje-uno',

  'ABONO CXC DISPUTA MAL LIBERADA': 'abono-cxc-disputa-mal-liberada',
  'Abono CxC Disputa Mal Liberada': 'abono-cxc-disputa-mal-liberada',

  'ABONO CXC PAGO MÓVIL': 'abono-cxc-pago-movil',
  'ABONO CXC PAGO MOVIL': 'abono-cxc-pago-movil',
  'Abono CxC Pago Móvil': 'abono-cxc-pago-movil',
};

// Convierte nombre de guía a slug; si no está, hace un slug básico.
export function guideNameToSlug(guideName) {
  if (!guideName) return 'default-guide';
  const slug = GUIDE_NAME_TO_SLUG[guideName.trim()];
  if (slug) return slug;
  console.warn('[GuideSlugMap] No se encontró slug para:', guideName);
  return guideName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function slugToGuideName(slug) {
  if (!slug) return 'Unknown Guide';
  for (const [name, mapped] of Object.entries(GUIDE_NAME_TO_SLUG)) {
    if (mapped === slug) return name;
  }
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default {
  guideNameToSlug,
  slugToGuideName,
  GUIDE_NAME_TO_SLUG,
};