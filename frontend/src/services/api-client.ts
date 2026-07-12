const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown;
  headers?: HeadersInit;
};

export async function apiClient<T>(path: string, options: RequestOptions = {}, token?: string) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message = isErrorPayload(payload) ? payload.message : 'The request could not be completed.';
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

function isErrorPayload(value: unknown): value is { message: string } {
  return typeof value === 'object' && value !== null && 'message' in value && typeof value.message === 'string';
}
