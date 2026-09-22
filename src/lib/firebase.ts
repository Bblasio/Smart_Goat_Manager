import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  onValue,
  set,
  push,
  remove,
  get,
  update
} from 'firebase/database';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAWI-FKRzV8kZna2qEUUMX4ddiswGF_LWA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "goat-smart-farm.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://goat-smart-farm-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "goat-smart-farm",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "goat-smart-farm.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "308912834329",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:308912834329:web:b7b38370133b4fd346a788",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-SWG0F5HFJP"
};

// Initialize Firebase safely
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const rtdb = getDatabase(app, firebaseConfig.databaseURL);

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updateProfile,
  ref,
  onValue,
  set,
  push,
  remove,
  get,
  update
};
export type { User };
