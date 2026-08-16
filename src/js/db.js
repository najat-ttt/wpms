import { auth, db } from './firebase-config.js';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, onSnapshot, query, orderBy, deleteDoc, serverTimestamp } from 'firebase/firestore';

// Handle missing permissions centrally
function handleFirestoreError(error, context) {
  console.error(`Firestore Error (${context}):`, error);
  // Re-throw or handle as needed
  throw error;
}

// User Profile
export async function createUserProfile(userId, email, name) {
  try {
    await setDoc(doc(db, 'users', userId), {
      email,
      name,
      createdAt: serverTimestamp()
    });
  } catch (e) {
    handleFirestoreError(e, 'createUserProfile');
  }
}

export async function getUserProfile(userId) {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (e) {
    handleFirestoreError(e, 'getUserProfile');
  }
}

// Wedding Profile
export async function getWeddingProfile(userId) {
  try {
    const docRef = doc(db, `users/${userId}/wedding/profile`);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (e) {
    handleFirestoreError(e, 'getWeddingProfile');
  }
}

export async function saveWeddingProfile(userId, data) {
  try {
    const docRef = doc(db, `users/${userId}/wedding/profile`);
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, 'saveWeddingProfile');
  }
}

// Tasks
export function subscribeToTasks(userId, callback) {
  const q = query(collection(db, `users/${userId}/tasks`), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const tasks = [];
    snapshot.forEach((doc) => tasks.push({ id: doc.id, ...doc.data() }));
    callback(tasks);
  }, (error) => {
    handleFirestoreError(error, 'subscribeToTasks');
  });
}

export async function addTask(userId, taskData) {
  try {
    await addDoc(collection(db, `users/${userId}/tasks`), {
      ...taskData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    handleFirestoreError(e, 'addTask');
  }
}

export async function updateTask(userId, taskId, data) {
  try {
    const docRef = doc(db, `users/${userId}/tasks/${taskId}`);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    handleFirestoreError(e, 'updateTask');
  }
}

export async function deleteTask(userId, taskId) {
  try {
    await deleteDoc(doc(db, `users/${userId}/tasks/${taskId}`));
  } catch (e) {
    handleFirestoreError(e, 'deleteTask');
  }
}

// Vendors
export function subscribeToVendors(userId, callback) {
  const q = query(collection(db, `users/${userId}/vendors`), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const vendors = [];
    snapshot.forEach((doc) => vendors.push({ id: doc.id, ...doc.data() }));
    callback(vendors);
  }, (error) => {
    handleFirestoreError(error, 'subscribeToVendors');
  });
}

export async function addVendor(userId, vendorData) {
  try {
    await addDoc(collection(db, `users/${userId}/vendors`), {
      ...vendorData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    handleFirestoreError(e, 'addVendor');
  }
}

export async function updateVendor(userId, vendorId, data) {
  try {
    const docRef = doc(db, `users/${userId}/vendors/${vendorId}`);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    handleFirestoreError(e, 'updateVendor');
  }
}

export async function deleteVendor(userId, vendorId) {
  try {
    await deleteDoc(doc(db, `users/${userId}/vendors/${vendorId}`));
  } catch (e) {
    handleFirestoreError(e, 'deleteVendor');
  }
}
