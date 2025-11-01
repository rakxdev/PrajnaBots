/**
 * Authentication Core Module
 * Handles user authentication, session management, and auth state
 */

import { 
  auth, 
  database, 
  firestore 
} from '../config/firebase-config.js';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import {
  ref,
  set,
  get,
  update
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Auth state listeners
const authStateListeners = [];

/**
 * Register new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} displayName - User's display name
 * @param {Object} additionalData - Additional user data
 * @returns {Promise<Object>} User object
 */
export async function registerUser(email, password, displayName, additionalData = {}) {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with display name
    await updateProfile(user, {
      displayName: displayName
    });

    // Send email verification
    await sendEmailVerification(user);

    // Create user profile in Realtime Database
    const userRef = ref(database, `users/${user.uid}`);
    await set(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      role: 'user',
      emailVerified: false,
      createdAt: Date.now(),
      lastLogin: Date.now(),
      ...additionalData
    });

    // Create user document in Firestore
    const userDocRef = doc(firestore, 'users', user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      role: 'user',
      emailVerified: false,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      ...additionalData
    });

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        emailVerified: false
      },
      message: 'Registration successful! Please check your email for verification.'
    };

  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User object
 */
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update last login time
    await updateLastLogin(user.uid);

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      },
      message: 'Login successful!'
    };

  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

/**
 * Sign in with Google
 * @returns {Promise<Object>} User object
 */
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user profile exists
    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      // Create new user profile
      await set(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'user',
        emailVerified: true,
        provider: 'google',
        createdAt: Date.now(),
        lastLogin: Date.now()
      });

      // Create Firestore document
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'user',
        emailVerified: true,
        provider: 'google',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
    } else {
      // Update last login
      await updateLastLogin(user.uid);
    }

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: true
      },
      message: 'Google sign-in successful!'
    };

  } catch (error) {
    console.error('Google sign-in error:', error);
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

/**
 * Sign out current user
 * @returns {Promise<Object>} Success status
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    return {
      success: true,
      message: 'Logged out successfully!'
    };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      error: error.code,
      message: 'Failed to logout. Please try again.'
    };
  }
}

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<Object>} Success status
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: 'Password reset email sent! Check your inbox.'
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

/**
 * Get current authenticated user
 * @returns {Object|null} Current user or null
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export function isAuthenticated() {
  return auth.currentUser !== null;
}

/**
 * Get user profile data from database
 * @param {string} uid - User ID
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfile(uid) {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return {
        success: true,
        data: snapshot.val()
      };
    } else {
      return {
        success: false,
        message: 'User profile not found'
      };
    }
  } catch (error) {
    console.error('Get profile error:', error);
    return {
      success: false,
      error: error.code,
      message: 'Failed to fetch user profile'
    };
  }
}

/**
 * Update user profile
 * @param {string} uid - User ID
 * @param {Object} data - Profile data to update
 * @returns {Promise<Object>} Success status
 */
export async function updateUserProfile(uid, data) {
  try {
    // Update Realtime Database
    const userRef = ref(database, `users/${uid}`);
    await update(userRef, {
      ...data,
      updatedAt: Date.now()
    });

    // Update Firestore
    const userDocRef = doc(firestore, 'users', uid);
    await updateDoc(userDocRef, {
      ...data,
      updatedAt: serverTimestamp()
    });

    // Update Firebase Auth profile if displayName or photoURL changed
    if (data.displayName || data.photoURL) {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateProfile(currentUser, {
          displayName: data.displayName || currentUser.displayName,
          photoURL: data.photoURL || currentUser.photoURL
        });
      }
    }

    return {
      success: true,
      message: 'Profile updated successfully!'
    };
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      success: false,
      error: error.code,
      message: 'Failed to update profile'
    };
  }
}

/**
 * Update last login timestamp
 * @param {string} uid - User ID
 */
async function updateLastLogin(uid) {
  try {
    // Update Realtime Database
    const userRef = ref(database, `users/${uid}`);
    await update(userRef, {
      lastLogin: Date.now()
    });

    // Update Firestore
    const userDocRef = doc(firestore, 'users', uid);
    await updateDoc(userDocRef, {
      lastLogin: serverTimestamp()
    });
  } catch (error) {
    console.error('Update last login error:', error);
  }
}

/**
 * Listen to authentication state changes
 * @param {Function} callback - Callback function to execute on auth state change
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in
      const profile = await getUserProfile(user.uid);
      callback({
        authenticated: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified
        },
        profile: profile.success ? profile.data : null
      });
    } else {
      // User is signed out
      callback({
        authenticated: false,
        user: null,
        profile: null
      });
    }
  });

  authStateListeners.push(unsubscribe);
  return unsubscribe;
}

/**
 * Require authentication - redirect to login if not authenticated
 * @param {string} redirectUrl - URL to redirect to if not authenticated
 */
export function requireAuth(redirectUrl = '../auth/login.html') {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (!user) {
        // Save intended destination
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
        window.location.href = redirectUrl;
      }
      resolve(user);
    });
  });
}

/**
 * Redirect if already authenticated
 * @param {string} redirectUrl - URL to redirect to if authenticated
 */
export function redirectIfAuthenticated(redirectUrl = '../dashboard/overview.html') {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        window.location.href = redirectUrl;
      }
      resolve(user);
    });
  });
}

/**
 * Get user-friendly error message
 * @param {string} errorCode - Firebase error code
 * @returns {string} User-friendly error message
 */
function getErrorMessage(errorCode) {
  const errorMessages = {
    'auth/email-already-in-use': 'This email is already registered. Please login instead.',
    'auth/invalid-email': 'Invalid email address. Please check and try again.',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
    'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email. Please register first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
    'auth/cancelled-popup-request': 'Only one popup request is allowed at a time.',
    'auth/popup-blocked': 'Sign-in popup was blocked by browser. Please allow popups.'
  };

  return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
}

/**
 * Clean up all auth state listeners
 */
export function cleanupAuthListeners() {
  authStateListeners.forEach(unsubscribe => unsubscribe());
  authStateListeners.length = 0;
}

// Export auth instance for direct access if needed
export { auth };

console.log('Auth module loaded');
