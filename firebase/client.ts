import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDCTn62b4tnERyoLKQsok-0uEDJNrwJkgY",
  authDomain: "preppyai.firebaseapp.com",
  projectId: "preppyai",
  storageBucket: "preppyai.firebasestorage.app",
  messagingSenderId: "620654097057",
  appId: "1:620654097057:web:3faa5699fd3639caaef6e0",
  measurementId: "G-VRL0VNR05P"
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);