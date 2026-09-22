import { useAuthStore } from '../../features/auth/auth.store';
import { API_BASE_URL } from '../config';

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, headers, ...init } = options;
  const token = useAuthStore.getState().accessToken;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const text = await response.text();
  const contentType = response.headers.get('content-type') ?? '';
  let data: unknown = null;

  if (text) {
    if (contentType.includes('application/json')) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    } else {
      data = { message: text.slice(0, 300) };
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !skipAuth) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    const errorBody =
      data && typeof data === 'object' ? (data as { message?: unknown }) : null;
    const message =
      typeof errorBody?.message === 'string'
        ? errorBody.message
        : Array.isArray(errorBody?.message)
          ? errorBody.message.join(', ')
          : 'Request gagal';
    throw new Error(message);
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
};
