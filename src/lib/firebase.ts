import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
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
  get
} from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyAWI-FKRzV8kZna2qEUUMX4ddiswGF_LWA",
  authDomain: "goat-smart-farm.firebaseapp.com",
  databaseURL: "https://goat-smart-farm-default-rtdb.firebaseio.com",
  projectId: "goat-smart-farm",
  storageBucket: "goat-smart-farm.firebasestorage.app",
  messagingSenderId: "308912834329",
  appId: "1:308912834329:web:b7b38370133b4fd346a788",
  measurementId: "G-SWG0F5HFJP"
};

// Initialize Firebase safely
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const rtdb = getDatabase(app, firebaseConfig.databaseURL);

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  ref,
  onValue,
  set,
  push,
  remove,
  get
};
export type { User };
