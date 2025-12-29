// Ejemplo de handler React para un botón "Guardar" en la UI de admin.
// - Debes proveer adminToken (no lo incluyas en build público). Si tienes auth, usa el token real.
// - Tras guardar, se notifica a otras pestañas via BroadcastChannel (si deseas).
import React, { useState, useEffect } from 'react';
import { saveGuideToServer } from '../lib/saveGuideClient';

const bc = typeof window !== 'undefined' && 'BroadcastChannel' in window ? new BroadcastChannel('ridery-updates') : null;

export default function EditGuideExample({ initialGuide }) {
  const [guide, setGuide] = useState(initialGuide);
  // adminToken puede venir de un prompt para builds internas, o de un auth flow.
  const adminToken = window.__ADMIN_TOKEN__ || process.env.REACT_APP_ADMIN_TOKEN || null;

  useEffect(() => {
    if (!bc) return;
    const onMessage = (ev) => {
      if (ev.data?.type === 'guide-updated' && ev.data?.id === guide.id) {
        // actualizar UI si es necesario
        // por ejemplo, re-fetch o aplicar ev.data.guide
        console.log('Guide updated elsewhere:', ev.data);
      }
    };
    bc.addEventListener('message', onMessage);
    return () => bc.removeEventListener('message', onMessage);
  }, [guide.id]);

  async function handleSaveClick() {
    try {
      // Construye el objeto que quieres guardar
      const payload = { ...guide, updatedBy: 'admin-username' };
      const result = await saveGuideToServer({
        binId: import.meta.env.VITE_JSONBIN_GUIDES_BIN_ID,
        newData: { [guide.id]: payload }, // ejemplo: guardar por id dentro del bin
        adminToken,
        merge: true,
      });
      console.log('Saved result', result);
      // Notificar otras pestañas del mismo navegador
      if (bc) {
        bc.postMessage({ type: 'guide-updated', id: guide.id, guide: payload });
      }
      // Actualiza estado local
      setGuide(payload);
      alert('Guardado correctamente');
    } catch (err) {
      console.error('Error guardando:', err);
      alert('Error guardando: ' + err.message);
    }
  }

  return (
    <div>
      <h3>Edit Guide</h3>
      <input value={guide.title} onChange={(e) => setGuide({ ...guide, title: e.target.value })} />
      <button onClick={handleSaveClick}>Guardar</button>
    </div>
  );
}