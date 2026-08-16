import { auth } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

export async function registerUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
}

export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
    window.location.href = '/index.html';
  } catch (error) {
    console.error("Logout error", error);
  }
}

export function observeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

// Helper to redirect based on auth status
export function requireAuth() {
  document.body.style.display = 'none';
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = '/index.html';
    } else {
      document.body.style.display = '';
    }
  });
}

export function requireUnauth() {
  document.body.style.display = 'none';
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.href = '/dashboard.html';
    } else {
      document.body.style.display = '';
    }
  });
}
