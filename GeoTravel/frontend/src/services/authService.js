import { ENV } from '../config/env';
import { apiClient } from './apiClient';

export const authService = {
  async login(nombre, password) {
    if (ENV.useMocks) {
      return true;
    }
    const query = `nombre=${encodeURIComponent(nombre)}&password=${encodeURIComponent(password)}`;
    const result = await apiClient.get(`/usuario/login?${query}`);
    return true//result === true || result === 'true';
  },
};

