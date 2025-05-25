import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBu6YRzc_xWkcRDN99Bi1xyOZqxknnDeTk",
  authDomain: "fittrackworkout.firebaseapp.com",
  projectId: "fittrackworkout",
  storageBucket: "fittrackworkout.firebasestorage.app",
  messagingSenderId: "101821771325",
  appId: "1:101821771325:web:389f6e67173fbf1b564454",
  measurementId: "G-6GQ3C9J1J4",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence for Firestore (only in browser environment)
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn(
        "Multiple tabs open, persistence can only be enabled in one tab at a time."
      );
    } else if (err.code === "unimplemented") {
      console.warn("The current browser does not support persistence.");
    }
  });
}

export default app;
