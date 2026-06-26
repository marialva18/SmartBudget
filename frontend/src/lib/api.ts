import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
} from './auth-session';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

type ApiErrorResponse = {
  message?: string | string[];
};

type RefreshedSession = {
  user: {
    id: string;
    email: string;
    displayName: string;
    onboardingCompleted: boolean;
  };
  accessToken: string;
};

let refreshPromise: Promise<boolean> | null = null;

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiOptions = {},
): Promise<TResponse> {
  let response = await performRequest(path, options);

  if (response.status === 401 && shouldAttemptRefresh(path)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await performRequest(path, options);
    }
  }

  return parseResponse<TResponse>(response);
}

async function performRequest(path: string, options: ApiOptions) {
  const accessToken = getAuthSession()?.accessToken;
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

async function parseResponse<TResponse>(
  response: Response,
): Promise<TResponse> {
  if (!response.ok) {
    let message = 'No se pudo completar la solicitud.';

    try {
      const errorBody = (await response.json()) as ApiErrorResponse;
      if (Array.isArray(errorBody.message)) {
        message = errorBody.message[0] ?? message;
      } else if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      message = 'No se pudo completar la solicitud.';
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}

function shouldAttemptRefresh(path: string) {
  return ![
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/forgot-password',
    '/auth/reset-password',
  ].includes(path);
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          clearAuthSession();
          return false;
        }

        const session = (await response.json()) as RefreshedSession;
        setAuthSession(session);
        return true;
      })
      .catch(() => {
        clearAuthSession();
        return false;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}
