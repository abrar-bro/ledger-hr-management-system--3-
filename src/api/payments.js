import { apiFetch, isLiveApi } from "./client";

// Tracks which employees have had their pay for a given month "forwarded"
// to their bank. There's no real banking integration here — this simulates
// the action and keeps a record of it, the same way attendance.js and
// leave.js simulate a backend with localStorage until a real API is wired up.
const LOG_KEY = "ledgerhr_bank_transfers";
const EVENT_NAME = "ledgerhr:bank-transfers-updated";

function monthKey(referenceDate = new Date()) {
  return `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, "0")}`;
}

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

export function subscribeToBankTransfers(callback) {
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

export async function getBankTransfers() {
  if (isLiveApi) return apiFetch("/bank-transfers");
  return readLocalLog();
}

// Has this employee already been forwarded for the given month?
export async function getTransferForMonth(employeeId, referenceDate = new Date()) {
  const log = await getBankTransfers();
  const key = monthKey(referenceDate);
  return log.find((t) => t.employeeId === employeeId && t.month === key) || null;
}

export async function forwardToBank(employee, amount, referenceDate = new Date()) {
  const month = monthKey(referenceDate);

  if (isLiveApi) {
    const record = await apiFetch("/bank-transfers", {
      method: "POST",
      body: JSON.stringify({ employeeId: employee.id, amount, month }),
    });
    window.dispatchEvent(new Event(EVENT_NAME));
    return record;
  }

  const log = readLocalLog();
  const entry = {
    id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()),
    employeeId: employee.id,
    name: employee.name,
    bankName: employee.bankName || "",
    bankAccount: employee.bankAccount || "",
    amount,
    month,
    forwardedAt: new Date().toISOString(),
  };
  writeLocalLog([entry, ...log.filter((t) => !(t.employeeId === employee.id && t.month === month))]);
  return entry;
}
