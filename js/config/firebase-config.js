// Firebase SDK v10+ modular imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getFunctions } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';

// Your Firebase configuration - URZA Solar Management
// Project ID: urza-web-application
// Created: October 31, 2025
const firebaseConfig = {
  apiKey: "AIzaSyDgn7L1Sx00MN6Bnv3_eC18be9FdhhM3L0",
  authDomain: "urza-web-application.firebaseapp.com",
  databaseURL: "https://urza-web-application-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "urza-web-application",
  storageBucket: "urza-web-application.firebasestorage.app",
  messagingSenderId: "771801918737",
  appId: "1:771801918737:web:d247ffdc87e65e1995b0b0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const database = getDatabase(app);
const firestore = getFirestore(app);
const functions = getFunctions(app);

// Export for use in other modules
export { app, auth, database, firestore, functions };

// Log initialization (for development only)
console.log('Firebase initialized:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});
