// Central fetch client.
//
// If VITE_API_BASE_URL is set (see .env.example), every request goes to your
// real backend. Until then, the app quietly falls back to the local
// /public/employees.json file and localStorage, so the whole UI works
// offline out of the box.

import { getSession } from "./session";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const API_KEY = import.meta.env.VITE_API_KEY || "";

export const isLiveApi = Boolean(BASE_URL);

export async function apiFetch(path, options = {}) {
  const session = getSession();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
      // A logged-in user's session token (if any) takes priority over a
      // static API key, so requests are attributed to the signed-in HR/employee user.
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(`API ${options.method || "GET"} ${path} failed (${res.status}): ${message}`);
  }

  if (res.status === 204) return null;
  return res.json();
}
