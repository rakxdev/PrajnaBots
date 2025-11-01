/**
 * Database Core Module
 * Handles all database operations for Realtime Database and Firestore
 */

import { database, firestore } from '../config/firebase-config.js';

import {
  ref,
  set,
  get,
  update,
  remove,
  push,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  onValue,
  off
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query as firestoreQuery,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ==================== REALTIME DATABASE OPERATIONS ====================

/**
 * Create or set data at a path
 * @param {string} path - Database path
 * @param {*} data - Data to set
 * @returns {Promise<Object>} Success status
 */
export async function setData(path, data) {
  try {
    const dbRef = ref(database, path);
    await set(dbRef, data);
    return {
      success: true,
      message: 'Data saved successfully'
    };
  } catch (error) {
    console.error('Set data error:', error);
    return {
      success: false,
      error: error.code,
      message: 'Failed to save data'
    };
  }
}

/**
 * Get data from a path
 * @param {string} path - Database path
 * @returns {Promise<Object>} Data object
 */
export async function getData(path) {
  try {
    const dbRef = ref(database, path);
    const snapshot = await get(dbRef);
    
    if (snapshot.exists()) {
      return {
        success: true,
        data: snapshot.val()
      };
    } else {
      return {
        success: false,
        message: 'No data found at this path'
      };
    }
  } catch (error) {
    console.error('Get data error:', error);
    return {
      success: false,
      error: error.code,
      message: 'Failed to fetch data'
    };
  }
}

/**
 * Update data at a path
 * @param {string} path - Database path
 * @param {Object} updates - Data to update
 * @returns {Promise<Object>} Success status
 */
export async function updateData(path, updates) {
  try {
    const dbRef = ref(database, path);
    await update(dbRef, updates);
    return {
      success: true,
      message: 'Data updated successfully'
    };
  } catch (error) {
    console.error('Update data error:', error);
    return {
      success: false,
      error: error.code,
      message: 'Failed to update data'
    };
  }
}

/**
 * Delete data at a path
 * @param {string} path - Database path
 * @returns {Promise<Object>} Success status
 */
export async function deleteData(path) {
  try {
    const dbRef = ref(database, path);
    await remove(dbRef);
    return {
      success: true,
      message: 'Data deleted successfully'
    };
  } catch (error) {
    console.error('Delete data error:', error);
    return {
      success: false,
      error: error.code,
      message: 'Failed to delete data'
    };
  }
}

/**
 * Push new data to a list (auto-generates key)
 * @param {string} path - Database path
 * @param {*} data - Data to push
 * @returns {Promise<Object>} Success status with key
 */
export async function pushData(path, data) {
  try {
    const dbRef = ref(database, path);
    const newRef = push(dbRef);
    await set(newRef, data);
    return {
      success: true,
      key: newRef.key,
      message: 'Data added successfully'
    };
  } catch (error) {
    console.error('Push data error:', error);
    return {
      success: false,
      error: error.code,
      message: 'Failed to add data'
    };
  }
}

/**
 * Query data with filters
 * @param {string} path - Database path
 * @param {string} orderByField - Field to order by
 * @param {*} equalToValue - Value to filter by
 * @param {number} limitCount - Limit number of results
 * @returns {Promise<Object>} Query results
 */
export async function queryData(path, orderByField, equalToValue = null, limitCount = null) {
  try {
    let dbRef = ref(database, path);
    let dbQuery = query(dbRef, orderByChild(orderByField));
    
    if (equalToValue !== null) {
      dbQuery = query(dbRef, orderByChild(orderByField), equalTo(equalToValue));
    }
    
    if (limitCount) {
      dbQuery = query(dbRef, orderByChild(orderByField), limitToLast(limitCount));
    }
    
    const snapshot = await get(dbQuery);
    
    if (snapshot.exists()) {
      return {
        success: true,
        data: snapshot.val()
      };
    } else {
      return {
        success: false,
        message: 'No data found'
      };
    }
  } catch (error) {
    console.error('Query data error:', error);
    return {
      success: false,
      error: error.code,
      message: 'Failed to query data'
    };
  }
}

/**
 * Listen to real-time changes at a path
 * @param {string} path - Database path
 * @param {Function} callback - Callback function for data changes
 * @returns {Function} Unsubscribe function
 */
export function listenToData(path, callback) {
  const dbRef = ref(database, path);
  const unsubscribe = onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({
        success: true,
        data: snapshot.val()
      });
    } else {
      callback({
        success: false,
        message: 'No data found'
      });
    }
  }, (error) => {
    console.error('Listen error:', error);
    callback({
      success: false,
      error: error.code,
      message: 'Failed to listen to data'
    });
  });
  
  return () => off(dbRef);
}

// ==================== FIRESTORE OPERATIONS ====================

/**
 * Create or set document in Firestore
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @param {Object} data - Document data
 * @returns {Promise<Object>} Success status
 */
export async function setDocument(collectionName, docId, data) {
  try {
    const docRef = doc(firestore, collectionName, docId);
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return {
      success: true,
      message: 'Document saved successfully'
    };
  } catch (error) {
    console.error('Set document error:', error);
    return {
      success: false,
      error: error.code,
      message: 'Failed to save document'
    };
  }
}

/**
 * Get document from Firestore
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise<Object>} Document data
 */
export async function getDocument(collectionName, docId) {
  try {
    const docRef = doc(firestore, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        success: true,
        data: { id: docSnap.id, ...docSnap.data() }
      };
    } else {
      return {
        success: false,
        message: 'Document not found'
      };
    }
  } catch (error) {
    console.error('Get document error:', error);
    return {
      success: false,
      error: error.code,
      message: 'Failed to fetch document'
    };
  }
}

/**
 * Update document in Firestore
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @param {Object} updates - Data to update
 * @returns {Promise<Object>} Success status
 */
export async function updateDocument(collectionName, docId, updates) {
  try {
    const docRef = doc(firestore, collectionName, docId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return {
      success: true,
      message: 'Document updated successfully'
    };
  } catch (error) {
    console.error('Update document error:', error);
    return {
      success: false,
      error: error.code,
      message: 'Failed to update document'
    };
  }
}

/**
 * Delete document from Firestore
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise<Object>} Success status
 */
export async function deleteDocument(collectionName, docId) {
  try {
    const docRef = doc(firestore, collectionName, docId);
    await deleteDoc(docRef);
    return {
      success: true,
      message: 'Document deleted successfully'
    };
  } catch (error) {
    console.error('Delete document error:', error);
    return {
      success: false,
      error: error.code,
      message: 'Failed to delete document'
    };
  }
}

/**
 * Get all documents from a collection
 * @param {string} collectionName - Collection name
 * @returns {Promise<Object>} Collection data
 */
export async function getCollection(collectionName) {
  try {
    const colRef = collection(firestore, collectionName);
    const snapshot = await getDocs(colRef);
    
    const data = [];
    snapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });
    
    return {
      success: true,
      data: data,
      count: data.length
    };
  } catch (error) {
    console.error('Get collection error:', error);
    return {
      success: false,
      error: error.code,
      message: 'Failed to fetch collection'
    };
  }
}

/**
 * Query Firestore collection
 * @param {string} collectionName - Collection name
 * @param {Array} conditions - Array of where conditions: [['field', '==', 'value']]
 * @param {string} orderByField - Field to order by
 * @param {number} limitCount - Limit number of results
 * @returns {Promise<Object>} Query results
 */
export async function queryCollection(collectionName, conditions = [], orderByField = null, limitCount = null) {
  try {
    let colRef = collection(firestore, collectionName);
    let constraints = [];
    
    // Add where conditions
    conditions.forEach(([field, operator, value]) => {
      constraints.push(where(field, operator, value));
    });
    
    // Add order by
    if (orderByField) {
      constraints.push(orderBy(orderByField));
    }
    
    // Add limit
    if (limitCount) {
      constraints.push(limit(limitCount));
    }
    
    const q = firestoreQuery(colRef, ...constraints);
    const snapshot = await getDocs(q);
    
    const data = [];
    snapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });
    
    return {
      success: true,
      data: data,
      count: data.length
    };
  } catch (error) {
    console.error('Query collection error:', error);
    return {
      success: false,
      error: error.code,
      message: 'Failed to query collection'
    };
  }
}

/**
 * Listen to real-time changes in a document
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @param {Function} callback - Callback function for data changes
 * @returns {Function} Unsubscribe function
 */
export function listenToDocument(collectionName, docId, callback) {
  const docRef = doc(firestore, collectionName, docId);
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({
        success: true,
        data: { id: docSnap.id, ...docSnap.data() }
      });
    } else {
      callback({
        success: false,
        message: 'Document not found'
      });
    }
  }, (error) => {
    console.error('Listen to document error:', error);
    callback({
      success: false,
      error: error.code,
      message: 'Failed to listen to document'
    });
  });
  
  return unsubscribe;
}

/**
 * Listen to real-time changes in a collection
 * @param {string} collectionName - Collection name
 * @param {Function} callback - Callback function for data changes
 * @returns {Function} Unsubscribe function
 */
export function listenToCollection(collectionName, callback) {
  const colRef = collection(firestore, collectionName);
  const unsubscribe = onSnapshot(colRef, (snapshot) => {
    const data = [];
    snapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });
    callback({
      success: true,
      data: data,
      count: data.length
    });
  }, (error) => {
    console.error('Listen to collection error:', error);
    callback({
      success: false,
      error: error.code,
      message: 'Failed to listen to collection'
    });
  });
  
  return unsubscribe;
}

// Export database instances
export { database, firestore };

console.log('Database module loaded');
