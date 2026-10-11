import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import { Transaction, CategoryItem, SchoolConfig, FamilyConfig, AppMode } from '../types/finance';

/**
 * Service to manage Firestore real-time synchronization for the authenticated user.
 */

/**
 * Recursively removes keys with `undefined` values from objects or arrays.
 * Firestore strictly forbids `undefined` field values in document writes
 * and throws "Function WriteBatch.set() called with invalid data. Unsupported field value: undefined".
 */
export function cleanDataForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanDataForFirestore(item)) as any;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanDataForFirestore(value);
      }
    }
    return cleaned as any;
  }
  return data;
}

// User profile & sync settings
export async function syncUserProfile(
  userId: string,
  profile: { email: string; displayName?: string | null; photoURL?: string | null; activeMode?: AppMode }
) {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      cleanDataForFirestore({
        userId,
        email: profile.email,
        displayName: profile.displayName || '',
        photoURL: profile.photoURL || '',
        activeMode: profile.activeMode || 'business',
        updatedAt: Date.now(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ---------------- TRANSACTIONS ----------------
export function subscribeUserTransactions(
  userId: string,
  onUpdate: (transactions: (Transaction & { mode?: AppMode })[]) => void,
  onError?: (error: Error) => void
) {
  const path = `users/${userId}/transactions`;
  const q = query(collection(db, 'users', userId, 'transactions'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: (Transaction & { mode?: AppMode })[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const tx: Transaction & { mode?: AppMode } = {
          id: data.id || docSnap.id,
          date: data.date,
          month: data.month,
          type: data.type,
          categoryId: data.categoryId,
          categoryName: data.categoryName,
          amount: Number(data.amount) || 0,
          note: data.note || '',
          payerOrReceiver: data.payerOrReceiver || '',
          paymentMethod: data.paymentMethod || 'tien_mat',
          referenceCode: data.referenceCode || '',
          createdAt: data.createdAt || Date.now(),
          mode: data.mode || (docSnap.id.includes('home') ? 'home' : 'business'),
        };
        list.push(tx);
      });
      onUpdate(list);
    },
    (err) => {
      if (onError) {
        onError(err);
      }
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

export async function saveUserTransactionToFirestore(userId: string, tx: Transaction, mode: AppMode) {
  const path = `users/${userId}/transactions/${tx.id}`;
  try {
    const txRef = doc(db, 'users', userId, 'transactions', tx.id);
    await setDoc(txRef, cleanDataForFirestore({
      ...tx,
      userId,
      mode,
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserTransactionFromFirestore(userId: string, transactionId: string) {
  const path = `users/${userId}/transactions/${transactionId}`;
  try {
    const txRef = doc(db, 'users', userId, 'transactions', transactionId);
    await deleteDoc(txRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- CATEGORIES ----------------
export function subscribeUserCategories(
  userId: string,
  onUpdate: (categories: (CategoryItem & { mode?: AppMode })[]) => void,
  onError?: (error: Error) => void
) {
  const path = `users/${userId}/categories`;
  const q = query(collection(db, 'users', userId, 'categories'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: (CategoryItem & { mode?: AppMode })[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const item: CategoryItem & { mode?: AppMode } = {
          id: data.id || docSnap.id,
          name: data.name,
          type: data.type,
          group: data.group || '',
          description: data.description || '',
          mode: data.mode || 'business',
        };
        if (typeof data.monthlyBudget === 'number') {
          item.monthlyBudget = data.monthlyBudget;
        }
        list.push(item);
      });
      onUpdate(list);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

export async function saveUserCategoryToFirestore(userId: string, category: CategoryItem, mode: AppMode) {
  const path = `users/${userId}/categories/${category.id}`;
  try {
    const catRef = doc(db, 'users', userId, 'categories', category.id);
    await setDoc(catRef, cleanDataForFirestore({
      ...category,
      userId,
      mode,
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserCategoryFromFirestore(userId: string, categoryId: string) {
  const path = `users/${userId}/categories/${categoryId}`;
  try {
    const catRef = doc(db, 'users', userId, 'categories', categoryId);
    await deleteDoc(catRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- CONFIG / SETTINGS ----------------
export function subscribeUserSettings(
  userId: string,
  onUpdate: (data: { schoolConfig?: SchoolConfig; familyConfig?: FamilyConfig; activeMode?: AppMode }) => void,
  onError?: (error: Error) => void
) {
  const path = `users/${userId}/settings/current`;
  const settingsRef = doc(db, 'users', userId, 'settings', 'current');

  return onSnapshot(
    settingsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate({
          schoolConfig: data.schoolConfig,
          familyConfig: data.familyConfig,
          activeMode: data.activeMode,
        });
      }
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

export async function saveUserSettingsToFirestore(
  userId: string,
  settings: { schoolConfig?: SchoolConfig; familyConfig?: FamilyConfig; activeMode?: AppMode }
) {
  const path = `users/${userId}/settings/current`;
  try {
    const settingsRef = doc(db, 'users', userId, 'settings', 'current');
    await setDoc(
      settingsRef,
      cleanDataForFirestore({
        userId,
        ...settings,
        updatedAt: Date.now(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ---------------- BULK SYNC / INITIAL UPLOAD ----------------
/**
 * Upload local data to Firestore if user's cloud database is empty,
 * ensuring all undefined fields are omitted so Firestore accepts batch writes.
 */
export async function initializeUserCloudDataIfEmpty(
  userId: string,
  localData: {
    transactions: Transaction[];
    homeTransactions: Transaction[];
    categories: CategoryItem[];
    homeCategories: CategoryItem[];
    schoolConfig: SchoolConfig;
    familyConfig: FamilyConfig;
    activeMode: AppMode;
  }
) {
  const path = `users/${userId}/transactions`;
  try {
    // Check if transactions exist
    const snap = await getDocs(collection(db, 'users', userId, 'transactions'));
    if (snap.empty) {
      let batch = writeBatch(db);
      let opsCount = 0;

      const commitIfNeeded = async () => {
        if (opsCount >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          opsCount = 0;
        }
      };

      // Business transactions
      for (const tx of localData.transactions) {
        const txRef = doc(db, 'users', userId, 'transactions', tx.id);
        batch.set(txRef, cleanDataForFirestore({ ...tx, userId, mode: 'business' }));
        opsCount++;
        await commitIfNeeded();
      }

      // Home transactions
      for (const tx of localData.homeTransactions) {
        const txRef = doc(db, 'users', userId, 'transactions', tx.id);
        batch.set(txRef, cleanDataForFirestore({ ...tx, userId, mode: 'home' }));
        opsCount++;
        await commitIfNeeded();
      }

      // Business categories
      for (const cat of localData.categories) {
        const catRef = doc(db, 'users', userId, 'categories', cat.id);
        batch.set(catRef, cleanDataForFirestore({ ...cat, userId, mode: 'business' }));
        opsCount++;
        await commitIfNeeded();
      }

      // Home categories
      for (const cat of localData.homeCategories) {
        const catRef = doc(db, 'users', userId, 'categories', cat.id);
        batch.set(catRef, cleanDataForFirestore({ ...cat, userId, mode: 'home' }));
        opsCount++;
        await commitIfNeeded();
      }

      // Settings
      const settingsRef = doc(db, 'users', userId, 'settings', 'current');
      batch.set(
        settingsRef,
        cleanDataForFirestore({
          userId,
          schoolConfig: localData.schoolConfig,
          familyConfig: localData.familyConfig,
          activeMode: localData.activeMode,
          updatedAt: Date.now(),
        })
      );
      opsCount++;

      if (opsCount > 0) {
        await batch.commit();
      }
      return true;
    }
    return false;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
