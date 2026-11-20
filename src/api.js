export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export async function api(path, { token, ...options } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) throw new Error(body?.message || `Request failed (${response.status})`);
  return body?.data ?? body;
}

export const send = (method, data) => ({ method, body: JSON.stringify(data) });
