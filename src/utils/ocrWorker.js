import { createWorker } from 'tesseract.js';

let workerPromise = null;

/**
 * Devuelve un singleton worker de Tesseract inicializado.
 * Se inicializa una sola vez y se reutiliza para reconocimiento múltiples.
 */
export const getWorker = async () => {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = createWorker({
        logger: m => {
          // depuración ligera; puedes desactivar o ajustar
          console.debug('Tesseract', m);
        }
      });
      await worker.load();
      // Usamos 'eng' por compatibilidad con dígitos y símbolos; si
      // deseas soporte español, cambia a 'spa' o carga ambos.
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      return worker;
    })();
  }
  return workerPromise;
};

/**
 * Recognize text from a File/Blob or image URL using the shared worker.
 * Returns the recognized text (string) or '' on error.
 */
export const recognizeImage = async (fileOrUrl) => {
  try {
    const worker = await getWorker();
    const { data } = await worker.recognize(fileOrUrl);
    return data?.text || '';
  } catch (err) {
    console.error('OCR recognize error:', err);
    return '';
  }
};

/**
 * Termina el worker si quieres liberar recursos manualmente.
 */
export const terminateWorker = async () => {
  if (workerPromise) {
    try {
      const w = await workerPromise;
      await w.terminate();
    } catch (e) {
      console.warn('Error terminating Tesseract worker', e);
    } finally {
      workerPromise = null;
    }
  }
};