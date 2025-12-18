// Auto-updater del cliente: actualiza un bin cada X ms mientras la app está abierta.
// Uso:
//  import { startAutoUpdater, stopAutoUpdater } from '../lib/autoUpdater';
//  const stop = startAutoUpdater({ binId: BIN_ID, buildNewData: (old)=>({...}), intervalMs: 30*60*1000 });
//  stop(); // para detener

import { getBinData, updateBinData } from '../hooks/useJsonBinClient.js';

const DEFAULT_INTERVAL = 30 * 60 * 1000; // 30 minutos

let _intervalHandle = null;

/**
 * Inicia el auto-updater.
 * @param {Object} opts
 * @param {string} opts.binId - ID del Bin a actualizar.
 * @param {function(Object|null):Object} opts.buildNewData - función que recibe data actual y devuelve el nuevo objeto a PUT.
 * @param {number} [opts.intervalMs] - intervalo en ms (por defecto 30 minutos).
 * @returns {function} stop() - función para detener el auto-updater.
 */
export function startAutoUpdater({ binId, buildNewData, intervalMs = DEFAULT_INTERVAL } = {}) {
  if (!binId) throw new Error('binId es obligatorio para startAutoUpdater');
  if (typeof buildNewData !== 'function') throw new Error('buildNewData debe ser una función');

  // Ejecutar una vez inmediatamente
  (async function runOnce() {
    try {
      const current = await getBinData(binId);
      const newData = await buildNewData(current);
      if (newData) {
        await updateBinData(binId, newData);
        console.log(`[autoUpdater] Bin ${binId} actualizado.`);
      } else {
        console.log('[autoUpdater] buildNewData devolvió null/undefined; no se guardó.');
      }
    } catch (err) {
      console.error('[autoUpdater] error en runOnce:', err);
    }
  })();

  // Limpiar si ya había uno corriendo
  if (_intervalHandle) clearInterval(_intervalHandle);

  _intervalHandle = setInterval(async () => {
    try {
      const current = await getBinData(binId);
      const newData = await buildNewData(current);
      if (newData) {
        await updateBinData(binId, newData);
        console.log(`[autoUpdater] Bin ${binId} actualizado (interval).`);
      }
    } catch (err) {
      console.error('[autoUpdater] error en intervalo:', err);
    }
  }, intervalMs);

  return function stop() {
    if (_intervalHandle) {
      clearInterval(_intervalHandle);
      _intervalHandle = null;
      console.log('[autoUpdater] detenido.');
    }
  };
}

export function stopAutoUpdater() {
  if (_intervalHandle) clearInterval(_intervalHandle);
  _intervalHandle = null;
}