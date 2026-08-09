/**
 * dataService.js
 * ------------------------------------------------------------------
 * This is the ONLY file that talks to the backend. Every component
 * calls these functions instead of making fetch() calls directly.
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

export async function getHoursForUserAsync(week) {
  const q = week ? `?week=${week}` : "";
  return apiFetch(`/hours${q}`);
}

export async function deleteHoursEntryAsync(entryId) {
  await apiFetch(`/hours?id=${encodeURIComponent(entryId)}`, { method: "DELETE" });
}

// ---------- weeks ----------
export async function getWeeksAsync() {
  return apiFetch("/weeks");
}

// ---------- leaderboard ----------
export async function getTopEarnersAsync(week) {
  const q = week ? `?week=${week}` : "";
  return apiFetch(`/leaderboard${q}`);
}

// ---------- admin ----------
export async function getAdminOverviewAsync(week) {
  const q = week ? `?week=${week}` : "";
  return apiFetch(`/admin/overview${q}`);
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

// ---------- approvals ----------
export async function getPendingApprovalsAsync() {
  return apiFetch("/admin/pending");
}

export async function decideHoursAsync(entryId, action) {
  return apiFetch(`/admin/pending/${entryId}`, { method: "PUT", body: { action } });
}
// ---------- links (worker-facing) ----------
export async function getMyLinksAsync() {
  return apiFetch("/links");
}

export async function releaseLinkAsync(linkId) {
  return apiFetch("/links", { method: "PUT", body: { action: "release", linkId } });
}

export async function claimLinkAsync(assignmentId) {
  return apiFetch("/links", { method: "PUT", body: { action: "claim", assignmentId } });
}

// ---------- links (admin management) ----------
export async function getAdminLinksAsync() {
  return apiFetch("/admin/links");
}

export async function createLinkAsync(link) {
  return apiFetch("/admin/links", { method: "POST", body: link });
}

export async function assignLinkAsync(id, workerIds) {
  return apiFetch(`/admin/links?id=${encodeURIComponent(id)}`, {
    method: "PUT",
    body: { workerIds },
  });
}

export async function deleteLinkAsync(id) {
  return apiFetch(`/admin/links?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}
