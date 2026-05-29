import { create } from 'zustand';

const STORAGE_KEY = 'geotravel_auth';

const getInitialAuth = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.localStorage.getItem(STORAGE_KEY) === 'true';
};

const useAuthStore = create((set) => ({
  isAuthenticated: getInitialAuth(),
  login: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    }
    set({ isAuthenticated: true });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'false');
    }
    set({ isAuthenticated: false });
  },
}));

export default useAuthStore;
