import { create } from 'zustand';
import type { UserProfile } from '../types';

interface CurrentUserState {
  currentUser: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  setCurrentUser: (user: UserProfile | null) => void;
  updateCurrentUser: (partial: Partial<UserProfile>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearCurrentUser: () => void;
}

export const useCurrentUserStore = create<CurrentUserState>((set) => ({
  currentUser: null,
  isLoading: false,
  error: null,
  setCurrentUser: (user) => set({ currentUser: user, error: null }),
  updateCurrentUser: (partial) =>
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, ...partial }
        : null,
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearCurrentUser: () =>
    set({ currentUser: null, isLoading: false, error: null }),
}));
