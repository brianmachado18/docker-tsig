import { apiClient } from '@/shared/lib/api/apiClient';

export const authService = {
  async login(nombre, password) {
    const query = `nombre=${encodeURIComponent(nombre)}&password=${encodeURIComponent(password)}`;
    const result = await apiClient.get(`/usuario/login?${query}`);
    return result === true || result === 'true';
  },
};
