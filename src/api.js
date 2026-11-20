import toast from 'react-hot-toast';

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function friendlyError(status) {
  if (status === 401) return 'Please sign in to continue.';
  if (status === 403) return "You don't have access to do that.";
  if (status === 404) return "We couldn't find that. It may have moved or been removed.";
  if (status === 409) return "That change can't be made right now. Please check and try again.";
  if (status === 429) return 'Please wait a moment before trying again.';
  if (status >= 500) return "That didn't go through. Please try again in a moment.";
  return 'Please check the information and try again.';
}

function successMessage(path) {
  if (path.includes('/auth/staff/login')) return "You're signed in.";
  if (path.includes('/menu/') && path.endsWith('/options')) return 'Item options updated.';
  if (path.includes('/admin/menu')) return 'Menu details saved.';
  if (path.includes('/tables')) return 'Table details saved.';
  if (path.includes('/customers')) return 'Customer details updated.';
  if (path.includes('/delivery')) return 'Delivery details updated.';
  if (path.includes('/staff')) return 'Team details updated.';
  if (path.includes('/settings')) return 'Restaurant settings saved.';
  if (path.includes('/orders')) return 'Order details updated.';
  return 'Changes saved.';
}

export async function api(path, { token, ...options } = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });
  } catch {
    const message = "We couldn't reach the restaurant right now. Please check your connection and try again.";
    toast.error(message);
    throw new Error(message);
  }
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) {
    const message = friendlyError(response.status);
    toast.error(message);
    throw new Error(message);
  }
  if (!['GET', 'HEAD'].includes(method)) toast.success(successMessage(path));
  return body?.data ?? body;
}

export const send = (method, data) => ({ method, body: JSON.stringify(data) });
