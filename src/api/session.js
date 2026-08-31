// Tiny helper around the logged-in session, stored in localStorage so it
// survives a page refresh. Kept separate from auth.js and client.js so
// neither has to import the other.
const SESSION_KEY = "ledgerhr_session";
const EVENT_NAME = "ledgerhr:session-changed";

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(EVENT_NAME));
}
