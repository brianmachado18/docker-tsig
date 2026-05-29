import { ENV } from '../config/env';
import { apiClient } from './apiClient';
import { routesMock } from './mocks/routesMock';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const routesService = {
  async list() {
    if (ENV.useMocks) {
      await delay(200);
      return [...routesMock];
    }
    return apiClient.get('/routes');
  },
  async save(route) {
    if (ENV.useMocks) {
      await delay(200);
      return {
        ...route,
        id: route.id || `route-${Date.now()}`,
      };
    }
    if (route.id) {
      return apiClient.put(`/routes/${route.id}`, route);
    }
    return apiClient.post('/routes', route);
  },
  async remove(routeId) {
    if (ENV.useMocks) {
      await delay(200);
      return { ok: true };
    }
    return apiClient.delete(`/routes/${routeId}`);
  },
};
