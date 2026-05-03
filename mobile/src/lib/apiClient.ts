import { env } from '../config/env';

type RequestOptions = RequestInit & {
  token?: string;
};

export const apiClient = async <T>(path: string, options: RequestOptions = {}) => {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers,
  });

  const payload = (await response.json()) as
    | T
    | {
        error?: {
          message?: string;
        };
      };

  if (!response.ok) {
    const errorMessage =
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      payload.error?.message
        ? payload.error.message
        : `API request failed: ${response.status}`;
    throw new Error(errorMessage);
  }

  return payload as T;
};
