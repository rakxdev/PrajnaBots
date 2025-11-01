/**
 * Supabase Authentication Module
 * Handles user authentication with Email/Password and Email/OTP
 */

import { supabase } from '../config/supabase-config.js';

/**
 * Register new user with email and send OTP
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} userData - Additional user data (fullName, phone, companyName)
 * @returns {Promise<Object>} Result object
 */
export async function registerWithEmailOTP(email, password, userData = {}) {
  try {
    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/verify-email.html`,
        data: {
          full_name: userData.fullName || '',
          phone: userData.phone || '',
          company_name: userData.companyName || ''
        }
      }
    });

    if (error) throw error;

    // OTP will be sent automatically by Supabase
    return {
      success: true,
      message: 'Registration successful! Please check your email for the verification code.',
      user: data.user,
      needsVerification: true
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error.message,
      message: getErrorMessage(error.message)
    };
  }
}

/**
 * Verify email with OTP code
 * @param {string} email - User email
 * @param {string} token - OTP token from email
 * @returns {Promise<Object>} Result object
 */
export async function verifyEmailOTP(email, token) {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    });

    if (error) throw error;

    return {
      success: true,
      message: 'Email verified successfully! You can now log in.',
      user: data.user,
      session: data.session
    };
  } catch (error) {
    console.error('Verification error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Invalid or expired verification code. Please try again.'
    };
  }
}

/**
 * Login with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Result object
 */
export async function loginWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    return {
      success: true,
      message: 'Login successful!',
      user: data.user,
      session: data.session
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message,
      message: getErrorMessage(error.message)
    };
  }
}

/**
 * Logout current user
 * @returns {Promise<Object>} Result object
 */
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    return {
      success: true,
      message: 'Logged out successfully!'
    };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to logout. Please try again.'
    };
  }
}

/**
 * Get current user
 * @returns {Promise<Object>} Current user object or null
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

/**
 * Get current session
 * @returns {Promise<Object>} Current session or null
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * Get user profile from database
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Get profile error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updates - Profile updates
 * @returns {Promise<Object>} Result object
 */
export async function updateUserProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      message: 'Profile updated successfully!',
      data
    };
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to update profile.'
    };
  }
}

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<Object>} Result object
 */
export async function resetPassword(email) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password.html`
    });

    if (error) throw error;

    return {
      success: true,
      message: 'Password reset email sent! Check your inbox.'
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send password reset email.'
    };
  }
}

/**
 * Listen to authentication state changes
 * @param {Function} callback - Callback function
 * @returns {Object} Subscription object with unsubscribe method
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback({
      event,
      session,
      user: session?.user || null
    });
  });
}

/**
 * Require authentication - redirect if not logged in
 * @param {string} redirectUrl - URL to redirect to if not authenticated
 */
export async function requireAuth(redirectUrl = '../auth/login.html') {
  const session = await getSession();
  if (!session) {
    sessionStorage.setItem('redirectAfterLogin', window.location.href);
    window.location.href = redirectUrl;
    return false;
  }
  return true;
}

/**
 * Redirect if already authenticated
 * @param {string} redirectUrl - URL to redirect to if authenticated
 */
export async function redirectIfAuthenticated(redirectUrl = '../dashboard/index.html') {
  const session = await getSession();
  if (session) {
    window.location.href = redirectUrl;
    return true;
  }
  return false;
}

/**
 * Get user-friendly error message
 * @param {string} errorMessage - Error message from Supabase
 * @returns {string} User-friendly error message
 */
function getErrorMessage(errorMessage) {
  if (!errorMessage) return 'An unexpected error occurred.';
  
  const errorLower = errorMessage.toLowerCase();
  
  if (errorLower.includes('invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  if (errorLower.includes('email not confirmed')) {
    return 'Please verify your email before logging in.';
  }
  if (errorLower.includes('user already registered')) {
    return 'This email is already registered. Please log in instead.';
  }
  if (errorLower.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  if (errorLower.includes('password')) {
    return 'Password must be at least 6 characters long.';
  }
  
  return errorMessage;
}

export { supabase };
