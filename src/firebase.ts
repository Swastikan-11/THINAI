import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDpCyqemIV7cCNcDOSNZ_1LG7fJ8autCAc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "thinai-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "thinai-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "thinai-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "941533981140",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:941533981140:web:fba37ac1f3ce48bcebce41",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestoreDb = getFirestore(app);
export default app;