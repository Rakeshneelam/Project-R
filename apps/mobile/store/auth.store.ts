import { create } from 'zustand';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { authApi } from '../services/api';

interface User {
  id: string; // Maps to Firebase UID
  name: string;
  email: string;
  avatarUrl?: string;
  xpPoints: number;
  level: number;
  bio?: string;
}

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, dob?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  firebaseUser: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    // Firebase handles token persistence and triggers onAuthStateChanged
    await signInWithEmailAndPassword(auth, email, password);
  },

  register: async (name, email, password, dob) => {
    // Create user in Firebase first (this automatically signs them in)
    await createUserWithEmailAndPassword(auth, email, password);
    // After Firebase success, the interceptor will use the new Firebase token
    // to authenticate this request to our backend to create the relational profile
    try {
      await authApi.register({ name, email, password, dateOfBirth: dob });
    } catch (e) {
      console.error('Failed to create backend profile sync', e);
    }
  },

  logout: async () => {
    await signOut(auth);
    set({ user: null, firebaseUser: null, isAuthenticated: false });
  },

  loadSession: () => {
    onAuthStateChanged(auth, async (firebaseUser: any) => {
      if (firebaseUser) {
        try {
          // Fetch backend profile using the Firebase token (handled by api interceptor)
          const me = await authApi.me(); 
          set({ 
            user: me.data, 
            firebaseUser, 
            isAuthenticated: true,
            isLoading: false 
          });
        } catch (e) {
          // Fallback if backend profile fetch fails
          set({ 
            user: { id: firebaseUser.uid, name: firebaseUser.displayName || 'User', email: firebaseUser.email || '', xpPoints: 0, level: 1 }, 
            firebaseUser, 
            isAuthenticated: true,
            isLoading: false 
          });
        }
      } else {
        set({ user: null, firebaseUser: null, isAuthenticated: false, isLoading: false });
      }
    });
  },

  updateUser: (partial) => set((s) => ({ user: s.user ? { ...s.user, ...partial } : s.user })),
}));
