import { ENV } from '../config/env';
import { apiClient } from './apiClient';
import { attractionsMock } from './mocks/attractionsMock';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const attractionsService = {
  async list() {
    if (ENV.useMocks) {
      await delay(200);
      return [...attractionsMock];
    }
    return apiClient.get('/attractions');
  },
  async save(attraction) {
    if (ENV.useMocks) {
      await delay(200);
      return {
        ...attraction,
        id: attraction.id || `attr-${Date.now()}`,
      };
    }
    if (attraction.id) {
      return apiClient.put(`/attractions/${attraction.id}`, attraction);
    }
    return apiClient.post('/attractions', attraction);
  },
  async remove(attractionId) {
    if (ENV.useMocks) {
      await delay(200);
      return { ok: true };
    }
    return apiClient.delete(`/attractions/${attractionId}`);
  },
};
