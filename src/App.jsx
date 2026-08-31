import { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Employees from "./pages/Employees.jsx";
import Attendance from "./pages/Attendance.jsx";
import Payroll from "./pages/Payroll.jsx";
import Login from "./pages/Login.jsx";
import { getSession, logout } from "./api/auth";

function defaultPageFor(role) {
  return role === "hr" ? "dashboard" : "employees";
}

export default function App() {
  const [session, setSession] = useState(() => getSession());
  const [page, setPage] = useState(() => defaultPageFor(getSession()?.user?.role));

  function handleLogin(user) {
    setSession(getSession());
    setPage(defaultPageFor(user.role));
  }

  function handleLogout() {
    logout();
    setSession(null);
  }

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  const { user } = session;
  const isHR = user.role === "hr";

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={setPage} user={user} onLogout={handleLogout} />
      <div className="main-col">
        {isHR && page === "dashboard" && <Dashboard onNavigate={setPage} />}
        {page === "employees" && <Employees readOnly={!isHR} />}
        {isHR && page === "attendance" && <Attendance />}
        {isHR && page === "payroll" && <Payroll />}
      </div>
    </div>
  );
}
