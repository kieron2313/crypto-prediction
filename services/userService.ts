import { User, AdSpaceConfig, Notification } from '../types';
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, setDoc, getDoc, updateDoc, onSnapshot, 
  collection, getDocs, deleteDoc, addDoc, query, orderBy, limit, where 
} from 'firebase/firestore';

// Helper to map Firestore data to our User type
const mapDocToUser = (data: any, email: string, uid: string): User => {
  const isSuperAdmin = email === 'wdsolutionnet@gmail.com';
  return {
    uid: uid,
    email: email,
    name: data.name || 'User',
    balance: typeof data.balance === 'number' ? data.balance : 0,
    portfolio: data.portfolio || [],
    watchlist: data.watchlist || [],
    transactions: data.transactions || [],
    // User is admin if hardcoded super-admin OR if db says so
    isAdmin: isSuperAdmin || !!data.isAdmin,
    lastReadNotifyTime: data.lastReadNotifyTime || 0
  };
};

export const userService = {

  // Register new user
  async register(email: string, password: string, name: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      const newUser: User = {
        uid: fbUser.uid,
        email: email,
        name: name,
        balance: 10000, // Starting balance
        portfolio: [],
        watchlist: [],
        transactions: [],
        isAdmin: email === 'wdsolutionnet@gmail.com',
        lastReadNotifyTime: Date.now()
      };

      try {
        await setDoc(doc(db, "users", fbUser.uid), {
            name: newUser.name,
            balance: newUser.balance,
            portfolio: newUser.portfolio,
            watchlist: newUser.watchlist,
            transactions: newUser.transactions,
            isAdmin: newUser.isAdmin,
            lastReadNotifyTime: newUser.lastReadNotifyTime,
            email: newUser.email // Save email for admin visibility
        }, { merge: true });
      } catch (dbError) {
          console.error("Firestore DB Error during Register:", dbError);
      }

      return newUser;
    } catch (error: any) {
      console.error("Firebase Register Error:", error);
      throw error;
    }
  },

  // Login existing user
  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      const docRef = doc(db, "users", fbUser.uid);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return mapDocToUser(docSnap.data(), email, fbUser.uid);
        } else {
            const defaultUser = {
                name: email.split('@')[0],
                balance: 10000,
                portfolio: [],
                watchlist: [],
                transactions: [],
                isAdmin: email === 'wdsolutionnet@gmail.com',
                lastReadNotifyTime: Date.now(),
                email: email
            };
            await setDoc(docRef, defaultUser).catch(e => console.warn("Failed to create user doc", e));
            return { uid: fbUser.uid, email, ...defaultUser };
        }
      } catch (dbError) {
          console.error("DB Connection Failed during Login:", dbError);
          return {
             uid: fbUser.uid,
             email: email,
             name: fbUser.displayName || 'User (Offline)',
             balance: 0,
             portfolio: [],
             watchlist: [],
             transactions: [],
             isAdmin: email === 'wdsolutionnet@gmail.com'
          };
      }
    } catch (error: any) {
      console.error("Firebase Login Error:", error);
      throw error;
    }
  },

  // Logout
  async logout(): Promise<void> {
    await signOut(auth);
  },

  // Update user data
  async updateUser(user: User): Promise<void> {
    try {
      if (!user.uid) return;
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, {
        name: user.name,
        balance: user.balance,
        portfolio: user.portfolio,
        watchlist: user.watchlist,
        transactions: user.transactions,
        lastReadNotifyTime: user.lastReadNotifyTime,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      console.error("Update User Error:", error);
    }
  },

  // Observe Session
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const docRef = doc(db, "users", fbUser.uid);
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                callback(mapDocToUser(docSnap.data(), fbUser.email || '', fbUser.uid));
            } else {
                callback({
                    uid: fbUser.uid,
                    email: fbUser.email || '',
                    name: fbUser.displayName || 'User',
                    balance: 0,
                    portfolio: [],
                    watchlist: [],
                    transactions: [],
                    isAdmin: fbUser.email === 'wdsolutionnet@gmail.com'
                });
            }
        } catch (e) {
            console.error("Error fetching user profile:", e);
            callback({
                uid: fbUser.uid,
                email: fbUser.email || '',
                name: fbUser.displayName || 'User (DB Unavailable)',
                balance: 0,
                portfolio: [],
                watchlist: [],
                transactions: [],
                isAdmin: fbUser.email === 'wdsolutionnet@gmail.com'
            });
        }
      } else {
        callback(null);
      }
    });
  },

  // --- ADMIN FUNCTIONS ---

  // Get All Users (Real Data)
  async getAllUsers(): Promise<User[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      return querySnapshot.docs.map(docData => {
         const data = docData.data();
         // Use the email stored in the document if available, otherwise placeholder
         const email = data.email || 'Hidden';
         return mapDocToUser(data, email, docData.id);
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },

  // Delete User (Delete Profile Document)
  async deleteUser(uid: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "users", uid));
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  // --- NOTIFICATION SYSTEM ---

  async sendNotification(type: 'BROADCAST' | 'SIGNAL', title: string, message: string) {
      try {
          await addDoc(collection(db, 'notifications'), {
              type,
              title,
              message,
              timestamp: Date.now()
          });
      } catch (e) {
          console.error("Failed to send notification", e);
      }
  },

  subscribeToNotifications(callback: (notifs: Notification[]) => void) {
      // Get notifications from last 7 days
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const q = query(
          collection(db, 'notifications'), 
          where('timestamp', '>', sevenDaysAgo),
          orderBy('timestamp', 'desc')
      );
      
      return onSnapshot(q, (snapshot) => {
          const notifications = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
          })) as Notification[];
          callback(notifications);
      });
  },

  async getUserCount(): Promise<number> {
      try {
          // getCountFromServer is cleaner but requires firebase/firestore-lite or specific import
          // For compat with standard SDK, fetching minimal collection is okay for small scale
          // OR better: use snapshot size
          const coll = collection(db, "users");
          const snap = await getDocs(coll);
          return snap.size;
      } catch (e) {
          return 0;
      }
  }
};

// --- SYSTEM SERVICES (ADS & HISTORY) ---

const DEFAULT_SPACES: AdSpaceConfig[] = [
    { id: 'scanner_feed', name: 'Scanner Feed (Top)', type: 'DEFAULT', active: true, impressions: 0 },
    { id: 'signals_top', name: 'Signals Page', type: 'DEFAULT', active: true, impressions: 0 },
    { id: 'portfolio_main', name: 'Portfolio Footer', type: 'DEFAULT', active: true, impressions: 0 },
    { id: 'gem_hunter_top', name: 'Gem Hunter Header', type: 'DEFAULT', active: true, impressions: 0 },
];

export const systemService = {
    subscribeToAds(callback: (ads: AdSpaceConfig[]) => void) {
        return onSnapshot(doc(db, 'system', 'ads'), 
            (docSnap) => {
                if (docSnap.exists()) {
                    callback(docSnap.data().spaces || DEFAULT_SPACES);
                } else {
                    setDoc(doc(db, 'system', 'ads'), { spaces: DEFAULT_SPACES }).catch(() => {});
                    callback(DEFAULT_SPACES);
                }
            }, 
            (error) => callback(DEFAULT_SPACES)
        );
    },

    async saveAdSpaces(spaces: AdSpaceConfig[]) {
        try {
            await setDoc(doc(db, 'system', 'ads'), { spaces }, { merge: true });
        } catch (e) { console.error("Failed to save ads", e); }
    },

    async recordImpression(slotId: string, currentSpaces: AdSpaceConfig[]) {
        const index = currentSpaces.findIndex(s => s.id === slotId);
        if (index === -1) return;
        
        const updatedSpaces = [...currentSpaces];
        updatedSpaces[index] = {
            ...updatedSpaces[index],
            impressions: (updatedSpaces[index].impressions || 0) + 1
        };
        await this.saveAdSpaces(updatedSpaces);
    },

    async getAnalysisHistory(): Promise<any[]> {
        try {
            const snap = await getDoc(doc(db, 'system', 'analysis'));
            return snap.exists() ? (snap.data().history || []) : [];
        } catch (e) { return []; }
    },

    async saveAnalysisHistory(history: any[]) {
        try {
            await setDoc(doc(db, 'system', 'analysis'), { history }, { merge: true });
        } catch (e) { console.error("Failed to save analysis", e); }
    }
};