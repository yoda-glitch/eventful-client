const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eventful-api-b824ebd153c0.herokuapp.com/api/v1';

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

const uploadRequest = async (path: string, formData: FormData) => {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw { response: { data, status: res.status } };
  return { data };
};

const request = async (method: string, path: string, body?: any) => {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();
  if (!res.ok) throw { response: { data, status: res.status } };
  return { data };
};

export const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body?: any) => request('POST', path, body),
  upload: (path: string, formData: FormData) => uploadRequest(path, formData),
  patch: (path: string, body?: any) => request('PATCH', path, body),
  put: (path: string, body?: any) => request('PUT', path, body),
  delete: (path: string) => request('DELETE', path),
};

export default api;
