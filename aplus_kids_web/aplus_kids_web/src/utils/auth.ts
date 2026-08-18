import { backendFetch } from "@/utils/backendActivity";

export function resolveApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const localOrPrivateHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
      || /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(hostname);
    if (localOrPrivateHost) return `http://${hostname.includes(":") ? `[${hostname}]` : hostname}:8081`;
  }
  return "http://localhost:8081";
}

const API_BASE_URL = resolveApiBaseUrl();
let activeApiRequests = 0;
let refreshPromise: Promise<string | null> | null = null;

function publishApiActivity() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("aplus-api-activity", { detail: { count: activeApiRequests } }));
}

function publishDataUpdated(path: string, method: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("aplus-data-updated", { detail: { path, method } }));
  }
}

function publishOperationFinished(success: boolean, path: string, status?: number, message?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("aplus-operation-finished", { detail: { success, path, status, message } }));
  }
}

function getAccessToken() {
  return window.sessionStorage.getItem("aplus-access-token")
    || window.localStorage.getItem("aplus-access-token");
}

function saveAccessToken(token: string) {
  const storage = window.localStorage.getItem("aplus-access-token")
    ? window.localStorage
    : window.sessionStorage;
  storage.setItem("aplus-access-token", token);
}

export type AuthenticatedUser = {
  publicId: string;
  accountHolderName: string;
  email: string;
  roles: string[];
};

export async function login(login: string, password: string, rememberMe: boolean) {
  const response = await backendFetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password, rememberMe }),
  });
  if (!response.ok) {
    clearAuthStorage();
    const error = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(error?.message || "Unable to log in. Please check your details and try again.");
  }

  const result = await response.json() as { accessToken: string; user: AuthenticatedUser };
  clearAuthStorage();
  const storage = rememberMe ? window.localStorage : window.sessionStorage;
  storage.setItem("aplus-access-token", result.accessToken);
  storage.setItem("aplus-current-user", JSON.stringify(result.user));
  return result.user;
}

export async function requestPasswordReset(email: string) {
  const response = await backendFetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const result = await response.json().catch(() => null) as { message?: string } | null;
  if (!response.ok) throw new Error(result?.message || "Unable to request a password reset.");
  return result?.message || "If that email is registered, a password reset link has been sent.";
}

type RegistrationPayload = {
  accountHolderName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  children: Array<{
    fullName: string;
    dateOfBirth: string;
    gender: "GIRL" | "BOY" | "PREFER_NOT_TO_SAY";
    countryCode: string;
    province: string;
    hometown: string;
    address?: string;
  }>;
  consent: {
    parentGuardianConfirmed: true;
    termsAccepted: true;
    termsVersion: string;
    privacyAccepted: true;
    privacyVersion: string;
  };
};

async function authAction(path: string, body: unknown) {
  const response = await backendFetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => null) as { message?: string } | null;
  if (!response.ok) throw new Error(result?.message || "The request could not be completed.");
  return result;
}

export async function registerAccount(payload: RegistrationPayload) {
  return authAction("/api/v1/auth/register", payload);
}

export async function verifyEmail(email: string, code: string) {
  return authAction("/api/v1/auth/verify-email", { email, code });
}

export async function resendVerification(email: string) {
  return authAction("/api/v1/auth/resend-verification", { email });
}

export async function acceptAdministratorInvitation(email: string, code: string, password: string, confirmPassword: string) {
  return authAction("/api/v1/admin-invitations/accept", { email, code, password, confirmPassword });
}

export async function validateAdministratorInvitation(email: string, code: string) {
  return authAction("/api/v1/admin-invitations/validate", { email, code });
}

export async function resendAdministratorInvitation(email: string) {
  return authAction("/api/v1/admin-invitations/resend", { email });
}

export function clearAuthStorage() {
  for (const storage of [window.localStorage, window.sessionStorage]) {
    storage.removeItem("aplus-access-token");
    storage.removeItem("aplus-current-user");
  }
  window.dispatchEvent(new Event("aplus-auth-cleared"));
}

async function performAccessTokenRefresh() {
  const response = await backendFetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    clearAuthStorage();
    return null;
  }
  const result = (await response.json()) as { accessToken: string };
  saveAccessToken(result.accessToken);
  return result.accessToken;
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = performAccessTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export type ApiFetchInit = RequestInit & {
  /**
   * Use for internal maintenance requests that are immediately followed by an
   * explicit refresh.  They should not remount every live workspace.
   */
  notifyDataUpdated?: boolean;
};

export async function apiFetch(path: string, init: ApiFetchInit = {}) {
  const { notifyDataUpdated = true, ...requestInit } = init;
  // Reads update their panel in place; only data-changing requests show the blocking save screen.
  const tracked = !path.endsWith("/events") && Boolean(requestInit.method && !["GET", "HEAD"].includes(requestInit.method.toUpperCase()));
  if (tracked) { activeApiRequests += 1; publishApiActivity(); }
  try {
  let token = getAccessToken();
  if (!token) token = await refreshAccessToken();

  const isFormData = typeof FormData !== "undefined" && requestInit.body instanceof FormData;
  const request = (accessToken: string | null) => backendFetch(`${API_BASE_URL}${path}`, {
    ...requestInit,
    credentials: "include",
    headers: {
      ...(requestInit.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...requestInit.headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  let response = await request(token);
  if (response.status === 401) {
    token = await refreshAccessToken();
    if (token) response = await request(token);
  }
  // A completed write has committed on the API. Let every mounted admin workspace
  // reload its server-backed data without waiting for the next poll or navigation.
  if (tracked) {
    if (response.ok && notifyDataUpdated) publishDataUpdated(path, requestInit.method!.toUpperCase());
    const failure = !response.ok
      ? await response.clone().json().catch(() => null) as { message?: string } | null
      : null;
    publishOperationFinished(response.ok, path, response.status, failure?.message);
  }
  return response;
  } catch (error) {
    if (tracked) publishOperationFinished(false, path, undefined, error instanceof Error ? error.message : undefined);
    throw error;
  } finally {
    if (tracked) { activeApiRequests = Math.max(0, activeApiRequests - 1); publishApiActivity(); }
  }
}

export async function logout() {
  try {
    await backendFetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } finally {
    clearAuthStorage();
  }
}

export async function reauthenticate(login: string, password: string) {
  const response = await backendFetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password, rememberMe: Boolean(window.localStorage.getItem("aplus-access-token")) }),
  });
  if (!response.ok) {
    clearAuthStorage();
    return false;
  }
  const result = await response.json() as { accessToken: string };
  saveAccessToken(result.accessToken);
  return true;
}
