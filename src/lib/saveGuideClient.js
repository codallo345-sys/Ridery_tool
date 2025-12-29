// Ejemplo de función cliente para usar en el handler de "Guardar" de la UI de admin.
// - NOTA: debes tener una manera segura de obtener el ADMIN_TOKEN sólo en la UI de admin.
//   Puedes guardarlo en un archivo local de la UI admin (solo si distribuyes una build interna) o mejor:
//   autenticar al admin y obtener un token desde tu servidor.
//
// Uso:
//   await saveGuide({ id: 'guide123', title:'nuevo', ... }, { binId: import.meta.env.VITE_JSONBIN_GUIDES_BIN_ID, adminToken: 'xxx' });

export async function saveGuideToServer({ binId, newData, adminToken, merge = true }) {
  if (!binId) throw new Error('binId required');
  if (!adminToken) {
    console.error('No adminToken provided. Request will be rejected.');
    throw new Error('adminToken required');
  }

  const res = await fetch('/api/update-bin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': adminToken, // enviar token secreto
    },
    body: JSON.stringify({ binId, newData, merge }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Save failed: ${res.status} ${res.statusText} ${errText}`);
  }
  const json = await res.json();
  if (!json.ok) throw new Error('Save failed: ' + JSON.stringify(json));
  return json.result;
}