import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase application singleton (prevents duplicate app initialization in Next.js)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export async function registerWithEmailPassword(name: string, email: string, pass: string) {
  // Let Firebase Auth errors propagate — auth-context will handle user-facing messages
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (name.trim()) {
    await updateProfile(cred.user, { displayName: name.trim() });
  }
  return {
    user: {
      uid: cred.user.uid,
      name: name.trim() || cred.user.displayName || email.split("@")[0],
      email: cred.user.email || email,
    },
  };
}

export async function loginWithEmailPassword(email: string, pass: string) {
  // Let Firebase Auth errors propagate — auth-context will handle user-facing messages
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return {
    user: {
      uid: cred.user.uid,
      name: cred.user.displayName || email.split("@")[0],
      email: cred.user.email || email,
    },
  };
}

export async function logoutFromFirebase() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Firebase signOut error:", error);
  }
}

export { app, db, auth };
