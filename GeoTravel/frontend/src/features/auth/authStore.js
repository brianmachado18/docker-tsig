import { create } from 'zustand';
import { authService } from '@/features/auth/authService';

const STORAGE_KEY = 'geotravel_auth';

const getInitialAuth = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.localStorage.getItem(STORAGE_KEY) === 'true';
};

const useAuthStore = create((set) => ({
  isAuthenticated: getInitialAuth(),
  isSubmitting: false,
  error: null,
  login: async (username, password) => {
    set({ isSubmitting: true, error: null });
    try {
      const success = await authService.login(username, password);
      if (!success) {
        set({ isSubmitting: false, error: 'Credenciales inválidas.' });
        return false;
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, 'true');
      }
      set({ isAuthenticated: true, isSubmitting: false, error: null });
      return true;
    } catch (error) {
      const details = error?.details || error?.message || 'Error de autenticación.';
      set({ isSubmitting: false, error: details });
      return false;
    }
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'false');
    }
    set({ isAuthenticated: false, error: null, isSubmitting: false });
  },
}));

export default useAuthStore;
