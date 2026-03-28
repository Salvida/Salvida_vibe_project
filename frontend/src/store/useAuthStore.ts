import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { UserProfile } from '../types';

interface AuthState {
  session: Session | null;
  isInitialized: boolean;
  user: UserProfile | null;
  setSession: (session: Session | null) => void;
  setInitialized: () => void;
  setUser: (user: UserProfile | null) => void;
  updateUser: (partial: Partial<UserProfile>) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isInitialized: false,
  user: null,
  setSession: (session) =>
    set((state) => ({
      session,
      // Only clear user on logout; leave it untouched on login/token-refresh
      // so that onAuthStateChange doesn't wipe the profile fetched by useProfile
      user: session ? state.user : null,
    })),
  setInitialized: () => set({ isInitialized: true }),
  setUser: (user) => set({ user }),
  updateUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),
  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));
