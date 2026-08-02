/**
 * dataService.js
 * ------------------------------------------------------------------
 * This is the ONLY file that talks to the backend. Every component
 * calls these functions instead of making fetch() calls directly.
 *
 * Now backed by real serverless functions in /api, a real Postgres
 * database, hashed passwords, and encrypted bank account numbers.
 * See /api/_lib/schema.sql and the README for one-time setup.
 * ------------------------------------------------------------------
 */

const TOKEN_KEY = "multilink_token";
const USER_KEY = "multilink_user";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong. Please try again.");
  }
  return data;
}

// ---------- auth ----------
export async function signUp({ email, password }) {
  const { token, user } = await apiFetch("/auth/signup", {
    method: "POST",
    body: { email, password },
  });
  saveSession(token, user);
  return user;
}

export async function login({ email, password }) {
  const { token, user } = await apiFetch("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  saveSession(token, user);
  return user;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

// ---------- profile ----------
export async function updateProfile(userId, profileFields) {
  await apiFetch("/profile", { method: "PUT", body: profileFields });
  const current = getCurrentUser();
  const updated = {
    ...current,
    profile: { ...current.profile, ...profileFields, bankAccountNumber: undefined },
  };
  localStorage.setItem(USER_KEY, JSON.stringify(updated));
  return updated;
}

// ---------- pay rate ----------
export async function getPayRateAsync() {
  const { payRate } = await apiFetch("/settings");
  return payRate;
}

export async function setPayRateAsync(rate) {
  await apiFetch("/settings", { method: "PUT", body: { payRate: Number(rate) } });
}

// ---------- hours ----------
export async function logHoursAsync({ date, hours, note }) {
  await apiFetch("/hours", { method: "POST", body: { date, hours, note } });
}

export async function getHoursForUserAsync() {
  return apiFetch("/hours");
}

export async function deleteHoursEntryAsync(entryId) {
  await apiFetch(`/hours?id=${encodeURIComponent(entryId)}`, { method: "DELETE" });
}

// ---------- leaderboard ----------
export async function getTopEarnersAsync() {
  return apiFetch("/leaderboard");
}

// ---------- admin ----------
export async function getAdminOverviewAsync() {
  return apiFetch("/admin/overview");
}

export async function getAdminWorkersAsync() {
  return apiFetch("/admin/users");
}

export async function getWorkerProfileAsync(userId) {
  return apiFetch(`/admin/users/${userId}`);
}

export async function setUserRoleAsync(userId, role) {
  return apiFetch(`/admin/users/${userId}`, { method: "PUT", body: { role } });
}
