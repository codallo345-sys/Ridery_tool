// Cliente para JSONBin.io - lectura y escritura
// Uso:
//   import { getBinData, updateBinData } from '../hooks/useJsonBinClient';
//   await getBinData(BIN_ID)
//   await updateBinData(BIN_ID, newData)

const BASE_URL = import.meta.env.VITE_JSONBIN_BASE_URL || 'https://api.jsonbin.io/v3';
const API_KEY = import.meta.env.VITE_JSONBIN_API_KEY || ''; // X-Master-Key (secreto) - NO subir al repo

async function getHeaders(includeMaster = false) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (includeMaster && API_KEY) {
    headers['X-Master-Key'] = API_KEY;
  }
  return headers;
}

/**
 * Leer el contenido actual del Bin.
 * @param {string} binId
 * @returns {object|null}
 */
export async function getBinData(binId) {
  try {
    // Para lectura pública se puede usar /b/:binId/latest
    const res = await fetch(`${BASE_URL}/b/${binId}/latest`, {
      method: 'GET',
      headers: await getHeaders(false),
    });
    if (!res.ok) {
      // Si el bin es privado puede requerir X-Master-Key
      // Reintentar con la clave maestra si está disponible
      if (API_KEY) {
        const res2 = await fetch(`${BASE_URL}/b/${binId}`, {
          method: 'GET',
          headers: await getHeaders(true),
        });
        if (!res2.ok) throw new Error(`Error GET bin ${binId}: ${res2.status} ${res2.statusText}`);
        const json2 = await res2.json();
        return json2.record ?? json2;
      }
      throw new Error(`Error GET bin ${binId}: ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    // JSONBin v3 devuelve `record`
    return json.record ?? json;
  } catch (err) {
    console.error('getBinData error:', err);
    return null;
  }
}

/**
 * Actualiza (PUT) el contenido del Bin.
 * Requiere la X-Master-Key para escritura.
 * @param {string} binId
 * @param {object} newData
 * @returns {object|null} nuevo contenido o null en error
 */
export async function updateBinData(binId, newData) {
  if (!API_KEY) {
    console.error('VITE_JSONBIN_API_KEY no definido. No se puede escribir en JSONBin.');
    return null;
  }
  try {
    const res = await fetch(`${BASE_URL}/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY,
      },
      body: JSON.stringify(newData),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Error al actualizar Bin ${binId}: ${res.status} ${res.statusText} - ${text}`);
    }
    const json = await res.json();
    // JSONBin v3 devuelve el nuevo record en `record`
    return json.record ?? json;
  } catch (error) {
    console.error('Fallo en la actualización (updateBinData):', error);
    return null;
  }
}

export default {
  getBinData,
  updateBinData,
};