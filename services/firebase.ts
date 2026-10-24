import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ------------------------------------------------------------------
// INSTRUCTIONS FOR THE USER:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project.
// 3. Register a Web App in Project Settings.
// 4. Enable "Authentication" (Email/Password).
// 5. Enable "Firestore Database" (Start in Test Mode).
// 6. REPLACE THE OBJECT BELOW with your own firebaseConfig.
// ------------------------------------------------------------------

const firebaseConfig = {
  apiKey: "AIzaSyDFUFUgMBzL0sDB_aAZllozwx6dFFmGq6s",
  authDomain: "crypto-oracle-2.firebaseapp.com",
  databaseURL: "https://crypto-oracle-2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "crypto-oracle-2",
  storageBucket: "crypto-oracle-2.firebasestorage.app",
  messagingSenderId: "760437178242",
  appId: "1:760437178242:web:2584bc73bbc0395de8999b"
};

// Simple check to warn developer if they haven't set up keys
if (firebaseConfig.apiKey === "YOUR_API_KEY") {
    console.error("⚠️ FIREBASE NOT CONFIGURED: Please update services/firebase.ts with your actual Firebase project keys.");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth and Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);