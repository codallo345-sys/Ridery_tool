// Acceso a la colección 'guias'
import {
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, guiasCol } from '../firebase';

// Listar
export async function listGuias() {
  try {
    const q = query(guiasCol, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('listGuias fallback sin orden:', e);
    const snap = await getDocs(guiasCol);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}

// Obtener una
export async function getGuia(guiaId) {
  try {
    const guiaRef = doc(db, 'guias', guiaId);
    const snap = await getDoc(guiaRef);
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    return null;
  } catch (e) {
    console.error('Error getGuia:', e);
    return null;
  }
}

// Guardar (crear/actualizar) por slug fijo
export async function saveGuia(slug, guiaData) {
  if (!slug) throw new Error('slug requerido');
  const guiaRef = doc(db, 'guias', slug);
  const saveData = {
    title: guiaData.title || 'Untitled Guide',
    content: guiaData.content || '',
    slug,
    isPublished: guiaData.isPublished ?? true,
    category: guiaData.category || 'incidencias',
    audiences: guiaData.audiences || [],
    updatedAt: serverTimestamp(),
    updatedBy: guiaData.updatedBy || 'admin',
  };
  await setDoc(guiaRef, saveData, { merge: true });
  console.log('✅ Guide saved:', slug);
  return { id: slug, ...saveData };
}

// Crear (solo si quieres docs nuevos, no para editar existentes)
export async function createGuia(guiaData) {
  const newGuia = {
    title: guiaData.title || 'Untitled Guide',
    content: guiaData.content || '',
    slug: guiaData.slug || '',
    isPublished: guiaData.isPublished ?? false,
    category: guiaData.category || 'incidencias',
    audiences: guiaData.audiences || [],
    updatedAt: serverTimestamp(),
    updatedBy: guiaData.updatedBy || 'admin',
  };
  const ref = await addDoc(guiasCol, newGuia);
  return { id: ref.id, ...newGuia };
}

// Update por id/slug
export async function updateGuia(guiaId, updates) {
  const guiaRef = doc(db, 'guias', guiaId);
  const updateData = {
    ...updates,
    updatedAt: serverTimestamp(),
    updatedBy: updates.updatedBy || 'admin',
  };
  await updateDoc(guiaRef, updateData);
}

// Delete
export async function deleteGuia(guiaId) {
  const guiaRef = doc(db, 'guias', guiaId);
  await deleteDoc(guiaRef);
}

// Suscribirse
export function subscribeToGuias(callback) {
  const q = query(guiasCol, orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const guias = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(guias);
    },
    () => {
      return onSnapshot(guiasCol, (snap2) => {
        const guias = snap2.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(guias);
      });
    }
  );
}