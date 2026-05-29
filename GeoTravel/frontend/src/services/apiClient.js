import { ENV } from '../config/env';

const defaultHeaders = {
  'Content-Type': 'application/json',
};

const buildUrl = (path) => {
  if (path.startsWith('http')) {
    return path;
  }
  return `${ENV.apiUrl}${path}`;
};

export const apiClient = {
  async get(path) {
    const response = await fetch(buildUrl(path), {
      headers: defaultHeaders,
    });
    if (!response.ok) {
      throw new Error(`GET ${path} failed with ${response.status}`);
    }
    return response.json();
  },
  async post(path, body) {
    const response = await fetch(buildUrl(path), {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`POST ${path} failed with ${response.status}`);
    }
    return response.json();
  },
  async put(path, body) {
    const response = await fetch(buildUrl(path), {
      method: 'PUT',
      headers: defaultHeaders,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`PUT ${path} failed with ${response.status}`);
    }
    return response.json();
  },
  async delete(path) {
    const response = await fetch(buildUrl(path), {
      method: 'DELETE',
      headers: defaultHeaders,
    });
    if (!response.ok) {
      throw new Error(`DELETE ${path} failed with ${response.status}`);
    }
    return response.json();
  },
};
