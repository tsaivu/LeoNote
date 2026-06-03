const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const ACCESS_TOKEN_KEY = "leonote_access_token";
const REFRESH_TOKEN_KEY = "leonote_refresh_token";
const USER_KEY = "leonote_auth_user";

if (!apiBaseUrl) {
  throw new Error("VITE_API_BASE_URL is required");
}

async function buildHttpError(response: Response): Promise<Error> {
  try {
    const data = (await response.json()) as { detail?: unknown };
    return new Error(formatErrorDetail(data.detail) || `HTTP ${response.status}`);
  } catch {
    return new Error(`HTTP ${response.status}`);
  }
}

function formatErrorDetail(detail: unknown): string {
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail.map(formatValidationError).join("; ");
  }
  if (detail && typeof detail === "object") {
    return JSON.stringify(detail);
  }
  return "";
}

function formatValidationError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return String(error);
  }
  const item = error as { loc?: unknown[]; msg?: unknown };
  const path = Array.isArray(item.loc) ? item.loc.join(".") : "request";
  const message = typeof item.msg === "string" ? item.msg : JSON.stringify(item.msg);
  return `${path}: ${message}`;
}

export async function httpGet<T>(path: string): Promise<T> {
  const response = await requestWithAuthRetry(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw await buildHttpError(response);
  }

  return response.json() as Promise<T>;
}

export async function httpPost<TResponse, TPayload>(
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  const response = await requestWithAuthRetry(path, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await buildHttpError(response);
  }

  return response.json() as Promise<TResponse>;
}

export async function httpPut<TResponse, TPayload>(
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  const response = await requestWithAuthRetry(path, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await buildHttpError(response);
  }

  return response.json() as Promise<TResponse>;
}

export async function httpDelete<TResponse>(path: string): Promise<TResponse> {
  const response = await requestWithAuthRetry(path, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw await buildHttpError(response);
  }

  return response.json() as Promise<TResponse>;
}

function withAuthorization(init: RequestInit): RequestInit {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}

async function requestWithAuthRetry(path: string, init: RequestInit): Promise<Response> {
  const response = await fetch(`${apiBaseUrl}${path}`, withAuthorization(init));
  if (response.status !== 401 || path.startsWith("/auth/")) {
    return response;
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    return response;
  }

  return fetch(`${apiBaseUrl}${path}`, withAuthorization(init));
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  try {
    const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      clearStoredAuth();
      return false;
    }

    const session = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      user: unknown;
    };
    localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    return true;
  } catch {
    clearStoredAuth();
    return false;
  }
}

function clearStoredAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
