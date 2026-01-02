#!/usr/bin/env bash
# Script de ayuda para crear rama y añadir archivos. NO añade claves. Ejecuta desde la raíz del repo.
# Uso: bash scripts/create_jsonbin_setup.sh

set -e

BRANCH="jsonbin-migration"
echo "Creando rama $BRANCH..."
git checkout -b "$BRANCH"

# Crea las carpetas si no existen
mkdir -p src/hooks src/lib api scripts

# Agrega los archivos (sobreescribe si ya existen)
cat > src/hooks/useJsonBinClient.js <<'EOF'
// Cliente para JSONBin.io - lectura y escritura
const BASE_URL = import.meta.env.VITE_JSONBIN_BASE_URL || 'https://api.jsonbin.io/v3';
const API_KEY = import.meta.env.VITE_JSONBIN_API_KEY || '';

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

export async function getBinData(binId) {
  try {
    const res = await fetch(`${BASE_URL}/b/${binId}/latest`, {
      method: 'GET',
      headers: await getHeaders(false),
    });
    if (!res.ok) {
      if (API_KEY) {
        const res2 = await fetch(`${BASE_URL}/b/${binId}`, {
          method: 'GET',
          headers: await getHeaders(true),
        });
        if (!res2.ok) throw new Error(`Error GET bin ${binId}: ${res2.status}`);
        const json2 = await res2.json();
        return json2.record ?? json2;
      }
      throw new Error(`Error GET bin ${binId}: ${res.status}`);
    }
    const json = await res.json();
    return json.record ?? json;
  } catch (err) {
    console.error('getBinData error:', err);
    return null;
  }
}

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
    return json.record ?? json;
  } catch (error) {
    console.error('Fallo en la actualización (updateBinData):', error);
    return null;
  }
}
EOF

cat > src/lib/autoUpdater.js <<'EOF'
// Auto-updater del cliente: actualiza un bin cada X ms mientras la app está abierta.
import { getBinData, updateBinData } from '../hooks/useJsonBinClient.js';
const DEFAULT_INTERVAL = 30 * 60 * 1000;
let _intervalHandle = null;
export function startAutoUpdater({ binId, buildNewData, intervalMs = DEFAULT_INTERVAL } = {}) {
  if (!binId) throw new Error('binId es obligatorio');
  if (typeof buildNewData !== 'function') throw new Error('buildNewData debe ser una función');
  (async function runOnce() {
    try {
      const current = await getBinData(binId);
      const newData = await buildNewData(current);
      if (newData) await updateBinData(binId, newData);
    } catch (err) { console.error(err); }
  })();
  if (_intervalHandle) clearInterval(_intervalHandle);
  _intervalHandle = setInterval(async () => {
    try {
      const current = await getBinData(binId);
      const newData = await buildNewData(current);
      if (newData) await updateBinData(binId, newData);
    } catch (err) { console.error(err); }
  }, intervalMs);
  return function stop() { if (_intervalHandle) clearInterval(_intervalHandle); _intervalHandle = null; };
}
export function stopAutoUpdater() { if (_intervalHandle) clearInterval(_intervalHandle); _intervalHandle = null; }
EOF

cat > api/update-bin.js <<'EOF'
const BASE_URL = process.env.JSONBIN_BASE_URL || 'https://api.jsonbin.io/v3';
const API_KEY = process.env.JSONBIN_API_KEY || '';
const DEFAULT_BIN_ID = process.env.JSONBIN_PARAMS_BIN_ID || '';
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method Not Allowed' }); return; }
    const binId = req.query.binId || req.body?.binId || DEFAULT_BIN_ID;
    if (!binId) { res.status(400).json({ error: 'binId no especificado' }); return; }
    if (!API_KEY) { res.status(500).json({ error: 'JSONBIN_API_KEY no configurada' }); return; }
    let newData = req.body?.newData ?? null;
    if (!newData) {
      const getRes = await fetch(`${BASE_URL}/b/${binId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
      });
      if (!getRes.ok) throw new Error('Error GET bin');
      const json = await getRes.json();
      const current = json.record ?? json;
      newData = { ...current, lastUpdatedAt: new Date().toISOString() };
    }
    const putRes = await fetch(`${BASE_URL}/b/${binId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
      body: JSON.stringify(newData),
    });
    if (!putRes.ok) throw new Error('Error PUT bin');
    const result = await putRes.json();
    res.status(200).json({ ok: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err) });
  }
}
EOF

cat > .env.local.example <<'EOF'
VITE_JSONBIN_API_KEY=REPLACE_WITH_YOUR_JSONBIN_MASTER_KEY
VITE_JSONBIN_GUIDES_BIN_ID=693e2734d0ea881f4027d1fc
VITE_JSONBIN_PARAMS_BIN_ID=693e2752d0ea881f4027d221
VITE_JSONBIN_BASE_URL=https://api.jsonbin.io/v3
# Server-side:
# JSONBIN_API_KEY=REPLACE_WITH_YOUR_JSONBIN_MASTER_KEY
# JSONBIN_BASE_URL=https://api.jsonbin.io/v3
# JSONBIN_PARAMS_BIN_ID=693e2752d0ea881f4027d221
EOF

git add .
git commit -m "feat: add JSONBin client, auto-updater and serverless update endpoint"
echo "Listo. Archivos añadidos y commit realizado en la rama $BRANCH"
EOF