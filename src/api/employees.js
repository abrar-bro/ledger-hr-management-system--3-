import { apiFetch, isLiveApi } from "./client";

// In local/demo mode the roster is seeded once from /employees.json, then
// every add/edit/delete is persisted to localStorage — so it survives page
// refreshes even though there's no backend yet. Swap to VITE_API_BASE_URL
// and these same functions will talk to your real REST endpoints instead.
const STORE_KEY = "ledgerhr_employees";
const EVENT_NAME = "ledgerhr:employees-updated";
let localCache = null;

function readStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStore(list) {
  localStorage.setItem(STORE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVENT_NAME));
}

// Notified whenever an employee is added/edited/deleted/reset — in this tab
// (custom event) or another tab on the same origin (storage event). Poll
// separately if you also need to pick up changes made through a live API
// by someone else's browser.
export function subscribeToEmployees(callback) {
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

async function loadLocal() {
  if (!localCache) {
    const stored = readStore();
    if (stored) {
      localCache = stored;
    } else {
      const res = await fetch("/employees.json");
      const seed = await res.json();
      // The "updatedAt" written in employees.json is ignored on purpose —
      // whatever moment this browser first loads the seed data becomes the
      // real "updated" timestamp, so editing the JSON and resetting always
      // shows a fresh, current time without hand-editing timestamps.
      const loadedAt = new Date().toISOString();
      localCache = seed.map((emp) => ({ ...emp, updatedAt: loadedAt }));
      writeStore(localCache);
    }
  }
  return localCache;
}

export async function getEmployees() {
  if (isLiveApi) return apiFetch("/employees");
  return loadLocal();
}

export async function createEmployee(employee) {
  if (isLiveApi) {
    const record = await apiFetch("/employees", { method: "POST", body: JSON.stringify(employee) });
    window.dispatchEvent(new Event(EVENT_NAME));
    return record;
  }

  const list = await loadLocal();
  const nextNumber = list.length
    ? Math.max(...list.map((e) => Number(e.id.replace(/\D/g, "")) || 0)) + 1
    : 1001;

  const record = {
    ...employee,
    id: `EMP-${nextNumber}`,
    updatedAt: new Date().toISOString(),
  };
  localCache = [record, ...list];
  writeStore(localCache);
  return record;
}

export async function updateEmployee(id, patch) {
  if (isLiveApi) {
    const record = await apiFetch(`/employees/${id}`, { method: "PUT", body: JSON.stringify(patch) });
    window.dispatchEvent(new Event(EVENT_NAME));
    return record;
  }

  const list = await loadLocal();
  localCache = list.map((e) =>
    e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e
  );
  writeStore(localCache);
  return localCache.find((e) => e.id === id);
}

export async function deleteEmployee(id) {
  if (isLiveApi) {
    await apiFetch(`/employees/${id}`, { method: "DELETE" });
    window.dispatchEvent(new Event(EVENT_NAME));
    return true;
  }

  const list = await loadLocal();
  localCache = list.filter((e) => e.id !== id);
  writeStore(localCache);
  return true;
}

// Wipes local edits and reloads the original demo roster from employees.json.
export async function resetToDemoData() {
  localCache = null;
  localStorage.removeItem(STORE_KEY);
  const fresh = await loadLocal();
  window.dispatchEvent(new Event(EVENT_NAME));
  return fresh;
}
