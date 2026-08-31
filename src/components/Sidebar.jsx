const HR_NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "◱" },
  { key: "employees", label: "Employees", icon: "☰" },
  { key: "attendance", label: "Attendance", icon: "◷" },
  { key: "payroll", label: "Payroll", icon: "৳" },
];

const EMPLOYEE_NAV_ITEMS = [{ key: "employees", label: "Employees", icon: "☰" }];

export default function Sidebar({ page, onNavigate, user, onLogout }) {
  const items = user?.role === "hr" ? HR_NAV_ITEMS : EMPLOYEE_NAV_ITEMS;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">⏱</div>
        <div className="brand-text">
          Ledger HR
          <span>Admin Console</span>
        </div>
      </div>

      <ul className="nav-list">
        {items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              className={`nav-item ${page === item.key ? "active" : ""}`}
              onClick={() => onNavigate(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="sidebar-footer">
        <div className="sidebar-user-name">{user?.name}</div>
        <div className="sidebar-user-role">{user?.role === "hr" ? "HR Admin" : "Employee"}</div>
        <button type="button" className="sidebar-logout" onClick={onLogout}>
          Log out
        </button>
      </div>
    </aside>
  );
}
