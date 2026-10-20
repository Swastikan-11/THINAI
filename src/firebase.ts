import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";

const getDynamicAuthDomain = (): string => {
  if (typeof window !== "undefined" && window.location) {
    const host = window.location.hostname;
    // Match serving host on web.app or firebaseapp.com to prevent cross-origin storage partitioning
    if (host.endsWith(".web.app") || host.endsWith(".firebaseapp.com")) {
      return host;
    }
  }
  return import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "thinai-app.firebaseapp.com";
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDpCyqemIV7cCNcDOSNZ_1LG7fJ8autCAc",
  authDomain: getDynamicAuthDomain(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "thinai-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "thinai-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "941533981140",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:941533981140:web:fba37ac1f3ce48bcebce41",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Enable Firestore persistent local disk cache for robust offline access
export const firestoreDb = (() => {
  try {
    if (typeof window !== "undefined") {
      return initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    }
  } catch (e) {
    // Graceful fallback if already initialized or in Node test runner
  }
  return getFirestore(app);
})();

export default app;