// src/lib/data/categories.js
// Data access helpers for the 'categories' collection
import {
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, categoriesCol } from '../firebase';

/**
 * List all categories from Firestore
 * @returns {Promise<Array>} Array of category documents
 */
export async function listCategories() {
  try {
    const q = query(categoriesCol, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error listing categories:', error);
    // Fallback without ordering if index doesn't exist
    try {
      const snapshot = await getDocs(categoriesCol);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (fallbackError) {
      console.error('Error listing categories (fallback):', fallbackError);
      return [];
    }
  }
}

/**
 * Create a new category in Firestore
 * @param {Object} categoryData - Category data (name, slug, isActive, order)
 * @returns {Promise<Object>} Created document reference
 */
export async function createCategory(categoryData) {
  const newCategory = {
    name: categoryData.name || 'Untitled Category',
    slug: categoryData.slug || '',
    isActive: categoryData.isActive ?? true,
    order: categoryData.order ?? 0,
    updatedAt: serverTimestamp(),
    updatedBy: categoryData.updatedBy || 'admin',
  };

  try {
    const docRef = await addDoc(categoriesCol, newCategory);
    console.log('✅ Category created with ID:', docRef.id);
    return { id: docRef.id, ...newCategory };
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

/**
 * Update an existing category in Firestore
 * @param {string} categoryId - Document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateCategory(categoryId, updates) {
  const categoryRef = doc(db, 'categories', categoryId);
  const updateData = {
    ...updates,
    updatedAt: serverTimestamp(),
    updatedBy: updates.updatedBy || 'admin',
  };

  try {
    await updateDoc(categoryRef, updateData);
    console.log('✅ Category updated:', categoryId);
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

/**
 * Delete a category from Firestore
 * @param {string} categoryId - Document ID
 * @returns {Promise<void>}
 */
export async function deleteCategory(categoryId) {
  const categoryRef = doc(db, 'categories', categoryId);

  try {
    await deleteDoc(categoryRef);
    console.log('✅ Category deleted:', categoryId);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time updates for categories
 * @param {Function} callback - Function to call with updated data
 * @returns {Function} Unsubscribe function
 */
export function subscribeToCategories(callback) {
  const q = query(categoriesCol, orderBy('order', 'asc'));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const categories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(categories);
    },
    (error) => {
      // If the error is due to missing index, try without ordering
      console.warn('Error with ordered query, falling back to unordered:', error);
      return onSnapshot(categoriesCol, (snapshot) => {
        const categories = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(categories);
      });
    }
  );
}
