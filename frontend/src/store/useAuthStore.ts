import { create } from 'zustand';
import { UserProfile } from '../types';
import { MOCK_USER } from '../mockData';

interface AuthState {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  updateUser: (partial: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: MOCK_USER,
  setUser: (user) => set({ user }),
  updateUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),
}));
