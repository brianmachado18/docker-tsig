import { ENV } from '../config/env';
import { apiClient } from './apiClient';
import { zonesMock } from './mocks/zonesMock';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const zonesService = {
  async list() {
    if (ENV.useMocks) {
      await delay(200);
      return [...zonesMock];
    }
    return apiClient.get('/zones');
  },
  async save(zone) {
    if (ENV.useMocks) {
      await delay(200);
      return {
        ...zone,
        id: zone.id || `zone-${Date.now()}`,
      };
    }
    if (zone.id) {
      return apiClient.put(`/zones/${zone.id}`, zone);
    }
    return apiClient.post('/zones', zone);
  },
  async remove(zoneId) {
    if (ENV.useMocks) {
      await delay(200);
      return { ok: true };
    }
    return apiClient.delete(`/zones/${zoneId}`);
  },
};
