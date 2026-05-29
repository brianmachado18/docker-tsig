import { ENV } from '../config/env';

const jsonHeaders = {
  'Content-Type': 'application/json',
};

export class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const buildUrl = (path) => {
  if (path.startsWith('http')) {
    return path;
  }
  return `${ENV.apiUrl}${path}`;
};

const parseResponse = async (response) => {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
};

const request = async (path, options = {}) => {
  const response = await fetch(buildUrl(path), options);
  const body = await parseResponse(response);

  if (!response.ok) {
    const details = typeof body === 'string' ? body : body?.message || null;
    throw new ApiError(`HTTP ${response.status}`, response.status, details);
  }

  return body;
};

export const apiClient = {
  async get(path) {
    return request(path);
  },
  async post(path, body) {
    return request(path, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(body),
    });
  },
  async put(path, body) {
    return request(path, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(body),
    });
  },
  async delete(path) {
    return request(path, {
      method: 'DELETE',
    });
  },
};
