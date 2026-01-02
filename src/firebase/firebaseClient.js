// src/firebase/firebaseClient.js
// Firebase client (Firestore realtime helpers).
// This file uses the Firebase config you provided and exposes:
// - subscribeToGuides(callback)
// - saveGuide(guideKey, html)
// - subscribeToCategoryParams(callback)
// - saveCategoryParams(paramsObject)
//
// NOTE: You must have `npm install firebase` in the project.

import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

// --- Firebase config (provided) ---
const firebaseConfig = {
  apiKey: "AIzaSyCfHjqU1QWAw0hL1svi48lyrhInavmEFJQ",
  authDomain: "ridery-tool.firebaseapp.com",
  projectId: "ridery-tool",
  storageBucket: "ridery-tool.firebasestorage.app",
  messagingSenderId: "345023045578",
  appId: "1:345023045578:web:d5d13573a21274df12b933",
  measurementId: "G-KXXWZ0Y3QX"
};

// Initialize app (avoid re-init during HMR)
if (!getApps().length) {
  initializeApp(firebaseConfig);
  try { getAnalytics(); } catch (e) { /* analytics might fail in non-browser env */ }
}

const db = getFirestore();

// Collections / documents used
const GUIDES_COLLECTION = "cmc_guides";
const GUIDES_DOC_ID = "master_guides";

const CATEGORY_PARAMS_COLLECTION = "cmc_category_params";
const CATEGORY_PARAMS_DOC_ID = "master_params";

/**
 * subscribeToGuides(callback)
 * - callback receives an object map of guideKey -> { html } OR string html depending on your doc structure
 * - returns unsubscribe function
 */
export function subscribeToGuides(callback) {
  const docRef = doc(db, GUIDES_COLLECTION, GUIDES_DOC_ID);
  const unsub = onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        callback({});
        return;
      }
      const data = docSnap.data() || {};
      callback(data);
    },
    (err) => {
      console.error("subscribeToGuides onSnapshot error:", err);
      callback({});
    }
  );
  return unsub;
}

/**
 * saveGuide(guideKey, html)
 * - merges the field into master_guides doc
 */
export async function saveGuide(guideKey, html) {
  try {
    const docRef = doc(db, GUIDES_COLLECTION, GUIDES_DOC_ID);
    await setDoc(docRef, { [guideKey]: html, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.error("saveGuide error:", err);
    throw err;
  }
}

/**
 * subscribeToCategoryParams(callback)
 * - callback gets the doc data object (or {} if not exists)
 * - returns unsubscribe
 */
export function subscribeToCategoryParams(callback) {
  const docRef = doc(db, CATEGORY_PARAMS_COLLECTION, CATEGORY_PARAMS_DOC_ID);
  const unsub = onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        callback({});
        return;
      }
      const data = docSnap.data() || {};
      callback(data);
    },
    (err) => {
      console.error("subscribeToCategoryParams onSnapshot error:", err);
      callback({});
    }
  );
  return unsub;
}

/**
 * saveCategoryParams(paramsObject)
 * - saves/merges the full paramsObject into master_params
 */
export async function saveCategoryParams(paramsObject) {
  try {
    const docRef = doc(db, CATEGORY_PARAMS_COLLECTION, CATEGORY_PARAMS_DOC_ID);
    await setDoc(docRef, { ...paramsObject, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.error("saveCategoryParams error:", err);
    throw err;
  }
}