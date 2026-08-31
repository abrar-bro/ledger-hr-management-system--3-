import { apiFetch, isLiveApi } from "./client";

// One entry per vacation day taken. Shares the same localStorage +
// real-time sync pattern as attendance.js, under its own key/event so it
// doesn't interfere with the attendance punch log.
const LOG_KEY = "ledgerhr_leave_log";
const EVENT_NAME = "ledgerhr:leave-updated";

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

export function subscribeToLeave(callback) {
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

export async function getLeaveLog() {
  if (isLiveApi) return apiFetch("/leave");
  return readLocalLog();
}

export async function logVacationDay(employee, date, reason = "") {
  if (isLiveApi) {
    return apiFetch("/leave", {
      method: "POST",
      body: JSON.stringify({ employeeId: employee.id, date, reason }),
    });
  }

  const log = readLocalLog();
  const entry = {
    id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()),
    employeeId: employee.id,
    name: employee.name,
    department: employee.department,
    date,
    reason,
    createdAt: new Date().toISOString(),
  };
  writeLocalLog([entry, ...log]);
  return entry;
}

export async function deleteVacationDay(id) {
  if (isLiveApi) return apiFetch(`/leave/${id}`, { method: "DELETE" });

  const log = readLocalLog();
  writeLocalLog(log.filter((e) => e.id !== id));
  return true;
}
