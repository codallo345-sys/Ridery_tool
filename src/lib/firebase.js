// Firebase initialization and Firestore setup (forzado con fallback)
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection } from 'firebase/firestore';

// Fallback con las claves que compartiste
const FALLBACK_CONFIG = {
  apiKey: 'AIzaSyA1oXl497eFD43igwbNN69N2hYHX7zaBn0',
  authDomain: 'ridery-base-de-datos.firebaseapp.com',
  projectId: 'ridery-base-de-datos',
  // Usa el bucket que muestra tu consola: firebasestorage.app
  storageBucket: 'ridery-base-de-datos.firebasestorage.app',
  messagingSenderId: '134752220448',
  appId: '1:134752220448:web:ceb9e557ff1622c4f75345',
};

// Helper: obtiene variables de entorno (Vite), window o process
const getEnvVar = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env[key];
  if (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__) return window.__FIREBASE_CONFIG__[key];
  if (typeof process !== 'undefined' && process.env) return process.env[key];
  return undefined;
};

// Construye config usando env primero y fallback después
const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY') || FALLBACK_CONFIG.apiKey,
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN') || FALLBACK_CONFIG.authDomain,
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID') || FALLBACK_CONFIG.projectId,
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET') || FALLBACK_CONFIG.storageBucket,
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID') || FALLBACK_CONFIG.messagingSenderId,
  appId: getEnvVar('VITE_FIREBASE_APP_ID') || FALLBACK_CONFIG.appId,
};

// Inicializa siempre (sin cortar por guardas)
let app = null;
let db = null;
let guiasCol = null;
let formulasCol = null;
let categoriesCol = null;

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  guiasCol = collection(db, 'guias');
  formulasCol = collection(db, 'formulas');
  categoriesCol = collection(db, 'categories');
  console.log('✅ Firebase initialized (forced)', { projectId: firebaseConfig.projectId });
} catch (error) {
  console.error('❌ Firebase initialization error:', error, firebaseConfig);
}

export { app, db, guiasCol, formulasCol, categoriesCol };