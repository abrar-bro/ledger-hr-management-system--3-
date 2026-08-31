import { apiFetch, isLiveApi } from "./client";
import { getEmployees } from "./employees";
import { clearSession, getSession, setSession } from "./session";

// DEMO-ONLY credentials, used only while running on local mock data
// (no VITE_API_BASE_URL set). Shown right on the login screen.
//   HR admin  → name "admin",        password "admin123"
//   Employee  → their own full name, password "employee123"
// Once connected to the server/ backend (or your own), real hashed
// passwords from the `users` table are used instead — see server/db.js.
const DEMO_HR = { name: "admin", password: "admin123" };
const DEMO_EMPLOYEE_PASSWORD = "employee123";

export { getSession };
export const logout = clearSession;

export async function login(name, password) {
  const trimmedName = (name || "").trim();
  if (!trimmedName || !password) {
    throw new Error("Enter a name and password.");
  }

  if (isLiveApi) {
    const result = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ name: trimmedName, password }),
    });
    setSession({ token: result.token, user: result.user });
    return result.user;
  }

  // ---- local/demo mode ----
  if (trimmedName.toLowerCase() === DEMO_HR.name && password === DEMO_HR.password) {
    const user = { id: "hr-admin", name: "Admin", role: "hr", employeeId: null };
    setSession({ token: "local-session", user });
    return user;
  }

  const employees = await getEmployees();
  const match = employees.find((e) => e.name.toLowerCase() === trimmedName.toLowerCase());
  if (match && password === DEMO_EMPLOYEE_PASSWORD) {
    const user = { id: match.id, name: match.name, role: "employee", employeeId: match.id };
    setSession({ token: "local-session", user });
    return user;
  }

  throw new Error("Invalid name or password.");
}
