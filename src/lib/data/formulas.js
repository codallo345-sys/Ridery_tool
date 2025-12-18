// src/lib/data/formulas.js
// Data access helpers for the 'formulas' collection
import {
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db, formulasCol } from '../firebase';

/**
 * List all formulas from Firestore
 * @returns {Promise<Array>} Array of formula documents
 */
export async function listFormulas() {
  try {
    const snapshot = await getDocs(formulasCol);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error listing formulas:', error);
    return [];
  }
}

/**
 * Create a new formula in Firestore
 * @param {Object} formulaData - Formula data (name, expression, description, isActive)
 * @returns {Promise<Object>} Created document reference
 */
export async function createFormula(formulaData) {
  const newFormula = {
    name: formulaData.name || 'Untitled Formula',
    expression: formulaData.expression || '',
    description: formulaData.description || '',
    isActive: formulaData.isActive ?? true,
    updatedAt: serverTimestamp(),
    updatedBy: formulaData.updatedBy || 'admin',
  };

  try {
    const docRef = await addDoc(formulasCol, newFormula);
    console.log('✅ Formula created with ID:', docRef.id);
    return { id: docRef.id, ...newFormula };
  } catch (error) {
    console.error('Error creating formula:', error);
    throw error;
  }
}

/**
 * Update an existing formula in Firestore
 * @param {string} formulaId - Document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateFormula(formulaId, updates) {
  const formulaRef = doc(db, 'formulas', formulaId);
  const updateData = {
    ...updates,
    updatedAt: serverTimestamp(),
    updatedBy: updates.updatedBy || 'admin',
  };

  try {
    await updateDoc(formulaRef, updateData);
    console.log('✅ Formula updated:', formulaId);
  } catch (error) {
    console.error('Error updating formula:', error);
    throw error;
  }
}

/**
 * Delete a formula from Firestore
 * @param {string} formulaId - Document ID
 * @returns {Promise<void>}
 */
export async function deleteFormula(formulaId) {
  const formulaRef = doc(db, 'formulas', formulaId);

  try {
    await deleteDoc(formulaRef);
    console.log('✅ Formula deleted:', formulaId);
  } catch (error) {
    console.error('Error deleting formula:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time updates for formulas
 * @param {Function} callback - Function to call with updated data
 * @returns {Function} Unsubscribe function
 */
export function subscribeToFormulas(callback) {
  return onSnapshot(formulasCol, (snapshot) => {
    const formulas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(formulas);
  });
}
