import { apiFetch, isLiveApi } from "./client";

// The React dashboard and the vanilla-JS kiosk (public/pos.html) both read
// and write this same localStorage key, so a punch made at the kiosk shows
// up in the admin dashboard immediately (same browser/origin). Once
// VITE_API_BASE_URL is set, both sides should be pointed at real endpoints
// instead — this file is the one place that needs to change.
const LOG_KEY = "ledgerhr_attendance_log";
const EVENT_NAME = "ledgerhr:attendance-updated";

function readLocalLog() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocalLog(log) {
  localStorage.setItem(LOG_KEY, JSON.stringify(log));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function subscribeToAttendance(callback) {
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

export async function getLog() {
  if (isLiveApi) return apiFetch("/attendance");
  return readLocalLog();
}

export async function getTodayLog() {
  const log = await getLog();
  const today = new Date().toDateString();
  return log.filter((entry) => new Date(entry.timestamp).toDateString() === today);
}

// Punch types are: "in", "break-start", "break-end", "out".
// This collapses the most recent punch into one of three simple states.
export function normalizeStatus(type) {
  if (type === "break-start") return "break";
  if (type === "in" || type === "break-end") return "in";
  return "out";
}

export async function getStatus(employeeId) {
  const todays = (await getTodayLog()).filter((e) => e.employeeId === employeeId);
  if (!todays.length) return "out";
  return normalizeStatus(todays[0].type); // newest is unshifted to the front
}

export async function punch(employee, type) {
  if (isLiveApi) {
    return apiFetch("/attendance", {
      method: "POST",
      body: JSON.stringify({ employeeId: employee.id, type }),
    });
  }

  const log = readLocalLog();
  const entry = {
    id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()),
    employeeId: employee.id,
    name: employee.name,
    department: employee.department,
    type,
    timestamp: new Date().toISOString(),
  };
  writeLocalLog([entry, ...log]);
  return entry;
}
