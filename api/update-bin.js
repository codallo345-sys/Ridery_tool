// Endpoint serverless para actualizar Bins en JSONBin (Vercel/Netlify compatible).
// - Requiere en entorno: JSONBIN_API_KEY  (X-Master-Key), JSONBIN_BASE_URL (opcional), ADMIN_TOKEN (token secreto para autorizar peticiones).
// - POST body: { binId: string, newData: object, merge?: boolean }
// - Si merge=true hará GET current -> merge (shallow) -> PUT. Si no, hará PUT con newData.
//
// Seguridad: protege con ADMIN_TOKEN en header 'x-admin-token' o 'authorization: Bearer <token>'.
// Asegúrate de configurar JSONBIN_API_KEY y ADMIN_TOKEN en las variables de entorno del servidor (no en VITE_).

const BASE_URL = process.env.JSONBIN_BASE_URL || 'https://api.jsonbin.io/v3';
const API_KEY = process.env.JSONBIN_API_KEY || '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
      return;
    }

    // Verificar token admin
    const incomingToken = req.headers['x-admin-token'] || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!ADMIN_TOKEN || incomingToken !== ADMIN_TOKEN) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!API_KEY) {
      res.status(500).json({ error: 'JSONBIN_API_KEY not configured on server' });
      return;
    }

    const { binId, newData, merge = true } = req.body || {};
    if (!binId) {
      res.status(400).json({ error: 'binId is required' });
      return;
    }
    if (!newData && !merge) {
      res.status(400).json({ error: 'newData is required when merge=false' });
      return;
    }

    // Si merge=true y no se pasó newData -> sólo añadir lastUpdatedAt
    let payload = newData ?? null;

    if (merge) {
      // Leer contenido actual
      const getRes = await fetch(`${BASE_URL}/b/${binId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': API_KEY,
        },
      });
      if (!getRes.ok) {
        const txt = await getRes.text().catch(() => '');
        throw new Error(`GET bin error: ${getRes.status} ${getRes.statusText} ${txt}`);
      }
      const currentJson = await getRes.json();
      const current = currentJson.record ?? currentJson;

      // Si no se pasó newData, sólo actualizamos un campo lastUpdatedAt por ejemplo
      if (!payload) {
        payload = {
          ...current,
          lastUpdatedAt: new Date().toISOString(),
        };
      } else {
        // Shallow merge: newData overrides top-level keys
        payload = {
          ...current,
          ...payload,
          lastUpdatedAt: new Date().toISOString(),
        };
      }
    }

    // PUT para reemplazar el bin
    const putRes = await fetch(`${BASE_URL}/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!putRes.ok) {
      const txt = await putRes.text().catch(() => '');
      throw new Error(`PUT bin error: ${putRes.status} ${putRes.statusText} ${txt}`);
    }
    const result = await putRes.json();
    // Devuelve record o todo el resultado
    res.status(200).json({ ok: true, result });
  } catch (err) {
    console.error('api/update-bin error:', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
}