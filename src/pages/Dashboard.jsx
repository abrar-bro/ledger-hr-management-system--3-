import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import StatCard from "../components/StatCard.jsx";
import DeptBar from "../components/DeptBar.jsx";
import { getEmployees } from "../api/employees";
import { getTodayLog, subscribeToAttendance } from "../api/attendance";
import { formatCurrency, punchLabel, timeAgo } from "../utils";

export default function Dashboard({ onNavigate }) {
  const [employees, setEmployees] = useState([]);
  const [todayLog, setTodayLog] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [emps, log] = await Promise.all([getEmployees(), getTodayLog()]);
    setEmployees(emps);
    setTodayLog(log);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToAttendance(refresh);
    return unsubscribe;
  }, []);

  const stats = useMemo(() => {
    const total = employees.length;
    const avgSalary = total ? employees.reduce((sum, e) => sum + e.salary, 0) / total : 0;
    const latestByEmployee = {};
    todayLog.forEach((e) => {
      if (!(e.employeeId in latestByEmployee)) latestByEmployee[e.employeeId] = e.type;
    });
    const presentNow = Object.values(latestByEmployee).filter((t) => t !== "out").length;
    const departments = new Set(employees.map((e) => e.department));
    return { total, avgSalary, presentNow, departmentCount: departments.size };
  }, [employees, todayLog]);

  const deptBreakdown = useMemo(() => {
    const counts = {};
    employees.forEach((e) => {
      counts[e.department] = (counts[e.department] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [employees]);

  const recentUpdates = useMemo(
    () =>
      [...employees]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5),
    [employees]
  );

  return (
    <>
      <Topbar title="Dashboard" subtitle="A snapshot of today's headcount, payroll, and attendance." />
      <div className="page-body">
        {!loading && (
          <>
            <div className="stat-row">
              <StatCard label="Total Employees" value={stats.total} hint="Across all departments" />
              <StatCard label="Departments" value={stats.departmentCount} hint="Active teams" />
              <StatCard
                label="Present Now"
                value={stats.presentNow}
                hint={`${todayLog.length} punches logged today`}
                hintTone="up"
              />
              <StatCard label="Avg. Salary" value={formatCurrency(stats.avgSalary)} hint="Annual, company-wide" />
            </div>

            <div className="grid-2">
              <div className="panel">
                <div className="panel-head">
                  <h2 className="panel-title">Department breakdown</h2>
                  <button className="btn btn-ghost" onClick={() => onNavigate("employees")}>
                    View roster
                  </button>
                </div>
                <div className="panel-body">
                  {deptBreakdown.map(([name, count]) => (
                    <DeptBar key={name} name={name} count={count} total={stats.total} />
                  ))}
                </div>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <h2 className="panel-title">Today's punches</h2>
                  <button className="btn btn-ghost" onClick={() => onNavigate("attendance")}>
                    Open POS
                  </button>
                </div>
                <div className="panel-body">
                  {todayLog.length === 0 ? (
                    <div className="empty-state">No punches yet today.</div>
                  ) : (
                    <ul className="ledger-list">
                      {todayLog.slice(0, 6).map((entry) => (
                        <li className="ledger-item" key={entry.id}>
                          <span className="ledger-dot" />
                          <span className="ledger-who">{entry.name}</span>
                          <span>{punchLabel(entry.type)}</span>
                          <span className="ledger-meta">{timeAgo(entry.timestamp)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <h2 className="panel-title">Recently updated records</h2>
              </div>
              <div className="panel-body">
                <ul className="ledger-list">
                  {recentUpdates.map((emp) => (
                    <li className="ledger-item" key={emp.id}>
                      <span className="ledger-dot" />
                      <span className="ledger-who">{emp.name}</span>
                      <span>· {emp.department}</span>
                      <span className="ledger-meta">{timeAgo(emp.updatedAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
