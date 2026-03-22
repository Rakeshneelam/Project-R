import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBm9-ZdGFS5UajRXo-JO22VYuwzNFhG7_k",
  authDomain: "project-7bbe0.firebaseapp.com",
  projectId: "project-7bbe0",
  storageBucket: "project-7bbe0.firebasestorage.app",
  messagingSenderId: "399636578829",
  appId: "1:399636578829:web:3f6f88d413d13543b2cb44",
  measurementId: "G-6LH8Q8Q72H"
};

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
